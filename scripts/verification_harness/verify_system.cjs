// verify_system.cjs
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const puppeteer = require('puppeteer');

const MOCK_PORT = 9099;
const VITE_PORT = 3000;
const BRIDGE_PORT = 8001;
const ODYSSEUS_PORT = 7000;

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
      resolve(res.statusCode === 200);
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

// Start local mock LLM server
function startMockLlmServer(port) {
  return new Promise((resolve) => {
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
        let body = '';
        req.on('data', chunk => { body += chunk; });
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

    server.listen(port, '127.0.0.1', () => {
      console.log(`[Mock LLM] Listening on http://127.0.0.1:${port}`);
      resolve(server);
    });
  });
}

// Global helper functions removed (now defined locally inside run() to access safeEvaluate)


// Main execution logic
async function run() {
  const report = {
    timestamp: new Date().toISOString(),
    services: {
      vite: { status: 'checking', port: VITE_PORT },
      bridge: { status: 'checking', port: BRIDGE_PORT },
      odysseus: { status: 'checking', port: ODYSSEUS_PORT }
    },
    database_seeding: 'pending',
    mock_llm_server: 'pending',
    proxy_chat_flow: { status: 'pending', response: null },
    ui_verification: {
      status: 'pending',
      space_tab_found: false,
      telemetry_view_found: false,
      settings_panel_found: false
    },
    overall_status: 'FAIL'
  };

  // Determine Python path for db_helper
  const rootDir = path.resolve(__dirname, '../..');
  const pythonVenvPath = path.join(rootDir, 'odysseus', 'venv', 'Scripts', 'python.exe');
  const pythonExec = fs.existsSync(pythonVenvPath) ? `"${pythonVenvPath}"` : 'python';
  const dbHelperPath = path.join(__dirname, 'db_helper.py');

  try {
    // 1. Health check services
    console.log('1. Checking service health...');
    const viteHealthy = await checkEndpointHealth(`http://127.0.0.1:${VITE_PORT}`);
    report.services.vite.status = viteHealthy ? 'online' : 'offline';
    console.log(`- Vite: ${report.services.vite.status}`);

    const bridgeHealthy = await checkEndpointHealth(`http://127.0.0.1:${BRIDGE_PORT}/status`);
    report.services.bridge.status = bridgeHealthy ? 'online' : 'offline';
    console.log(`- Bridge: ${report.services.bridge.status}`);

    const odysseusHealthy = await checkEndpointHealth(`http://127.0.0.1:${ODYSSEUS_PORT}/api/health`);
    report.services.odysseus.status = odysseusHealthy ? 'online' : 'offline';
    console.log(`- Odysseus: ${report.services.odysseus.status}`);

    if (!viteHealthy || !bridgeHealthy || !odysseusHealthy) {
      throw new Error('One or more core services are offline. Make sure the system is running.');
    }

    // 2. Start mock LLM server
    console.log('2. Starting mock LLM server...');
    mockLlmServer = await startMockLlmServer(MOCK_PORT);
    report.mock_llm_server = 'success';

    // 3. Seed database
    console.log('3. Seeding database...');
    try {
      execSync(`${pythonExec} "${dbHelperPath}" seed`, { stdio: 'inherit' });
      report.database_seeding = 'success';
    } catch (dbErr) {
      report.database_seeding = 'failed';
      throw new Error(`Failed to seed database: ${dbErr.message}`);
    }

    // 4. Send chat proxy request
    console.log('4. Verifying proxy chat flow...');
    try {
      // Send chat request to bridge proxy
      const chatRes = await postJson(`http://127.0.0.1:${BRIDGE_PORT}/chat`, {
        message: 'Hello, this is a system verification test.'
      });
      
      if (chatRes.statusCode !== 200) {
        throw new Error(`Bridge returned status code ${chatRes.statusCode}: ${chatRes.body}`);
      }

      const responseObj = JSON.parse(chatRes.body);
      report.proxy_chat_flow.response = responseObj.response;
      
      if (responseObj.response && responseObj.response.includes('Hello! I am a mock LLM response.')) {
        report.proxy_chat_flow.status = 'success';
        console.log('- Proxy chat flow successfully verified!');
      } else {
        report.proxy_chat_flow.status = 'invalid_response';
        throw new Error(`Unexpected proxy response: ${JSON.stringify(responseObj)}`);
      }
    } catch (chatErr) {
      report.proxy_chat_flow.status = 'failed';
      throw new Error(`Proxy chat flow failed: ${chatErr.message}`);
    }

     // 5. Headless Puppeteer UI verification
    console.log('5. Executing Puppeteer UI verification...');
    let browser;
    let page;

    try {
      console.log('- Launching Puppeteer browser...');
      browser = await puppeteer.launch({
        headless: true,
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

      page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 800 });

      // Listen for console and page errors to diagnose target crashes
      page.on('console', msg => {
        const text = msg.text();
        if (!text.includes('favicon') && !text.includes('404')) {
          console.log(`[Browser Console] ${text}`);
        }
      });
      page.on('pageerror', err => console.error(`[Browser Error] ${err.toString()}`));

      // Block WebGL, intercept external APIs, and inject styles to prevent GPU crashes
      await page.evaluateOnNewDocument(() => {
        // Override getContext to disable WebGL and prevent GPU process crashes in headless mode
        const originalGetContext = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function (type, ...args) {
          if (type === 'webgl' || type === 'webgl2' || type === 'experimental-webgl') {
            console.log(`[WebGL Blocked] Context type requested: ${type}`);
            return null;
          }
          return originalGetContext.apply(this, [type, ...args]);
        };

        // Mock external API calls to avoid hanging requests in headless mode
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

        // Inject CSS overrides to disable blurs, filters, transitions, and animations
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

      console.log(`- Navigating to http://127.0.0.1:${VITE_PORT}/?fallback=true`);
      let navigated = false;
      for (let navAttempt = 1; navAttempt <= 3; navAttempt++) {
        try {
          await page.goto(`http://127.0.0.1:${VITE_PORT}/?fallback=true`, { waitUntil: 'domcontentloaded', timeout: 20000 });
          navigated = true;
          break;
        } catch (gotoErr) {
          console.warn(`- Navigation attempt ${navAttempt} warning: ${gotoErr.message}`);
          await new Promise(r => setTimeout(r, 1000));
        }
      }
      if (!navigated) {
        throw new Error('Failed to navigate to target URL after 3 attempts.');
      }

      console.log('- Waiting for UI store initialization...');
      await page.waitForFunction(() => typeof window.useUIStore !== 'undefined', { timeout: 15000 });
      console.log('- UI store initialized on window.');

      // 5a. Verify Workspace Layout & Space Tab
      console.log('- Activating Workspace layout via Zustand store...');
      await page.evaluate(() => {
        window.useUIStore.getState().setLauncherDismissed(true);
        window.useUIStore.getState().setCurrentPage('workspace');
      });
      await new Promise(r => setTimeout(r, 500));

      console.log('- Asserting Space tab exists in the DOM...');
      const spaceTabFound = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.some(btn => btn.textContent.includes('Space'));
      });

      if (spaceTabFound) {
        console.log('✔ Space tab found in DOM.');
        report.ui_verification.space_tab_found = true;
      } else {
        throw new Error('Space tab not found in DOM.');
      }

      // 5b. Verify Telemetry view in RightPanel
      console.log('- Activating Telemetry tab in RightPanel via Zustand store...');
      await page.evaluate(() => {
        window.useUIStore.getState().setRightPanelOpen(true);
        window.useUIStore.getState().setRightPanelTab('telemetry');
      });
      await new Promise(r => setTimeout(r, 500));

      console.log('- Asserting Telemetry view exists in the DOM...');
      const telemetryFound = await page.evaluate(() => {
        return document.body.textContent.includes('DataBus Telemetry');
      });

      if (telemetryFound) {
        console.log('✔ Telemetry view found in DOM.');
        report.ui_verification.telemetry_view_found = true;
      } else {
        throw new Error('Telemetry view text "DataBus Telemetry" not found in DOM.');
      }

      // 5c. Verify Settings Panel
      console.log('- Activating Settings page via Zustand store...');
      await page.evaluate(() => {
        window.useUIStore.getState().setCurrentPage('settings');
      });
      await new Promise(r => setTimeout(r, 500));

      console.log('- Asserting Settings panel exists in the DOM...');
      const settingsFound = await page.evaluate(() => {
        return document.body.textContent.includes('SYSTEM PANEL');
      });

      if (settingsFound) {
        console.log('✔ Settings panel found in DOM.');
        report.ui_verification.settings_panel_found = true;
      } else {
        throw new Error('Settings panel text "SYSTEM PANEL" not found in DOM.');
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

    report.overall_status = 'PASS';
    console.log('Verification completed: PASS');

  } catch (err) {
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
      mockLlmServer.close();
    }

    // 8. Write JSON report
    const reportPath = path.join(__dirname, 'verification_report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
    console.log(`Report written to ${reportPath}`);
  }
}

run();
