const axios = require('axios');

module.exports = {
    name: 'menu',
    description: 'Show available bot commands',
    aliases: ['help', 'cmdlist', 'commands'],

    async execute(sock, m) {
        const prefix = global.BOT_PREFIX || '.';

        const now = new Date();
        const date = now.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            timeZone: 'Africa/Accra'
        });

        const time = now.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
            timeZone: 'Africa/Accra'
        });

        const botOwner = global.ownerName || 'ABZTECH';
        const user = m.pushName || m.sender?.split('@')[0] || 'User';

        const menuText = `

┌─ ɢᴇɴᴇʀᴀʟ ᴄᴏᴍᴍᴀɴᴅs
│
├─ғ *ɢᴇɴᴇʀᴀʟ*
│ ꪜ ${prefix}ᴀʀɪᴇ
│ ꪜ ${prefix}ʜɪɴɢ
│ ꪜ ${prefix}ᴜᴘᴛɪᴍᴇ
│ ꪜ ${prefix}ᴏᴡɴᴇʀ
│ ꪜ ${prefix}ᴍᴇɴᴜ2
│
├─ғ *ᴅᴏᴡɴʟᴏᴀᴅᴇʀs*
│ ꪜ ${prefix}ᴛɪᴋᴛᴏᴋ / ${prefix}ᴛᴛ
│ ꪜ ${prefix}ᴛᴇᴍᴘ3
│ ꪜ ${prefix}ɪɢ
│
├─ғ *ᴛᴏᴏʟs*
│ ꪜ ${prefix}sᴛɪᴄᴋᴇʀ
│ ꪜ ${prefix}ᴏᴄʀ
│ ꪜ ${prefix}ᴛᴛs
│ ꪜ ${prefix}ʜᴏʀʀ
│ ꪜ ${prefix}sʜᴀǫᴀᴍ
│ ꪜ ${prefix}ᴛᴇxᴛʜᴏʀᴏ
│ ꪜ ${prefix}ᴄʜɪɴ
│
├─ғ *ᴀɪ*
│ ꪜ ${prefix}ᴀɪ
│ ꪜ ${prefix}ᴀɪ-sᴇᴀʀᴄʜ
│ ꪜ ${prefix}ᴀɪᴘ
│ ꪜ ${prefix}ɢᴇɴ
│
├─ғ *ғᴜɴ*
│ ꪜ ${prefix}ǫᴜᴇ
│
├─ғ *ɢʀᴏᴜᴘ*
│ ꪜ ${prefix}ᴛᴀɢᴀʟʟ
│ ꪜ ${prefix}ᴛᴀɢᴀʟʟ1
│ ꪜ ${prefix}ᴛᴀɢᴍᴇ
│ ꪜ ${prefix}ᴄᴏᴜɴᴛᴇᴍᴍ
│ ꪜ ${prefix}ɢʀᴏᴜᴘ
│ ꪜ ${prefix}ɢɪɴғᴏ
│ ꪜ ${prefix}ᴅᴇʟ
│ ꪜ ${prefix}ʟɪɴᴋ
│
├─ғ *sᴛᴀᴛᴜs*
│ ꪜ ${prefix}ɢsᴛᴀᴛᴜs
│
├─ғ *ᴄʜᴀɴɴᴇʟ*
│ ꪜ ${prefix}ᴄʜᴀɴɴᴇʟɪɴ
│
├─ғ *ᴀᴅᴍɪɴ*
│ ꪜ ${prefix}ʟɪᴋ
│
└─────────────────◆─────────────────┘

> 「 𝙏𝙞𝙢𝙚 - 𝙏𝙞𝙢𝙚𝙡𝙚𝙨𝙨 」
`.trim();

        try {
            const imageBuffer = await axios.get(global.menuImage || 'https://sam-cdn.zone.id/files/rzkeIq.jpg', {
                responseType: 'arraybuffer'
            }).then(res => Buffer.from(res.data));

            const fquoted = {
                key: {
                    fromMe: false,
                    participant: '0@s.whatsapp.net',
                    remoteJid: '120363400662819774@g.us'
                },
                message: {
                    stickerPackMessage: {
                        stickerPackId: 'XLICONV2',
                        name: 'XLICON V2',
                        publisher: 'ABZTECH'
                    }
                }
            };

            await sock.sendMessage(m.from, {
                text: menuText,
                contextInfo: {
                    externalAdReply: {
                        showAdAttribution: false,
                        title: `XLICON V2 MENU`,
                        body: `👋 ʜᴇʟʟᴏ ${user}!`,
                        mediaType: 1,
                        renderLargerThumbnail: true,
                        thumbnailUrl: 'https://whatsapp.com/channel/0029VaMGgVL3WHTNkhzHik3c',
                        thumbnail: imageBuffer,
                        sourceUrl: 'https://whatsapp.com/channel/0029VaMGgVL3WHTNkhzHik3c'
                    }
                }
            }, { quoted: fquoted });

        } catch (err) {
            console.error('Menu error:', err);
            try {
                await m.reply(menuText);
            } catch (fallbackErr) {
                console.error('Fallback error:', fallbackErr);
            }
        }
    }
};
