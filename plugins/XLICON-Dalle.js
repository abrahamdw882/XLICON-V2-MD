import fetch from 'node-fetch';

let handler = async (m) => {

  let message = m.quoted ? m.quoted : m;
  let text = (message.text || '').trim();


  if (!text) {
    throw "✳️ Please provide text for the AI to process.";
  }

  await m.react('⏳');

  try {
  
    let response = await fetch(`https://bk9.fun/ai/Text2Img?q=${encodeURIComponent(text)}`);

    if (!response.ok) {
      throw `❌ API returned status: ${response.status}`;
    }
    let json = await response.json();

    
    let aiResponse = json.BK9 || "No response received from the API.";

   
    await m.react('✅');
    const result = { text: aiResponse };
    await conn.sendMessage(m.chat, result, { quoted: m });
  } catch (error) {
    await m.react('❌');
    throw `❌ Error: ${error.message || error}`;
  }
};

handler.help = ['dalle'];
handler.tags = ['ai'];
handler.command = /^(dalle)$/i;

export default handler;
