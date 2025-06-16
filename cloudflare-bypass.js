const dotenv = require('dotenv');
dotenv.config({ path: '.env' });
const { firefox } = require('playwright');


const URL = process.env.TARGET_URL || 'https://phyhub.ru';

/**
 * Получает валидный набор cookie + UA после обхода Cloudflare.
 * @param {string} url           Целевой URL.
 * @param {boolean} persistent   Оставлять браузер живым (default: false).
 * @returns {Promise<{cookies: string, cookiesArray: Array, userAgent: string}>}
 */
async function getCloudflareSession(url, persistent = false) {
  const browser = await firefox.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log(`[INFO] Старт обхода Cloudflare для ${url}`);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

  // Ожидаем завершения проверки «Just a moment…»
  while ((await page.title()).trim().toLowerCase() === 'just a moment...') {
    await page.waitForTimeout(500);
  }

  // Извлекаем куки и user-agent
  const cookiesArray = await context.cookies();
  const cookies = cookiesArray.map(c => `${c.name}=${c.value}`).join('; ');
  const userAgent = await page.evaluate(() => navigator.userAgent);

  console.log('[INFO] Cloudflare пройден, получены cookie.');

  if (!persistent) {
    await browser.close();
  }

  return { cookies, cookiesArray, userAgent };
}

module.exports = { getCloudflareSession };

if (require.main === module) {
  (async () => {
    try {
      const data = await getCloudflareSession(URL, false);
      console.log(data);
      process.exit(0);
    } catch (e) {
      console.error('[ERROR] Не удалось пройти Cloudflare:', e.message);
      process.exit(1);
    }
  })();
} 