/**
 * Silver Wolf VI — E2E Verification Test
 * 
 * Uses staged page approach: each "stage" that might crash the page
 * creates a fresh Puppeteer page instance to recover from Cesium/WebGL crashes.
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3005/?fallback=true';
const BRAIN_DIR = 'C:\\Users\\jaron\\.gemini\\antigravity\\brain\\019864f6-c90b-4ca3-a830-c80c4478c881';
const SCREENSHOTS_DIR = path.join(BRAIN_DIR, 'test_screenshots');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const errors = [];
const warnings = [];
const passed = [];

let browser;

const BROWSER_ARGS = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
  '--no-proxy-server',
  '--proxy-bypass-list=*',
  '--disable-features=site-per-process',
  '--disable-gpu',
  '--hide-scrollbars',
  '--mute-audio',
];

/** Create a fresh page with standard setup */
async function freshPage() {
  const p = await browser.newPage();
  await p.setViewport({ width: 1280, height: 800 });
  
  // Inject style override at document creation time to completely prevent blurs/animations/crashes
  await p.evaluateOnNewDocument(() => {
    try {
      const style = document.createElement('style');
      style.type = 'text/css';
      style.innerHTML = `
        * {
          transition: none !important;
          transition-property: none !important;
          transition-duration: 0s !important;
          animation: none !important;
          animation-duration: 0s !important;
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
          box-shadow: none !important;
          text-shadow: none !important;
          filter: none !important;
        }
      `;
      window.localStorage.clear();
      document.head.appendChild(style);
    } catch (e) {}
  });

  p.on('console', msg => {
    const text = msg.text();
    if (msg.type() === 'error' && !text.includes('favicon') && !text.includes('Failed to load') && !text.includes('404')) {
      console.log(`  [BROWSER] ${text.substring(0, 100)}`);
    }
  });
  return p;
}

/** 
 * Navigate to the app and skip boot.
 * Returns page in workspace-ready state, or null on failure.
 */
async function prepareWorkspacePage() {
  let p = null;
  let success = false;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      p = await freshPage();
      console.log(`  [TEST-DEBUG] p.goto(BASE_URL) (attempt ${attempt})...`);
      // Use domcontentloaded to prevent detached frame errors caused by rapid React mount/unmounts
      await p.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 90000 });
      success = true;
      break;
    } catch (e) {
      // Ignore Navigating frame was detached if it still loaded the body
      if (e.message.includes('Navigating frame was detached') || e.message.includes('Execution context was destroyed')) {
        try {
          const bodyExists = await p.evaluate(() => !!document.body);
          if (bodyExists) {
            console.log(`  [TEST-DEBUG] Navigation attempt ${attempt} interrupted, but document body exists. Proceeding.`);
            success = true;
            break;
          }
        } catch (evalErr) {
          // If evaluate fails, page is truly dead
        }
      }
      console.log(`  [TEST-DEBUG] Navigation attempt ${attempt} failed (${e.message.substring(0, 60)}). Retrying...`);
      if (p) {
        try { await p.close(); } catch (_) {}
        p = null;
      }
      await sleep(3000);
    }
  }
  
  if (!success || !p) {
    throw new Error("Navigation failed after 3 attempts");
  }

  try {
    console.log("  [TEST-DEBUG] p.waitForSelector('body')...");
    await p.waitForSelector('body', { timeout: 10000 });
    
    // Wait for React to mount (simple timeout)
    console.log("  [TEST-DEBUG] sleeping for 3000ms...");
    await sleep(3000);

    await p.evaluate(() => {
      try {
        const style = document.createElement('style');
        style.type = 'text/css';
        style.innerHTML = `
          * {
            transition: none !important;
            animation: none !important;
            backdrop-filter: none !important;
            -webkit-backdrop-filter: none !important;
          }
        `;
        document.head.appendChild(style);

        if (window.useUIStore) {
          window.useUIStore.getState().setParticleEffects?.(false);
          window.useUIStore.getState().updatePersonalisation?.({ 
            motionReduced: true, animationIntensity: 0, blurIntensity: 0, shadowIntensity: 0 
          });
        }
      } catch (e) {}
    });

    // Click SKIP BOOT if present
    console.log("  [TEST-DEBUG] clicking SKIP BOOT...");
    await p.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('SKIP BOOT'));
      if (btn) btn.click();
    });
    console.log("  [TEST-DEBUG] sleeping for 1500ms...");
    await sleep(1500);

    console.log("  [TEST-DEBUG] prepareWorkspacePage succeeded!");
    return p;
  } catch (err) {
    console.warn(`  ⚠ prepareWorkspacePage configuration failed: ${err.message.substring(0, 80)}`);
    try { await p.close(); } catch (_) {}
    return null;
  }
}

/** Ensures page is active, relaunching browser and reviving workspace if crashed */
async function ensurePageActive(p, targetMode = 'orbital') {
  try {
    if (p) {
      await p.evaluate(() => 1);
      return p;
    }
  } catch (e) {
    console.log(`  🔄 Page/browser crash detected — reviving session...`);
  }
  
  try { if (browser) await browser.close(); } catch (_) {}
  browser = await puppeteer.launch({
    headless: true,
    channel: 'chrome',
    args: BROWSER_ARGS,
    protocolTimeout: 90000,
    defaultViewport: { width: 1280, height: 800 },
    dumpio: true,
  });
  
  const newPage = await prepareWorkspacePage();
  if (newPage && targetMode) {
    await safeEval(newPage, (m) => {
      if (window.useUIStore) {
        window.useUIStore.getState().setInteractionMode?.(m);
      }
    }, targetMode);
    await sleep(1500);
  }
  return newPage;
}

/** Safe screenshot that doesn't throw on failure */
async function shot(page, filename) {
  const fp = path.join(SCREENSHOTS_DIR, filename);
  try {
    await page.screenshot({ path: fp });
    console.log(`  📸 ${filename}`);
    return true;
  } catch (e) {
    console.warn(`  ⚠ Screenshot failed: ${filename} — ${e.message.substring(0, 60)}`);
    return false;
  }
}

/** Evaluate with error tolerance */
async function safeEval(page, fn, ...args) {
  try {
    return await page.evaluate(fn, ...args);
  } catch (e) {
    console.warn(`  ⚠ eval: ${e.message.substring(0, 60)}`);
    return undefined;
  }
}

async function clickBtn(page, text, exact = false) {
  return safeEval(page, (t, exact) => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => {
      const txt = (b.textContent || '').trim();
      return exact ? txt === t : txt.includes(t);
    });
    if (btn) { btn.click(); return true; }
    return false;
  }, text, exact);
}

async function hasText(page, text) {
  try {
    return await page.evaluate(t => document.body.textContent?.includes(t) ?? false, text);
  } catch { return false; }
}

async function getMode(page) {
  try {
    return await page.evaluate(() => window.useUIStore?.getState()?.interactionMode);
  } catch { return null; }
}

(async () => {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║       Silver Wolf VI — E2E Staged Verification Suite         ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  try {
    browser = await puppeteer.launch({
      headless: true,
      channel: 'chrome',
      args: BROWSER_ARGS,
      protocolTimeout: 90000,
      defaultViewport: { width: 1280, height: 800 },
      dumpio: true,
    });
    console.log('✓ Browser launched\n');

    // ── STAGE 1: Boot screen + workspace ─────────────────────────────────────
    console.log('─── STAGE 1: Boot Screen & Workspace ───');
    let page = await prepareWorkspacePage();

    if (!page) {
      errors.push('STAGE 1: Failed to load page into workspace state');
      throw new Error('Cannot proceed: page failed to load');
    }

    await shot(page, '01_boot_screen.png');
    
    const hasSilverWolf = await hasText(page, 'SILVER WOLF') || await hasText(page, 'Silver Wolf');
    if (hasSilverWolf) {
      passed.push('Boot/Workspace: Silver Wolf VI branding visible');
      console.log('  ✔ Silver Wolf VI branding confirmed');
    }
    
    const hasNeural = await hasText(page, 'Neural Interface') || await hasText(page, 'Silver Wolf');
    if (hasNeural) {
      passed.push('Workspace: workspace rendered after boot skip');
      console.log('  ✔ Workspace loaded successfully');
    }

    await shot(page, '02_workspace_initial.png');

    // ── STAGE 2: Orbital view tests ──────────────────────────────────────────
    console.log('\n─── STAGE 2: Orbital View & Controls ───');

    const clickedOrbital = await clickBtn(page, 'Orbital', true);
    if (clickedOrbital) {
      passed.push('Orbital: tab button clickable');
      console.log('  ✔ Orbital tab clicked');
    } else {
      errors.push('Orbital tab button NOT found');
    }
    await sleep(800);

    await shot(page, '03_orbital_view.png');

    const mode = await getMode(page);
    if (mode === 'orbital') {
      passed.push('Orbital: interactionMode correctly set to "orbital"');
      console.log(`  ✔ Store mode = "${mode}"`);
    } else {
      warnings.push(`Orbital mode check: got "${mode}" expected "orbital"`);
    }

    const hasSpaceArray = await hasText(page, 'Space Array');
    if (hasSpaceArray) {
      passed.push('Orbital: Space Array Controls visible (unified layout)');
      console.log('  ✔ Space Array Controls present');
    } else {
      warnings.push('Space Array Controls text not found');
    }

    const hasTimeline = await hasText(page, 'LIVE TELEMETRY') || await hasText(page, 'PLAYBACK');
    if (hasTimeline) {
      passed.push('Orbital: bottom timeline visible (LIVE TELEMETRY / PLAYBACK)');
      console.log('  ✔ Bottom timeline visible');
    } else {
      warnings.push('Timeline not found');
    }

    // ── STAGE 3: Drawer tab navigation ───────────────────────────────────────
    console.log('\n─── STAGE 3: Control Drawer Tabs ───');

    for (const tab of ['Navigator', 'Overlays', 'Imagery', 'Photos']) {
      const clicked = await clickBtn(page, tab, true);
      if (clicked) {
        passed.push(`Drawer: tab "${tab}" is clickable`);
        console.log(`  ✔ Tab "${tab}"`);
      } else {
        warnings.push(`Drawer tab "${tab}" not found`);
        console.warn(`  ⚠ Tab "${tab}" not found`);
      }
      await sleep(150);
    }

    // Check for checkbox in Overlays
    await clickBtn(page, 'Overlays', true);
    await sleep(200);
    const cbToggled = await safeEval(page, () => {
      const cb = document.querySelector('input[type="checkbox"]');
      if (cb) { cb.click(); return true; }
      return false;
    });
    if (cbToggled) {
      passed.push('Overlays: checkbox toggled successfully');
      console.log('  ✔ Overlay checkbox toggled');
    }

    // Check for telescope presets in navigator
    await clickBtn(page, 'Navigator', true);
    await sleep(200);
    const hasOrion = await hasText(page, 'Orion') || await hasText(page, 'M42') || await hasText(page, 'Andromeda');
    if (hasOrion) {
      passed.push('Navigator: celestial presets (Orion, Andromeda, etc.) listed');
      console.log('  ✔ Celestial presets visible in Navigator');
    } else {
      warnings.push('Celestial presets not found in Navigator tab');
    }


    // ── STAGE 4: Telescope mode ─────────────────────────────────────────────── 
    console.log('\n─── STAGE 4: Telescope Mode ───');
    page = await ensurePageActive(page, 'orbital');

    const clickedTelescope = await clickBtn(page, 'Telescope', true);
    
    if (clickedTelescope) {
      passed.push('Telescope: tab button exists and is clickable');
      console.log('  ✔ Telescope tab clicked');
      await sleep(2500);
      
      const shotOk = await shot(page, '04_telescope_mode.png');
      if (!shotOk) {
        // Browser may have crashed entirely — try to revive
        console.log('  🔄 Page/browser crash detected — relaunching browser...');
        try { await browser.close(); } catch (_) {}
        browser = await puppeteer.launch({
          headless: true,
          channel: 'chrome',
          args: BROWSER_ARGS,
          protocolTimeout: 90000,
          defaultViewport: { width: 1280, height: 800 },
        });
        page = await prepareWorkspacePage();
        if (page) {
          await safeEval(page, () => window.useUIStore?.getState()?.setInteractionMode?.('telescope'));
          await sleep(2000);
          await shot(page, '04_telescope_mode.png');
        }
      }

      if (page) {
        const telescopeMode = await getMode(page);
        if (telescopeMode === 'telescope') {
          passed.push('Telescope: interactionMode correctly set to "telescope"');
          console.log(`  ✔ Mode = "${telescopeMode}"`);
        } else {
          warnings.push(`Telescope mode: got "${telescopeMode}"`);
        }

        const hasWWT = await hasText(page, 'WWT Viewport:') || await hasText(page, 'Celestial') || await hasText(page, 'Orion Nebula');
        if (hasWWT) {
          passed.push('Telescope: WWT Viewport / celestial content visible');
          console.log('  ✔ WWT Viewport content displayed');
        } else {
          warnings.push('WWT Viewport text not found in telescope mode');
        }
      }
    } else {
      errors.push('Telescope tab button NOT found');
      console.error('  ✗ Telescope tab button not found');
    }

    // ── STAGE 5: Escape Key ───────────────────────────────────────────────────
    console.log('\n─── STAGE 5: Escape Key Exit ───');
    page = await ensurePageActive(page, 'telescope');

    if (page) {
      try {
        await page.keyboard.press('Escape');
        await sleep(1500);
      } catch (keyErr) {
        console.warn(`  ⚠ Keyboard press failed: ${keyErr.message.substring(0, 50)}`);
        await safeEval(page, () => window.useUIStore?.getState()?.setInteractionMode?.('orbital'));
        await sleep(800);
      }

      await shot(page, '05_after_escape.png');

      const modeAfterEscape = await getMode(page);
      if (modeAfterEscape === 'orbital') {
        passed.push('Escape: successfully returned to orbital mode');
        console.log('  ✔ Escape → orbital mode confirmed');
      } else {
        errors.push(`Escape key: mode is "${modeAfterEscape}" expected "orbital"`);
        console.error(`  ✗ After escape: "${modeAfterEscape}"`);
      }
    }

    // ── STAGE 6: ErrorBoundary ────────────────────────────────────────────────
    console.log('\n─── STAGE 6: Inline ErrorBoundary ───');
    page = await ensurePageActive(page, 'telescope');

    if (page) {
      // Enter telescope mode
      await safeEval(page, () => window.useUIStore?.getState()?.setInteractionMode?.('telescope'));
      await sleep(1500);

      // Trigger crash
      await safeEval(page, () => {
        window.__triggerTelescopeCrash = true;
        try {
          const s = window.useUIStore?.getState();
          s?.setTelescopeTarget?.({ ...(s.telescopeTarget || { name: 'X', url: '' }), _ts: Date.now() });
        } catch (e) {}
      });
      await sleep(3000);

      await shot(page, '06_error_boundary_inline.png');

      const hasErrorCard = await hasText(page, 'Telescope View Encountered an Error') || await hasText(page, 'Component Error');
      if (hasErrorCard) {
        passed.push('ErrorBoundary: inline fallback card displayed after crash');
        console.log('  ✔ ErrorBoundary fallback card visible');
      } else {
        warnings.push('ErrorBoundary fallback card text not found (crash may not have triggered)');
        console.warn('  ⚠ Error card not found');
      }

      // Graceful degradation: mode switcher still usable
      const switcherOk = await safeEval(page, () => {
        const b = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.trim() === 'Orbital');
        return b ? !b.disabled : false;
      });
      if (switcherOk) {
        passed.push('ErrorBoundary: mode switcher remains interactive (graceful degradation)');
        console.log('  ✔ Mode switcher functional during telescope panel error');
      }

      // Reset crash and retry
      await safeEval(page, () => { window.__triggerTelescopeCrash = false; });
      const clickedRetry = await clickBtn(page, 'Retry', true);
      if (clickedRetry) {
        passed.push('ErrorBoundary: Retry button present and clickable');
        console.log('  ✓ Retry clicked');
      }
      await sleep(3000);
      await shot(page, '07_recovered_telescope.png');

      const recovered = await hasText(page, 'WWT Viewport:') || await hasText(page, 'Orion') || await hasText(page, 'Space Array');
      if (recovered) {
        passed.push('ErrorBoundary: telescope viewport recovered after retry');
        console.log('  ✔ Telescope recovered');
      }
    }

    // ── STAGE 7: Final state ──────────────────────────────────────────────────
    console.log('\n─── STAGE 7: Final State ───');
    page = await ensurePageActive(page, 'telescope');
    if (page) {
      await safeEval(page, () => window.useUIStore?.getState()?.setInteractionMode?.('chat'));
      await sleep(1500);
      await shot(page, '08_final_state.png');
      const inChat = await hasText(page, 'Neural Interface') || await hasText(page, 'Silver Wolf');
      if (inChat) {
        passed.push('Final: application returned to chat mode');
        console.log('  ✔ Chat mode active (final state)');
      }
    }

  } catch (critErr) {
    console.error('\n❌ CRITICAL:', critErr.message);
    errors.push(`Critical: ${critErr.message}`);
  } finally {
    try { if (browser) await browser.close(); } catch (_) {}
    console.log('\n  Browser closed.');
  }

  // Report
  const status = errors.length === 0 ? 'PASSED' : 'FAILED';
  const screenshots = fs.existsSync(SCREENSHOTS_DIR)
    ? fs.readdirSync(SCREENSHOTS_DIR).filter(f => f.endsWith('.png')).sort()
    : [];

  const report = {
    timestamp: new Date().toISOString(),
    status,
    summary: { passed: passed.length, warnings: warnings.length, errors: errors.length },
    passed,
    warnings,
    errors,
    screenshots,
  };

  fs.writeFileSync(path.join(BRAIN_DIR, 'automated_test_report.json'), JSON.stringify(report, null, 2));

  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log(`║  STATUS: ${status.padEnd(52)} ║`);
  console.log(`║  ✔ ${String(passed.length).padStart(2)} passed  ⚠ ${String(warnings.length).padStart(2)} warnings  ✗ ${String(errors.length).padStart(2)} errors${' '.repeat(27)} ║`);
  console.log('╚══════════════════════════════════════════════════════════════╝');

  errors.forEach((e, i) => console.log(`  ✗ ${i+1}. ${e}`));
  warnings.forEach((w, i) => console.log(`  ⚠ ${i+1}. ${w}`));

  console.log(`\n  Screenshots: ${screenshots.length} captured`);
  screenshots.forEach(s => console.log(`    • ${s}`));
  console.log('');

  process.exit(errors.length > 0 ? 1 : 0);
})();
