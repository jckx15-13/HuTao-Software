const puppeteer = require('puppeteer');
const path = require('path');

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
});

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--no-proxy-server',
      '--proxy-bypass-list=*',
      '--disable-features=site-per-process',
      '--disable-gpu'
    ],
    protocolTimeout: 60000
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  page.on('console', msg => {
    console.log(`[CONSOLE] ${msg.text()}`);
  });

  page.on('pageerror', err => {
    console.error(`[UNCAUGHT] ${err.toString()}`);
  });

  page.on('error', err => {
    console.error(`[PAGE CRASHED] ${err.toString()}`);
  });

  try {
    console.log('Navigating to http://127.0.0.1:3000/?fallback=true ...');
    await page.goto('http://127.0.0.1:3000/?fallback=true', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForFunction(() => typeof window.useUIStore !== 'undefined', { timeout: 10000 });

    console.log('Skipping boot via store...');
    await page.evaluate(() => {
      window.useUIStore.getState().setLauncherDismissed(true);
    });
    await new Promise(r => setTimeout(r, 2000));

    console.log('Switching to Orbital mode via store...');
    await page.evaluate(() => {
      window.useUIStore.getState().setInteractionMode('orbital');
    });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(__dirname, '03_store_orbital.png') });
    console.log('Orbital screenshot taken.');

    console.log('Switching to Telescope mode via store...');
    await page.evaluate(() => {
      window.useUIStore.getState().setInteractionMode('telescope');
    });
    await new Promise(r => setTimeout(r, 1000));
    
    console.log('Taking Telescope screenshot...');
    await page.screenshot({ path: path.join(__dirname, '04_store_telescope.png') });
    console.log('Telescope screenshot taken!');

  } catch (e) {
    console.error('Failed:', e);
  } finally {
    await browser.close();
    console.log('Browser closed.');
  }
})();
