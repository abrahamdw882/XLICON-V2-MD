import ytdl from 'ytdl-core';
import fs from 'fs';
import { pipeline } from 'stream';
import { promisify } from 'util';
import os from 'os';
import axios from 'axios';

const streamPipeline = promisify(pipeline);

let handler = async (message, { conn, command, text, usedPrefix }) => {
  if (!text) {
    throw "Use example " + usedPrefix + command + " <query>";
  }
  
  await message.react('⏳');
  try {
    const query = encodeURIComponent(text);
    const searchResponse = await axios.get(`https://weeb-api.vercel.app/ytsearch?query=${query}`);
    const video = searchResponse.data.results[0];

    if (!video) {
      throw "Video not found, try another title.";
    }

    const { title, thumbnail, duration, views, uploaded, url } = video;

    const videoInfo = `⬡▸  ••๑⋯ ⬡▸  Y O U T U B E ⬡▸  ⋯⋅๑•• ✼\n\n  ⬡▸  Title: ${title}\n\n  ⬡▸  Duration: ${duration}\n\n  ⬡▸  Views: ${views}\n\n  ⬡▸  Upload: ${uploaded}\n\n  ⬡▸  Link: ${url}\n\n⊱─━━━━⊱༻XLICON●v2༺⊰━━━━─⬡▸`;

    conn.sendMessage(message.chat, {
      image: { url: thumbnail },
      caption: videoInfo,
      footer: "Author"
    }, { quoted: message });

    const audioStream = ytdl(url, {
      filter: "audioonly",
      quality: "highestaudio"
    });

    const tmpDir = os.tmpdir();
    const audioPath = `${tmpDir}/${title}.mp3`;
    const audioWriteStream = fs.createWriteStream(audioPath);

    await streamPipeline(audioStream, audioWriteStream);

    const audioMessage = {
      audio: { url: audioPath },
      mimetype: "audio/mpeg",
      ptt: false,
      fileName: `${title}.mp3`,
      contextInfo: {
        externalAdReply: {
          showAdAttribution: true,
          mediaType: 2,
          mediaUrl: url,
          title: title,
          body: "Here is your song made by XLICON-v2",
          sourceUrl: url,
          thumbnail: await (await conn.getFile(thumbnail)).data
        }
      }
    };

    await conn.sendMessage(message.chat, audioMessage, { quoted: message });

    fs.unlink(audioPath, (err) => {
      if (err) {
        console.error("Failed to delete audio file:", err);
      } else {
        console.log("Deleted audio file:", audioPath);
      }
    });

  } catch (error) {
    console.error(error);
    throw "An error occurred while searching for YouTube videos or fetching the audio.";
  }
};

handler.help = ["play1"].map(command => command + " <query>");
handler.tags = ['downloader'];
handler.command = /^play1$/i;
handler.exp = 0;

export default handler;
