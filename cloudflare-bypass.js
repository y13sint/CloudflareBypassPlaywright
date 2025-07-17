const dotenv = require('dotenv');
dotenv.config({ path: '.env' });
const { firefox } = require('playwright');


const TARGET_DEFAULT = process.env.TARGET_URL || 'https://kra34.at';


const CF_CHALLENGE_CLICK = '213,293' || '640,480';

/**
 * Получает валидный набор cookie + UA после обхода Cloudflare.
 * @param {string} url           Целевой URL.
 * @param {boolean} persistent   Оставлять браузер живым (default: false).
 * @param {string} proxyUrl       URL прокси (default: null).
 * @returns {Promise<{cookies: string, cookiesArray: Array, userAgent: string}>}
 */
async function getCloudflareSession(url, persistent = false, proxyUrl = null, clickCoords = null) {
  const launchOpts = { headless: true };

  // Если указан proxyUrl – прокидываем в настройки браузера
  if (proxyUrl) {
    try {
      const u = new URL(proxyUrl);
      const proxy = {
        server: `${u.protocol}//${u.hostname}:${u.port}`,
      };
      if (u.username) proxy.username = decodeURIComponent(u.username);
      if (u.password) proxy.password = decodeURIComponent(u.password);
      launchOpts.proxy = proxy;
      console.log('[INFO] Используем прокси для обхода CF:', proxy.server);
    } catch (e) {
      console.warn('[WARN] Некорректный proxyUrl, игнорируем:', proxyUrl, e.message);
    }
  }

  const browser = await firefox.launch(launchOpts);
  const context = await browser.newContext();
  const page = await context.newPage();

  let coords = clickCoords;
  if (!coords && CF_CHALLENGE_CLICK) {
    const [cx, cy] = CF_CHALLENGE_CLICK.split(',').map(Number);
    if (Number.isFinite(cx) && Number.isFinite(cy)) {
      coords = { x: cx, y: cy };
    }
  }

  console.log(`[INFO] Старт обхода Cloudflare для ${url}`);
  // --- Логируем завершённые / ошибочные запросы, чтобы видеть прогресс обхода CF ---
  /*page.on('requestfinished', (req) => {
    console.log('[CF OK]', req.method(), req.url());
  });*/
  /*page.on('requestfailed', (req) => {
    const err = (req.failure() && req.failure().errorText) || 'unknown';
    console.warn('[CF FAIL]', req.method(), req.url(), err);
  });*/

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 });

  if (coords) {
    console.log(`[INFO] click.`);
    let attempt = 0;
    while (true) {
      const title = (await page.title()).trim().toLowerCase();
      if (title !== 'just a moment...') {
        break;
      }

      attempt += 1;
      try {
        await page.mouse.click(coords.x, coords.y);
        process.stdout.write(`\r[INFO] attempt ${attempt}`);
      } catch (e) {
        console.warn('[WARN] Ошибка клика:', e.message);
      }


      await page.waitForTimeout(800);
    }
    process.stdout.write('\n');
  } else {

    await page.waitForFunction(() => document.title.toLowerCase() !== 'just a moment...', null, { timeout: 120000 });
  }
  // -----------------------------------------------------------

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
      const data = await getCloudflareSession(TARGET_DEFAULT, false);
      console.log(data);
      process.exit(0);
    } catch (e) {
      console.error('[ERROR] Не удалось пройти Cloudflare:', e.message);
      process.exit(1);
    }
  })();
} 
