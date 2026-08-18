const yts = require('yt-search');

module.exports = {
    name: 'play',
    description: 'Search YouTube and choose MP3 or MP4 to download',
    aliases: ['yt', 'song'],
    command: /^.?(play|yt|song)/i,

    async execute(sock, m, args) {
        const prefix = global.BOT_PREFIX || '.';
        const chatId = m.key.remoteJid;
        const query = args.join(" ").trim();

        if (!query) {
            return m.reply(
                `Usage:\n${prefix}play <youtube link or search query>`
            );
        }

        try {
            await sock.sendMessage(chatId, {
                react: {
                    text: '🎵',
                    key: m.key
                }
            });

            let finalUrl = query;
            let title = 'YouTube Video';

            if (
                !query.includes('youtube.com') &&
                !query.includes('youtu.be')
            ) {
                const results = await yts(query);

                if (!results?.videos?.length) {
                    return m.reply('No results found on YouTube.');
                }

                finalUrl = results.videos[0].url;
                title = results.videos[0].title;
            } else {
                const results = await yts(query);

                if (results?.videos?.length) {
                    title = results.videos[0].title;
                }
            }

            await sock.relayMessage(
                chatId,
                {
                    interactiveMessage: {
                        header: {
                            title: `🎬 ${title}`
                        },
                        body: {
                            text:
`Choose a format to download:

🎵 *${title}*

Current prefix: *${prefix}*

> 「 𝙏𝙞𝙢𝙚 - 𝙏𝙞𝙢𝙚𝙡𝙚𝙨𝙨 」`
                        },
                        footer: {
                            text: 'YouTube Downloader • Instant commands'
                        },
                        nativeFlowMessage: {
                            buttons: [
                                {
                                    name: 'quick_reply',
                                    buttonParamsJson: JSON.stringify({
                                        display_text: '🎵 MP3',
                                        id: `${prefix}ytmp3 ${finalUrl}`
                                    })
                                },
                                {
                                    name: 'quick_reply',
                                    buttonParamsJson: JSON.stringify({
                                        display_text: '🎬 MP4',
                                        id: `${prefix}ymp4 ${finalUrl}`
                                    })
                                }
                            ]
                        }
                    }
                },
                {
                    additionalNodes: [
                        {
                            tag: 'biz',
                            attrs: {},
                            content: [
                                {
                                    tag: 'interactive',
                                    attrs: {
                                        type: 'native_flow',
                                        v: '1'
                                    },
                                    content: [
                                        {
                                            tag: 'native_flow',
                                            attrs: {
                                                v: '9',
                                                name: 'mixed'
                                            }
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            );

        } catch (err) {
            console.error('Play error:', err);
            return m.reply('Failed to process request.');
        }
    }
};
