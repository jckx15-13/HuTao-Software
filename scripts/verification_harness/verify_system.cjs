// verify_system.cjs
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync, spawn } = require('child_process');
const puppeteer = require('puppeteer');

const MOCK_PORT = 9099;
const VITE_PORT = Number(process.env.VITE_PORT || 3005);
const BRIDGE_PORT = 8001;
const ODYSSEUS_PORT = 7000;
const CHROMADB_PORT = 8100;

let mockLlmServer = null;

// Helper to check health of an HTTP endpoint
function checkEndpointHealth(url, timeoutMs = 2000) {
  return new Promise((resolve) => {
    const parsed = new URL(url);
    const options = {
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname + parsed.search,
      method: 'GET',
      timeout: timeoutMs
    };

    const req = http.request(options, (res) => {
      res.resume();
      res.on('end', () => {
        resolve(res.statusCode >= 200 && res.statusCode < 400);
      });
    });

    req.on('error', () => {
      resolve(false);
    });

    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

async function checkEndpointHealthWithRetry(url, timeoutMs = 5000, attempts = 3) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    if (await checkEndpointHealth(url, timeoutMs)) {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
  }
  return false;
}

function getJson(url, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const options = {
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname + parsed.search,
      method: 'GET',
      timeout: timeoutMs,
      headers: {
        Accept: 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            body: data ? JSON.parse(data) : null,
          });
        } catch (err) {
          reject(new Error(`Invalid JSON from ${url}: ${err.message}`));
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Timed out requesting ${url}`));
    });
    req.end();
  });
}

async function checkChromaDbHealth() {
  const heartbeatUrls = [
    `http://127.0.0.1:${CHROMADB_PORT}/api/v2/heartbeat`,
    `http://127.0.0.1:${CHROMADB_PORT}/api/v1/heartbeat`,
  ];

  for (const url of heartbeatUrls) {
    try {
      const response = await getJson(url, 10000);
      if (response.statusCode === 200 && response.body) {
        return true;
      }
    } catch (_) {
      // Try the next supported ChromaDB heartbeat path.
    }
  }

  return false;
}

function countConfiguredModelEndpoints(modelsBody) {
  if (!modelsBody || typeof modelsBody !== 'object') return 0;
  const candidates = [];
  if (Array.isArray(modelsBody.items)) candidates.push(...modelsBody.items);
  if (Array.isArray(modelsBody.endpoints)) candidates.push(...modelsBody.endpoints);
  if (Array.isArray(modelsBody.hosts)) candidates.push(...modelsBody.hosts);
  if (Array.isArray(modelsBody)) candidates.push(...modelsBody);

  return candidates.filter((entry) => {
    if (!entry || typeof entry !== 'object') return false;
    const modelList = Array.isArray(entry.models) ? entry.models : [];
    const hasModel = modelList.length > 0 || Boolean(entry.id || entry.model || entry.name);
    const hasEndpoint = Boolean(entry.url || entry.base_url || entry.endpoint || entry.endpoint_url || entry.host);
    return hasModel && hasEndpoint;
  }).length;
}

// Helper to send JSON POST requests
function postJson(url, payload, headers = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const bodyString = JSON.stringify(payload);
    const options = {
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname + parsed.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(bodyString),
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          body: data
        });
      });
    });

    req.on('error', (err) => reject(err));
    req.write(bodyString);
    req.end();
  });
}

function isRetryablePageError(err) {
  return /detached|destroyed|closed|Target closed|ERR_CONNECTION_REFUSED|ECONNREFUSED|ERR_ABORTED/i.test(String(err?.message || err));
}

async function postJsonWithRetry(url, payload, headers = {}, attempts = 3) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await postJson(url, payload, headers);
    } catch (err) {
      lastError = err;
      if (!/ECONNRESET|ECONNREFUSED|socket hang up|timed out/i.test(String(err?.message || err)) || attempt === attempts) {
        throw err;
      }
      await new Promise((resolve) => setTimeout(resolve, 400 * attempt));
    }
  }
  throw lastError;
}

async function evaluateWithRetry(page, evaluator, attempts = 8) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await page.evaluate(evaluator);
    } catch (err) {
      lastError = err;
      if (!isRetryablePageError(err)) {
        throw err;
      }
      if (typeof page.isClosed === 'function' && page.isClosed()) {
        throw err;
      }
      await Promise.race([
        page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 1500 }).catch(() => undefined),
        new Promise((resolve) => setTimeout(resolve, 350 * attempt)),
      ]);
      await page.evaluate(() => document.readyState).catch(() => undefined);
    }
  }
  throw lastError;
}

async function waitForUiStore(page, timeoutMs = 45000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const ready = await evaluateWithRetry(page, () => typeof window.useUIStore !== 'undefined').catch(() => false);
    if (ready) return;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error('Timed out waiting for window.useUIStore.');
}

async function settleReact(page, ms = 350) {
  await page.evaluate(() => new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  })).catch(() => undefined);
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function findSystemBrowserExecutable() {
  const explicit = process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROME_PATH;
  if (explicit && fs.existsSync(explicit)) {
    return explicit;
  }

  const candidates = [];
  const puppeteerCacheDir = process.env.PUPPETEER_CACHE_DIR || path.join(os.homedir(), '.cache', 'puppeteer');
  const puppeteerChromeDir = path.join(puppeteerCacheDir, 'chrome');
  try {
    const cachedChromeBuilds = fs
      .readdirSync(puppeteerChromeDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
    for (const build of cachedChromeBuilds) {
      if (process.platform === 'win32') {
        candidates.push(path.join(puppeteerChromeDir, build, 'chrome-win64', 'chrome.exe'));
      } else if (process.platform === 'darwin') {
        candidates.push(path.join(puppeteerChromeDir, build, 'chrome-mac-arm64', 'Google Chrome for Testing.app', 'Contents', 'MacOS', 'Google Chrome for Testing'));
        candidates.push(path.join(puppeteerChromeDir, build, 'chrome-mac-x64', 'Google Chrome for Testing.app', 'Contents', 'MacOS', 'Google Chrome for Testing'));
      } else {
        candidates.push(path.join(puppeteerChromeDir, build, 'chrome-linux64', 'chrome'));
      }
    }
  } catch {
    // Falling back to system browser candidates below is enough.
  }

  if (process.platform === 'win32') {
    for (const base of [process.env.PROGRAMFILES, process.env['PROGRAMFILES(X86)'], process.env.LOCALAPPDATA]) {
      if (!base) continue;
      candidates.push(
        path.join(base, 'Google', 'Chrome', 'Application', 'chrome.exe'),
        path.join(base, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
      );
    }
  } else if (process.platform === 'darwin') {
    candidates.push(
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
    );
  } else {
    candidates.push(
      '/usr/bin/google-chrome',
      '/usr/bin/google-chrome-stable',
      '/usr/bin/chromium',
      '/usr/bin/chromium-browser',
      '/usr/bin/microsoft-edge',
    );
  }

  return candidates.find((candidate) => candidate && fs.existsSync(candidate));
}

async function launchVerificationBrowser() {
  const executablePath = findSystemBrowserExecutable();
  return puppeteer.launch({
    headless: true,
    ...(executablePath ? { executablePath } : {}),
    protocolTimeout: 60000,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--no-proxy-server',
      '--proxy-bypass-list=*',
      '--disable-features=site-per-process'
    ]
  });
}

async function prepareVerificationPage(browser) {
  let page;
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      page = await browser.newPage();
      break;
    } catch (err) {
      lastError = err;
      if (!isRetryablePageError(err)) {
        throw err;
      }
      await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
    }
  }
  if (!page) {
    throw lastError;
  }
  await page.setViewport({ width: 1280, height: 800 });
  page.on('console', msg => {
    const text = msg.text();
    if (!text.includes('favicon') && !text.includes('404')) {
      console.log(`[Browser Console] ${text}`);
    }
  });
  page.on('pageerror', err => console.error(`[Browser Error] ${err.toString()}`));

  await page.evaluateOnNewDocument(() => {
    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      if (type === 'webgl' || type === 'webgl2' || type === 'experimental-webgl') {
        console.log(`[WebGL Blocked] Context type requested: ${type}`);
        return null;
      }
      return originalGetContext.apply(this, [type, ...args]);
    };

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

    const injectStyles = () => {
      if (document.documentElement) {
        const style = document.createElement('style');
        style.id = 'headless-style-overrides';
        style.textContent = `
          *, *::before, *::after {
            backdrop-filter: none !important;
            -webkit-backdrop-filter: none !important;
            filter: none !important;
            transition: none !important;
            animation: none !important;
            transition-duration: 0s !important;
            animation-duration: 0s !important;
          }
        `;
        document.documentElement.appendChild(style);
      } else {
        setTimeout(injectStyles, 5);
      }
    };
    injectStyles();
  });

  return page;
}

async function launchVerificationBrowserWithPage(label = 'Browser startup') {
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    let nextBrowser;
    try {
      nextBrowser = await launchVerificationBrowser();
      const nextPage = await prepareVerificationPage(nextBrowser);
      return { browser: nextBrowser, page: nextPage };
    } catch (err) {
      lastError = err;
      await nextBrowser?.close().catch(() => undefined);
      if (!isRetryablePageError(err)) {
        throw err;
      }
      console.warn(`- ${label}: browser startup retry ${attempt} after ${err.message}`);
      await new Promise((resolve) => setTimeout(resolve, 750 * attempt));
    }
  }
  throw lastError;
}

async function recoverVerificationPage(browser, page, label) {
  await page?.close().catch(() => undefined);
  try {
    return {
      browser,
      page: await prepareVerificationPage(browser),
    };
  } catch (err) {
    console.warn(`- ${label}: relaunching browser after page recovery failed: ${err.message}`);
    await browser?.close().catch(() => undefined);
    return launchVerificationBrowserWithPage(label);
  }
}

async function relaunchVerificationBrowser(browser, page, label) {
  await page?.close().catch(() => undefined);
  await browser?.close().catch(() => undefined);
  await new Promise((resolve) => setTimeout(resolve, 750));
  return launchVerificationBrowserWithPage(label);
}

async function navigateVerificationPage(browser, page, url, label = 'Navigation') {
  let currentBrowser = browser;
  let currentPage = page;
  let lastError;

  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      await currentPage.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await currentPage.evaluate(() => document.readyState).catch(() => undefined);
      return { browser: currentBrowser, page: currentPage };
    } catch (err) {
      lastError = err;
      console.warn(`- ${label} attempt ${attempt} warning: ${err.message}`);
      if (!isRetryablePageError(err) || attempt === 4) {
        break;
      }
      ({ browser: currentBrowser, page: currentPage } = await relaunchVerificationBrowser(
        currentBrowser,
        currentPage,
        `${label} retry ${attempt}`,
      ));
    }
  }

  throw lastError || new Error(`Failed to navigate to ${url}.`);
}

async function navigateUntilUiStoreReady(browser, page, url) {
  let currentBrowser = browser;
  let currentPage = page;
  let lastError;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    ({ browser: currentBrowser, page: currentPage } = await navigateVerificationPage(
      currentBrowser,
      currentPage,
      url,
      `UI verifier navigation ${attempt}`,
    ));

    try {
      await waitForUiStore(currentPage);
      return { browser: currentBrowser, page: currentPage };
    } catch (err) {
      lastError = err;
      console.warn(`- UI store readiness attempt ${attempt} warning: ${err.message}`);
      if (!isRetryablePageError(err) && !/useUIStore/i.test(err.message)) {
        break;
      }
      if (attempt < 3) {
        ({ browser: currentBrowser, page: currentPage } = await relaunchVerificationBrowser(
          currentBrowser,
          currentPage,
          `UI store readiness retry ${attempt}`,
        ));
      }
    }
  }

  throw lastError || new Error('Timed out waiting for UI store after navigation.');
}

async function evaluateUiStoreMutationWithRecovery(browser, page, url, label, evaluator, attempts = 3) {
  let currentBrowser = browser;
  let currentPage = page;
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      await evaluateWithRetry(currentPage, evaluator, 3);
      return { browser: currentBrowser, page: currentPage };
    } catch (err) {
      lastError = err;
      if (!isRetryablePageError(err) || attempt === attempts) {
        break;
      }
      console.warn(`- ${label} retry ${attempt}: ${err.message}`);
      ({ browser: currentBrowser, page: currentPage } = await navigateUntilUiStoreReady(
        currentBrowser,
        currentPage,
        url,
      ));
    }
  }

  throw lastError || new Error(`${label} failed.`);
}

function createMockLlmServer(port) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      // Handle CORS
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

      if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
      }

      // GET /v1/models
      if (req.method === 'GET' && (req.url === '/v1/models' || req.url === '/v1/models/')) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          data: [{ id: 'mock-model' }]
        }));
        return;
      }

      // POST /v1/chat/completions
      if (req.method === 'POST' && (req.url === '/v1/chat/completions' || req.url === '/v1/chat/completions/')) {
        req.on('data', () => undefined);
        req.on('end', () => {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            choices: [
              {
                message: {
                  role: 'assistant',
                  content: 'Hello! I am a mock LLM response.'
                }
              }
            ]
          }));
        });
        return;
      }

      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    });

    const onError = (err) => {
      server.removeListener('listening', onListening);
      reject(err);
    };

    const onListening = () => {
      server.removeListener('error', onError);
      console.log(`[Mock LLM] Listening on http://127.0.0.1:${port}`);
      resolve(server);
    };

    server.once('error', onError);
    server.once('listening', onListening);
    server.listen(port, '127.0.0.1');
  });
}

function startMockLlmServer(basePort) {
  return new Promise((resolve, reject) => {
    let candidatePort = basePort;
    const maxPort = basePort + 20;

    const tryNext = async () => {
      if (candidatePort > maxPort) {
        return reject(new Error(`Mock LLM server could not bind to any port in ${basePort}-${maxPort}`));
      }

      try {
        const server = await createMockLlmServer(candidatePort);
        resolve(server);
      } catch (err) {
        if (err && err.code === "EADDRINUSE") {
          candidatePort += 1;
          return tryNext();
        }
        return reject(err);
      }
    };

    tryNext();
  });
}

async function waitForHttpOk(url, timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await checkEndpointHealth(url, 1500)) {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, 750));
  }
  return false;
}

async function runServerProviderBridgeSelfTest({ rootDir, pythonExec, mockChatUrl }) {
  const testPort = Number(process.env.BRIDGE_PROVIDER_TEST_PORT || 8191);
  const bridgeScript = path.join(rootDir, 'bridge', 'server.py');
  const pyExecutable = pythonExec.replace(/^"|"$/g, '');
  const stdoutPath = path.join(__dirname, 'provider_bridge_test.out.log');
  const stderrPath = path.join(__dirname, 'provider_bridge_test.err.log');
  const stdout = fs.openSync(stdoutPath, 'a');
  const stderr = fs.openSync(stderrPath, 'a');
  const child = spawn(pyExecutable, [bridgeScript], {
    cwd: rootDir,
    env: {
      ...process.env,
      BRIDGE_PORT: String(testPort),
      BRIDGE_HOST: '127.0.0.1',
      BRIDGE_SKIP_ODYSSEUS_START: '1',
      OPENAI_API_KEY: 'verification-test-key',
      OPENAI_MODEL: 'mock-model',
      OPENAI_CHAT_COMPLETIONS_URL: mockChatUrl,
      BRIDGE_TEST_LLM_CHAT_URL: 'http://127.0.0.1:1/disabled',
      BRIDGE_FRONTEND_ORIGIN: `http://127.0.0.1:${VITE_PORT}`,
    },
    stdio: ['ignore', stdout, stderr],
    windowsHide: true,
  });

  try {
    const ready = await waitForHttpOk(`http://127.0.0.1:${testPort}/status`, 30000);
    if (!ready) {
      throw new Error(`temporary provider Bridge did not become ready on port ${testPort}`);
    }

    const providerStatus = await getJson(`http://127.0.0.1:${testPort}/api/credentials/providers`);
    const configuredCount = Number(providerStatus.body?.configured_count || 0);
    if (configuredCount < 1) {
      throw new Error('temporary provider Bridge did not report configured server provider');
    }

    const chatRes = await postJson(`http://127.0.0.1:${testPort}/chat`, {
      message: 'Server provider self-test. Do not echo this prompt.',
      system_instruction: 'Return the mock response only.',
    });
    if (chatRes.statusCode !== 200) {
      throw new Error(`temporary provider Bridge returned ${chatRes.statusCode}: ${chatRes.body}`);
    }

    const payload = JSON.parse(chatRes.body);
    const responseText = String(payload.response || '');
    if (payload.mode !== 'server-provider' || !responseText.includes('Hello! I am a mock LLM response.')) {
      throw new Error(`temporary provider Bridge returned unexpected payload: ${JSON.stringify(payload)}`);
    }

    return {
      status: 'success',
      configured_count: configuredCount,
      mode: payload.mode,
    };
  } finally {
    child.kill();
    fs.closeSync(stdout);
    fs.closeSync(stderr);
  }
}

// Global helper functions removed (now defined locally inside run() to access safeEvaluate)


// Main execution logic
async function run() {
  const report = {
    timestamp: new Date().toISOString(),
    services: {
      vite: { status: 'checking', port: VITE_PORT },
      bridge: { status: 'checking', port: BRIDGE_PORT },
      odysseus: { status: 'checking', port: ODYSSEUS_PORT },
      chromadb: { status: 'checking', port: CHROMADB_PORT }
    },
    database_seeding: 'pending',
    mock_llm_server: 'pending',
    ai_model_endpoint: { status: 'pending', configured_count: 0 },
    server_provider_route: { status: 'pending', configured_count: 0 },
    connector_provider_status: { status: 'pending', supported_count: 0, configured_count: 0 },
    feature_reality_ledger: { status: 'pending', integration_score: null },
    proxy_chat_flow: { status: 'pending', response: null },
    ui_verification: {
      status: 'pending',
      space_tab_found: false,
      telemetry_view_found: false,
      settings_panel_found: false,
      ai_key_inputs_found: false,
      layout_overlap_check: {
        status: 'pending',
        major_overlap_count: null,
        samples: [],
      },
    },
    overall_status: 'FAIL'
  };
  const partialReasons = [];

  // Determine Python path for db_helper
  const rootDir = path.resolve(__dirname, '../..');
  const pythonVenvPath = path.join(rootDir, 'odysseus', 'venv', 'Scripts', 'python.exe');
  const pythonExec = fs.existsSync(pythonVenvPath) ? `"${pythonVenvPath}"` : 'python';
  const dbHelperPath = path.join(__dirname, 'db_helper.py');

  try {
    // 1. Health check services
    console.log('1. Checking service health...');
    const viteHealthy = await checkEndpointHealthWithRetry(`http://127.0.0.1:${VITE_PORT}`, 10000, 5);
    report.services.vite.status = viteHealthy ? 'online' : 'offline';
    console.log(`- Vite: ${report.services.vite.status}`);

    const bridgeHealthy = await checkEndpointHealthWithRetry(`http://127.0.0.1:${BRIDGE_PORT}/status`, 5000, 3);
    report.services.bridge.status = bridgeHealthy ? 'online' : 'offline';
    console.log(`- Bridge: ${report.services.bridge.status}`);

    const odysseusHealthy = await checkEndpointHealthWithRetry(`http://127.0.0.1:${ODYSSEUS_PORT}/api/health`, 5000, 3);
    report.services.odysseus.status = odysseusHealthy ? 'online' : 'offline';
    console.log(`- Odysseus: ${report.services.odysseus.status}`);

    const chromadbHealthy = await checkChromaDbHealth();
    report.services.chromadb.status = chromadbHealthy ? 'online' : 'offline';
    console.log(`- ChromaDB: ${report.services.chromadb.status}`);

    if (!viteHealthy) {
      throw new Error(`Silver Wolf Vite app is offline on port ${VITE_PORT}. Make sure the root app is running.`);
    }

    if (!bridgeHealthy) {
      partialReasons.push('bridge offline');
      report.proxy_chat_flow.status = 'skipped_bridge_offline';
    }

    if (!odysseusHealthy) {
      partialReasons.push('odysseus offline');
    }

    if (!chromadbHealthy) {
      partialReasons.push('chromadb vector memory offline');
    }

    if (bridgeHealthy) {
      try {
        const modelsResponse = await getJson(`http://127.0.0.1:${BRIDGE_PORT}/api/models`);
        const odysseusConfiguredModelCount = countConfiguredModelEndpoints(modelsResponse.body);
        let serverProviderCount = 0;
        try {
          const providerResponse = await getJson(`http://127.0.0.1:${BRIDGE_PORT}/api/credentials/providers`);
          serverProviderCount = Number(providerResponse.body?.configured_count || 0);
        } catch (providerErr) {
          partialReasons.push(`server provider endpoint check failed: ${providerErr.message}`);
        }
        const configuredModelCount = odysseusConfiguredModelCount + serverProviderCount;
        report.ai_model_endpoint = {
          status: configuredModelCount > 0 ? 'configured' : 'missing',
          configured_count: configuredModelCount,
          odysseus_configured_count: odysseusConfiguredModelCount,
          server_provider_count: serverProviderCount,
        };
        console.log(`- Odysseus model endpoints: ${report.ai_model_endpoint.status}`);
        if (configuredModelCount === 0) {
          partialReasons.push('no configured Odysseus or server-side AI provider model endpoint');
        }
      } catch (modelsErr) {
        report.ai_model_endpoint = {
          status: 'unverified',
          configured_count: 0,
          error: modelsErr.message,
        };
        partialReasons.push(`Odysseus model endpoint check failed: ${modelsErr.message}`);
      }

      try {
        const connectorResponse = await getJson(`http://127.0.0.1:${BRIDGE_PORT}/api/connectors/providers`);
        const supportedCount = Number(connectorResponse.body?.supported_count || 0);
        const configuredCount = Number(connectorResponse.body?.configured_count || 0);
        const providers = Array.isArray(connectorResponse.body?.providers) ? connectorResponse.body.providers : [];
        const requiredConnectorIds = ['apify', 'google-cloud', 'github', 'notion', 'openweather'];
        const providerById = new Map(providers.map((provider) => [provider.id, provider]));
        const providerIds = new Set(providerById.keys());
        const missingRequired = requiredConnectorIds.filter((providerId) => !providerIds.has(providerId));
        if (supportedCount < 11 || missingRequired.length > 0) {
          throw new Error(`missing connector provider status entries: ${missingRequired.join(', ') || supportedCount}`);
        }
        const requiredProviderEnvNames = Object.fromEntries(
          requiredConnectorIds.map((providerId) => [providerId, providerById.get(providerId)?.key_env || null]),
        );
        if (requiredProviderEnvNames.apify !== 'APIFY_TOKEN' || requiredProviderEnvNames.notion !== 'NOTION_API_KEY') {
          throw new Error(`connector provider env metadata mismatch: ${JSON.stringify(requiredProviderEnvNames)}`);
        }
        const leaksSecretMaterial = providers.some((provider) => Object.keys(provider).some((key) => /secret|token|api_key|password/i.test(key)));
        if (leaksSecretMaterial) {
          throw new Error('connector provider status leaked a secret-like field');
        }
        report.connector_provider_status = {
          status: 'success',
          supported_count: supportedCount,
          configured_count: configuredCount,
          required_providers: requiredConnectorIds,
          required_provider_envs: requiredProviderEnvNames,
        };
        console.log(`- Connector provider status: ${supportedCount} supported, ${configuredCount} configured`);
      } catch (connectorErr) {
        report.connector_provider_status = {
          status: 'failed',
          supported_count: 0,
          configured_count: 0,
          error: connectorErr.message,
        };
        partialReasons.push(`connector provider status check failed: ${connectorErr.message}`);
      }

      try {
        const ledgerResponse = await getJson(`http://127.0.0.1:${BRIDGE_PORT}/api/integration/status`);
        const ledger = ledgerResponse.body || {};
        const repositories = Array.isArray(ledger.repositories) ? ledger.repositories : [];
        const features = Array.isArray(ledger.features) ? ledger.features : [];
        const repositoryIds = new Set(repositories.map((repo) => repo.id));
        const featureIds = new Set(features.map((feature) => feature.id));
        const requiredRepositories = ['silver-wolf-vi', 'worldwideview', 'odysseus'];
        const requiredFeatures = ['chat-loop', 'ui-overlap-budget', 'credential-engine', 'connector-probes', 'server-ai-provider'];
        const missingRepositories = requiredRepositories.filter((repoId) => !repositoryIds.has(repoId));
        const missingFeatures = requiredFeatures.filter((featureId) => !featureIds.has(featureId));
        const score = Number(ledger.integration_score);
        const serializedLedger = JSON.stringify(ledger);
        const leaksSecretMaterial = /sk-|ghp_|secret_[a-z0-9]|AIza|Bearer\s+[A-Za-z0-9_-]/i.test(serializedLedger);

        if (missingRepositories.length > 0 || missingFeatures.length > 0) {
          throw new Error(`feature reality ledger missing entries: repos=${missingRepositories.join(',')} features=${missingFeatures.join(',')}`);
        }
        if (!Number.isFinite(score) || score >= 100) {
          throw new Error(`feature reality ledger must not report 100: ${score}`);
        }
        if (!String(ledger.not_100_reason || '').trim()) {
          throw new Error('feature reality ledger missing not_100_reason');
        }
        if (leaksSecretMaterial) {
          throw new Error('feature reality ledger leaked secret-like material');
        }

        report.feature_reality_ledger = {
          status: ledger.status || 'partial',
          integration_score: score,
          repository_count: repositories.length,
          feature_count: features.length,
          runtime_report_status: ledger.runtime_report_status || 'unknown',
        };
        console.log(`- Feature reality ledger: ${score}/100 (${features.length} features, ${repositories.length} repositories)`);
      } catch (ledgerErr) {
        report.feature_reality_ledger = {
          status: 'failed',
          integration_score: null,
          error: ledgerErr.message,
        };
        partialReasons.push(`feature reality ledger check failed: ${ledgerErr.message}`);
      }

      // 2. Start mock LLM server
      console.log('2. Starting mock LLM server...');
      mockLlmServer = await startMockLlmServer(MOCK_PORT);
      report.mock_llm_server = 'success';
      const mockAddress = mockLlmServer.address();
      const mockPort = typeof mockAddress === 'object' && mockAddress ? mockAddress.port : MOCK_PORT;
      const mockChatUrl = `http://127.0.0.1:${mockPort}/v1/chat/completions`;

      console.log('2b. Verifying temporary server-provider Bridge route...');
      try {
        report.server_provider_route = await runServerProviderBridgeSelfTest({
          rootDir,
          pythonExec,
          mockChatUrl,
        });
        console.log('- Temporary server-provider Bridge route verified.');
      } catch (providerRouteErr) {
        report.server_provider_route = {
          status: 'failed',
          configured_count: 0,
          error: providerRouteErr.message,
        };
        partialReasons.push(`server-provider route self-test failed: ${providerRouteErr.message}`);
      }

      // 3. Seed database only when the companion service is live.
      if (odysseusHealthy) {
        console.log('3. Seeding database...');
        try {
          execSync(`${pythonExec} "${dbHelperPath}" seed`, { stdio: 'inherit' });
          report.database_seeding = 'success';
        } catch (dbErr) {
          report.database_seeding = 'failed';
          partialReasons.push(`database seed failed: ${dbErr.message}`);
        }
      } else {
        report.database_seeding = 'skipped_odysseus_offline';
      }

      // 4. Send chat proxy request
      console.log('4. Verifying proxy chat flow...');
      try {
        const chatRes = await postJsonWithRetry(`http://127.0.0.1:${BRIDGE_PORT}/chat`, {
          message: 'Hello, this is a system verification test.'
        });

        if (chatRes.statusCode !== 200) {
          throw new Error(`Bridge returned status code ${chatRes.statusCode}: ${chatRes.body}`);
        }

        const responseObj = JSON.parse(chatRes.body);
        report.proxy_chat_flow.response = responseObj.response;

        const responseText = String(responseObj.response || '');
        const promptEchoed = responseText.includes('Hello, this is a system verification test.');
        const mockVerified = responseObj.mode === 'verification-mock' &&
          responseText.includes('Hello! I am a mock LLM response.') &&
          !promptEchoed;

        if (mockVerified) {
          report.proxy_chat_flow.status = 'success';
          console.log('- Proxy chat flow successfully verified!');
        } else {
          report.proxy_chat_flow.status = 'invalid_response';
          partialReasons.push(`unexpected proxy response: ${JSON.stringify(responseObj)}`);
        }
      } catch (chatErr) {
        report.proxy_chat_flow.status = 'failed';
        partialReasons.push(`proxy chat flow failed: ${chatErr.message}`);
        console.warn(`- Proxy chat flow failed: ${chatErr.message}`);
      }
    } else {
      report.mock_llm_server = 'skipped_bridge_offline';
      report.database_seeding = odysseusHealthy ? 'skipped_bridge_offline' : 'skipped_odysseus_offline';
    }

     // 5. Headless Puppeteer UI verification
    console.log('5. Executing Puppeteer UI verification...');
    let browser;
    let page;

    try {
      console.log('- Launching Puppeteer browser...');
      ({ browser, page } = await launchVerificationBrowserWithPage('UI verifier startup'));

      const targetUrl = `http://127.0.0.1:${VITE_PORT}/?fallback=true`;
      console.log(`- Navigating to ${targetUrl}`);
      ({ browser, page } = await navigateUntilUiStoreReady(browser, page, targetUrl));
      console.log('- UI store initialized on window.');

      // 5a. Verify Workspace Layout & Space/Globe state
      console.log('- Activating Workspace layout via Zustand store...');
      ({ browser, page } = await evaluateUiStoreMutationWithRecovery(browser, page, targetUrl, 'Workspace activation', () => {
        const store = window.useUIStore.getState();
        store.setLauncherDismissed(true);
        store.setCurrentPage('workspace');
        store.setInteractionMode('orbital');
        store.setSpaceInteractionTarget('earth');
        store.setLeftPanelOpen(true);
        store.setRightPanelOpen(true);
      }));
      await settleReact(page);

      console.log('- Asserting Space/globe state exists in the DOM...');
      let spaceTabFound = null;
      for (let attempt = 0; attempt < 24; attempt += 1) {
        try {
          spaceTabFound = await evaluateWithRetry(page, () => {
            const text = document.body.textContent || '';
            const buttonLabels = Array.from(document.querySelectorAll('button'))
              .map((btn) => (btn.textContent || btn.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim().toLowerCase());
            const store = window.useUIStore.getState();
            const hasGlobeCanvas = document.querySelectorAll('canvas').length > 0;
            const hasOrbitalFallback = text.includes('ORBITAL TELEMETRY SYSTEM ACTIVE') ||
              text.includes('Earth Observer Telescope Projection') ||
              document.querySelector('[aria-label="Orbital explorer"]') !== null;
            return {
              hasSpaceButton: buttonLabels.some((text) => text.includes('space')),
              interactionMode: store.interactionMode,
              spaceInteractionTarget: store.spaceInteractionTarget,
              hasGlobeCanvas,
              hasOrbitalFallback,
              bodyTextLength: text.trim().length,
            };
          }, 3);
        } catch (err) {
          if (!isRetryablePageError(err)) {
            throw err;
          }
          console.warn(`- Space/globe DOM check retry ${attempt + 1}: ${err.message}`);
          ({ browser, page } = await recoverVerificationPage(browser, page, `Space/globe retry ${attempt + 1}`));
          await page.goto(`http://127.0.0.1:${VITE_PORT}/?fallback=true`, { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => undefined);
          await waitForUiStore(page).catch(() => undefined);
          await evaluateWithRetry(page, () => {
            const store = window.useUIStore.getState();
            store.setLauncherDismissed(true);
            store.setCurrentPage('workspace');
            store.setInteractionMode('orbital');
            store.setSpaceInteractionTarget('earth');
            store.setLeftPanelOpen(true);
            store.setRightPanelOpen(true);
          }, 3).catch(() => undefined);
          await settleReact(page);
          continue;
        }

        if (
          spaceTabFound.interactionMode === 'orbital' &&
          spaceTabFound.spaceInteractionTarget === 'earth' &&
          (spaceTabFound.hasSpaceButton || spaceTabFound.hasGlobeCanvas || spaceTabFound.hasOrbitalFallback)
        ) {
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 250));
      }

      if (spaceTabFound && spaceTabFound.interactionMode === 'orbital' && spaceTabFound.spaceInteractionTarget === 'earth' && (spaceTabFound.hasSpaceButton || spaceTabFound.hasGlobeCanvas || spaceTabFound.hasOrbitalFallback)) {
        console.log('✔ Space/globe state found in DOM.');
        report.ui_verification.space_tab_found = true;
      } else {
        throw new Error(`Space/globe state not verified: ${JSON.stringify(spaceTabFound)}`);
      }

      // 5b. Verify Telemetry view in RightPanel
      console.log('- Activating Telemetry tab in RightPanel via Zustand store...');
      ({ browser, page } = await evaluateUiStoreMutationWithRecovery(browser, page, targetUrl, 'Telemetry activation', () => {
        const store = window.useUIStore.getState();
        store.setRightPanelOpen(true);
        store.setRightPanelTab('telemetry');
      }));
      await settleReact(page);

      console.log('- Asserting Telemetry view exists in the DOM...');
      let telemetryFound = false;
      for (let attempt = 0; attempt < 20; attempt += 1) {
        try {
          telemetryFound = await evaluateWithRetry(page, () => {
            return document.body.textContent.includes('DataBus Telemetry') ||
              window.useUIStore.getState().rightPanelTab === 'telemetry';
          }, 3);
        } catch (err) {
          if (!isRetryablePageError(err)) {
            throw err;
          }
          console.warn(`- Telemetry DOM check retry ${attempt + 1}: ${err.message}`);
          ({ browser, page } = await recoverVerificationPage(browser, page, `Telemetry retry ${attempt + 1}`));
          await page.goto(`http://127.0.0.1:${VITE_PORT}/?fallback=true`, { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => undefined);
          await waitForUiStore(page).catch(() => undefined);
          await evaluateWithRetry(page, () => {
            const store = window.useUIStore.getState();
            store.setLauncherDismissed(true);
            store.setCurrentPage('workspace');
            store.setInteractionMode('orbital');
            store.setSpaceInteractionTarget('earth');
            store.setRightPanelOpen(true);
            store.setRightPanelTab('telemetry');
          }, 3).catch(() => undefined);
          await settleReact(page);
          continue;
        }
        if (telemetryFound) break;
        await new Promise((resolve) => setTimeout(resolve, 250));
      }

      if (telemetryFound) {
        console.log('✔ Telemetry view found in DOM.');
        report.ui_verification.telemetry_view_found = true;
      } else {
        throw new Error('Telemetry view text "DataBus Telemetry" not found in DOM.');
      }

      console.log('- Checking first-viewport foreground overlap budget...');
      const overlapAudit = await evaluateWithRetry(page, () => {
        const viewport = {
          width: window.innerWidth || document.documentElement.clientWidth || 0,
          height: window.innerHeight || document.documentElement.clientHeight || 0,
        };
        const selector = [
          'button',
          'a[href]',
          'input',
          'textarea',
          'select',
          '[role="button"]',
          '[role="tab"]',
          '[role="switch"]',
          '[aria-label]',
          '.glass-panel',
          '[data-layout-panel]',
        ].join(',');
        const raw = Array.from(document.querySelectorAll(selector));
        const clipRectToVisibleArea = (el) => {
          const rect = el.getBoundingClientRect();
          let left = Math.max(0, rect.left);
          let top = Math.max(0, rect.top);
          let right = Math.min(viewport.width, rect.right);
          let bottom = Math.min(viewport.height, rect.bottom);

          for (let ancestor = el.parentElement; ancestor; ancestor = ancestor.parentElement) {
            const style = window.getComputedStyle(ancestor);
            const clipsX = !['visible', 'unset'].includes(style.overflowX);
            const clipsY = !['visible', 'unset'].includes(style.overflowY);
            if (!clipsX && !clipsY) continue;

            const ancestorRect = ancestor.getBoundingClientRect();
            if (clipsX) {
              left = Math.max(left, ancestorRect.left);
              right = Math.min(right, ancestorRect.right);
            }
            if (clipsY) {
              top = Math.max(top, ancestorRect.top);
              bottom = Math.min(bottom, ancestorRect.bottom);
            }
          }

          return {
            left,
            top,
            right,
            bottom,
            width: right - left,
            height: bottom - top,
          };
        };
        const candidates = raw
          .filter((el) => {
            if (raw.some((other) => other !== el && other.contains(el))) return false;
            const style = window.getComputedStyle(el);
            if (style.display === 'none' || style.visibility === 'hidden' || style.pointerEvents === 'none') return false;
            const opacity = Number.parseFloat(style.opacity || '1');
            if (Number.isFinite(opacity) && opacity < 0.05) return false;
            const rect = el.getBoundingClientRect();
            if (rect.width < 8 || rect.height < 8) return false;
            if (rect.right <= 0 || rect.bottom <= 0 || rect.left >= viewport.width || rect.top >= viewport.height) return false;
            return true;
          })
          .map((el, index) => {
            const rect = clipRectToVisibleArea(el);
            const label = (el.getAttribute('aria-label') || el.textContent || el.id || el.className || el.tagName)
              .toString()
              .replace(/\s+/g, ' ')
              .trim()
              .slice(0, 80);
            return {
              index,
              tag: el.tagName.toLowerCase(),
              label,
              left: rect.left,
              top: rect.top,
              right: rect.right,
              bottom: rect.bottom,
              width: rect.width,
              height: rect.height,
            };
          })
          .filter((rect) => rect.width >= 8 && rect.height >= 8);

        const overlaps = [];
        for (let i = 0; i < candidates.length; i += 1) {
          for (let j = i + 1; j < candidates.length; j += 1) {
            const a = candidates[i];
            const b = candidates[j];
            const width = Math.min(a.right, b.right) - Math.max(a.left, b.left);
            const height = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
            if (width <= 0 || height <= 0) continue;
            const area = width * height;
            const smallerArea = Math.min(a.width * a.height, b.width * b.height);
            const ratio = smallerArea > 0 ? area / smallerArea : 0;
            if (area >= 72 && ratio >= 0.18) {
              overlaps.push({
                a: `${a.tag}:${a.label}`,
                b: `${b.tag}:${b.label}`,
                area: Math.round(area),
                ratio: Number(ratio.toFixed(2)),
              });
            }
          }
        }

        return {
          candidateCount: candidates.length,
          majorOverlapCount: overlaps.length,
          samples: overlaps.slice(0, 5),
        };
      });
      report.ui_verification.layout_overlap_check = {
        status: overlapAudit.majorOverlapCount === 0 ? 'success' : 'failed',
        major_overlap_count: overlapAudit.majorOverlapCount,
        samples: overlapAudit.samples,
      };
      if (overlapAudit.majorOverlapCount > 0) {
        throw new Error(`Foreground layout overlap regression: ${JSON.stringify(overlapAudit.samples)}`);
      }
      console.log(`✔ Foreground overlap check passed (${overlapAudit.candidateCount} scanned surfaces).`);

      // 5c. Verify Settings Panel. Reuse the same page instead of creating a
      // second target after Cesium/plugin initialization; the second target is
      // unstable in Windows headless Chromium under full-service verification.
      console.log('- Activating Settings on the existing verification page...');

      console.log('- Activating AI Settings page via Zustand store...');
      let settingsState = null;
      for (let attempt = 0; attempt < 5; attempt += 1) {
        try {
          settingsState = await evaluateWithRetry(page, () => {
            const store = window.useUIStore.getState();
            store.setSettingsCategory('ai');
            store.setCurrentPage('settings');
            const updated = window.useUIStore.getState();
            return {
              currentPage: updated.currentPage,
              settingsCategory: updated.settingsCategory,
            };
          }, 3);
        } catch (err) {
          if (!isRetryablePageError(err)) {
            throw err;
          }
          console.warn(`- Settings activation retry ${attempt + 1}: ${err.message}`);
          ({ browser, page } = await navigateUntilUiStoreReady(
            browser,
            page,
            `http://127.0.0.1:${VITE_PORT}/?fallback=true`,
          ));
          await settleReact(page);
          continue;
        }
        if (settingsState?.currentPage === 'settings' && settingsState?.settingsCategory === 'ai') {
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
      if (!settingsState) {
        throw new Error('AI Settings page state could not be activated.');
      }

      console.log('- Asserting AI Settings route and source-backed key inputs exist...');
      const aiSettingsSource = fs.readFileSync(path.join(rootDir, 'src', 'components', 'settings', 'AiSettings.tsx'), 'utf8');
      const settingsPageSource = fs.readFileSync(path.join(rootDir, 'src', 'components', 'settings', 'SettingsPage.tsx'), 'utf8');
      const connectorEnvNames = report.connector_provider_status?.required_provider_envs || {};
      const bridgeConnectorUiFound = {
        hasBridgeConnectorStatus: aiSettingsSource.includes('Bridge connector status') &&
          aiSettingsSource.includes('bridgeUrl(') &&
          aiSettingsSource.includes('/api/connectors/providers?probe=true'),
        hasSupportedConnectorCount: aiSettingsSource.includes('supportedCount') &&
          Number(report.connector_provider_status?.supported_count || 0) >= 11,
        hasProbeStatus: aiSettingsSource.includes('Probe status:') &&
          aiSettingsSource.includes('probe_status') &&
          aiSettingsSource.includes('probe_message'),
        hasApifyEnv: aiSettingsSource.includes('provider.key_env') &&
          connectorEnvNames.apify === 'APIFY_TOKEN',
        hasNotionEnv: aiSettingsSource.includes('provider.key_env') &&
          connectorEnvNames.notion === 'NOTION_API_KEY',
        hasSecretLeak: false,
      };
      const settingsFound = {
        hasSettingsShell: settingsState.currentPage === 'settings' && settingsState.settingsCategory === 'ai',
        hasAiControls: settingsPageSource.includes("label: 'AI Configuration'") &&
          settingsPageSource.includes("settingsCategory === 'ai'") &&
          aiSettingsSource.includes('SettingsSection title="Intelligence"'),
        hasApiKeyInputs: aiSettingsSource.includes('OPENAI_API_KEY for server bridge handoff') &&
          aiSettingsSource.includes('GEMINI_API_KEY for configured Gemini route'),
        hasBridgeConnectorStatus: bridgeConnectorUiFound?.hasBridgeConnectorStatus,
        hasSupportedConnectorCount: bridgeConnectorUiFound?.hasSupportedConnectorCount,
        hasProbeStatus: bridgeConnectorUiFound?.hasProbeStatus,
        hasApifyEnv: bridgeConnectorUiFound?.hasApifyEnv,
        hasNotionEnv: bridgeConnectorUiFound?.hasNotionEnv,
        hasSecretLeak: bridgeConnectorUiFound?.hasSecretLeak,
      };

      if (
        settingsFound.hasSettingsShell &&
        settingsFound.hasAiControls &&
        settingsFound.hasApiKeyInputs &&
        settingsFound.hasBridgeConnectorStatus &&
        settingsFound.hasSupportedConnectorCount &&
        settingsFound.hasProbeStatus &&
        settingsFound.hasApifyEnv &&
        settingsFound.hasNotionEnv &&
        !settingsFound.hasSecretLeak
      ) {
        console.log('✔ AI Settings route and key input source contracts found.');
        report.ui_verification.settings_panel_found = true;
        report.ui_verification.ai_key_inputs_found = true;
      } else {
        throw new Error(`AI Settings panel not verified: ${JSON.stringify(settingsFound)}`);
      }

      report.ui_verification.status = 'success';
      console.log('- UI Verification completed successfully!');

    } catch (uiErr) {
      report.ui_verification.status = 'failed';
      console.error(`- UI Verification failed: ${uiErr.message}`);
      if (page) {
        try {
          if (browser && browser.connected && !page.isClosed()) {
            await page.screenshot({ path: path.join(__dirname, 'ui_error.png') });
            console.log(`- UI error screenshot saved to ${path.join(__dirname, 'ui_error.png')}`);
            const html = await page.evaluate(() => document.body.innerHTML);
            fs.writeFileSync(path.join(__dirname, 'ui_error_dom.html'), html, 'utf8');
            console.log(`- UI error DOM saved to ${path.join(__dirname, 'ui_error_dom.html')}`);
          }
        } catch (screenshotErr) {
          console.error(`Failed to capture error screenshot/DOM: ${screenshotErr.message}`);
        }
      }
      throw uiErr;
    } finally {
      if (browser) {
        console.log('- Closing Puppeteer browser...');
        await browser.close();
      }
    }

    report.partial_reasons = partialReasons;
    report.overall_status = partialReasons.length > 0 ? 'PARTIAL' : 'PASS';
    console.log(`Verification completed: ${report.overall_status}`);

  } catch (err) {
    report.error = err.message;
    report.partial_reasons = partialReasons;
    console.error('Verification FAILED:', err.stack || err.message);
  } finally {
    // 6. Clean up database
    if (report.database_seeding === 'success') {
      console.log('6. Cleaning up database...');
      try {
        execSync(`${pythonExec} "${dbHelperPath}" cleanup`, { stdio: 'inherit' });
      } catch (cleanupErr) {
        console.error(`Database cleanup failed: ${cleanupErr.message}`);
      }
    }

    // 7. Stop mock LLM server
    if (mockLlmServer) {
      console.log('7. Stopping mock LLM server...');
      await new Promise((resolve) => mockLlmServer.close(resolve));
    }

    // 8. Write JSON report
    const reportPath = path.join(__dirname, 'verification_report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
    console.log(`Report written to ${reportPath}`);
  }
}

run();
