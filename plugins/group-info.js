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

            const invite = await sock.groupGetInviteInfo(code);

            if (!invite || !invite.id) {
                return m.reply('Unable to retrieve group information.');
            }

            const meta = await sock.groupMetadata(invite.id).catch(() => null);

            const participants = meta?.participants || [];
            const admins = participants.filter(p => p.admin);

            const info = `
*Group Info:*

- *ID:* ${invite.id}
- *Name:* ${meta?.subject || invite.subject || 'Unknown'}
- *Description:* ${meta?.desc || invite.desc || 'None'}
- *Owner:* ${meta?.owner || invite.owner || 'Unknown'}
- *Participants:* ${participants.length || invite.size || 0}
- *Admins:* ${admins.length}
- *Disappearing Messages:* ${
                meta?.ephemeralDuration || invite.ephemeralDuration
                    ? (meta?.ephemeralDuration || invite.ephemeralDuration) + 's'
                    : 'Off'
            }
- *Announce Only:* ${
                meta?.announce ?? invite.announce ? 'Yes' : 'No'
            }
- *Restricted Settings:* ${
                meta?.restrict ?? invite.restrict ? 'Yes' : 'No'
            }
- *Member Add Mode:* ${
                meta?.memberAddMode ?? invite.memberAddMode
                    ? 'All members'
                    : 'Admins only'
            }
- *Join Approval:* ${
                meta?.joinApprovalMode ?? invite.joinApprovalMode
                    ? 'Required'
                    : 'Not required'
            }
`.trim();

            const pp = await sock
                .profilePictureUrl(invite.id, 'image')
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
