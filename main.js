const TelegramBot = require('node-telegram-bot-api');
import dotenv from "dotenv"
dotenv.config()
const TOKEN = process.env.BOT_TOKEN;
const {instagramDownloaderMethod} = require("./instagram");

const bot = new TelegramBot(TOKEN, {polling: true});

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
    await bot.sendMessage(chatId, "Instagram kontentini yuklab olishga harakat qilyapman...");
    
    // Instagram API orqali kontentni yuklab olish
    const getUrl = await instagramDownloaderMethod(text);
    
    // Agar natija bo'lmasa yoki video mavjud bo'lmasa
    if (!getUrl || !getUrl.video) {
      await bot.sendMessage(chatId, `Kechirasiz, bu havola uchun kontentni yuklab ololmadim. Boshqa havola bilan urinib ko'ring.`);
      return;
    }
    
    console.log(`Video URL: ${getUrl.video.substring(0, 50)}...`);
    
    // Captionni tayyorlash
    const caption = (getUrl.caption || "") + '\n\nDasturchi: @Saidakbarovv_A';
    
    // Videoni yuborish
    await bot.sendVideo(chatId, getUrl.video, {
      caption: caption
    });
    
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