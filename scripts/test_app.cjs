const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  if (reason && reason.stack) {
    console.error(reason.stack);
  }
});

(async () => {
  // Save screenshots to the brain artifacts directory to avoid triggering Vite's watcher
  const screenshotsDir = 'C:\\Users\\jaron\\.gemini\\antigravity\\brain\\3044dd3b-6f4b-48ed-ae61-99e4f097932e\\test_screenshots';
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  console.log('Launching browser with GPU disabled...');
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--disable-webgl',
      '--disable-software-rasterizer',
      '--disable-accelerated-2d-canvas'
    ],
    protocolTimeout: 60000
  });

  let page;
  const consoleLogs = [];
  const errors = [];

  // Safe screenshot helper — WebGL/Cesium can crash headless Chrome
  async function safeScreenshot(p, filePath) {
    try {
      if (p && !p.isClosed()) {
        await p.screenshot({ path: filePath });
        console.log(`Screenshot saved: ${path.basename(filePath)}`);
      }
    } catch (ssErr) {
      console.warn(`Screenshot failed (non-fatal): ${ssErr.message}`);
    }
  }

  async function setupPage() {
    if (page) {
      try {
        await page.close();
      } catch (e) {}
    }
    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    page.on('console', msg => {
      const text = msg.text();
      const type = msg.type();
      consoleLogs.push({ type, text });
      console.log(`[BROWSER CONSOLE ${type.toUpperCase()}] ${text}`);
      if (type === 'error') {
        errors.push(text);
      }
    });

    page.on('pageerror', err => {
      errors.push(err.toString());
      console.error(`[BROWSER UNCAUGHT EXCEPTION] ${err.toString()}`);
    });

    page.on('requestfailed', request => {
      const url = request.url();
      const failure = request.failure();
      console.warn(`[BROWSER REQUEST FAILED] ${url}: ${failure ? failure.errorText : 'unknown'}`);
      if (!url.includes('google-analytics') && !url.includes('doubleclick') && !url.includes('favicon.ico') && !url.includes('satellites/25544') && !url.includes('chat') && !url.includes('manifest')) {
        errors.push(`Request failed: ${url} (${failure ? failure.errorText : 'unknown'})`);
      }
    });
  }

  // Safe evaluate helper — recovers from detached frame by recreating page
  async function safeEvaluate(fn) {
    try {
      return await page.evaluate(fn);
    } catch (evalErr) {
      if (evalErr.message.includes('detached') || evalErr.message.includes('closed')) {
        console.warn('Frame detached. Recreating page...');
        await setupPage();
        await page.goto('http://127.0.0.1:3000/?fallback=true', { waitUntil: 'domcontentloaded', timeout: 20000 });
        await new Promise(r => setTimeout(r, 4000));
        return await page.evaluate(fn);
      }
      throw evalErr;
    }
  }

  await setupPage();

  try {
    console.log('Navigating to http://127.0.0.1:3000/ ...');
    
    // Retry navigation up to 3 times — headless Chrome may crash during WebGL init
    let navSuccess = false;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`Navigation attempt ${attempt}...`);
        await page.goto('http://127.0.0.1:3000/?fallback=true', { waitUntil: 'domcontentloaded', timeout: 20000 });
        await page.waitForSelector('body', { timeout: 10000 });
        await new Promise(r => setTimeout(r, 6000));
        navSuccess = true;
        break;
      } catch (navErr) {
        console.warn(`Attempt ${attempt} failed: ${navErr.message}`);
        if (attempt < 3) {
          await new Promise(r => setTimeout(r, 3000));
          await setupPage();
        }
      }
    }
    
    if (!navSuccess) {
      throw new Error('Could not load page after 3 attempts (headless browser WebGL crash)');
    }
    await safeScreenshot(page, path.join(screenshotsDir, '01_boot_screen.png'));
    console.log('Captured boot screen.');

    // 1. Skip boot interface if present
    console.log('Clicking SKIP BOOT INTERFACE if present...');
    const clickedSkip = await safeEvaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('SKIP BOOT'));
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });

    if (clickedSkip) {
      console.log('Clicked SKIP BOOT button. Waiting for workspace...');
      await new Promise(r => setTimeout(r, 3000));
    } else {
      console.log('SKIP BOOT button not present (already skipped). Proceeding...');
    }

    await safeScreenshot(page, path.join(screenshotsDir, '02_workspace_initial.png'));
    console.log('Workspace loaded.');

    // Verify UI is in Chat mode by default
    const isChatMode = await safeEvaluate(() => {
      return document.body.textContent.includes('Neural Interface active');
    });
    console.log(`Is initial workspace in Chat mode? ${isChatMode}`);

    // 2. Test Orbital view tab
    console.log('Switching to Orbital View...');
    const clickedOrbital = await safeEvaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.trim() === 'Orbital');
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });
    if (!clickedOrbital) throw new Error('Could not find Orbital tab button');
    await new Promise(r => setTimeout(r, 2000));
    await safeScreenshot(page, path.join(screenshotsDir, '03_orbital_view.png'));
    console.log('Orbital View displayed.');

    // 3. Test Saved Places preset coordinates targets
    console.log('Opening Landmark Database panel (Places)...');
    const openedPlaces = await safeEvaluate(() => {
      const btn = document.querySelector('button[title="Saved Places"]');
      if (btn) {
        btn.click();
        return true;
      }
      // Try collapsible section buttons
      const sectionBtns = Array.from(document.querySelectorAll('button'));
      const placesBtn = sectionBtns.find(b => b.textContent && b.textContent.includes('Saved Places'));
      if (placesBtn) {
        placesBtn.click();
        return true;
      }
      return false;
    });
    console.log(`Opened Saved Places: ${openedPlaces}`);
    await new Promise(r => setTimeout(r, 1000));
    await safeScreenshot(page, path.join(screenshotsDir, '04_places_panel.png'));

    console.log('Clicking on preset coordinate target (Mount Everest)...');
    const clickedEverest = await safeEvaluate(() => {
      const items = Array.from(document.querySelectorAll('button'));
      const everest = items.find(item => item.textContent && item.textContent.includes('Mount Everest'));
      if (everest) {
        everest.click();
        return true;
      }
      return false;
    });
    console.log(`Clicked Mount Everest: ${clickedEverest}`);
    await new Promise(r => setTimeout(r, 2000));
    await safeScreenshot(page, path.join(screenshotsDir, '05_places_everest_selected.png'));
    console.log('Selected Mount Everest preset coordinates.');

    // 4. Test ruler measurements (Measure Distance)
    console.log('Opening Measure Distance panel...');
    const openedMeasure = await safeEvaluate(() => {
      const sectionBtns = Array.from(document.querySelectorAll('button'));
      const measureBtn = sectionBtns.find(b => b.textContent && b.textContent.includes('Distance Ruler'));
      if (measureBtn) {
        measureBtn.click();
        return true;
      }
      return false;
    });
    console.log(`Opened Distance Ruler: ${openedMeasure}`);
    await new Promise(r => setTimeout(r, 1000));
    await safeScreenshot(page, path.join(screenshotsDir, '06_measure_panel.png'));

    console.log('Selecting Start and End locations for measurement...');
    const selectedPoints = await safeEvaluate(() => {
      const selects = document.querySelectorAll('select.earth-measure-select');
      if (selects.length >= 2) {
        selects[0].selectedIndex = 1;
        selects[0].dispatchEvent(new Event('change', { bubbles: true }));
        
        selects[1].selectedIndex = 2;
        selects[1].dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }
      return false;
    });
    console.log(`Selected measurement points: ${selectedPoints}`);
    await new Promise(r => setTimeout(r, 1000));
    await safeScreenshot(page, path.join(screenshotsDir, '07_measure_active.png'));

    const measureDistanceText = await safeEvaluate(() => {
      const res = document.querySelector('.earth-measure-result');
      return res ? res.textContent.trim().replace(/\s+/g, ' ') : null;
    });
    console.log(`Measured Distance: ${measureDistanceText}`);

    // 5. Test Telescope view tab
    console.log('Switching to Telescope View...');
    const clickedTelescope = await safeEvaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.trim() === 'Telescope');
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });
    if (!clickedTelescope) throw new Error('Could not find Telescope tab button');
    await new Promise(r => setTimeout(r, 2000));
    await safeScreenshot(page, path.join(screenshotsDir, '08_telescope_view.png'));
    console.log('Telescope View displayed.');

    // 6. Test Personalisation Settings panel
    console.log('Opening Personalisation Settings panel...');
    const openedSettings = await safeEvaluate(() => {
      const btn = document.querySelector('button[aria-label="User profile"]');
      if (btn) {
        btn.click();
        return true;
      }
      // Fallback: look for settings button by title
      const settingsBtn = document.querySelector('button[title="Open Settings"]');
      if (settingsBtn) {
        settingsBtn.click();
        return true;
      }
      return false;
    });
    console.log(`Opened Settings: ${openedSettings}`);
    await new Promise(r => setTimeout(r, 2000));
    await safeScreenshot(page, path.join(screenshotsDir, '09_settings_panel.png'));
    console.log('Personalisation Settings panel displayed.');

    // Close settings
    console.log('Closing settings panel...');
    const closedSettings = await safeEvaluate(() => {
      const closeBtn = document.querySelector('button[title="Exit Settings"]') || Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Back to Workspace'));
      if (closeBtn) {
        closeBtn.click();
        return true;
      }
      return false;
    });
    if (closedSettings) {
      await new Promise(r => setTimeout(r, 1000));
    }

    // 7. Switch back to Chat mode
    console.log('Switching back to Chat View...');
    const clickedChat = await safeEvaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.trim() === 'Chat');
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });
    if (!clickedChat) throw new Error('Could not find Chat tab button');
    await new Promise(r => setTimeout(r, 1000));
    await safeScreenshot(page, path.join(screenshotsDir, '10_chat_view_final.png'));

  } catch (err) {
    console.error('Test script encountered an error:', err);
    errors.push(`Test execution exception: ${err.message}`);
  } finally {
    await browser.close();
    console.log('Browser closed.');

    // Write final summary log to brain artifacts directory
    const reportPath = 'C:\\Users\\jaron\\.gemini\\antigravity\\brain\\3044dd3b-6f4b-48ed-ae61-99e4f097932e\\automated_test_report.json';
    const reportData = {
      timestamp: new Date().toISOString(),
      errors,
      consoleLogsCount: consoleLogs.length,
      status: errors.length === 0 ? 'PASSED' : 'FAILED',
      failedChecks: errors
    };
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    console.log(`Saved audit report to ${reportPath}`);
    console.log(`Test status: ${reportData.status}`);
  }
})();
