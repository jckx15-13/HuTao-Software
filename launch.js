import { spawn, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logFile = path.join(__dirname, 'launcher.log');

// Clear previous logs
fs.writeFileSync(logFile, `=============================================================\n  SILVER WOLF VI - LAUNCHER STARTED\n  Timestamp: ${new Date().toISOString()}\n=============================================================\n`);

function log(source, level, message) {
  const timestamp = new Date().toISOString();
  const cleanMsg = `[${timestamp}] [${level}] [${source}] ${message}`;

  // Print to console with cyberpunk colors
  let color = '\x1b[0m';
  if (level === 'SUCCESS') color = '\x1b[32m'; // green
  if (level === 'WARNING') color = '\x1b[33m'; // yellow
  if (level === 'ERROR') color = '\x1b[31m';   // red
  if (level === 'INFO') color = '\x1b[36m';    // cyan

  console.log(`${color}[${source}] ${message}\x1b[0m`);

  // Write to log file
  fs.appendFileSync(logFile, cleanMsg + '\n');
}

// Kill processes holding a specific port on Windows
function clearPort(port) {
  try {
    log('Engine', 'INFO', `Checking port ${port}...`);
    const output = execSync('netstat -ano -p tcp', { encoding: 'utf8' });
    const lines = output.split('\n');
    const pids = new Set();

    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 5) {
        const proto = parts[0];
        const localAddress = parts[1];
        const state = parts[3];
        const pid = parts[4];

        if (proto === 'TCP' && state === 'LISTENING' && localAddress.endsWith(`:${port}`)) {
          if (parseInt(pid) > 0) {
            pids.add(pid);
          }
        }
      }
    }

    for (const pid of pids) {
      log('Engine', 'WARNING', `Port ${port} in use by PID ${pid}. Terminating process...`);
      try {
        execSync(`taskkill /F /PID ${pid} /T`);
        log('Engine', 'SUCCESS', `PID ${pid} terminated.`);
      } catch (err) {
        log('Engine', 'ERROR', `Failed to terminate PID ${pid}: ${err.message}`);
      }
    }
  } catch (err) {
    log('Engine', 'ERROR', `clearPort failed: ${err.message}`);
  }
}

// Start launcher pipeline
async function main() {
  log('Engine', 'INFO', 'Starting Silver Wolf VI Environment Setup...');

  // 1. Clear ports 8001, 3000, and 7000 to prevent port collisions
  clearPort(8001);
  clearPort(3000);
  clearPort(7000);

  // Wait for ports to be fully released by the OS
  log('Engine', 'INFO', 'Waiting 3 seconds for ports to be fully released by OS...');
  await new Promise(r => setTimeout(r, 3000));

  // 2. Start Assistant Bridge
  log('Bridge', 'INFO', 'Starting Assistant Bridge FastAPI server (python)...');
  const bridgeProcess = spawn('python', ['./bridge/server.py'], {
    cwd: __dirname,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, PYTHONUNBUFFERED: '1' }
  });

  bridgeProcess.stdout.on('data', (data) => {
    const text = data.toString().trim();
    if (text) log('Bridge', 'INFO', text);
  });

  bridgeProcess.stderr.on('data', (data) => {
    const text = data.toString().trim();
    if (text && !text.includes('DeprecationWarning')) {
      // Uvicorn logs INFO messages to stderr by default
      if (text.includes('INFO:')) {
        log('Bridge', 'INFO', text);
      } else {
        log('Bridge Error', 'WARNING', text);
      }
    }
  });

  bridgeProcess.on('error', (err) => {
    log('Bridge', 'ERROR', `Failed to start Python bridge: ${err.message}`);
  });

  // 3. Start Vite Preview Server
  log('Vite', 'INFO', 'Starting Vite frontend production preview server...');
  // Launch Vite in preview mode to serve the compiled production build from dist/.
  // This completely avoids dev client reloads and ensures 100% E2E test stability.
  const viteBin = path.join(__dirname, 'node_modules', 'vite', 'bin', 'vite.js');
  const nodeExec = process.execPath || 'node';
  const viteArgs = [viteBin, 'preview', '--port', '3000', '--host', '127.0.0.1'];
  const viteProcess = spawn(nodeExec, viteArgs, {
    cwd: __dirname,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env }
  });

  viteProcess.stdout.on('data', (data) => {
    const text = data.toString().trim();
      if (text) {
        log('Vite', 'INFO', text);
        if (text.includes('Local:') || text.includes('Local')) {
          const match = text.match(/https?:\/\/[^\s)]+/i);
          if (match) {
            log('Engine', 'SUCCESS', `Frontend is online at ${match[0]}`);
          }
        }
      }
  });

  viteProcess.stderr.on('data', (data) => {
    const text = data.toString().trim();
    if (text) log('Vite Error', 'WARNING', text);
  });

  // 4. Handle Cleanup on Termination
  const cleanup = () => {
    log('Engine', 'INFO', 'Shutting down services...');
    try {
      bridgeProcess.kill();
      viteProcess.kill();
    } catch (e) {}
    log('Engine', 'SUCCESS', 'All services closed. Exiting.');
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  // Keep the launcher process alive indefinitely so background tasks do not get cleaned up
  setInterval(() => {}, 60000);
}

main();
