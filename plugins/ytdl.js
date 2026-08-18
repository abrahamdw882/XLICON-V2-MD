const axios = require('axios');
const yts = require('yt-search');

module.exports = {
    name: 'ytmp3',
    description: 'Download YouTube audio (link or search)',
    aliases: ['ytdl', 'ytaudio', 'ytdlv3'],
    tags: ['downloader'],
    command: /^.?(ytmp3|ytdl|ytaudio|ytdlv3)/i,

    async execute(sock, m, args) {
        const chatId = m.key.remoteJid;
        const input = args.join(" ").trim();

        if (!input) {
            return m.reply("Usage:\n.ytmp3 <youtube link>\n.ytmp3 <search query>");
        }

        try {
            await sock.sendMessage(chatId, {
                react: { text: '🎵', key: m.key }
            });

            let finalUrl = input;

            if (!input.includes("youtube.com") && !input.includes("youtu.be")) {
                const results = await yts(input);

                if (!results || !results.videos || results.videos.length === 0) {
                    return m.reply("No results found on YouTube.");
                }

                finalUrl = results.videos[0].url;
            }

            const apiUrl = `https://eliteprotech-apis.zone.id/convert?url=${encodeURIComponent(finalUrl)}&format=mp3`;
            const apiRes = await axios.get(apiUrl);
            const data = apiRes.data;

            if (!data || !data.success) {
                return m.reply(`API Error: ${data?.message || "Unknown error"}`);
            }

            const { downloadURL, title } = data;

            const audioRes = await axios.get(downloadURL, {
                responseType: "arraybuffer"
            });

            const buffer = Buffer.from(audioRes.data);

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

            const safeName = (title || "audio").replace(/[\\/:*?"<>|]/g, "");

            await sock.sendMessage(
                chatId,
                {
                    audio: buffer,
                    mimetype: "audio/mpeg",
                    fileName: `${safeName}.mp3`,
                    ptt: false
                },
                { quoted: quotedMsg }
            );

        } catch (err) {
            console.error('YTMP3 error:', err.response?.data || err.message);
            m.reply('Failed to process request.');
        }
    }
};
