const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
  const screenshotsDir = path.join(__dirname, '..', 'development_logs', 'test_screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  const consoleLogs = [];
  const errors = [];

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
    // Ignore harmless analytics or third-party connections if any, but log them
    console.warn(`[BROWSER REQUEST FAILED] ${url}: ${failure ? failure.errorText : 'unknown'}`);
    if (!url.includes('google-analytics') && !url.includes('doubleclick')) {
      errors.push(`Request failed: ${url} (${failure ? failure.errorText : 'unknown'})`);
    }
  });

  try {
    console.log('Navigating to http://127.0.0.1:3000/ ...');
    await page.goto('http://127.0.0.1:3000/', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(screenshotsDir, '01_boot_screen.png') });
    console.log('Captured boot screen.');

    // 1. Skip boot interface
    console.log('Clicking SKIP BOOT INTERFACE...');
    const clickedSkip = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('SKIP BOOT'));
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });

    if (!clickedSkip) {
      throw new Error('Could not find SKIP BOOT INTERFACE button');
    }

    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(screenshotsDir, '02_workspace_initial.png') });
    console.log('Workspace loaded.');

    // Verify UI is in Chat mode by default
    const isChatMode = await page.evaluate(() => {
      return document.body.textContent.includes('Neural Interface active');
    });
    console.log(`Is initial workspace in Chat mode? ${isChatMode}`);

    // 2. Test Orbital view tab
    console.log('Switching to Orbital View...');
    const clickedOrbital = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.trim() === 'Orbital');
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });
    if (!clickedOrbital) throw new Error('Could not find Orbital tab button');
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(screenshotsDir, '03_orbital_view.png') });
    console.log('Orbital View displayed.');

    // 3. Test Saved Places preset coordinates targets
    console.log('Opening Landmark Database panel (Places)...');
    const openedPlaces = await page.evaluate(() => {
      const btn = document.querySelector('button[title="Saved Places"]');
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });
    if (!openedPlaces) throw new Error('Could not find Saved Places sidebar button');
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(screenshotsDir, '04_places_panel.png') });

    console.log('Clicking on preset coordinate target (Mount Everest)...');
    const clickedEverest = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('.earth-result-item'));
      const everest = items.find(item => item.textContent && item.textContent.includes('Mount Everest'));
      if (everest) {
        everest.click();
        return true;
      }
      return false;
    });
    if (!clickedEverest) throw new Error('Could not find Mount Everest preset target');
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(screenshotsDir, '05_places_everest_selected.png') });
    console.log('Selected Mount Everest preset coordinates.');

    // 4. Test ruler measurements (Measure Distance)
    console.log('Opening Measure Distance panel...');
    const openedMeasure = await page.evaluate(() => {
      const btn = document.querySelector('button[title="Measure Distance"]');
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });
    if (!openedMeasure) throw new Error('Could not find Measure Distance sidebar button');
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(screenshotsDir, '06_measure_panel.png') });

    console.log('Selecting Start and End locations for measurement...');
    const selectedPoints = await page.evaluate(() => {
      const selects = document.querySelectorAll('select.earth-measure-select');
      if (selects.length >= 2) {
        // Select first available options (usually index 1 is first landmark, index 2 is second)
        selects[0].selectedIndex = 1;
        selects[0].dispatchEvent(new Event('change', { bubbles: true }));
        
        selects[1].selectedIndex = 2;
        selects[1].dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }
      return false;
    });
    if (!selectedPoints) throw new Error('Could not select measurement points');
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(screenshotsDir, '07_measure_active.png') });

    const measureDistanceText = await page.evaluate(() => {
      const res = document.querySelector('.earth-measure-result');
      return res ? res.textContent.trim().replace(/\s+/g, ' ') : null;
    });
    console.log(`Measured Distance: ${measureDistanceText}`);

    // 5. Test Telescope view tab
    console.log('Switching to Telescope View...');
    const clickedTelescope = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.trim() === 'Telescope');
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });
    if (!clickedTelescope) throw new Error('Could not find Telescope tab button');
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(screenshotsDir, '08_telescope_view.png') });
    console.log('Telescope View displayed.');

    // 6. Test Personalisation Settings panel
    console.log('Opening Personalisation Settings panel...');
    const openedSettings = await page.evaluate(() => {
      // Find Operator button in header
      const btn = document.querySelector('button[aria-label="User profile"]');
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });
    if (!openedSettings) throw new Error('Could not find Operator profile button to open settings');
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(screenshotsDir, '09_settings_panel.png') });
    console.log('Personalisation Settings panel displayed.');

    // Close settings
    console.log('Closing settings panel...');
    const closedSettings = await page.evaluate(() => {
      const closeBtn = document.querySelector('button[title="Exit Settings"]') || Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Back to Workspace'));
      if (closeBtn) {
        (closeBtn as any).click();
        return true;
      }
      return false;
    });
    if (closedSettings) {
      await new Promise(r => setTimeout(r, 1000));
    }

    // 7. Switch back to Chat mode
    console.log('Switching back to Chat View...');
    const clickedChat = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.trim() === 'Chat');
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });
    if (!clickedChat) throw new Error('Could not find Chat tab button');
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(screenshotsDir, '10_chat_view_final.png') });

  } catch (err) {
    console.error('Test script encountered an error:', err);
    errors.push(`Test execution exception: ${err.message}`);
  } finally {
    await browser.close();
    console.log('Browser closed.');

    // Write final summary log
    const reportPath = path.join(__dirname, '..', 'development_logs', 'automated_test_report.json');
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
