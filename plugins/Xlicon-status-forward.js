export async function processStatusMessage(message, { isAdmin, isBotAdmin, conn }) {
  if (message.key.remoteJid !== "status@broadcast") {
    return false;
  }

  this.story = this.story || [];
  const senderName = conn.getName(message.sender) || "Unknown";

  console.log(conn.user.id);

  try {
    if (message.type === "imageMessage" || message.type === "videoMessage") {
      const statusContent = "XLICON-V2 BOT STATUS SERVER";
      const statusCaption = `${statusContent}\n\n Status from ${senderName}`;
      const mediaBuffer = await message.download();

      await this.sendFile(conn.user.id, mediaBuffer, '', statusCaption, message, false, {
        mentions: [message.sender],
      });

      this.story.push({
        type: message.type,
        quoted: message,
        sender: message.sender,
        caption: statusCaption,
        buffer: mediaBuffer,
      });
    } else if (message.type === "audioMessage") {
      const audioBuffer = await message.download();

      await this.sendFile(conn.user.id, audioBuffer, '', '', message, false, {
        mimetype: message.mimetype,
      });

      this.story.push({
        type: message.type,
        quoted: message,
        sender: message.sender,
        buffer: audioBuffer,
      });
    } else if (message.type === "extendedTextMessage") {
      const customMessage = message.text || '';

      await this.reply(conn.user.id, customMessage, message, {
        mentions: [message.sender],
      });

      this.story.push({
        type: message.type,
        quoted: message,
        sender: message.sender,
        message: customMessage,
      });
    } else {
      console.log("Unsupported message type:", message.type);
    }

    if (process.env.statusview) {
      return true;
    }
  } catch (error) {
    console.error("Error processing message:", error);
    return false;
  }
}
