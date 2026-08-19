const fs = require('fs');
const { tmpdir } = require('os');
const path = require('path');
const Crypto = require('crypto');
const webp = require('node-webpmux');

async function addStickerMetadata(webpBuffer, packname, author, categories = [''], extra = {}) {
    const tmpFileIn = path.join(tmpdir(), `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.webp`);
    const tmpFileOut = path.join(tmpdir(), `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.webp`);

    try {
        fs.writeFileSync(tmpFileIn, webpBuffer);

        const img = new webp.Image();
        const stickerPackId = Crypto.randomBytes(32).toString('hex');

        const json = {
            'sticker-pack-id': stickerPackId,
            'sticker-pack-name': packname || '',
            'sticker-pack-publisher': author || '',
            'emojis': categories.length ? categories : [''],
            ...extra
        };

        const exifAttr = Buffer.from([
            0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00,
            0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x16, 0x00, 0x00, 0x00
        ]);
        const jsonBuffer = Buffer.from(JSON.stringify(json), 'utf-8');
        const exif = Buffer.concat([exifAttr, jsonBuffer]);
        exif.writeUIntLE(jsonBuffer.length, 14, 4);

        await img.load(tmpFileIn);
        img.exif = exif;
        await img.save(tmpFileOut);

        return fs.readFileSync(tmpFileOut);

    } catch (error) {
        console.error('addStickerMetadata error:', error);
        return webpBuffer;
    } finally {
        if (fs.existsSync(tmpFileIn)) fs.unlinkSync(tmpFileIn);
        if (fs.existsSync(tmpFileOut)) fs.unlinkSync(tmpFileOut);
    }
}

module.exports = { addStickerMetadata };
