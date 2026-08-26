const util = require('util')
const axios = require('axios')
const Jimp = global || require('jimp')

let sentOnce = new Set()

module.exports = {
    name: 'exec',
    aliases: ['$'],
    description: 'Execute JavaScript code (Owner only)',

    async execute() {},

    async onMessage(sock, m) {
        if (!m?.text) return
        if (!m.text.startsWith('$')) return
        if (sentOnce.has(m.id)) return
        sentOnce.add(m.id)

        try {
            if (!m.isOwner) return

            const code = m.text.slice(1).trim()

            if (!code) {
                await m.reply(`☑️ ʀᴇsᴜʟᴛ:\n\`\`\`\nᴜɴᴅᴇғɪɴᴇᴅ\n\`\`\``)
                return
            }

            const info = '*ABZTech Exec*'

            const sandbox = {
                sock,
                m,
                axios,
                util,
                Jimp : global.Jimp,
                console,
                proto: global.proto,
                prepareWAMessageMedia: global.prepareWAMessageMedia,
                generateWAMessageContent: global.generateWAMessageContent,
                generateWAMessageFromContent: global.generateWAMessageFromContent,
                generateMessageID: global.generateMessageID
            }

            const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor

            let result
            if (code.includes('await') || code.includes('\n')) {
                result = await new AsyncFunction(...Object.keys(sandbox), code)(
                    ...Object.values(sandbox)
                )
            } else {
                result = await new Function(
                    ...Object.keys(sandbox),
                    `return (${code})`
                )(...Object.values(sandbox))
            }

            let output
            if (result === undefined) {
                output = 'ᴜɴᴅᴇғɪɴᴇᴅ'
            } else if (typeof result === 'string') {
                output = result
            } else {
                output = util.inspect(result, {
                    depth: 3,
                    colors: false,
                    maxArrayLength: 50
                })
            }

            const text = `☑️ ʀᴇsᴜʟᴛ:\n\`\`\`\n${output.slice(0, 4000)}\n\`\`\``

            let imageBuffer = null
            try {
                imageBuffer = await axios.get(global.menuImage || 'https://sam-cdn.zone.id/files/rzkeIq.jpg', {
                    responseType: 'arraybuffer'
                }).then(res => Buffer.from(res.data))
            } catch {}

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
            }

            await sock.sendMessage(m.from, {
                text: `${info}\n${text}`,
                contextInfo: {
                    externalAdReply: {
                        showAdAttribution: false,
                        title: `XLICON V2 EXEC`,
                        body: `⚡ ${m.pushName || 'User'} executed code`,
                        mediaType: 1,
                        renderLargerThumbnail: true,
                        thumbnailUrl: 'https://whatsapp.com/channel/0029VaMGgVL3WHTNkhzHik3c',
                        thumbnail: imageBuffer
                    }
                }
            }, { quoted: fquoted })

        } catch (err) {
            await m.reply(`❌ Error:\n\`\`\`\n${err.stack || err.message}\n\`\`\``)
        } finally {
            setTimeout(() => sentOnce.delete(m.id), 5000)
        }
    }
}
