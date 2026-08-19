const sharp = require("sharp");
const { addStickerMetadata } = require("../lib/sticker");

module.exports = {
    name: "sticker",
    description: "Convert image to sticker with metadata",
    aliases: ["s", "stiker", "sticker"],
    tags: ["convert", "sticker", "tools"],
    command: /^\.?(sticker|stiker|s)/i,

    async execute(sock, m, args) {
        try {
            if (!m.quoted) {
                return m.reply(
                    "Usage: Reply to an image with .sticker\n\nExample: Reply to a photo and type .sticker"
                );
            }

            const mimeType = (
                m.quoted.mtype ||
                m.quoted.msg?.mimetype ||
                m.quoted.mimetype ||
                ""
            ).toLowerCase();

            if (!mimeType.includes("image")) {
                return m.reply("Please reply to an image to convert it to sticker!");
            }

            const buffer = await m.quoted.download();

            if (!buffer || buffer.length === 0) {
                return m.reply("Failed to download image!");
            }

            const webpBuffer = await sharp(buffer)
                .resize(512, 512, {
                    fit: "contain",
                    background: {
                        r: 0,
                        g: 0,
                        b: 0,
                        alpha: 0
                    }
                })
                .webp({
                    quality: 80
                })
                .toBuffer();

            if (!webpBuffer || webpBuffer.length === 0) {
                return m.reply("Failed to convert image to WebP!");
            }

            let packname = "XLICON V2";
            let author = "abztech";
            let categories = ["😀", "🎉"];
            let isAvatar = 0;

            if (args.length > 0) {
                const metaArgs = args.join(" ").split("|");

                if (metaArgs[0] && metaArgs[0].trim()) {
                    packname = metaArgs[0].trim();
                }

                if (metaArgs[1] && metaArgs[1].trim()) {
                    author = metaArgs[1].trim();
                }

                if (metaArgs[2] && metaArgs[2].trim()) {
                    categories = metaArgs[2]
                        .split(",")
                        .map(e => e.trim())
                        .filter(e => e);
                }

                if (
                    metaArgs[3] &&
                    metaArgs[3].trim().toLowerCase() === "avatar"
                ) {
                    isAvatar = 1;
                }
            }

            const stickerWithMetadata = await addStickerMetadata(
                webpBuffer,
                packname,
                author,
                categories,
                {
                    "is-avatar-sticker": isAvatar
                }
            );

            await sock.sendMessage(m.from, {
                sticker: stickerWithMetadata || webpBuffer
            });

        } catch (err) {
            console.error("Sticker Creation Error:", err);
            await m.reply(
                "Failed to create sticker. Error: " + err.message
            );
        }
    }
};
