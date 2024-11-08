import axios from 'axios';

let handler = async (m, { conn, command, text, usedPrefix }) => {
  if (!text) {
    throw `Please provide a search query. Example: ${usedPrefix + command} <query>`;
  }
  await m.react('⏳');
  try {
    const query = encodeURIComponent(text);
    const searchResponse = await axios.get(`https://weeb-api.vercel.app/ytsearch?query=${query}`);
    const video = searchResponse.data.results[0];

    if (!video) {
      throw 'No video found, please try a different query.';
    }

    const { url, title } = video;
    const audioUrl = `https://ironman.koyeb.app/ironman/dl/yta?url=${encodeURIComponent(url)}`;

    await conn.sendMessage(m.chat, {
      audio: { url: audioUrl },
      mimetype: 'audio/mpeg',
      ptt: false,
      fileName: title,
    }, { quoted: m });

  } catch (error) {
    console.error(error);
    throw 'An error occurred while searching for the YouTube video or fetching the audio.';
  }
};

handler.help = ['play1'].map(command => command + ' <query>');
handler.tags = ['downloader'];
handler.command = /^play1$/i;
handler.exp = 0;

export default handler;
