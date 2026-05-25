import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const APP_URL = 'http://127.0.0.1:3000/?fallback=true';
const ARTIFACTS_DIR = 'C:\\Users\\jaron\\.gemini\\antigravity\\brain\\ea725f73-0d40-45d0-aab4-6ea4fab817ee';
const SCREENSHOTS_DIR = path.join(ARTIFACTS_DIR, 'test_screenshots');
const REPORT_PATH = path.join(ARTIFACTS_DIR, 'automated_test_report.json');

// Ensure directories exist
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

// Simple sleep helper function
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runTest() {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  const consoleLogs = [];
  const errors = [];

  page.on('console', (msg) => {
    const text = msg.text();
    const type = msg.type();
    consoleLogs.push({ type, text });
    console.log(`[Browser Console ${type}] ${text}`);
    if (type === 'error' || text.toLowerCase().includes('uncaught') || text.toLowerCase().includes('error')) {
      errors.push({ source: 'console', type, text });
    }
  });

  page.on('pageerror', (err) => {
    console.error('[Page Error]', err.message);
    errors.push({ source: 'pageerror', text: err.message, stack: err.stack });
  });

  page.on('requestfailed', (req) => {
    const failure = req.failure();
    const url = req.url();
    // Ignore external API request failures like wheretheiss.at or bridge, as they are expected to fail or be mocked in fallback mode
    if (!url.includes('wheretheiss.at') && !url.includes(':5000') && !url.includes(':8001')) {
      console.warn(`[Request Failed] ${url}: ${failure?.errorText}`);
      errors.push({ source: 'requestfailed', url, error: failure?.errorText });
    }
  });

  try {
    console.log(`Navigating to ${APP_URL}...`);
    try {
      await page.goto(APP_URL, { timeout: 30000 });
    } catch (gotoErr) {
      console.warn('First navigation attempt error:', gotoErr.message);
      console.log('Waiting 3 seconds for page/Vite to settle, then retrying...');
      await sleep(3000);
      await page.goto(APP_URL, { timeout: 30000 });
    }

    // Step 1: Boot screen screenshot
    console.log('Capturing boot screen...');
    await sleep(2000);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01_boot_screen.png') });

    // Step 2: Skip boot screen
    console.log('Skipping boot screen...');
    const skipped = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const skipBtn = buttons.find(b => b.textContent.includes('SKIP BOOT INTERFACE'));
      if (skipBtn) {
        skipBtn.click();
        return true;
      }
      return false;
    });
    if (!skipped) {
      throw new Error('Skip Boot Interface button not found!');
    }

    // Wait for the workspace interface to load
    await sleep(3500);

    // Step 3: Switch to Chat tab & take screenshot
    console.log('Testing Chat tab...');
    await clickModeTab(page, 'Chat');
    await sleep(1500);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '02_workspace_chat.png') });

    // Step 4: Switch to Orbital tab & take screenshot
    console.log('Testing Orbital tab...');
    await clickModeTab(page, 'Orbital');
    await sleep(4000); // Cesium widget load delay
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '03_workspace_orbital.png') });

    // Step 5: Open Landmark Database (Places) and select Mount Everest
    console.log('Opening Landmark Database panel...');
    const placesOpened = await clickButtonByTitle(page, 'Saved Places');
    if (placesOpened) {
      await sleep(1500);
      console.log('Selecting Mount Everest landmark...');
      const landmarkSelected = await page.evaluate(() => {
        const items = Array.from(document.querySelectorAll('.earth-result-item'));
        const everest = items.find(item => item.textContent.includes('Mount Everest'));
        if (everest) {
          everest.click();
          return true;
        }
        if (items.length > 0) {
          items[0].click();
          return true;
        }
        return false;
      });
      if (!landmarkSelected) {
        console.warn('Could not select landmark from list.');
      }
      await sleep(2000);
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '04_landmark_database.png') });
      
      // Close Landmark Database panel
      await page.evaluate(() => {
        const closeBtn = document.querySelector('.earth-panel-close');
        if (closeBtn) closeBtn.click();
      });
      await sleep(1000);
    } else {
      throw new Error('Saved Places button not found!');
    }

    // Step 6: Test Ruler Measurement
    console.log('Opening Measure Distance panel...');
    const measureOpened = await clickButtonByTitle(page, 'Measure Distance');
    if (measureOpened) {
      await sleep(1500);

      console.log('Choosing measure points Eiffel Tower and Great Pyramids...');
      const selectsChosen = await page.evaluate(() => {
        const selects = Array.from(document.querySelectorAll('.earth-measure-select'));
        if (selects.length >= 2) {
          selects[0].value = 'eiffel';
          selects[0].dispatchEvent(new Event('change', { bubbles: true }));
          selects[1].value = 'pyramids';
          selects[1].dispatchEvent(new Event('change', { bubbles: true }));
          return true;
        }
        return false;
      });
      if (!selectsChosen) {
        console.warn('Could not select measurement points.');
      }
      await sleep(2000);
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '05_measure_distance.png') });
      
      // Close Measure panel
      await page.evaluate(() => {
        const closeBtn = document.querySelector('.earth-panel-close');
        if (closeBtn) closeBtn.click();
      });
      await sleep(1000);
    } else {
      throw new Error('Measure Distance button not found!');
    }

    // Step 7: Open Personalisation Settings panel
    console.log('Opening Settings panel...');
    const settingsOpened = await clickButtonByTitle(page, 'Open Settings');
    if (settingsOpened) {
      await sleep(2000);
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '06_personalisation.png') });

      console.log('Closing Settings panel...');
      const exitSettingsOpened = await clickButtonByTitle(page, 'Exit Settings');
      if (!exitSettingsOpened) {
        console.warn('Exit Settings button not found, clicking fallback close');
        await page.evaluate(() => {
          const btn = document.querySelector('button[title="Exit Settings"]');
          if (btn) btn.click();
        });
      }
      await sleep(1500);
    } else {
      throw new Error('Open Settings button not found!');
    }

    // Step 8: Switch to Telescope view & select preset target
    console.log('Testing Telescope tab...');
    await clickModeTab(page, 'Telescope');
    await sleep(2000);

    console.log('Selecting Orion Nebula preset target...');
    const presetSelected = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('aside button'));
      const orion = buttons.find(b => b.textContent.includes('ORION NEBULA'));
      if (orion) {
        orion.click();
        return true;
      }
      if (buttons.length > 1) {
        buttons[1].click();
        return true;
      }
      return false;
    });
    if (!presetSelected) {
      console.warn('Telescope preset target button not found.');
    }
    await sleep(2000);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '07_telescope.png') });

    console.log('Tests completed successfully!');
  } catch (err) {
    console.error('Test Execution Failed:', err);
    errors.push({ source: 'runner', text: err.message, stack: err.stack });
  } finally {
    await browser.close();

    // Compile report
    const status = errors.length === 0 ? 'passed' : 'failed';
    const auditReport = {
      testTimestamp: new Date().toISOString(),
      status,
      testedAppUrl: APP_URL,
      screenshots: [
        '01_boot_screen.png',
        '02_workspace_chat.png',
        '03_workspace_orbital.png',
        '04_landmark_database.png',
        '05_measure_distance.png',
        '06_personalisation.png',
        '07_telescope.png'
      ],
      errorsSummary: errors,
      rawConsoleLogs: consoleLogs
    };

    fs.writeFileSync(REPORT_PATH, JSON.stringify(auditReport, null, 2));
    console.log(`Audit report written to ${REPORT_PATH}`);
  }
}

// Helper functions for browser-side Puppeteer page actions
async function clickModeTab(page, modeName) {
  const clicked = await page.evaluate((name) => {
    const buttons = Array.from(document.querySelectorAll('.glass-panel button'));
    const target = buttons.find(b => b.textContent.trim().toLowerCase() === name.toLowerCase());
    if (target) {
      target.click();
      return true;
    }
    return false;
  }, modeName);
  if (!clicked) {
    throw new Error(`Mode tab not found: ${modeName}`);
  }
}

async function clickButtonByTitle(page, titleText) {
  const clicked = await page.evaluate((title) => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const target = buttons.find(b => b.getAttribute('title') === title);
    if (target) {
      target.click();
      return true;
    }
    return false;
  }, titleText);
  return clicked;
}

runTest();
