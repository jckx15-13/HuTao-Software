const puppeteer = require('puppeteer');

(async () => {
  console.log("Launching Puppeteer...");
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-software-rasterizer'
    ]
  });

  try {
    const page = await browser.newPage();
    
    // Inject mocks and CSS overrides before the document loads
    await page.evaluateOnNewDocument(() => {
      // 1. Disable WebGL context creation
      const originalGetContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type, ...args) {
        if (type === 'webgl' || type === 'webgl2' || type === 'experimental-webgl') {
          console.warn(`[MOCKED INTERCEPT] Blocked WebGL context creation: ${type}`);
          return null;
        }
        return originalGetContext.apply(this, [type, ...args]);
      };
      
      // 2. Mock external fetches
      const originalFetch = window.fetch;
      window.fetch = async function (input, init) {
        const url = typeof input === 'string' ? input : (input && input.url) ? input.url : String(input);
        if (
          url.includes('wheretheiss') ||
          url.includes('earthquake') ||
          url.includes('celestrak') ||
          url.includes('open-meteo')
        ) {
          return new Response(JSON.stringify({}), {
            status: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        }
        return originalFetch.apply(window, arguments);
      };

      // 3. Early CSS overrides
      const injectStyles = () => {
        if (document.documentElement) {
          const style = document.createElement('style');
          style.id = 'headless-style-overrides';
          style.textContent = `
            * {
              backdrop-filter: none !important;
              -webkit-backdrop-filter: none !important;
              filter: none !important;
              transition: none !important;
              animation: none !important;
            }
          `;
          document.documentElement.appendChild(style);
          console.log("[MOCKED INTERCEPT] Headless CSS overrides injected successfully.");
        } else {
          setTimeout(injectStyles, 5);
        }
      };
      injectStyles();
    });

    page.on('console', msg => console.log(`[BROWSER CONSOLE] [${msg.type()}] ${msg.text()}`));
    page.on('pageerror', err => console.log(`[BROWSER EXCEPTION] ${err.stack || err.message}`));
    page.on('error', err => console.log(`[BROWSER CRASH] ${err.message}`));
    page.on('requestfailed', req => console.log(`[REQUEST FAILED] ${req.url()} - ${req.failure()?.errorText || 'unknown error'}`));

    console.log("Navigating to http://127.0.0.1:3000/?fallback=true...");
    await page.goto("http://127.0.0.1:3000/?fallback=true", { waitUntil: 'load', timeout: 25000 });
    
    console.log("Waiting for window.useUIStore...");
    await page.waitForFunction(() => typeof window.useUIStore !== 'undefined', { timeout: 15000 });

    console.log("Waiting 5 seconds for workspace to mount...");
    await new Promise(r => setTimeout(r, 5000));
    
    console.log("Querying title...");
    console.log("Page is still alive. Title:", await page.title());

    console.log("Querying body text content length...");
    const textLen = await page.evaluate(() => document.body.textContent?.length || 0);
    console.log("Body text length:", textLen);
  } catch (err) {
    console.error("Test script failed with error:", err.stack || err.message);
  } finally {
    await browser.close();
    console.log("Browser closed.");
  }
})();
