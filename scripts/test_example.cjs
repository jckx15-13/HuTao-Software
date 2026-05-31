const puppeteer = require('puppeteer');

(async () => {
  console.log('Launching with proxy bypass args...');
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--no-proxy-server',
      '--proxy-bypass-list=*',
      '--disable-features=site-per-process'
    ]
  });
  const page = await browser.newPage();
  try {
    console.log('Navigating to http://127.0.0.1:3000/?fallback=true ...');
    await page.goto('http://127.0.0.1:3000/?fallback=true', { waitUntil: 'domcontentloaded', timeout: 15000 });
    console.log('Success! Page title:', await page.title());
  } catch (e) {
    console.error('Failed:', e);
  } finally {
    await browser.close();
  }
})();
