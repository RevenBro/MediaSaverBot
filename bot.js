const { Telegraf } = require('telegraf');
const ytdlp = require('yt-dlp-exec');
const fs = require('fs');
const path = require('path');

// Bot tokenini .env faylidan olish tavsiya etiladi
const bot = new Telegraf(process.env.BOT_TOKEN || '8078704952:AAGX0c4Vz6TM9C5jt4HauuW2uWlRptr042c');

// Vaqtinchalik fayllar uchun papka
const tempDir = path.resolve(__dirname, 'temp');

// Papkani yaratish (agar mavjud bo'lmasa)
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

// Vaqtinchalik fayllarni tozalash funktsiyasi
function cleanupTempFiles() {
  try {
    const files = fs.readdirSync(tempDir);
    for (const file of files) {
      try {
        fs.unlinkSync(path.join(tempDir, file));
        console.log(`O'chirildi: ${file}`);
      } catch (err) {
        console.error(`${file} o'chirilmadi:`, err);
      }
    }
  } catch (err) {
    console.error('Temp papkasini o\'qishda xato:', err);
  }
}

// Platformani aniqlash funktsiyasi
function getPlatform(url) {
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  if (url.includes('tiktok.com')) return 'tiktok';
  if (url.includes('instagram.com')) return 'instagram';
  if (url.includes('twitter.com') || url.includes('x.com')) return 'twitter';
  return null;
}

// Start komandasi
bot.start((ctx) => {
  ctx.reply('Salom! YouTube, TikTok, Instagram yoki Twitter linkini yuboring. Men video yuklab beraman.');
});

// Link qabul qilish
bot.on('text', async (ctx) => {
  const url = ctx.message.text.trim();
  
  // URLni tekshirish
  if (!url.startsWith('http')) {
    return ctx.reply('Iltimos, to‘g‘ri havola yuboring.');
  }

  const platform = getPlatform(url);
  if (!platform) {
    return ctx.reply('Afsus, bu sayt qo‘llab-quvvatlanmaydi. YouTube, TikTok, Instagram yoki Twitter linkini yuboring.');
  }

  try {
    await ctx.reply('⏳ Video yuklanmoqda...');

    // Fayl nomi va joylashuvi
    const timestamp = Date.now();
    const fileName = `video_${timestamp}.mp4`;
    const filePath = path.join(tempDir, fileName);

    // Platformaga qarab format tanlash
    let ytdlpArgs = {
      output: filePath,
      noMtime: true,
      noOverwrites: true,
      verbose: true
    };

    switch (platform) {
      case 'youtube':
        ytdlpArgs.format = 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best';
        ytdlpArgs.mergeOutputFormat = 'mp4';
        break;
      case 'tiktok':
        ytdlpArgs.format = 'mp4';
        break;
      case 'instagram':
        ytdlpArgs.format = 'bestvideo+bestaudio/best';
        ytdlpArgs.mergeOutputFormat = 'mp4';
        break;
      case 'twitter':
        ytdlpArgs.format = 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best';
        break;
    }

    // Video yuklash
    await ytdlp(url, ytdlpArgs);

    // Fayl mavjudligini tekshirish
    await new Promise(resolve => setTimeout(resolve, 3000)); // 3 soniya kutish

    let videoFile = filePath;
    if (!fs.existsSync(videoFile)) {
      // Agar asosiy fayl topilmasa, boshqa formatlarni qidirish
      const files = fs.readdirSync(tempDir);
      const foundFile = files.find(f => 
        f.startsWith(`video_${timestamp}`) && 
        ['.mp4', '.mkv', '.webm'].some(ext => f.endsWith(ext))
      );
      
      if (!foundFile) {
        throw new Error('Fayl yaratilmadi');
      }
      videoFile = path.join(tempDir, foundFile);
    }

    // Video yuborish
    await ctx.replyWithVideo({ source: fs.createReadStream(videoFile) });
    await ctx.reply('✅ Video muvaffaqiyatli yuklandi!');

  } catch (error) {
    console.error('Xatolik:', error);
    
    let errorMessage = '❌ Video yuklab bo‘lmadi. ';
    if (error.message.includes('Private') || error.message.includes('private')) {
      errorMessage += 'Video maxfiy yoki cheklangan.';
    } else if (error.message.includes('Unsupported URL') || error.message.includes('not found')) {
      errorMessage += 'URL manzili noto‘g‘ri yoki qo‘llab-quvvatlanmaydi.';
    } else if (error.message.includes('Fayl yaratilmadi')) {
      errorMessage += 'Video formatini qayta ishlashda muammo yuz berdi.';
    } else {
      errorMessage += 'Iltimos, boshqa link yuboring yoki keyinroq urinib ko‘ring.';
    }
    
    await ctx.reply(errorMessage);
  } finally {
    // Har doim temp fayllarni tozalash
    cleanupTempFiles();
  }
});

// Botni ishga tushurish
bot.launch()
  .then(() => console.log('Bot ishga tushdi'))
  .catch(err => console.error('Botni ishga tushirishda xato:', err));

// Dasturni to'xtatganda temp fayllarni tozalash
process.on('SIGINT', () => {
  cleanupTempFiles();
  process.exit();
});

process.on('SIGTERM', () => {
  cleanupTempFiles();
  process.exit();
});