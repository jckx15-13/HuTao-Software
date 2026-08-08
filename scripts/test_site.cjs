const puppeteer = require('puppeteer');

(async () => {
  console.log("Launching browser...");
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.CHROME_PATH || undefined,
    dumpio: true
  });

  try {
    const page = await browser.newPage();
    
    page.on('console', msg => console.log('[BROWSER CONSOLE]', msg.type(), msg.text()));
    page.on('pageerror', err => console.error('[BROWSER EXCEPTION]', err.message));
    page.on('error', err => console.error('[BROWSER CRASH]', err.message));
    
    page.on('frameattached', frame => {
      console.log(`[FRAME ATTACHED] ID: ${frame._id || frame.id}, Name: ${frame.name()}, URL: ${frame.url()}`);
    });
    page.on('framedetached', frame => {
      console.log(`[FRAME DETACHED] ID: ${frame._id || frame.id}, Name: ${frame.name()}, URL: ${frame.url()}`);
    });
    page.on('framenavigated', frame => {
      console.log(`[FRAME NAVIGATED] ID: ${frame._id || frame.id}, Name: ${frame.name()}, URL: ${frame.url()}`);
    });

    console.log("Navigating to http://127.0.0.1:3000/?fallback=true...");
    await page.goto("http://127.0.0.1:3000/?fallback=true", { waitUntil: 'domcontentloaded', timeout: 30000 });

    console.log("Waiting 2s for boot screen to load...");
    await new Promise(r => setTimeout(r, 2000));

    console.log("Clicking SKIP BOOT...");
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('SKIP BOOT'));
      if (btn) {
        btn.click();
        console.log("SKIP BOOT clicked");
      } else {
        console.log("SKIP BOOT button not found");
      }
    });

    console.log("Waiting 4s for workspace to mount...");
    await new Promise(r => setTimeout(r, 4000));

    console.log("Checking UIStore status...");
    const state = await page.evaluate(() => {
      return {
        hasStore: typeof window.useUIStore !== 'undefined',
        interactionMode: window.useUIStore?.getState().interactionMode,
        currentPage: window.useUIStore?.getState().currentPage,
      };
    });
    console.log("UIStore State:", state);

    console.log("Setting mode to orbital...");
    await page.evaluate(() => {
      if (window.useUIStore) {
        window.useUIStore.getState().setInteractionMode('orbital');
      }
    });

    console.log("Waiting 5s in orbital mode...");
    await new Promise(r => setTimeout(r, 5000));
    console.log("Done waiting.");

  } catch (err) {
    console.error("Test encountered error:", err.message);
  } finally {
    await browser.close();
    console.log("Browser closed.");
  }
})();
