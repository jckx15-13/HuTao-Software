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
    const output = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' });
    const lines = output.split('\n');
    const pids = new Set();
    
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 5) {
        const pid = parts[parts.length - 1];
        if (parseInt(pid) > 0) {
          pids.add(pid);
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
    // netstat returns exit code 1 if no match found, which is expected if the port is free
  }
}

// Start launcher pipeline
async function main() {
  log('Engine', 'INFO', 'Starting Silver Wolf VI Environment Setup...');

  // 1. Clear ports 8001 and 3000 to prevent port collisions
  clearPort(8001);
  clearPort(3000);

  // 2. Start Assistant Bridge
  log('Bridge', 'INFO', 'Starting Assistant Bridge FastAPI server (python)...');
  const bridgeProcess = spawn('python', ['./bridge/server.py'], {
    cwd: __dirname,
    stdio: ['ignore', 'pipe', 'pipe']
  });

  bridgeProcess.stdout.on('data', (data) => {
    const text = data.toString().trim();
    if (text) log('Bridge', 'INFO', text);
  });

  bridgeProcess.stderr.on('data', (data) => {
    const text = data.toString().trim();
    if (text && !text.includes('DeprecationWarning')) {
      log('Bridge Error', 'WARNING', text);
    }
  });

  bridgeProcess.on('error', (err) => {
    log('Bridge', 'ERROR', `Failed to start Python bridge: ${err.message}`);
  });

  // 3. Start Vite Dev Server
  log('Vite', 'INFO', 'Starting Vite frontend dev server...');
  // Launch Vite by invoking the local node binary on the vite JS entrypoint.
  // This avoids shell wrappers (npm.cmd) and the DeprecationWarning on Windows.
  const viteBin = path.join(__dirname, 'node_modules', 'vite', 'bin', 'vite.js');
  const nodeExec = process.execPath || 'node';
  const viteArgs = [viteBin, '--port', '3000', '--host', '127.0.0.1'];
  const viteProcess = spawn(nodeExec, viteArgs, {
    cwd: __dirname,
    stdio: ['ignore', 'pipe', 'pipe']
  });

  viteProcess.stdout.on('data', (data) => {
    const text = data.toString().trim();
      if (text) {
        log('Vite', 'INFO', text);
        if (text.includes('Local:') || text.includes('Local')) {
          // Attempt to find an http(s) url in the output (covers 127.0.0.1 and localhost)
          const match = text.match(/https?:\/\/[^\s)]+/i);
          if (match) {
            const url = match[0];
            log('Engine', 'SUCCESS', `Frontend is online at ${url}`);
            log('Engine', 'INFO', `Launching default web browser to ${url}...`);
            try {
              // On Windows, `start` is a cmd builtin — use cmd.exe to invoke it safely.
              if (process.platform === 'win32') {
                try {
                  execSync(`cmd.exe /c start "" "${url.replace(/"/g, '\\"')}"`);
                } catch (winErr) {
                  // Fallback: try PowerShell Start-Process
                  try {
                    execSync(`powershell -NoProfile -Command "Start-Process '${url.replace(/'/g, "''")}'"`);
                  } catch (psErr) {
                    log('Engine', 'ERROR', `Could not auto-start browser on Windows: ${psErr.message}`);
                  }
                }
              } else {
                try {
                  execSync(`xdg-open "${url}"`);
                } catch (e) {
                  execSync(`open "${url}"`);
                }
              }
            } catch (e) {
              log('Engine', 'ERROR', `Could not auto-start browser: ${e.message}`);
            }
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
}

main();
