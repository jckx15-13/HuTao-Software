import puppeteer from 'puppeteer';
import { performance } from 'node:perf_hooks';
import { setTimeout as wait } from 'node:timers/promises';

const args = new Set(process.argv.slice(2));
const isFastProfile = args.has('--fast');
const jsonOutput = args.has('--json');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://127.0.0.1:3005';
const NAVIGATION_TIMEOUT_MS = Number.parseInt(process.env.UI_AUDIT_NAVIGATION_TIMEOUT_MS || '30000', 10);
const CONTENT_TIMEOUT_MS = Number.parseInt(process.env.UI_AUDIT_CONTENT_TIMEOUT_MS || '12000', 10);
const WORKSPACE_SETTLE_MS = Number.parseInt(process.env.UI_AUDIT_WORKSPACE_SETTLE_MS || (isFastProfile ? '2600' : '4200'), 10);
const STRICT_CONSOLE = process.env.UI_AUDIT_STRICT_CONSOLE === '1';

function withAuditFallback(url) {
  try {
    const parsed = new URL(url);
    if (!parsed.searchParams.has('fallback')) {
      parsed.searchParams.set('fallback', 'true');
    }
    return parsed.toString();
  } catch {
    return url;
  }
}

const AUDIT_URL = process.env.UI_AUDIT_URL || withAuditFallback(FRONTEND_URL);

const VIEWPORTS = isFastProfile
  ? [
      { name: 'desktop', width: 1365, height: 900 },
      { name: 'mobile', width: 390, height: 800 },
    ]
  : [
      { name: 'desktop', width: 1440, height: 960 },
      { name: 'tablet', width: 820, height: 1180 },
      { name: 'mobile', width: 390, height: 800 },
    ];

function buildFailure(message, details = {}) {
  return { message, ...details };
}

function summarizeList(items, limit = 8) {
  return items.slice(0, limit).map((item) => {
    const descriptor = item.text || item.aria || item.placeholder || item.selector || item.tag;
    const where = item.rect
      ? `${Math.round(item.rect.x)},${Math.round(item.rect.y)} ${Math.round(item.rect.width)}x${Math.round(item.rect.height)}`
      : '';
    return where ? `${descriptor} (${where})` : descriptor;
  });
}

function formatMs(value) {
  return `${Math.round(value)}ms`;
}

async function forceLauncherPage(page) {
  await page.evaluateOnNewDocument(() => {
    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function getContext(type, ...rest) {
      if (type === 'webgl' || type === 'webgl2' || type === 'experimental-webgl') {
        return null;
      }
      return originalGetContext.apply(this, [type, ...rest]);
    };

    const key = 'silver-wolf-v6-core';
    const fallback = { state: {}, version: 7 };
    let payload = fallback;

    try {
      payload = JSON.parse(window.localStorage.getItem(key) || JSON.stringify(fallback));
    } catch {
      payload = fallback;
    }

    const state = {
      ...(payload.state || payload),
      currentPage: 'launcher',
      launcherDismissed: false,
      leftPanelOpen: true,
      rightPanelOpen: true,
    };

    window.localStorage.setItem(key, JSON.stringify({ state, version: 7 }));
  });
}

async function gotoWithRetry(page, url) {
  let lastError;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: NAVIGATION_TIMEOUT_MS });
      return;
    } catch (error) {
      lastError = error;
      const message = error.message || String(error);
      const retryable = /frame was detached|target closed|navigation failed|net::err_aborted/i.test(message);
      if (!retryable || attempt === 3) {
        throw error;
      }
      await wait(500 * attempt);
    }
  }

  throw lastError;
}

async function readBodyText(page) {
  return page.evaluate(() => document.body?.innerText || '');
}

async function waitForBodyText(page) {
  const deadline = Date.now() + CONTENT_TIMEOUT_MS;
  let lastError;

  while (Date.now() < deadline) {
    try {
      const bodyText = await readBodyText(page);
      if (bodyText.trim().length > 20) {
        return bodyText;
      }
    } catch (error) {
      lastError = error;
    }
    await wait(200);
  }

  if (lastError) {
    throw lastError;
  }
  throw new Error('Timed out waiting for visible body text');
}

async function waitForWorkspaceText(page) {
  const deadline = Date.now() + CONTENT_TIMEOUT_MS;
  let lastText = '';

  while (Date.now() < deadline) {
    try {
      lastText = await readBodyText(page);
      if (/project workspaces|ai workspace|chat space/i.test(lastText)) {
        return true;
      }
    } catch {
      // The app can recreate frames during shell transition; retry until the deadline.
    }
    await wait(250);
  }

  return /project workspaces|ai workspace|chat space/i.test(lastText);
}

async function launchWorkspace(page) {
  const clicked = await page.evaluate(() => {
    const button = Array.from(document.querySelectorAll('button')).find((candidate) => {
      return (candidate.textContent || '').toLowerCase().includes('launch workspace');
    });

    if (!button) return false;
    button.click();
    return true;
  });

  if (!clicked) {
    return false;
  }

  await wait(WORKSPACE_SETTLE_MS);
  await waitForWorkspaceText(page);
  return true;
}

async function auditPage(page, stage, viewport) {
  return page.evaluate(
    ({ stageName, viewportName }) => {
      const viewportBounds = {
        width: window.innerWidth,
        height: window.innerHeight,
      };
      const selectorFor = (element) => {
        if (element.id) return `#${CSS.escape(element.id)}`;
        const role = element.getAttribute('role');
        const label = element.getAttribute('aria-label') || element.getAttribute('title');
        const text = (element.textContent || '').replace(/\s+/g, ' ').trim();
        if (label) return `${element.tagName.toLowerCase()}[aria-label="${label.slice(0, 60)}"]`;
        if (role) return `${element.tagName.toLowerCase()}[role="${role}"]`;
        if (text) return `${element.tagName.toLowerCase()}:has-text("${text.slice(0, 60)}")`;
        return element.tagName.toLowerCase();
      };
      const normalizedText = (element) => (element.textContent || '').replace(/\s+/g, ' ').trim();
      const labelledByText = (element) => {
        const labelledBy = element.getAttribute('aria-labelledby');
        if (!labelledBy) return '';
        return labelledBy
          .split(/\s+/)
          .map((id) => document.getElementById(id)?.textContent || '')
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();
      };
      const associatedLabelText = (element) => {
        const labels = element.labels ? Array.from(element.labels) : [];
        return labels
          .map((label) => label.textContent || '')
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();
      };
      const accessibleName = (element) => {
        return (
          element.getAttribute('aria-label') ||
          labelledByText(element) ||
          associatedLabelText(element) ||
          element.getAttribute('title') ||
          normalizedText(element) ||
          ''
        ).trim();
      };
      const isVisible = (element) => {
        if (element.closest('[aria-hidden="true"], [hidden], template')) return false;
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        return (
          rect.width >= 2 &&
          rect.height >= 2 &&
          rect.bottom > 0 &&
          rect.right > 0 &&
          rect.left < viewportBounds.width &&
          rect.top < viewportBounds.height &&
          style.display !== 'none' &&
          style.visibility !== 'hidden' &&
          Number.parseFloat(style.opacity || '1') > 0.01
        );
      };
      const toRecord = (element) => {
        const rect = element.getBoundingClientRect();
        return {
          tag: element.tagName.toLowerCase(),
          selector: selectorFor(element),
          role: element.getAttribute('role'),
          text: normalizedText(element).slice(0, 120),
          aria: accessibleName(element).slice(0, 120),
          placeholder: element.getAttribute('placeholder') || '',
          rect: {
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height,
          },
        };
      };
      const controls = Array.from(
        document.querySelectorAll('button, a[href], input, select, textarea, [role="button"], [role="tab"], [role="switch"], [role="menuitem"]'),
      )
        .filter(isVisible)
        .map(toRecord);
      const fields = Array.from(document.querySelectorAll('input, select, textarea')).filter(isVisible);
      const unnamedControls = controls.filter((control) => {
        const canUseNativeText = !['input', 'select', 'textarea'].includes(control.tag);
        return canUseNativeText && !control.aria && !control.text;
      });
      const fieldsWithoutProgrammaticLabel = fields.map(toRecord).filter((field) => !field.aria);
      const smallTargets = controls.filter((control) => {
        const minSide = Math.min(control.rect.width, control.rect.height);
        return minSide > 0 && minSide < 32;
      });
      const clippedText = Array.from(document.querySelectorAll('button, [role="button"], [role="tab"], label, p, span, h1, h2, h3, h4, h5, h6'))
        .filter(isVisible)
        .filter((element) => {
          const text = normalizedText(element);
          if (text.length < 2) return false;
          const style = window.getComputedStyle(element);
          const clipsX = element.scrollWidth > element.clientWidth + 2 && ['hidden', 'clip'].includes(style.overflowX);
          const clipsY = element.scrollHeight > element.clientHeight + 2 && ['hidden', 'clip'].includes(style.overflowY);
          return (clipsX || clipsY) && style.textOverflow !== 'ellipsis';
        })
        .slice(0, 20)
        .map(toRecord);
      const horizontalOverflowPx = Math.max(
        0,
        document.documentElement.scrollWidth - document.documentElement.clientWidth,
        document.body ? document.body.scrollWidth - document.documentElement.clientWidth : 0,
      );
      const headings = Array.from(document.querySelectorAll('h1, h2, h3, [role="heading"]'))
        .filter(isVisible)
        .map((element) => ({
          level: element.tagName.toLowerCase(),
          name: accessibleName(element) || normalizedText(element),
        }))
        .filter((heading) => heading.name);
      const mainLike = Array.from(document.querySelectorAll('main, [role="main"]')).filter(isVisible).length;
      const bodyText = normalizedText(document.body);

      return {
        stage: stageName,
        viewport: viewportName,
        url: window.location.href,
        title: document.title,
        bodyTextLength: bodyText.length,
        mainLike,
        headings,
        controlsCount: controls.length,
        unnamedControls,
        fieldsWithoutProgrammaticLabel,
        smallTargets,
        clippedText,
        horizontalOverflowPx,
        workspaceReady: /project workspaces|ai workspace|chat space/i.test(bodyText),
      };
    },
    { stageName: stage, viewportName: viewport.name },
  );
}

async function runViewport(browser, viewport) {
  const page = await browser.newPage();
  const consoleIssues = [];
  const pageErrors = [];
  const start = performance.now();

  page.on('console', (message) => {
    const type = message.type();
    const text = message.text();
    if (type === 'error' || type === 'warning') {
      consoleIssues.push({ type, text });
    }
  });
  page.on('pageerror', (error) => {
    pageErrors.push(error.message || String(error));
  });

  try {
    await page.setViewport({ width: viewport.width, height: viewport.height, deviceScaleFactor: 1 });
    await forceLauncherPage(page);
    await gotoWithRetry(page, AUDIT_URL);
    await waitForBodyText(page);
    await wait(isFastProfile ? 700 : 1200);

    const launcher = await auditPage(page, 'launcher', viewport);
    const clickedLauncher = await launchWorkspace(page);
    const workspace = await auditPage(page, 'workspace', viewport);

    return {
      viewport,
      durationMs: performance.now() - start,
      clickedLauncher,
      launcher,
      workspace,
      consoleIssues,
      pageErrors,
    };
  } finally {
    await page.close().catch(() => {});
  }
}

function evaluateResults(results) {
  const failures = [];
  const warnings = [];

  for (const result of results) {
    const snapshots = [result.launcher, result.workspace].filter(Boolean);
    for (const snapshot of snapshots) {
      if (snapshot.bodyTextLength < 20) {
        failures.push(buildFailure(`${snapshot.viewport}/${snapshot.stage} rendered too little text`, { bodyTextLength: snapshot.bodyTextLength }));
      }
      if (snapshot.horizontalOverflowPx > 2) {
        failures.push(buildFailure(`${snapshot.viewport}/${snapshot.stage} has horizontal overflow`, { px: snapshot.horizontalOverflowPx }));
      }
      if (snapshot.unnamedControls.length > 0) {
        failures.push(
          buildFailure(`${snapshot.viewport}/${snapshot.stage} has visible controls without accessible names`, {
            examples: summarizeList(snapshot.unnamedControls),
            count: snapshot.unnamedControls.length,
          }),
        );
      }
      if (snapshot.fieldsWithoutProgrammaticLabel.length > 0) {
        failures.push(
          buildFailure(`${snapshot.viewport}/${snapshot.stage} has form fields without programmatic labels`, {
            examples: summarizeList(snapshot.fieldsWithoutProgrammaticLabel),
            count: snapshot.fieldsWithoutProgrammaticLabel.length,
          }),
        );
      }
      if (snapshot.mainLike === 0) {
        warnings.push(buildFailure(`${snapshot.viewport}/${snapshot.stage} has no visible main landmark`));
      }
      if (snapshot.clippedText.length > 0) {
        warnings.push(
          buildFailure(`${snapshot.viewport}/${snapshot.stage} has clipped visible text`, {
            examples: summarizeList(snapshot.clippedText),
            count: snapshot.clippedText.length,
          }),
        );
      }
      if (snapshot.smallTargets.length > 0) {
        warnings.push(
          buildFailure(`${snapshot.viewport}/${snapshot.stage} has controls below 32px on one side`, {
            examples: summarizeList(snapshot.smallTargets),
            count: snapshot.smallTargets.length,
          }),
        );
      }
    }

    if (!result.clickedLauncher) {
      failures.push(buildFailure(`${result.viewport.name} could not click the launcher primary action`));
    }
    if (!result.workspace?.workspaceReady) {
      failures.push(buildFailure(`${result.viewport.name} did not reach the workspace shell`));
    }
    for (const pageError of result.pageErrors) {
      failures.push(buildFailure(`${result.viewport.name} page error`, { error: pageError }));
    }
    if (STRICT_CONSOLE) {
      for (const issue of result.consoleIssues.filter((entry) => entry.type === 'error')) {
        failures.push(buildFailure(`${result.viewport.name} console error`, { error: issue.text }));
      }
    }
  }

  return { failures, warnings };
}

function printReport(report) {
  if (jsonOutput) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  console.log(`Silver Wolf UI audit (${report.profile})`);
  console.log(`URL: ${report.url}`);
  console.log(`Duration: ${formatMs(report.durationMs)}`);
  console.log(`Score: ${report.score}/100`);

  for (const result of report.results) {
    const snapshots = [result.launcher, result.workspace].filter(Boolean);
    console.log(`\n${result.viewport.name} ${result.viewport.width}x${result.viewport.height} (${formatMs(result.durationMs)})`);
    for (const snapshot of snapshots) {
      console.log(
        `  ${snapshot.stage}: controls=${snapshot.controlsCount}, unnamed=${snapshot.unnamedControls.length}, unlabeledFields=${snapshot.fieldsWithoutProgrammaticLabel.length}, overflow=${snapshot.horizontalOverflowPx}px`,
      );
    }
  }

  if (report.failures.length) {
    console.log('\nFailures');
    for (const failure of report.failures) {
      console.log(`- ${failure.message}`);
      if (failure.count != null) console.log(`  count: ${failure.count}`);
      if (failure.px != null) console.log(`  px: ${failure.px}`);
      if (failure.examples?.length) {
        for (const example of failure.examples) {
          console.log(`  example: ${example}`);
        }
      }
      if (failure.error) console.log(`  error: ${failure.error}`);
    }
  }

  if (report.warnings.length) {
    console.log('\nWarnings');
    for (const warning of report.warnings) {
      console.log(`- ${warning.message}`);
      if (warning.count != null) console.log(`  count: ${warning.count}`);
      if (warning.examples?.length) {
        for (const example of warning.examples.slice(0, 4)) {
          console.log(`  example: ${example}`);
        }
      }
    }
  }

  if (!report.failures.length) {
    console.log('\nResult: PASS');
  }
}

async function main() {
  const start = performance.now();
  const browser = await puppeteer.launch({
    headless: 'new',
    protocolTimeout: 90000,
    args: [
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-gpu-compositing',
      '--disable-webgl',
      '--disable-webgl2',
      '--disable-3d-apis',
      '--disable-extensions',
      '--use-gl=swiftshader',
    ],
  });

  try {
    const results = [];
    for (const viewport of VIEWPORTS) {
      results.push(await runViewport(browser, viewport));
    }

    const { failures, warnings } = evaluateResults(results);
    const score = Math.max(0, 100 - failures.length * 8 - warnings.length * 2);
    const report = {
      profile: isFastProfile ? 'fast' : 'standard',
      url: AUDIT_URL,
      durationMs: performance.now() - start,
      score,
      failures,
      warnings,
      results,
    };

    printReport(report);

    if (failures.length) {
      process.exitCode = 1;
    }
  } finally {
    await browser.close().catch(() => {});
  }
}

main().catch((error) => {
  console.error(error.stack || error.message || String(error));
  process.exitCode = 1;
});
