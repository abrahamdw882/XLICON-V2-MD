module.exports = {
    name: 'link',
    aliases: ['grouplink', '.link'],
    description: 'Get the group invite link',

    async execute(sock, m) {
        if (!m.isGroup) return

        try {
            const groupJid = m.from
            const code = await sock.groupInviteCode(groupJid)
            const link = `https://chat.whatsapp.com/${code}`

            const msg = generateWAMessageFromContent(
                groupJid,
                {
                    interactiveMessage: {
                        header: {
                            title: "XLICON V2",
                            subtitle: "ABZTECH",
                            hasMediaAttachment: true,
                            locationMessage: {
                                degreesLatitude: 0,
                                degreesLongitude: 0,
                                name: `Group Link`,
                                address: `${link}`,
                                url: `${link}`,
                                contextInfo: {
                                    forwardingScore: 999,
                                    isForwarded: true,
                                    forwardOrigin: 0
                                }
                            }
                        },
                        body: {
                            text: `Group Link\n\n${link}\n\nShare this link to invite others!`
                        },
                        footer: {
                            text: " "
                        },
                        nativeFlowMessage: {
                            buttons: [
                                {
                                    name: "cta_url",
                                    buttonParamsJson: `{"display_text":"Join Group","url":"${link}"}`
                                },
                                {
                                    name: "single_select",
                                    buttonParamsJson: "{\"title\":\"Menu\",\"sections\":[{\"title\":\"Navigate\",\"highlight_label\":\"!\",\"rows\":[{\"header\":\"Menu\",\"title\":\"View All Commands\",\"description\":\"Show bot menu\",\"id\":\".menu\"},{\"header\":\"Owner\",\"title\":\"Contact Owner\",\"description\":\"Reach out to bot owner\",\"id\":\".owner\"},{\"header\":\"Ping\",\"title\":\"Check Bot Status\",\"description\":\"View bot response time\",\"id\":\".ping\"}]}]}"
                                },
                                {
                                    name: "cta_url",
                                    buttonParamsJson: "{\"display_text\":\"Channel\",\"url\":\"https://whatsapp.com/channel/0029VaMGgVL3WHTNkhzHik3c\"}"
                                }
                            ],
                            messageParamsJson: ""
                        },
                        contextInfo: {
                            forwardingScore: 999,
                            isForwarded: true,
                            forwardOrigin: 0
                        }
                    }
                },
                {
                    userJid: m.sender,
                    messageId: generateMessageID()
                }
            );

            await sock.relayMessage(
                groupJid,
                msg.message,
                {
                    messageId: msg.key.id,
                    additionalNodes: [
                        {
                            tag: "biz",
                            attrs: {},
                            content: [
                                {
                                    tag: "interactive",
                                    attrs: {
                                        type: "native_flow",
                                        v: "1"
                                    },
                                    content: [
                                        {
                                            tag: "native_flow",
                                            attrs: {
                                                v: "9",
                                                name: "mixed"
                                            }
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            );

            await sock.sendMessage(groupJid, {
                react: {
                    text: "✅",
                    key: m.key
                }
            });

        } catch (err) {
            await m.reply(`Failed to get group link: ${err.message}`)
        }
    }
}
