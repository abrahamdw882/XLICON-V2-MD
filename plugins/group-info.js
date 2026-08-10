const axios = require('axios');

module.exports = {
    name: 'ginfo',
    description: 'Get information about a WhatsApp group from its invite link',
    aliases: ['groupinfo'],
    tags: ['group'],
    command: /^.?(ginfo|groupinfo)$/i,

    async execute(sock, m, args) {
        const link = args.join(' ').trim();

        if (!link) {
            return m.reply(
                'Usage:\n.ginfo <group invite link>\n\nExample:\n.ginfo https://chat.whatsapp.com/XXXXXXXXXXXX'
            );
        }

        try {
            if (!link.includes('chat.whatsapp.com/')) {
                return m.reply('Please provide a valid WhatsApp group invite link.');
            }

            const code = link
                .split('chat.whatsapp.com/')[1]
                .split('?')[0]
                .trim();

            if (!code) {
                return m.reply('Invalid group invite link.');
            }

            const r = await sock.groupGetInviteInfo(code);

            if (!r || !r.id) {
                return m.reply('Unable to retrieve group information.');
            }

            const info = `
*Group Info:*

- *ID:* ${r.id}
- *Name:* ${r.subject || 'Unknown'}
- *Description:* ${r.desc || 'None'}
- *Owner:* ${r.owner || 'Unknown'}
- *Participants:* ${r.participants?.length || 0}
- *Disappearing Messages:* ${
                r.ephemeralDuration ? r.ephemeralDuration + 's' : 'Off'
            }
- *Announce Only:* ${r.announce ? 'Yes' : 'No'}
- *Restricted Settings:* ${r.restrict ? 'Yes' : 'No'}
- *Member Add Mode:* ${
                r.memberAddMode ? 'All members' : 'Admins only'
            }
- *Join Approval:* ${
                r.joinApprovalMode ? 'Required' : 'Not required'
            }
`.trim();

            const pp = await sock
                .profilePictureUrl(r.id, 'image')
                .catch(() => null);

            if (pp) {
                const imageBuffer = (
                    await axios.get(pp, {
                        responseType: 'arraybuffer'
                    })
                ).data;

                await m.reply(imageBuffer, {
                    caption: info
                });
            } else {
                await m.reply(
                    info + '\n- *Profile Picture:* None'
                );
            }

        } catch (err) {
            console.error('GINFO error:', err);

            return m.reply(
                'Failed to retrieve group information. The invite link may be invalid, expired, or the group may no longer be accessible.'
            );
        }
    }
};
