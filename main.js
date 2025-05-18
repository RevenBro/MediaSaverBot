// CommonJS usulida dotenv va boshqa modullarni import qilish
const TelegramBot = require('node-telegram-bot-api');
const dotenv = require('dotenv');
const axios = require('axios');

// dotenv konfiguratsiyasi 
dotenv.config();
const TOKEN = process.env.BOT_TOKEN;

// Bot yaratish
const bot = new TelegramBot(TOKEN, {polling: true});

// API'larni almashtirish uchun funksiya
async function downloadFromInstagram(url) {
  console.log(`Instagram URL yuklanmoqda: ${url}`);
  
  // Barcha API'larni sinab ko'rish
  return tryAllApis(url);
}

// Barcha API'larni sinab ko'rish
async function tryAllApis(url) {
  // Xatolarni saqlash uchun
  const errors = [];

  // 1-usul: RapidAPI Instagram Web API
  try {
    console.log("1-usul: RapidAPI Instagram Web API bilan urinish");
    const options = {
      method: 'GET',
      url: 'https://instagram-scrapper-posts-reels-stories-downloader.p.rapidapi.com/hashtag_search_by_query',
      params: { url: url },
      headers: {
        'x-rapidapi-key': '99b4099a6cmsh170d3543ef010f0p124e05jsn505f226853fa',
        'x-rapidapi-host': 'instagram-scrapper-posts-reels-stories-downloader.p.rapidapi.com'
      }
    };

    const response = await axios.request(options);
    if (response.data && response.data.success && response.data.data && response.data.data.result) {
      console.log("RapidAPI Instagram Web API muvaffaqiyatli ishladi");
      const result = response.data.data.result;
      
      if (result.type === 'video') {
        return {
          type: 'video',
          url: result.url,
          caption: result.caption || ''
        };
      } else if (result.type === 'image') {
        return {
          type: 'photo',
          url: result.url,
          caption: result.caption || ''
        };
      }
    }
    errors.push("RapidAPI Instagram Web API: Media mavjud emas");
  } catch (error) {
    console.error("RapidAPI Instagram Web API xatoligi:", error.message);
    errors.push(`RapidAPI Instagram Web API: ${error.message}`);
  }
  
  // 2-usul: IGRAPI - Instagram Graph API
  try {
    console.log("2-usul: IGRAPI bilan urinish");
    const options = {
      method: 'GET',
      url: 'https://instagram-reels-downloader-api.p.rapidapi.com/download',
      params: { url: url },
      headers: {
        'x-rapidapi-key': '99b4099a6cmsh170d3543ef010f0p124e05jsn505f226853fa',
        'x-rapidapi-host': 'instagram-reels-downloader-api.p.rapidapi.com'
      }
    };

    const response = await axios.request(options);
    if (response.data && response.data.result) {
      console.log("IGRAPI muvaffaqiyatli ishladi");
      const mediaUrl = response.data.result.download_link || response.data.result.url;
      
      if (mediaUrl) {
        return {
          type: mediaUrl.includes('.mp4') ? 'video' : 'photo',
          url: mediaUrl,
          caption: response.data.result.title || ''
        };
      }
    }
    errors.push("IGRAPI: Media mavjud emas");
  } catch (error) {
    console.error("IGRAPI xatoligi:", error.message);
    errors.push(`IGRAPI: ${error.message}`);
  }
  
  // 3-usul: Instagram Story yoki Reels uchun mo'ljallangan API
  try {
    console.log("3-usul: Instagram Story/Reels API bilan urinish");
    const options = {
      method: 'GET',
      url: 'https://instagram-downloader-download-instagram-stories-videos4.p.rapidapi.com/convert',
      params: { url: url },
      headers: {
        'x-rapidapi-key': '99b4099a6cmsh170d3543ef010f0p124e05jsn505f226853fa',
        'x-rapidapi-host': 'instagram-downloader-download-instagram-stories-videos4.p.rapidapi.com'
      }
    };
    
    const response = await axios.request(options);
    if (response.data && response.data.data && response.data.data.url) {
      console.log("Instagram Story/Reels API muvaffaqiyatli ishladi");
      return {
        type: response.data.data.url.includes('.mp4') ? 'video' : 'photo',
        url: response.data.data.url,
        caption: response.data.data.caption || ''
      };
    }
    errors.push("Instagram Story/Reels API: Media mavjud emas");
  } catch (error) {
    console.error("Instagram Story/Reels API xatoligi:", error.message);
    errors.push(`Instagram Story/Reels API: ${error.message}`);
  }
  
  // 4-usul: SnapIG API
  try {
    console.log("4-usul: SnapIG API bilan urinish");
    const options = {
      method: 'GET',
      url: 'https://instagram-api-media-downloader.p.rapidapi.com/download',
      params: { url: url },
      headers: {
        'x-rapidapi-key': '99b4099a6cmsh170d3543ef010f0p124e05jsn505f226853fa',
        'x-rapidapi-host': 'instagram-api-media-downloader.p.rapidapi.com'
      }
    };
    
    const response = await axios.request(options);
    if (response.data && response.data.result && response.data.result.length > 0) {
      console.log("SnapIG API muvaffaqiyatli ishladi");
      const mediaItem = response.data.result[0];
      return {
        type: mediaItem.type === 'video' ? 'video' : 'photo',
        url: mediaItem.url,
        caption: mediaItem.caption || ''
      };
    }
    errors.push("SnapIG API: Media mavjud emas");
  } catch (error) {
    console.error("SnapIG API xatoligi:", error.message);
    errors.push(`SnapIG API: ${error.message}`);
  }
  
  // 5-usul: Universal Instagram Downloader
  try {
    console.log("5-usul: Universal Instagram Downloader bilan urinish");
    const instagramUrl = url.trim();
    // Instagram URL'dan ID ni ajratib olish
    const urlParts = instagramUrl.split('/');
    let mediaCode = '';
    for (let i = 0; i < urlParts.length; i++) {
      if (urlParts[i] && urlParts[i].length > 5 && !urlParts[i].includes('.')) {
        mediaCode = urlParts[i];
      }
    }
    
    if (mediaCode) {
      const options = {
        method: 'GET',
        url: `https://instagram-bulk-profile-scrapper.p.rapidapi.com/media/${mediaCode}`,
        headers: {
          'X-RapidAPI-Key': '14ca47c488mshc8e79e7b00a0c82p10c2eejsn5a799ced749c',
          'X-RapidAPI-Host': 'instagram-bulk-profile-scrapper.p.rapidapi.com'
        }
      };
      
      const response = await axios.request(options);
      if (response.data && response.data.node) {
        console.log("Universal Instagram Downloader muvaffaqiyatli ishladi");
        const node = response.data.node;
        
        if (node.is_video && node.video_url) {
          return {
            type: 'video',
            url: node.video_url,
            caption: node.edge_media_to_caption?.edges[0]?.node?.text || ''
          };
        } else if (node.display_url) {
          return {
            type: 'photo',
            url: node.display_url,
            caption: node.edge_media_to_caption?.edges[0]?.node?.text || ''
          };
        }
      }
    }
    errors.push("Universal Instagram Downloader: Media mavjud emas");
  } catch (error) {
    console.error("Universal Instagram Downloader xatoligi:", error.message);
    errors.push(`Universal Instagram Downloader: ${error.message}`);
  }
  
  // Barcha API'lar ishlamadi
  throw new Error(`Barcha API'lar ishlamadi: ${errors.join(', ')}`);
}

// Bot xabarlarini qayta ishlash
bot.on('message', async (message) => {
  try {
    const chatId = message.chat.id;
    const name = message.from.first_name;
    const text = message.text || '';
    
    console.log(`Foydalanuvchidan xabar olindi: ${chatId}, ${name}, "${text}"`);
    
    // /start buyrug'ini tekshirish
    if (text === "/start") {
      await bot.sendMessage(chatId, `Salom <b>${name}</b>, botimizga xush kelibsiz! Instagram linkini yuboring, men video/rasm yuklashga harakat qilaman.`, {
        parse_mode: "HTML"
      });
      return;
    }
    
    // Agar xabar instagram.com havolasini o'z ichiga olmasa, xabar berish
    if (!text.includes('instagram.com')) {
      await bot.sendMessage(chatId, `Instagram linkini yuboring! Masalan: https://www.instagram.com/p/XXXXXX/`, {
        parse_mode: "HTML"
      });
      return;
    }
    
    // Yuklashni boshlashni bildirish
    const loadingMsg = await bot.sendMessage(chatId, "Instagram kontentini yuklab olishga harakat qilyapman...");
    
    try {
      // Instagram kontentini yuklab olish
      const media = await downloadFromInstagram(text);
      
      // Loading xabarini o'chirish
      await bot.deleteMessage(chatId, loadingMsg.message_id);
      
      // Caption tayyorlash
      const caption = (media.caption || "") + "\n\nDasturchi: @Saidakbarovv_A";
      
      if (media.type === 'video') {
        // Video yuborish
        await bot.sendVideo(chatId, media.url, {
          caption: caption
        });
      } else {
        // Rasm yuborish
        await bot.sendPhoto(chatId, media.url, {
          caption: caption
        });
      }
      
    } catch (downloadError) {
      console.error("Yuklab olishda xatolik:", downloadError);
      
      // Loading xabarini o'chirish
      try {
        await bot.deleteMessage(chatId, loadingMsg.message_id);
      } catch (e) {
        console.log("Xabarni o'chirishda xatolik:", e.message);
      }
      
      await bot.sendMessage(chatId, `Kechirasiz, bu havola uchun kontentni yuklab ololmadim. Boshqa havola bilan urinib ko'ring yoki keyinroq qayta harakat qiling.`);
    }
    
  } catch (error) {
    console.error("Xatolik yuz berdi:", error);
    
    // Xatolik haqida foydalanuvchiga xabar berish
    try {
      await bot.sendMessage(message.chat.id, `Kechirasiz, xatolik yuz berdi. Iltimos, boshqa Instagram linkini yuboring yoki keyinroq qayta urinib ko'ring.`);
    } catch (sendError) {
      console.error("Xatolik haqida xabar yuborishda muammo:", sendError);
    }
  }
});

// Botni ishga tushirish haqida xabar
console.log('Bot ishga tushirildi!');