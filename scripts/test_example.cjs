const puppeteer = require('puppeteer');

(async () => {
  console.log('Launching...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  try {
    console.log('Navigating to example.com...');
    await page.goto('https://example.com', { waitUntil: 'networkidle2' });
    console.log('Success! Page title:', await page.title());
  } catch (e) {
    console.error('Failed:', e);
  } finally {
    await browser.close();
  }
})();
