import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';
import zlib from 'node:zlib';
import { dirname } from 'node:path';
import { setTimeout as wait } from 'node:timers/promises';

const __dirname = dirname(fileURLToPath(import.meta.url));

const args = new Set(process.argv.slice(2));
const PERF_PROFILE = args.has('--fast')
  ? 'fast'
  : args.has('--standard')
    ? 'standard'
    : process.env.PERF_PROFILE || 'standard';
const isFastProfile = PERF_PROFILE === 'fast';

const BRIDGE_URL = process.env.BRIDGE_URL || 'http://127.0.0.1:8001';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://127.0.0.1:3005';
const ROUNDS = Number.parseInt(process.env.PERF_ROUNDS || (isFastProfile ? '3' : '6'), 10);
const INTERVAL_MS = Number.parseInt(process.env.PERF_INTERVAL_MS || (isFastProfile ? '40' : '120'), 10);
const FRONTEND_PAGES = Number.parseInt(process.env.FRONTEND_PAGES || (isFastProfile ? '1' : '2'), 10);
const API_WARMUP_ROUNDS = Number.parseInt(process.env.PERF_API_WARMUP_ROUNDS || (isFastProfile ? '1' : '2'), 10);
const FRONTEND_SETTLE_MS = Number.parseInt(process.env.PERF_FRONTEND_SETTLE_MS || (isFastProfile ? '250' : '1000'), 10);
const FRONTEND_GOTO_TIMEOUT_MS = Number.parseInt(process.env.PERF_FRONTEND_GOTO_TIMEOUT_MS || (isFastProfile ? '30000' : '45000'), 10);
const FRONTEND_CONTENT_TIMEOUT_MS = Number.parseInt(process.env.PERF_FRONTEND_CONTENT_TIMEOUT_MS || (isFastProfile ? '5000' : '15000'), 10);
const FRONTEND_NETWORK_IDLE_TIMEOUT_MS = Number.parseInt(process.env.PERF_FRONTEND_NETWORK_IDLE_TIMEOUT_MS || (isFastProfile ? '2500' : '10000'), 10);

const BUDGETS = {
  bridgeStatusP95: Number.parseInt(process.env.PERF_BRIDGE_STATUS_BUDGET_MS || '700', 10),
  bridgeChatP95: Number.parseInt(process.env.PERF_BRIDGE_CHAT_BUDGET_MS || '1800', 10),
  gitStatusP95: Number.parseInt(process.env.PERF_GIT_STATUS_BUDGET_MS || '600', 10),
  frontendLoadP95: Number.parseInt(process.env.PERF_FRONTEND_LOAD_BUDGET_MS || '1500', 10),
  frontendDomP95: Number.parseInt(process.env.PERF_FRONTEND_DOM_BUDGET_MS || '1500', 10),
};
const INCLUDE_CHAT_BENCHMARKS = process.env.PERF_INCLUDE_CHAT == null
  ? !isFastProfile
  : process.env.PERF_INCLUDE_CHAT !== '0';
const INCLUDE_GIT_BENCHMARKS = process.env.PERF_INCLUDE_GIT == null
  ? !isFastProfile
  : process.env.PERF_INCLUDE_GIT !== '0';

function percentile(values, p) {
  if (!values.length) return null;
  const copy = [...values].sort((a, b) => a - b);
  const idx = Math.min(copy.length - 1, Math.ceil((p / 100) * copy.length) - 1);
  return copy[Math.max(0, idx)];
}

function summarize(values) {
  if (!values.length) {
    return { count: 0 };
  }
  const sum = values.reduce((a, b) => a + b, 0);
  return {
    count: values.length,
    min: Math.min(...values),
    max: Math.max(...values),
    avg: sum / values.length,
    p50: percentile(values, 50),
    p95: percentile(values, 95),
    p99: percentile(values, 99),
  };
}

async function requestWithTimeout(url, init = {}, timeoutMs = 5000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const start = performance.now();

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(init.headers || {}),
      },
    });

    const duration = performance.now() - start;
    const text = await response.text();
    const sizeBytes = Buffer.byteLength(text || '');

    return {
      ok: response.ok,
      status: response.status,
      ms: duration,
      sizeBytes,
      body: text,
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function measureApi(url, init = {}, rounds = ROUNDS, timeoutMs = 5000, warmupRounds = 0) {
  const latency = [];
  const errors = [];

  for (let i = 0; i < warmupRounds; i += 1) {
    try {
      await requestWithTimeout(url, init, timeoutMs);
    } catch {
      // Warm-up failures are ignored; warm-up is only intended to stabilise caches.
    }
    if (INTERVAL_MS > 0) {
      await wait(INTERVAL_MS);
    }
  }

  for (let i = 0; i < rounds; i += 1) {
    try {
      const r = await requestWithTimeout(url, init, timeoutMs);
      latency.push(r.ms);
      if (!r.ok) {
        errors.push(`HTTP ${r.status}`);
      }
    } catch (error) {
      errors.push(error.name === 'AbortError' ? 'timeout' : error.message || String(error));
    }
    if (INTERVAL_MS > 0) {
      await wait(INTERVAL_MS);
    }
  }

  return {
    url,
    latency: summarize(latency),
    errors,
  };
}

async function measureChatStream(url, payload) {
  const start = performance.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(url, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.body) {
      clearTimeout(timeout);
      return { ok: false, error: 'No stream body', ms: performance.now() - start };
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let chunks = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      decoder.decode(value, { stream: true });
      chunks += 1;
      if (chunks > 10) break;
    }
    clearTimeout(timeout);

    return { ok: true, ms: performance.now() - start, chunks };
  } catch (err) {
    return { ok: false, error: err.name === 'AbortError' ? 'timeout' : err.message, ms: performance.now() - start };
  }
}

async function measureFrontend() {
  try {
    await requestWithTimeout(FRONTEND_URL, { headers: { Accept: 'text/html' } }, 20000);
  } catch (error) {
    return {
      status: 'failed',
      reason: `Frontend preflight failed: ${error.name === 'AbortError' ? 'timeout' : error.message || String(error)}`,
    };
  }

  let puppeteer;
  try {
    puppeteer = await import('puppeteer');
  } catch (error) {
    return { status: 'skipped', reason: `puppeteer not available: ${error.message}` };
  }

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-dev-shm-usage'],
    });
  } catch (error) {
    return { status: 'failed', reason: `Unable to launch Chromium: ${error.message}` };
  }

  try {
    const pageResults = [];
    let failedLoads = 0;
    const loadErrors = [];

    for (let i = 0; i < FRONTEND_PAGES; i += 1) {
      let page;
      try {
        page = await browser.newPage();
      } catch (error) {
        failedLoads += 1;
        loadErrors.push(error.message || String(error));
        continue;
      }
      try {
        await page.setViewport({ width: 1365, height: 1024 });
        const pageLoad = await page.goto(FRONTEND_URL, {
          waitUntil: 'domcontentloaded',
          timeout: FRONTEND_GOTO_TIMEOUT_MS,
        });
        await page
          .waitForFunction(
            () => document.body && document.body.innerText.trim().length > 20,
            { timeout: FRONTEND_CONTENT_TIMEOUT_MS },
          )
          .catch((error) => {
            loadErrors.push(`content wait: ${error.message}`);
          });
        if (FRONTEND_SETTLE_MS > 0 && typeof page.waitForNetworkIdle === 'function') {
          await page
            .waitForNetworkIdle({
              idleTime: FRONTEND_SETTLE_MS,
              timeout: FRONTEND_NETWORK_IDLE_TIMEOUT_MS,
            })
            .catch(() => {});
        } else {
          await wait(FRONTEND_SETTLE_MS);
        }
        const metrics = await page.evaluate(() => {
          const navigation = performance.getEntriesByType('navigation')[0];
          const paint = performance.getEntriesByType('paint');
          const resource = performance.getEntriesByType('resource');
          const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
          const largestContentfulPaint = lcpEntries.length
            ? lcpEntries[lcpEntries.length - 1].startTime
            : null;
          const totalResourceCount = resource.length;
          const totalResourceTransfer = resource.reduce(
            (sum, item) => sum + (item.transferSize || item.encodedBodySize || 0),
            0,
          );

          return {
            timing: {
              fetchStart: navigation?.fetchStart,
              domContentLoadedEventEnd: navigation?.domContentLoadedEventEnd,
              domInteractive: navigation?.domInteractive,
              loadEventEnd: navigation?.loadEventEnd || performance.now(),
              responseStart: navigation?.responseStart,
              requestStart: navigation?.requestStart,
            },
            paint: paint.map((entry) => ({ name: entry.name, startTime: entry.startTime })),
            largestContentfulPaint,
            totalResourceCount,
            totalResourceTransfer,
          };
        });

        pageResults.push({
          ...metrics,
          status: pageLoad?.status(),
          url: pageLoad?.url(),
        });
      } catch (error) {
        failedLoads += 1;
        loadErrors.push(error.message || String(error));
      } finally {
        await page.close().catch(() => {});
      }
    }

    if (!pageResults.length) {
      return {
        status: 'failed',
        reason: `Frontend was not reachable on all ${FRONTEND_PAGES} attempts (failed ${failedLoads}).`,
        errors: loadErrors.slice(0, 5),
      };
    }

    const warmup = pageResults.slice(0, 1);
    const active = pageResults.length > 1 ? pageResults.slice(1) : pageResults;
    const avgDomContent = summarize(active.map((item) => item.timing.domContentLoadedEventEnd - item.timing.fetchStart).filter(Number.isFinite));
    const avgLoad = summarize(active.map((item) => item.timing.loadEventEnd - item.timing.fetchStart).filter(Number.isFinite));
    const avgLCP = summarize(active.map((item) => item.largestContentfulPaint).filter(Number.isFinite));

    return {
      status: 'ok',
      pageResults,
      failedLoads,
      loadErrors: loadErrors.slice(0, 5),
      averages: {
        domContentMs: avgDomContent,
        loadMs: avgLoad,
        lcpMs: avgLCP,
        warmupSampleCount: summarize(warmup.map((item) => item.timing.loadEventEnd - item.timing.fetchStart).filter(Number.isFinite)).count,
      },
    };
  } finally {
    await browser.close().catch(() => {});
  }
}

async function measureBundle() {
  const distDir = path.resolve(__dirname, '..', 'dist');
  try {
    const collectFiles = async (dir) => {
      const names = await fs.readdir(dir, { withFileTypes: true });
      const out = [];
      for (const entry of names) {
        const filePath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          out.push(...await collectFiles(filePath));
          continue;
        }

        if (entry.isFile() && /\.(js|css)$/.test(entry.name)) {
          out.push(filePath);
        }
      }
      return out;
    };

    const entries = await collectFiles(distDir);
    const assets = await Promise.all(
      entries.map(async (file) => {
        const full = file;
        const stat = await fs.stat(full);
        const raw = stat.size;
        const rawBuf = await fs.readFile(full);
        const gzip = zlib.gzipSync(rawBuf).length;
        const brotli = zlib.brotliCompressSync(rawBuf).length;

        return {
          file: path.relative(distDir, full),
          bytes: raw,
          gzip,
          brotli,
          ratioGzip: Number(((1 - gzip / raw) * 100).toFixed(1)),
          ratioBrotli: Number(((1 - brotli / raw) * 100).toFixed(1)),
        };
      })
    );

    const largest = assets
      .sort((a, b) => b.bytes - a.bytes)
      .slice(0, 10);

    return {
      status: 'ok',
      count: assets.length,
      largest,
      topRawOver400KB: assets.filter((asset) => asset.bytes > 400_000).length,
    };
  } catch (error) {
    return {
      status: 'missing',
      reason: error.message,
    };
  }
}

function warnOrOk(label, val, budgetMs, direction = 'max') {
  if (val == null) {
    return { label, status: 'skip', reason: 'No samples.' };
  }
  const pass = direction === 'max' ? val <= budgetMs : val >= budgetMs;
  return {
    label,
    value: Number(val.toFixed(2)),
    budgetMs,
    pass,
    status: pass ? 'pass' : 'fail',
  };
}

function skipped(label, reason) {
  return { label, status: 'skip', reason };
}

async function main() {
  console.log(`\n=== Silver Wolf VI Performance Baseline (${new Date().toISOString()}) ===`);
  console.log(`BRIDGE_URL=${BRIDGE_URL}`);
  console.log(`FRONTEND_URL=${FRONTEND_URL}`);
  console.log(`PROFILE=${PERF_PROFILE}`);
  console.log(`ROUNDS=${ROUNDS} INTERVAL_MS=${INTERVAL_MS} FRONTEND_PAGES=${FRONTEND_PAGES}`);
  console.log(`INCLUDE_CHAT_BENCHMARKS=${INCLUDE_CHAT_BENCHMARKS}`);
  console.log(`INCLUDE_GIT_BENCHMARKS=${INCLUDE_GIT_BENCHMARKS}\n`);

  const [
    bridge,
    frontend,
    bundle,
  ] = await Promise.all([
    measureApi(`${BRIDGE_URL}/status`, { method: 'GET' }, Math.min(ROUNDS, 4), 7000, API_WARMUP_ROUNDS),
    measureFrontend(),
    measureBundle(),
  ]);

  const bridgeGitStatus = INCLUDE_GIT_BENCHMARKS
    ? await measureApi(`${BRIDGE_URL}/git/status`, { method: 'GET' }, Math.min(ROUNDS, 4), 7000, API_WARMUP_ROUNDS)
    : skipped('Bridge /git/status benchmark', 'Disabled for fast profile. Use PERF_INCLUDE_GIT=1 or --standard to include git status latency.');
  const bridgeChat = INCLUDE_CHAT_BENCHMARKS
    ? await measureApi(
      `${BRIDGE_URL}/chat`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Latency test ping', system_instruction: 'Keep reply concise.' }),
      },
      Math.min(ROUNDS, 4),
      5000,
      isFastProfile ? 0 : 1,
    )
    : skipped('Bridge /chat benchmark', 'Disabled for fast profile. Use PERF_INCLUDE_CHAT=1 or --standard to include chat latency.');
  const bridgeChatStream = INCLUDE_CHAT_BENCHMARKS
    ? await measureChatStream(`${BRIDGE_URL}/api/chat_stream`, {
      message: 'Latency test ping for stream',
    })
    : skipped('Bridge /api/chat_stream benchmark', 'Disabled for fast profile. Use PERF_INCLUDE_CHAT=1 or --standard to include stream latency.');

  const results = {
    bridge: {
      status: '/status',
      payload: bridge,
    },
    bridgeChat: {
      status: '/chat',
      payload: bridgeChat,
    },
    bridgeGitStatus: {
      status: '/git/status',
      payload: bridgeGitStatus,
    },
    bridgeChatStream: {
      status: '/api/chat_stream',
      payload: bridgeChatStream,
    },
  };

  const checks = {
    bridgeStatusP95: warnOrOk('Bridge /status p95', results.bridge.payload.latency?.p95, BUDGETS.bridgeStatusP95),
    bridgeChatP95: INCLUDE_CHAT_BENCHMARKS
      ? warnOrOk('Bridge /chat p95', results.bridgeChat.payload.latency?.p95, BUDGETS.bridgeChatP95)
      : skipped('Bridge /chat p95', 'Disabled for fast profile.'),
    gitStatusP95: INCLUDE_GIT_BENCHMARKS
      ? warnOrOk('Bridge /git/status p95', results.bridgeGitStatus.payload.latency?.p95, BUDGETS.gitStatusP95)
      : skipped('Bridge /git/status p95', 'Disabled for fast profile.'),
    frontendLoadP95: warnOrOk(
      'Frontend dom load p95',
      (frontend.averages?.loadMs?.p95 || null),
      BUDGETS.frontendLoadP95
    ),
    frontendDomP95: warnOrOk(
      'Frontend DOM ready p95',
      (frontend.averages?.domContentMs?.p95 || null),
      BUDGETS.frontendDomP95
    ),
  };

  console.log(JSON.stringify({
    metadata: {
      date: new Date().toISOString(),
      profile: PERF_PROFILE,
      rounds: ROUNDS,
      frontendPages: FRONTEND_PAGES,
      frontendSettleMs: FRONTEND_SETTLE_MS,
      includeChatBenchmarks: INCLUDE_CHAT_BENCHMARKS,
      includeGitBenchmarks: INCLUDE_GIT_BENCHMARKS,
      bridgeUrl: BRIDGE_URL,
      frontendUrl: FRONTEND_URL,
    },
    checks,
    results,
    frontend,
    bundle,
  }, null, 2));

  const failed =
    frontend.status === 'failed' ||
    Object.values(checks).some((check) => check.status === 'fail');
  process.exitCode = failed ? 1 : 0;
}

main().catch((error) => {
  console.error('[perf-check] execution failed:', error);
  process.exitCode = 1;
});
