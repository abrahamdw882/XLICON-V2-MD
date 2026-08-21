module.exports = {
    name: 'link',
    aliases: ['grouplink'],
    description: 'Get the group invite link',

    async execute(sock, m) {
        if (!m.isGroup) return

        try {
            const groupJid = m.from
            const code = await sock.groupInviteCode(groupJid)
            const link = `https://chat.whatsapp.com/${code}`

            await sock.sendMessage(groupJid, {
                text: `Group Link:\n${link}`
            })
        } catch {
            return
        }
    }
}
