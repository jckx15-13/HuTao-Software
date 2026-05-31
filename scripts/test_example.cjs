const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage'
    ]
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  try {
    console.log('Navigating to http://127.0.0.1:3001/?fallback=true ...');
    await page.goto('http://127.0.0.1:3001/?fallback=true', { waitUntil: 'domcontentloaded', timeout: 15000 });
    console.log('Success! Page title:', await page.title());
    
    await page.screenshot({ path: path.join(__dirname, '01_test_boot.png') });
    console.log('Took 01_test_boot.png');

    console.log('Clicking SKIP BOOT button...');
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('SKIP BOOT'));
      if (btn) btn.click();
    });

    console.log('Waiting 3 seconds for workspace to mount...');
    await new Promise(r => setTimeout(r, 3000));

    await page.screenshot({ path: path.join(__dirname, '02_test_workspace.png') });
    console.log('Took 02_test_workspace.png');

    const bodyText = await page.evaluate(() => document.body.textContent);
    console.log('Body contains Neural Interface active:', bodyText.includes('Neural Interface active'));

  } catch (e) {
    console.error('Failed:', e);
  } finally {
    await browser.close();
    console.log('Browser closed.');
  }
})();
