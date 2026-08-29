const zlib = require('node:zlib');

function escapeXml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function createZip(files) {
    const localParts = [];
    const centralParts = [];
    let offset = 0;

    for (const [name, content] of Object.entries(files)) {
        const nameBuffer = Buffer.from(name);
        const data = Buffer.from(content);
        const crc = zlib.crc32(data) >>> 0;

        const local = Buffer.alloc(30 + nameBuffer.length);

        local.writeUInt32LE(0x04034b50, 0);
        local.writeUInt16LE(20, 4);
        local.writeUInt32LE(crc, 14);
        local.writeUInt32LE(data.length, 18);
        local.writeUInt32LE(data.length, 22);
        local.writeUInt16LE(nameBuffer.length, 26);

        nameBuffer.copy(local, 30);

        localParts.push(local, data);

        const central = Buffer.alloc(46 + nameBuffer.length);

        central.writeUInt32LE(0x02014b50, 0);
        central.writeUInt16LE(20, 4);
        central.writeUInt16LE(20, 6);
        central.writeUInt32LE(crc, 16);
        central.writeUInt32LE(data.length, 20);
        central.writeUInt32LE(data.length, 24);
        central.writeUInt16LE(nameBuffer.length, 28);
        central.writeUInt32LE(offset, 42);

        nameBuffer.copy(central, 46);

        centralParts.push(central);

        offset += local.length + data.length;
    }

    const centralDirectory = Buffer.concat(centralParts);
    const end = Buffer.alloc(22);

    end.writeUInt32LE(0x06054b50, 0);
    end.writeUInt16LE(Object.keys(files).length, 8);
    end.writeUInt16LE(Object.keys(files).length, 10);
    end.writeUInt32LE(centralDirectory.length, 12);
    end.writeUInt32LE(offset, 16);

    return Buffer.concat([
        ...localParts,
        centralDirectory,
        end
    ]);
}

function createDocx(text) {
    const files = {
        '[Content_Types].xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`,

        '_rels/.rels': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1"
Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument"
Target="word/document.xml"/>
</Relationships>`,

        'word/document.xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:body>
<w:p>
<w:r>
<w:t xml:space="preserve">${escapeXml(text)}</w:t>
</w:r>
</w:p>
<w:sectPr/>
</w:body>
</w:document>`
    };

    return createZip(files);
}

module.exports = {
    name: 'write',
    aliases: ['w'],

    async execute(sock, m, args) {
        if (args.length < 2) {
            return m.reply(
                `ᴜsᴀɢᴇ:\n\n.write hi txt\n.write hi docx`
            );
        }

        const format = args[args.length - 1].toLowerCase();
        const text = args.slice(0, -1).join(' ').trim();

        if (!text) {
            return m.reply(`ᴘʟᴇᴀsᴇ ᴘʀᴏᴠɪᴅᴇ sᴏᴍᴇ ᴛᴇxᴛ.`);
        }

        try {
            if (format === 'txt') {
                const buffer = Buffer.from(text, 'utf8');

                await sock.sendMessage(m.from, {
                    document: buffer,
                    mimetype: 'text/plain',
                    fileName: 'document.txt'
                });

                return;
            }

            if (format === 'docx') {
                const buffer = createDocx(text);

                await sock.sendMessage(m.from, {
                    document: buffer,
                    mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    fileName: 'document.docx'
                });

                return;
            }

            await m.reply(
                `ғᴏʀᴍᴀᴛ ɴᴏᴛ sᴜᴘᴘᴏʀᴛᴇᴅ\n\nᴜsᴇ: ᴛxᴛ ᴏʀ ᴅᴏᴄx`
            );

        } catch (err) {
            console.error('write error:', err);
            await m.reply(`ғᴀɪʟᴇᴅ\n\n${err.message}`);
        }
    }
};
