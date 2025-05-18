const axios = require('axios');

async function instagramDownloaderMethod(insta_url) {
  try {
    // URL bo'sh bo'lmaganligini va instagram.com ga tegishli ekanligini tekshirish
    if (!insta_url || !insta_url.includes('instagram.com')) {
      console.log("URL mavjud emas yoki Instagram URL emas:", insta_url);
      return null; // null qaytaramiz, main.js da buni tekshiramiz
    }
    
    console.log("Instagram URL ni yuklab olishga harakat qilinmoqda:", insta_url);
    
    const options = {
      method: 'GET',
      url: 'https://instagram-posts-reels-stories-downloader.p.rapidapi.com/get-info-rapidapi',
      params: {
        url: insta_url
      },
      headers: {
        'x-rapidapi-key': '99b4099a6cmsh170d3543ef010f0p124e05jsn505f226853fa',
        'x-rapidapi-host': 'instagram-posts-reels-stories-downloader.p.rapidapi.com'
      }
    };
      
    const response = await axios.request(options);
    console.log("API dan javob olindi:", JSON.stringify(response.data).slice(0, 200) + "...");
    
    // API javobida video mavjud yo'qligini tekshiramiz
    if (!response.data || !response.data.video) {
      console.log("API javobida video topilmadi");
      return null;
    }
    
    // Videoning URL manzili to'g'ri formatda ekanligini tekshiramiz
    if (typeof response.data.video !== 'string' || !response.data.video.startsWith('http')) {
      console.log("Video URL noto'g'ri formatda:", response.data.video);
      return null;
    }
    
    const result = {
      video: response.data.video,
      caption: response.data.caption || ''
    };
    
    console.log("Video URL muvaffaqiyatli olindi:", result.video.slice(0, 50) + "...");
    return result;
  } catch (error) {
    console.log("Instagram yuklab olish xatosi:", error.message);
    return null;
  }
}

module.exports = {
  instagramDownloaderMethod
};