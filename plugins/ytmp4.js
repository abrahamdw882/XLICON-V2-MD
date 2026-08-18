const axios = require('axios');
const yts = require('yt-search');

module.exports = {
name: 'ymp4',
description: 'Download YouTube video as MP4 (link or search)',
aliases: ['ytmp4', 'ytvideo'],
tags: ['downloader'],
command: /^.?(ymp4|ytmp4|ytvideo)/i,

async execute(sock, m, args) {
    const chatId = m.key.remoteJid;
    const input = args.join(" ").trim();

    if (!input) {
        return m.reply("Usage:\n.ymp4 <youtube link or search query>");
    }

    try {
        await sock.sendMessage(chatId, {
            react: { text: '🎬', key: m.key }
        });

        let finalUrl = input;

        if (!input.includes("youtube.com") && !input.includes("youtu.be")) {
            const results = await yts(input);

            if (!results || !results.videos || results.videos.length === 0) {
                return m.reply("No results found on YouTube.");
            }

            finalUrl = results.videos[0].url;
        }

        const apiUrl = `https://eliteprotech-apis.zone.id/convert?url=${encodeURIComponent(finalUrl)}&format=mp4`;
        const apiRes = await axios.get(apiUrl);
        const data = apiRes.data;

        if (!data || !data.success) {
            return m.reply(`API Error: ${data?.message || "Unknown error"}`);
        }

        const { downloadURL, title } = data;

        const videoRes = await axios.get(downloadURL, {
            responseType: "arraybuffer"
        });

        const buffer = Buffer.from(videoRes.data);

        const quotedMsg = m.quoted || {
            key: {
                remoteJid: chatId,
                fromMe: false,
                id: m.id,
                participant: m.sender
            },
            message: {
                extendedTextMessage: {
                    text: m.body
                }
            }
        };

        const safeName = (title || "video").replace(/[\\/:*?"<>|]/g, "");

        await sock.sendMessage(
            chatId,
            {
                video: buffer,
                mimetype: "video/mp4",
                fileName: `${safeName}.mp4`,
                caption: title || safeName,
                contextInfo: {
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363230794474148@newsletter',
                        newsletterName: '𝘈𝘉-𝘡𝘛𝘌𝘊𝘏🇬🇭「 𝙏𝙞𝙢𝙚 - 𝙏𝙞𝙢𝙚𝙡𝙚𝙨𝙨 」',
                        serverMessageId: 1
                    }
                }
            },
            { quoted: quotedMsg }
        );

    } catch (err) {
        console.error('YMP4 error:', err.response?.data || err.message);
        m.reply('Failed to process request.');
    }
}
};
