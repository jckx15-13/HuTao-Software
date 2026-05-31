const puppeteer = require('puppeteer');
const path = require('path');

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu'
    ]
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  page.on('console', msg => {
    console.log(`[${new Date().toISOString()}] [CONSOLE ${msg.type().toUpperCase()}] ${msg.text()}`);
  });

  page.on('pageerror', err => {
    console.error(`[${new Date().toISOString()}] [UNCAUGHT EXCEPTION] ${err.toString()}`);
  });

  page.on('error', err => {
    console.error(`[${new Date().toISOString()}] [PAGE CRASHED] ${err.toString()}`);
  });

  page.on('requestfailed', req => {
    console.warn(`[${new Date().toISOString()}] [REQUEST FAILED] ${req.url()}: ${req.failure() ? req.failure().errorText : 'unknown'}`);
  });

  try {
    console.log('Navigating to http://127.0.0.1:3000/?fallback=true ...');
    await page.goto('http://127.0.0.1:3000/?fallback=true', { waitUntil: 'domcontentloaded', timeout: 15000 });
    console.log('Success! Page title:', await page.title());

    console.log('Clicking SKIP BOOT button...');
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('SKIP BOOT'));
      if (btn) btn.click();
    });

    console.log('Waiting 3 seconds for workspace to mount...');
    await new Promise(r => setTimeout(r, 3000));

    console.log('Clicking Orbital button...');
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.trim() === 'Orbital');
      if (btn) btn.click();
    });

    console.log('Waiting 2 seconds...');
    await new Promise(r => setTimeout(r, 2000));

    console.log('Clicking Telescope button...');
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.trim() === 'Telescope');
      if (btn) btn.click();
    });

    console.log('Polled checks start...');
    for (let i = 0; i < 20; i++) {
      await new Promise(r => setTimeout(r, 250));
      const text = await page.evaluate(() => document.body.textContent.slice(0, 100));
      console.log(`[POLL ${i}] Body starts with: ${text.replace(/\n/g, ' ')}`);
    }
    console.log('Completed polling successfully without crash!');

  } catch (e) {
    console.error('Failed:', e);
  } finally {
    await browser.close();
    console.log('Browser closed.');
  }
})();
