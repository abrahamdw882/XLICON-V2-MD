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

   
    let imageUrl = json.BK9;
    if (!imageUrl) {
      throw "❌ No image URL received from the API.";
    }

    
    let imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw "❌ Failed to download the image.";
    }
    let imageBuffer = await imageResponse.buffer();


    await m.react('✅');
    await conn.sendMessage(
      m.chat,
      { image: imageBuffer, caption: `✨ Here is your image for: "${text}"` },
      { quoted: m }
    );
  } catch (error) {
   
    await m.react('❌');
    throw `❌ Error: ${error.message || error}`;
  }
};

handler.help = ['dalle'];
handler.tags = ['ai'];
handler.command = /^(dalle)$/i;

export default handler;
