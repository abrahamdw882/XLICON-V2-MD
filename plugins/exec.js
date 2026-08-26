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
                imageBuffer = (await axios.get(global.menuImage, { responseType: 'arraybuffer' })).data
            } catch {}

            await m.reply(imageBuffer, {
                caption: `${info}\n${text}`,
                contextInfo: {
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363230794474148@newsletter',
                        newsletterName: '──𝘈𝘉-𝘡𝘛𝘌𝘊𝘏🇬🇭「 𝙏𝙞𝙢𝙚 - 𝙏𝙞𝙢𝙚𝙡𝙚𝙨𝙨 」',
                        serverMessageId: 1
                    }
                }
            })
        } catch (err) {
            await m.reply(`❌ Error:\n\`\`\`\n${err.stack || err.message}\n\`\`\``)
        } finally {
            setTimeout(() => sentOnce.delete(m.id), 5000)
        }
    }
}
