const dotenv = require('dotenv');
dotenv.config({ path: '.env' });
const { firefox } = require('playwright');


const URL = process.env.TARGET_URL || 'https://phyhub.ru';

async function bypassCloudflare(url) {
  let browser = await firefox.launch({ headless: true });
  
  try {
    let context = await browser.newContext();
    let page = await context.newPage();
    
    console.log(`[INFO] Переход на ${url}`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    let maxRestarts = 2;
    let restartCount = 0;
    
    while (true) {
      let cloudflareBypassSuccessful = false;
      
      for (let i = 0; i < 50; i++) {
        const title = await page.title();
        const html = await page.content();
        
        if (title.trim().toLowerCase() !== 'just a moment...') {
          cloudflareBypassSuccessful = true;
          break;
        }
        
        if (html.includes("Verification is taking longer than expected")) {
          console.log("[WARNING] Cloudflare завис — перезапускаем браузер");
          restartCount++;
          if (restartCount > maxRestarts) {
            throw new Error("[ERROR] Превышено количество попыток перезапуска браузера");
          }
          
          await browser.close();
          browser = await firefox.launch({ headless: false });
          context = await browser.newContext();
          page = await context.newPage();
          await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
          break;
        }
        
        await page.mouse.move(100 + i * 2, 200 + i);
        await page.mouse.wheel(0, 50);
        await new Promise(resolve => setTimeout(resolve, 500)); 
      }
      
      const title = await page.title();
      if (title.trim().toLowerCase() !== 'just a moment...') {
        console.log('[INFO] Cloudflare успешно пройден. Браузер оставлен открытым для дальнейших действий.');
        break;
      }
      
      if (cloudflareBypassSuccessful) break;
    }
    
    await new Promise(() => {});
    
  } catch (error) {
    console.error(`[ERROR] Ошибка: ${error.message}`);
    throw error;
  }
}

module.exports = { bypassCloudflare };

if (require.main === module) {
  (async () => {
    try {
      await bypassCloudflare(URL);
    } catch (error) {
      console.error(`[ERROR] Не удалось выполнить операцию: ${error.message}`);
    }
  })();
} 