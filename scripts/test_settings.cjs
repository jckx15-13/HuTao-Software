const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const assert = require('assert/strict');

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  if (reason && reason.stack) {
    console.error(reason.stack);
  }
});

(async () => {
  console.log('Launching browser with proxy bypass for settings panel state verification...');
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--no-proxy-server',
      '--proxy-bypass-list=*',
      '--disable-features=site-per-process'
    ],
    protocolTimeout: 60000
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
      // Ignore network-level load failures like favicon or local port probes
      const isNetworkLoadError = text.includes('Failed to load resource') || 
                                 text.includes('favicon.ico') || 
                                 text.includes('ERR_CONNECTION_REFUSED') ||
                                 text.includes('net::ERR_ABORTED');
      if (!isNetworkLoadError) {
        errors.push(text);
      }
    }
  });

  page.on('pageerror', err => {
    errors.push(err.toString());
    console.error(`[BROWSER UNCAUGHT EXCEPTION] ${err.toString()}`);
  });

  page.on('error', err => {
    errors.push(`Page crashed: ${err.message}`);
    console.error(`[PAGE CRASHED] ${err.toString()}`);
  });

  page.on('requestfailed', request => {
    const failure = request.failure();
    const failText = failure ? failure.errorText : 'Unknown error';
    console.log(`[REQUEST FAILED] URL: ${request.url()} - Error: ${failText}`);
  });

  page.on('response', response => {
    if (response.status() >= 400) {
      console.log(`[RESPONSE ERROR] URL: ${response.url()} - Status: ${response.status()}`);
    }
  });

  try {
    console.log('Navigating to http://127.0.0.1:3000/?fallback=true ...');
    await page.goto('http://127.0.0.1:3000/?fallback=true', { waitUntil: 'domcontentloaded', timeout: 20000 });
    
    // Wait for the state store to be exposed on window
    console.log('Waiting for useUIStore to expose on window...');
    await page.waitForFunction(() => typeof window.useUIStore !== 'undefined', { timeout: 15000 });
    console.log('useUIStore is loaded on window. Starting assertions...');

    // 1. Initial State Assertions
    const initialSettings = await page.evaluate(() => {
      const state = window.useUIStore.getState();
      return {
        currentPage: state.currentPage,
        launcherDismissed: state.launcherDismissed,
        activePalette: state.activePalette,
        aiModel: state.aiModel,
        audioFeedback: state.audioFeedback,
        forceFallback: state.forceFallback
      };
    });
    console.log('Initial settings read from store:', initialSettings);

    // 2. Dismiss launcher and open Settings
    console.log('Triggering workspace and settings layout...');
    await page.evaluate(() => {
      window.useUIStore.getState().setLauncherDismissed(true);
      window.useUIStore.getState().setCurrentPage('settings');
    });
    
    // Allow React 150ms to render the settings overlays
    await new Promise(r => setTimeout(r, 500));

    // Assert layout state changed
    const pageState = await page.evaluate(() => {
      const state = window.useUIStore.getState();
      return {
        currentPage: state.currentPage,
        launcherDismissed: state.launcherDismissed
      };
    });
    assert.equal(pageState.currentPage, 'settings');
    assert.equal(pageState.launcherDismissed, true);
    console.log('✔ Settings page is active.');

    // 3. Test Personalisation Tab updates
    console.log('Testing Personalisation updates (palette, opacity, cursor, imagery provider)...');
    await page.evaluate(() => {
      const store = window.useUIStore.getState();
      // Select coreHacker palette
      store.setActivePalette('coreHacker');
      // Update opacity
      store.updatePersonalisation({ panelOpacity: 0.55 });
      // Update cursor design
      store.setCursorDesign('crosshair');
      // Update imagery provider
      store.setImageryProvider('bing-aerial');
    });
    
    const personalisationResult = await page.evaluate(() => {
      const state = window.useUIStore.getState();
      return {
        activePalette: state.activePalette,
        panelOpacity: state.personalisation.panelOpacity,
        cursorDesign: state.cursorDesign,
        imageryProvider: state.imageryProvider
      };
    });
    assert.equal(personalisationResult.activePalette, 'coreHacker');
    assert.equal(personalisationResult.panelOpacity, 0.55);
    assert.equal(personalisationResult.cursorDesign, 'crosshair');
    assert.equal(personalisationResult.imageryProvider, 'bing-aerial');
    console.log('✔ Personalisation, cursor design, and imagery provider values updated successfully.');

    // 4. Test AI Configuration Tab updates
    console.log('Testing AI Configuration updates (model, system instructions)...');
    await page.evaluate(() => {
      const store = window.useUIStore.getState();
      store.setAiModel('gemini-1.5-pro');
      store.setSystemInstructions('Test Instructions Core.');
    });

    const aiResult = await page.evaluate(() => {
      const state = window.useUIStore.getState();
      return {
        aiModel: state.aiModel,
        systemInstructions: state.systemInstructions
      };
    });
    assert.equal(aiResult.aiModel, 'gemini-1.5-pro');
    assert.equal(aiResult.systemInstructions, 'Test Instructions Core.');
    console.log('✔ AI configuration values updated successfully.');

    // 5. Test Connections Tab (Notion) updates
    console.log('Testing Connections updates (Notion sync)...');
    await page.evaluate(() => {
      const store = window.useUIStore.getState();
      store.setNotionDatabaseId('notion-db-uuid-xyz');
      store.setNotionEnabled(true);
    });

    const notionResult = await page.evaluate(() => {
      const state = window.useUIStore.getState();
      return {
        notionDatabaseId: state.notionDatabaseId,
        notionEnabled: state.notionEnabled
      };
    });
    assert.equal(notionResult.notionDatabaseId, 'notion-db-uuid-xyz');
    assert.equal(notionResult.notionEnabled, true);
    console.log('✔ Notion connections values updated successfully.');

    // 6. Test Feedback settings updates
    console.log('Testing tactile sound feedback updates...');
    await page.evaluate(() => {
      const store = window.useUIStore.getState();
      store.setAudioFeedback(true);
      store.setTerminalFontSize(18);
    });

    const feedbackResult = await page.evaluate(() => {
      const state = window.useUIStore.getState();
      return {
        audioFeedback: state.audioFeedback,
        terminalFontSize: state.terminalFontSize
      };
    });
    assert.equal(feedbackResult.audioFeedback, true);
    assert.equal(feedbackResult.terminalFontSize, 18);
    console.log('✔ Tactile feedback values updated successfully.');

    // 7. Test Developer Panel settings updates
    console.log('Testing Developer settings updates...');
    await page.evaluate(() => {
      const store = window.useUIStore.getState();
      store.setForceFallback(true);
      store.setEngineUrlOverride('ws://127.0.0.1:8001/stream');
    });

    const devResult = await page.evaluate(() => {
      const state = window.useUIStore.getState();
      return {
        forceFallback: state.forceFallback,
        engineUrlOverride: state.engineUrlOverride
      };
    });
    assert.equal(devResult.forceFallback, true);
    assert.equal(devResult.engineUrlOverride, 'ws://127.0.0.1:8001/stream');
    console.log('✔ Developer Panel values updated successfully.');

    // 8. Test exiting settings back to workspace
    console.log('Testing exit settings page...');
    await page.evaluate(() => {
      window.useUIStore.getState().setCurrentPage('workspace');
    });
    
    const exitState = await page.evaluate(() => {
      return window.useUIStore.getState().currentPage;
    });
    assert.equal(exitState, 'workspace');
    console.log('✔ Navigation exited settings.');

  } catch (err) {
    console.error('Settings verification test encountered an error:', err);
    errors.push(`Test execution exception: ${err.message}`);
  } finally {
    await browser.close();
    console.log('Browser closed.');

    // Write final summary log
    const reportPath = 'C:\\Users\\jaron\\.gemini\\antigravity\\brain\\603fb42f-a824-4818-9518-0252d22e9359\\automated_settings_test_report.json';
    const reportData = {
      timestamp: new Date().toISOString(),
      errors,
      consoleLogsCount: consoleLogs.length,
      status: errors.length === 0 ? 'PASSED' : 'FAILED',
      failedChecks: errors
    };
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    console.log(`Saved settings audit report to ${reportPath}`);
    console.log(`Test status: ${reportData.status}`);
  }
})();
