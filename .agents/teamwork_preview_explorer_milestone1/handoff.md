# Handoff Report - Milestone 1 Explorer Investigation

## 1. Observation

- **Port Active Status**: Using `netstat -ano`, the following ports are actively `LISTENING`:
  - Port `3000` (Vite Preview Server): PIDs `21440`, `8924`
  - Port `8001` (FastAPI Assistant Bridge): PID `22112`
  - Port `7000` (Odysseus Backend): PID `17536`
  
  Verbatim output from command execution:
  ```
  TCP    0.0.0.0:3000           0.0.0.0:0              LISTENING       21440
  TCP    0.0.0.0:8001           0.0.0.0:0              LISTENING       22112
  TCP    127.0.0.1:3000         0.0.0.0:0              LISTENING       8924
  TCP    127.0.0.1:7000         0.0.0.0:0              LISTENING       17536
  ```

- **Port Health/Endpoints**:
  - `http://127.0.0.1:3000` returned HTTP `200`
  - `http://127.0.0.1:8001/status` returned HTTP `200` with JSON configuration details.
  - `http://127.0.0.1:7000/api/health` returned HTTP `200` with `{"status": "healthy"}`.
  - `http://127.0.0.1:8001/chat` returned HTTP `200` with body:
    `{"response":"[Odysseus Error 400] {\"detail\":\"No model selected for this chat. Open the model picker and choose one before sending.\"}"}`

- **Database State**: A query of `odysseus/data/app.db` showed that the `model_endpoints` table is empty (`[]`), and existing chat sessions have empty model fields (`endpoint_url: ""` and `model: ""`).

- **Server Launcher (`launch.js`)**:
  - Clears ports `8001`, `3000`, and `7000` on startup using `taskkill`.
  - Spawns the python bridge server (`python ./bridge/server.py`) on port `8001`.
  - Spawns the Vite production preview server (`node node_modules/vite/bin/vite.js preview --port 3000 --host 127.0.0.1`) on port `3000`.
  - Note: The Odysseus backend is not directly spawned by `launch.js`. Instead, it is spawned automatically as a subprocess of the FastAPI bridge server during the bridge startup lifecycle (`lifespan` event).

- **UI Code & DOM Selectors**:
  - **Space tab**: A button containing the text `"Space"` (toggled in store via interaction mode `'orbital'`).
  - **Settings panel**: Toggled open by clicking the button with `title="Open Settings"` in `LeftPanel.tsx`, which triggers the rendering of `SettingsPane.tsx`. Key element: `<select id="ai-model-select">` or `<select id="imagery-provider-select">`.
  - **Telemetry view**: The bottom timeline (`LIVE TELEMETRY` / `PLAYBACK`) and the developer inspector, which is toggled via a button with text `"Inspect Runtime"` under settings.

---

## 2. Logic Chain

1. Starting `launch.js` starts the Assistant Bridge (8001) and Vite Preview (3000). The Bridge startup lifespan calls `start_odysseus_subprocess()` which executes `python -m uvicorn app:app --port 7000` in the `odysseus` directory, bringing all three services online.
2. When the bridge processes a POST request to `/chat`, it proxies the request to the Odysseus backend `/api/chat` using the `X-Odysseus-Internal-Token` header.
3. The Odysseus backend validates whether the session has a configured model and endpoint. Since the `model_endpoints` database table is empty and no local/remote LLM provider is registered, any chat session created falls back to empty values (`endpoint_url: ""`, `model: ""`).
4. This mismatch triggers the `_clear_orphaned_session_endpoint()` function, returning a `400 No model selected` error.
5. To verify E2E chat routing end-to-end without failing, the new verification harness must temporarily seed the SQLite database `odysseus/data/app.db` with a mock endpoint and session, spin up a local mock LLM server on a temporary port (e.g. `9099`), and then cleanup the database after the check.
6. Headless Puppeteer tests face WebGL and CSS layout execution crashes in virtual/CI environments. Mocks for Canvas contexts and specific CSS styles must be injected to ensure stable DOM assertion.

---

## 3. Caveats

- **WebGL Compatibility**: Headless chrome environment does not support WebGL natively, which causes Cesium 3D canvas and other graphics subsystems to crash. The test harness must forcefully block WebGL context query via canvas and apply CSS overrides.
- **Port Conflicts**: If port `9099` is occupied, the mock LLM server might fail. The script should use a configurable or randomly selected free port.
- **Internal Token**: The bridge generates `INTERNAL_TOOL_TOKEN` on startup randomly if `ODYSSEUS_INTERNAL_TOKEN` is not specified in the environment. Therefore, direct HTTP calls to Odysseus must go through the bridge on port `8001`, which automatically attaches the token.

---

## 4. Conclusion

We recommend creating two new files under a brand-new directory `scripts/verification_harness/`:
1. `db_helper.py`: A Python helper script that interfaces with the Odysseus virtual environment and SQLAlchemy setup to seed and clean mock entries in `data/app.db`.
2. `verify_system.cjs`: A Node.js Puppeteer and HTTP test runner script that coordinates port checks, mock server lifecycle, database seeding/cleanup, and UI element verification.

Below are the complete implementations of both files:

### File 1: `scripts/verification_harness/db_helper.py`
```python
import sys
import os

# Adjust path to find the odysseus module
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "odysseus")))

from core.database import SessionLocal, ModelEndpoint, Session as DbSession

def seed():
    db = SessionLocal()
    try:
        # 1. Create a mock ModelEndpoint
        ep = ModelEndpoint(
            id="test-harness-endpoint",
            name="Test Harness Mock Endpoint",
            base_url="http://127.0.0.1:9099/v1",
            is_enabled=True,
            cached_models='["mock-model"]',
            model_type="llm",
            owner=None
        )
        db.add(ep)
        
        # 2. Create a mock Session owned by internal-tool
        sess = DbSession(
            id="test-harness-session",
            name="Test Harness Session",
            endpoint_url="http://127.0.0.1:9099/v1/chat/completions",
            model="mock-model",
            owner="internal-tool",
            rag=False,
            archived=False
        )
        db.add(sess)
        db.commit()
        print("SUCCESS: Seeded database successfully.")
    except Exception as e:
        db.rollback()
        print(f"ERROR: Failed to seed: {e}")
        sys.exit(1)
    finally:
        db.close()

def cleanup():
    db = SessionLocal()
    try:
        db.query(ModelEndpoint).filter(ModelEndpoint.id == "test-harness-endpoint").delete()
        db.query(DbSession).filter(DbSession.id == "test-harness-session").delete()
        db.commit()
        print("SUCCESS: Cleaned database successfully.")
    except Exception as e:
        db.rollback()
        print(f"ERROR: Failed to cleanup: {e}")
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: db_helper.py [seed|cleanup]")
        sys.exit(1)
    
    cmd = sys.argv[1]
    if cmd == "seed":
        seed()
    elif cmd == "cleanup":
        cleanup()
```

### File 2: `scripts/verification_harness/verify_system.cjs`
```javascript
const puppeteer = require('puppeteer');
const http = require('http');
const { execSync } = require('child_process');
const path = require('path');

const VITE_URL = 'http://127.0.0.1:3000';
const BRIDGE_STATUS_URL = 'http://127.0.0.1:8001/status';
const BRIDGE_CHAT_URL = 'http://127.0.0.1:8001/chat';
const ODYSSEUS_HEALTH_URL = 'http://127.0.0.1:7000/api/health';
const MOCK_LLM_PORT = 9099;

let mockServer;

// Start local mock LLM server
function startMockLLM() {
  return new Promise((resolve) => {
    mockServer = http.createServer((req, res) => {
      if (req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            choices: [
              {
                message: {
                  role: 'assistant',
                  content: 'Test mock response from Odysseus!'
                }
              }
            ]
          }));
        });
      } else {
        res.writeHead(404);
        res.end();
      }
    });
    mockServer.listen(MOCK_LLM_PORT, () => {
      console.log(`[HARNESS] Mock LLM server running on port ${MOCK_LLM_PORT}`);
      resolve();
    });
  });
}

// Perform simple HTTP GET request
function fetchGet(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      resolve(res.statusCode);
    }).on('error', (err) => reject(err));
  });
}

// Perform POST for Chat Proxy check
function fetchPostChat(url) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ message: 'ping', system_instruction: '' });
    const u = new URL(url);
    const options = {
      hostname: u.hostname,
      port: u.port,
      path: u.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => {
        resolve({ status: res.statusCode, body: JSON.parse(body) });
      });
    });
    req.on('error', (err) => reject(err));
    req.write(data);
    req.end();
  });
}

async function runTests() {
  console.log('=== SYSTEM HEALTH VERIFICATION HARNESS ===\n');
  let failures = 0;

  // 1. Port GET Checks
  try {
    const viteStatus = await fetchGet(VITE_URL);
    console.log(`[PASS] Vite Port 3000 Status: ${viteStatus}`);
  } catch (err) {
    console.error(`[FAIL] Vite Port 3000 unreachable: ${err.message}`);
    failures++;
  }

  try {
    const bridgeStatus = await fetchGet(BRIDGE_STATUS_URL);
    console.log(`[PASS] FastAPI Bridge Port 8001 Status: ${bridgeStatus}`);
  } catch (err) {
    console.error(`[FAIL] FastAPI Bridge Port 8001 unreachable: ${err.message}`);
    failures++;
  }

  try {
    const odysseusStatus = await fetchGet(ODYSSEUS_HEALTH_URL);
    console.log(`[PASS] Odysseus Backend Port 7000 Status: ${odysseusStatus}`);
  } catch (err) {
    console.error(`[FAIL] Odysseus Backend Port 7000 unreachable: ${err.message}`);
    failures++;
  }

  // 2. Database Seeding
  console.log('\n[HARNESS] Seeding database...');
  try {
    const pythonExec = path.join(__dirname, '..', '..', 'odysseus', 'venv', 'Scripts', 'python.exe');
    const helperPath = path.join(__dirname, 'db_helper.py');
    const seedOutput = execSync(`"${pythonExec}" "${helperPath}" seed`, { encoding: 'utf-8' });
    console.log(`[HARNESS] DB: ${seedOutput.trim()}`);
  } catch (err) {
    console.error(`[FAIL] DB Seeding failed: ${err.message}`);
    failures++;
  }

  // 3. Chat Proxy Verification
  try {
    const chatResult = await fetchPostChat(BRIDGE_CHAT_URL);
    if (chatResult.status === 200 && chatResult.body.response.includes('Test mock response from Odysseus!')) {
      console.log(`[PASS] Chat proxy correctly routed through bridge to Odysseus mock LLM: "${chatResult.body.response}"`);
    } else {
      console.error(`[FAIL] Chat proxy returned unexpected body:`, chatResult.body);
      failures++;
    }
  } catch (err) {
    console.error(`[FAIL] Chat proxy request failed: ${err.message}`);
    failures++;
  }

  // 4. Puppeteer UI Verification
  console.log('\n[HARNESS] Launching Puppeteer browser for UI check...');
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    // Block WebGL and inject transition overrides
    await page.evaluateOnNewDocument(() => {
      const originalGetContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type, ...args) {
        if (type === 'webgl' || type === 'webgl2' || type === 'experimental-webgl') {
          return null;
        }
        return originalGetContext.apply(this, [type, ...args]);
      };

      const style = document.createElement('style');
      style.textContent = `
        *, *::before, *::after {
          backdrop-filter: none !important;
          transition: none !important;
          animation: none !important;
        }
      `;
      document.documentElement.appendChild(style);
    });

    await page.goto(`${VITE_URL}/?fallback=true`, { waitUntil: 'load', timeout: 30000 });

    // Click Skip Boot button
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.toUpperCase().includes('SKIP BOOT'));
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 3000));

    // Verify Space Tab
    const spaceTabExists = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.trim() === 'Space');
      return !!btn;
    });
    console.log(spaceTabExists ? '[PASS] UI: Space tab exists' : '[FAIL] UI: Space tab not found');
    if (!spaceTabExists) failures++;

    // Open Settings
    await page.evaluate(() => {
      const btn = document.querySelector('button[title="Open Settings"]');
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 1500));

    // Verify Settings Panel (AI model select element)
    const settingsPanelExists = await page.evaluate(() => {
      return !!document.getElementById('ai-model-select');
    });
    console.log(settingsPanelExists ? '[PASS] UI: Settings Panel loaded' : '[FAIL] UI: Settings Panel select element not found');
    if (!settingsPanelExists) failures++;

    // Verify Telemetry View (Inspect Runtime button)
    const inspectRuntimeExists = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Inspect Runtime'));
      return !!btn;
    });
    console.log(inspectRuntimeExists ? '[PASS] UI: Runtime Telemetry view button exists' : '[FAIL] UI: Telemetry view button not found');
    if (!inspectRuntimeExists) failures++;

  } catch (err) {
    console.error(`[FAIL] Puppeteer check encountered error: ${err.message}`);
    failures++;
  } finally {
    if (browser) await browser.close();
  }

  // 5. Cleanup database
  console.log('\n[HARNESS] Cleaning up database...');
  try {
    const pythonExec = path.join(__dirname, '..', '..', 'odysseus', 'venv', 'Scripts', 'python.exe');
    const helperPath = path.join(__dirname, 'db_helper.py');
    const cleanupOutput = execSync(`"${pythonExec}" "${helperPath}" cleanup`, { encoding: 'utf-8' });
    console.log(`[HARNESS] DB: ${cleanupOutput.trim()}`);
  } catch (err) {
    console.error(`[FAIL] DB cleanup failed: ${err.message}`);
  }

  // Stop mock LLM
  if (mockServer) {
    mockServer.close();
  }

  console.log(`\n=== Verification Complete: ${failures} errors found ===`);
  process.exit(failures > 0 ? 1 : 0);
}

startMockLLM().then(() => runTests());
```

---

## 5. Verification Method

To independently verify:
1. Ensure the services are running by starting `launch.js`:
   `node launch.js`
2. Run the manual health check script to verify services are active:
   `python .agents/teamwork_preview_explorer_milestone1/verify_local_services.py`
3. Execute the database checking script to confirm no model endpoints are currently in the database:
   `python .agents/teamwork_preview_explorer_milestone1/check_db.py`
4. Once the implementer puts the two scripts into place under `scripts/verification_harness/`, run the verification harness command:
   `node scripts/verification_harness/verify_system.cjs`
   It should return a successful health test output with `0 errors found`.
