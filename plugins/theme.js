const { createCipheriv, createHash, createHmac, hkdfSync, randomBytes } = require('crypto');
const fs = require('fs');
const path = require('path');
const protobuf = require('protobufjs');
const { proto } = require('@whiskeysockets/baileys');

try {
    const messagesSendPath = path.resolve(__dirname, '../node_modules/@whiskeysockets/baileys/lib/Socket/messages-send.js');
    if (fs.existsSync(messagesSendPath)) {
        let content = fs.readFileSync(messagesSendPath, 'utf8');
        if (!content.includes("'chat_theme'")) {
            content = content.replace(
                "else if (message.groupInviteMessage) {\n            return 'url';\n        }\n        return '';",
                "else if (message.groupInviteMessage) {\n            return 'url';\n        }\n        else if (message.protocolMessage?.type === 34 || message.protocolMessage?.chatThemeSetting) {\n            return 'chat_theme';\n        }\n        return '';"
            );
            fs.writeFileSync(messagesSendPath, content, 'utf8');
        }
    }
} catch (e) {
    console.error('[THEME] Warning patching messages-send.js:', e.message);
}

const themeProtoDef = `
syntax = "proto3";
package waTheme;

message ChatThemeSetting {
    int64 settingTimestampMs = 1;
    bool clearTheme = 2;
    string colorSchemeId = 3;
    ChatSolidColorWallpaper solidColor = 11;
    ChatCustomImageWallpaper customImage = 13;
}

message ChatSolidColorWallpaper {
    string colorLight = 1;
    string colorDark = 2;
    bool isDoodleEnabled = 3;
}

message ChatCustomImageWallpaper {
    string directPath = 1;
    bytes mediaKey = 2;
    bytes fileEncSha256 = 3;
    bytes fileSha256 = 4;
    uint32 dimLevel = 5;
}
`;

const root = protobuf.parse(themeProtoDef).root;
const ChatThemeSetting = root.lookupType('waTheme.ChatThemeSetting');

if (!proto.Message.ProtocolMessage.__themePatched) {
    const originalProtoMsgEncode = proto.Message.ProtocolMessage.encode;
    proto.Message.ProtocolMessage.encode = function (m, w) {
        if (!w) w = protobuf.Writer.create();
        originalProtoMsgEncode(m, w);
        if (m.chatThemeSetting) {
            const themeBuf = ChatThemeSetting.encode(ChatThemeSetting.create(m.chatThemeSetting)).finish();

            w.uint32(242).bytes(themeBuf);
        }
        return w;
    };
    proto.Message.ProtocolMessage.__themePatched = true;
}

const COLOR_PRESETS = {
    pink: { hex: 'ff69b4', scheme: 'Pink@Tonal' },
    blue: { hex: '1e90ff', scheme: 'Royal-Blue@Tonal' },
    purple: { hex: '9b59b6', scheme: 'Amethyst@Tonal' },
    black: { hex: '121212', scheme: 'Dark@Tonal' },
    green: { hex: '2ecc71', scheme: 'Emerald@Tonal' },
    red: { hex: 'e74c3c', scheme: 'Crimson@Tonal' },
    yellow: { hex: 'f1c40f', scheme: 'Amber@Tonal' },
    orange: { hex: 'e67e22', scheme: 'Amber@Tonal' },
    white: { hex: 'f5f6fa', scheme: 'Light@Tonal' },
    biru: { hex: '1e90ff', scheme: 'Royal-Blue@Tonal' },
    ungu: { hex: '9b59b6', scheme: 'Amethyst@Tonal' },
    hitam: { hex: '121212', scheme: 'Dark@Tonal' },
    hijau: { hex: '2ecc71', scheme: 'Emerald@Tonal' },
    merah: { hex: 'e74c3c', scheme: 'Crimson@Tonal' },
    kuning: { hex: 'f1c40f', scheme: 'Amber@Tonal' },
    oren: { hex: 'e67e22', scheme: 'Amber@Tonal' },
    putih: { hex: 'f5f6fa', scheme: 'Light@Tonal' }
};

const WALLPAPER_HKDF_INFO = 'WhatsApp Chat Wallpaper Keys';
const WALLPAPER_UPLOAD_PATH = '/mms/chat-wallpaper-image';
const FALLBACK_MEDIA_HOST = 'mmg.whatsapp.net';

const generateMessageId = () => `3EB0${randomBytes(16).toString('hex').toUpperCase()}`;

const resolveColor = (color) => {
    const preset = COLOR_PRESETS[color.trim().toLowerCase()];
    if (preset) return preset;
    const match = /^#?([0-9a-f]{6})$/i.exec(color.trim());
    if (!match) {
        throw new Error('Color format unrecognized. Use hex (#ff69b4) or preset name (pink, blue, etc.)');
    }
    return { hex: match[1].toLowerCase() };
};

const fetchImage = async (url) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const ct = res.headers.get('content-type') || '';
    if (!/^image\//i.test(ct)) {
        throw new Error('URL does not point to an image');
    }
    return Buffer.from(await res.arrayBuffer());
};

const encryptWallpaper = (image) => {
    const mediaKey = randomBytes(32);
    const expanded = Buffer.from(
        hkdfSync('sha256', mediaKey, Buffer.alloc(32), Buffer.from(WALLPAPER_HKDF_INFO), 112)
    );
    const iv = expanded.subarray(0, 16);
    const cipherKey = expanded.subarray(16, 48);
    const macKey = expanded.subarray(48, 80);
    const cipher = createCipheriv('aes-256-cbc', cipherKey, iv);
    const encrypted = Buffer.concat([cipher.update(image), cipher.final()]);
    const mac = createHmac('sha256', macKey)
        .update(Buffer.concat([iv, encrypted]))
        .digest()
        .subarray(0, 10);
    const body = Buffer.concat([encrypted, mac]);
    return {
        body,
        mediaKey,
        fileSha256: createHash('sha256').update(image).digest(),
        fileEncSha256: createHash('sha256').update(body).digest()
    };
};

const queryMediaConn = async (sock) => {
    try {
        if (typeof sock.refreshMediaConn === 'function') {
            const conn = await sock.refreshMediaConn(true);
            const hosts = (conn.hosts || []).map(h => h.hostname).filter(Boolean);
            return {
                auth: conn.auth,
                hosts: hosts.length > 0 ? hosts : [FALLBACK_MEDIA_HOST]
            };
        }
    } catch (e) {

    }

    const node = {
        tag: 'iq',
        attrs: { to: 's.whatsapp.net', type: 'set', xmlns: 'w:m' },
        content: [{ tag: 'media_conn', attrs: {} }]
    };
    const response = await sock.query(node);
    const conn = Array.isArray(response.content)
        ? response.content.find((child) => child.tag === 'media_conn')
        : undefined;
    const auth = conn?.attrs?.auth;
    if (!conn || !auth) throw new Error('media_conn returned no auth');
    const hosts = Array.isArray(conn.content)
        ? conn.content
            .filter((child) => child.tag === 'host' && child.attrs?.hostname)
            .map((child) => child.attrs.hostname)
        : [];
    return { auth, hosts: hosts.length > 0 ? hosts : [FALLBACK_MEDIA_HOST] };
};

const uploadWallpaper = async (sock, image) => {
    const { body, mediaKey, fileSha256, fileEncSha256 } = encryptWallpaper(image);
    const { auth, hosts } = await queryMediaConn(sock);
    const token = fileEncSha256.toString('base64url');
    for (const host of hosts) {
        const url = `https://${host}${WALLPAPER_UPLOAD_PATH}/${encodeURIComponent(token)}?auth=${encodeURIComponent(auth)}&token=${encodeURIComponent(token)}`;
        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/octet-stream',
                    Origin: 'https://web.whatsapp.com'
                },
                body
            });
            if (!res.ok) continue;
            const json = await res.json().catch(() => null);
            const directPath = json?.direct_path ?? json?.directPath;
            if (directPath) return { directPath, mediaKey, fileSha256, fileEncSha256 };
        } catch {
            continue;
        }
    }
    throw new Error('Wallpaper upload failed on all hosts');
};

const buildThemeSetting = async (sock, input) => {
    const settingTimestampMs = Date.now();
    if (input.type === 'reset') {
        return { setting: { settingTimestampMs, clearTheme: true }, label: 'reset' };
    }
    if (input.type === 'color') {
        const { hex, scheme } = resolveColor(input.color);
        const color = `#${hex}`;
        return {
            setting: {
                settingTimestampMs,
                ...(scheme ? { colorSchemeId: scheme } : {}),
                solidColor: { colorLight: color, colorDark: color, isDoodleEnabled: true }
            },
            label: `color ${color}`
        };
    }
    const image = input.type === 'url' ? await fetchImage(input.url) : input.image;
    if (!image || image.byteLength === 0) throw new Error('Image is empty');
    const up = await uploadWallpaper(sock, image);
    return {
        setting: {
            settingTimestampMs,
            customImage: {
                directPath: up.directPath,
                mediaKey: up.mediaKey,
                fileEncSha256: up.fileEncSha256,
                fileSha256: up.fileSha256,
                dimLevel: input.dimLevel ?? 0
            }
        },
        label: 'wallpaper image'
    };
};

const setGroupTheme = async (sock, groupJid, input) => {
    if (!groupJid.endsWith('@g.us')) throw new Error('This command can only be used in groups!');

    const { setting, label } = await buildThemeSetting(sock, input);
    const id = generateMessageId();

    const result = await sock.relayMessage(
        groupJid,
        {
            protocolMessage: {
                type: 34,
                chatThemeSetting: setting
            }
        },
        {
            messageId: id,
            additionalAttributes: { type: 'media' }
        }
    );

    return { id: result || id, label };
};

const parseThemeArgs = (text = '', image = null) => {
    const q = text.trim();
    if (/^(reset|hapus|clear|default|restore)$/i.test(q)) return { type: 'reset' };
    if (image && image.byteLength > 0 && !q) return { type: 'image', image };
    if (/^https?:\/\/\S+$/i.test(q)) return { type: 'url', url: q };
    if (COLOR_PRESETS[q.toLowerCase()] || /^#?[0-9a-f]{6}$/i.test(q)) {
        return { type: 'color', color: q };
    }
    if (image && image.byteLength > 0) return { type: 'image', image };
    return null;
};

module.exports = {
    name: 'theme',
    aliases: ['grouptheme', 'wallpaper', 'chattheme', 'settheme'],
    description: 'Change group chat theme or wallpaper',
    tags: ['group', 'admin'],

    async execute(sock, m, args = []) {
        if (!m.isGroup) {
            return await m.reply('ᴛʜɪs ᴄᴏᴍᴍᴀɴᴅ ᴄᴀɴ ᴏɴʟʏ ʙᴇ ᴜsᴇᴅ ɪɴ ɢʀᴏᴜᴘs!');
        }


        const chatId = m.from || m.chat;
        let senderIsAdmin = m.isOwner;
        let botIsAdmin = false;
        try {
            const { jidNormalizedUser } = require('@whiskeysockets/baileys');
            const meta = await sock.groupMetadata(chatId);
            const participants = meta?.participants || [];
            const senderRaw = m.sender || '';
            const botId = sock.user?.id || '';
            const botLid = sock.user?.lid || '';
            const senderNum = senderRaw.split(':')[0].split('@')[0];
            const botNum = botId.split(':')[0].split('@')[0];
            const botLidNum = botLid.split(':')[0].split('@')[0];

            console.log('[THEME DEBUG] chatId:', chatId);
            console.log('[THEME DEBUG] m.sender:', senderRaw, '-> senderNum:', senderNum);
            console.log('[THEME DEBUG] botId:', botId, '-> botNum:', botNum);
            console.log('[THEME DEBUG] botLid:', botLid, '-> botLidNum:', botLidNum);
            console.log('[THEME DEBUG] m.isAdmin:', m.isAdmin, '| m.isBotAdmin:', m.isBotAdmin, '| m.isOwner:', m.isOwner);
            console.log('[THEME DEBUG] participants count:', participants.length);

            for (const p of participants) {
                const pNum = (p.id || '').split(':')[0].split('@')[0];
                if (pNum === senderNum) {
                    console.log('[THEME DEBUG] sender match -> p.id:', p.id, '| p.admin:', p.admin);
                    if (p.admin) senderIsAdmin = true;
                }
                if (pNum === botNum || pNum === botLidNum) {
                    console.log('[THEME DEBUG] bot match -> p.id:', p.id, '| p.admin:', p.admin, '| matched via:', pNum === botNum ? 'phone' : 'lid');
                    if (p.admin) botIsAdmin = true;
                }
            }

            if (!senderIsAdmin) console.log('[THEME DEBUG] No participant matched sender number:', senderNum);
            if (!botIsAdmin) console.log('[THEME DEBUG] No participant matched bot number:', botNum);
        } catch (e) {
            console.error('[THEME DEBUG] groupMetadata error:', e.message);
            // fallback to handler values
            senderIsAdmin = senderIsAdmin || m.isAdmin;
            botIsAdmin = m.isBotAdmin;
        }

        console.log('[THEME DEBUG] FINAL -> senderIsAdmin:', senderIsAdmin, '| botIsAdmin:', botIsAdmin);

        if (!senderIsAdmin) {
            return await m.reply('ᴏɴʟʏ ɢʀᴏᴜᴘ ᴀᴅᴍɪɴs ᴏʀ ᴏᴡɴᴇʀs ᴄᴀɴ ᴜsᴇ ᴛʜɪs ᴄᴏᴍᴍᴀɴᴅ!');
        }

        if (!botIsAdmin) {
            return await m.reply('ɪ ɴᴇᴇᴅ ᴛᴏ ʙᴇ ᴀɴ ᴀᴅᴍɪɴ ᴛᴏ ᴄʜᴀɴɢᴇ ᴛʜᴇ ɢʀᴏᴜᴘ ᴛʜᴇᴍᴇ!');
        }

        const text = args.join(' ').trim();
        let imageBuffer = null;

        const isQuotedImage = m.quoted && (m.quoted.mtype === 'imageMessage' || m.quoted.mediaType === 'image' || m.quoted.isMedia);
        const isCurrentMedia = m.mtype === 'imageMessage' || m.mediaType === 'image';

        if (isQuotedImage) {
            try {
                imageBuffer = await m.quoted.download();
            } catch (e) {
                console.error('[THEME] Failed to download quoted image:', e.message);
            }
        } else if (isCurrentMedia && typeof m.download === 'function') {
            try {
                imageBuffer = await m.download();
            } catch (e) {
                console.error('[THEME] Failed to download media:', e.message);
            }
        }

        const input = parseThemeArgs(text, imageBuffer);

        if (!input) {
            const presetNames = Object.keys(COLOR_PRESETS).slice(0, 9).join(', ');
            const helpText =
                `*ɢʀᴏᴜᴘ ᴛʜᴇᴍᴇ & ᴡᴀʟʟᴘᴀᴘᴇʀ*

*ᴜsᴀɢᴇ:*
• \`.theme <color/preset>\` - sᴇᴛ sᴏʟɪᴅ ᴄᴏʟᴏʀ ᴛʜᴇᴍᴇ
• \`.theme reset\` - ʀᴇsᴛᴏʀᴇ ᴅᴇғᴀᴜʟᴛ ᴛʜᴇᴍᴇ
• ʀᴇᴘʟʏ ᴛᴏ ᴀɴ ɪᴍᴀɢᴇ ᴡɪᴛʜ \`.theme\` - sᴇᴛ ɢʀᴏᴜᴘ ᴡᴀʟʟᴘᴀᴘᴇʀ
• \`.theme <image_url>\` - sᴇᴛ ᴡᴀʟʟᴘᴀᴘᴇʀ ғʀᴏᴍ ᴜʀʟ

*ᴀᴠᴀɪʟᴀʙʟᴇ ᴘʀᴇsᴇᴛs:*
${presetNames}
_(ᴏʀ ᴀɴʏ ʜᴇx ᴄᴏʟᴏʀ ʟɪᴋᴇ #ff69b4)_`;
            return await m.reply(helpText);
        }

        try {
            await m.reply('ᴄʜᴀɴɢɪɴɢ ɢʀᴏᴜᴘ ᴛʜᴇᴍᴇ...');
            const result = await setGroupTheme(sock, chatId, input);
            return await m.reply(`ɢʀᴏᴜᴘ ᴛʜᴇᴍᴇ ᴜᴘᴅᴀᴛᴇᴅ sᴜᴄᴄᴇssғᴜʟʟʏ: ${result.label}!`);
        } catch (error) {
            console.error('[THEME ERROR]', error);
            return await m.reply(`ғᴀɪʟᴇᴅ ᴛᴏ ᴜᴘᴅᴀᴛᴇ ɢʀᴏᴜᴘ ᴛʜᴇᴍᴇ: ${error.message}`);
        }
    }
};
