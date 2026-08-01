import { useEffect, useState } from 'react';
import { useUIStore } from '@/store/uiStore';
import {
  Hexagon,
  Terminal,
  ChevronDown,
  ChevronUp,
  Cpu,
  Wifi,
  Battery,
  Database,
  ArrowRight,
  AlertTriangle
} from 'lucide-react';
import { bridgeUrl, getBridgeBaseUrl, isBridgeEnabled } from '@/lib/bridgeConfig';

export function LauncherPage() {
  const setLauncherDismissed = useUIStore((s) => s.setLauncherDismissed);
  const aiModel = useUIStore((s) => s.aiModel);
  const diagnostics = useUIStore((s) => s.diagnostics);
  const addDiagnostic = useUIStore((s) => s.addDiagnostic);
  const clearDiagnostics = useUIStore((s) => s.clearDiagnostics);
  const engineUrlOverride = useUIStore((s) => s.engineUrlOverride);
  const bridgeBaseUrl = getBridgeBaseUrl();

  const [bridgeStatus, setBridgeStatus] = useState<'checking' | 'active' | 'offline'>('checking');
  const [gitStatus, setGitStatus] = useState<{ has_changes: boolean; count: number }>({ has_changes: false, count: 0 });
  const [logsExpanded, setLogsExpanded] = useState(false);

  // Initialize diagnostics logs and check bridge health
  useEffect(() => {
    clearDiagnostics();
    addDiagnostic({ source: 'BOOT', level: 'info', message: 'SILVER WOLF ENGINE INITIALISING...' });
    addDiagnostic({ source: 'STORE', level: 'success', message: 'State hydration complete.' });
    addDiagnostic({
      source: 'THEME',
      level: 'success',
      message: 'Visual profile themes and dynamic theme engine initialised.'
    });
    addDiagnostic({ source: '3D-MAP', level: 'info', message: 'Cesium map engine bound to canvas background.' });

    let active = true;

    // Static demo builds (GitHub Pages) ship without a bridge. Report that as a
    // normal state instead of pinging an endpoint that cannot exist.
    if (!isBridgeEnabled()) {
      addDiagnostic({
        source: 'BRIDGE',
        level: 'info',
        message: 'Static demo mode: Assistant Bridge disabled for this deployment.'
      });
      addDiagnostic({
        source: 'BRIDGE',
        level: 'info',
        message: 'Map, astronomy, and local diagnostic chat remain fully available.'
      });
      setBridgeStatus('offline');
      return () => {
        active = false;
      };
    }

    addDiagnostic({ source: 'BRIDGE', level: 'info', message: `Pinging Assistant Bridge at ${bridgeBaseUrl}...` });

    async function checkGit() {
      try {
        const response = await fetch(bridgeUrl('/git/status'));
        const data = await response.json();
        if (data.has_changes && active) {
          setGitStatus({ has_changes: true, count: data.change_count });
          addDiagnostic({
            source: 'GIT',
            level: 'warning',
            message: `Found ${data.change_count} uncommitted local changes.`
          });
        }
      } catch (e) {}
    }

    async function checkBridge() {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);

        // Simple ping to bridge health endpoint.
        const response = await fetch(bridgeUrl('/status'), {
          method: 'GET',
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!active) return;
        const status = await response.json().catch(() => ({}));

        if (response.ok && status.ready) {
          setBridgeStatus('active');
          addDiagnostic({
            source: 'BRIDGE',
            level: 'success',
            message: `Assistant Bridge verified active at ${bridgeBaseUrl}.`
          });
          checkGit();
        } else {
          setBridgeStatus('offline');
          if (response.ok) {
            addDiagnostic({
              source: 'BRIDGE',
              level: 'warning',
              message: `Bridge is reachable but waiting for odysseus readiness at ${bridgeBaseUrl}.`
            });
          } else {
            addDiagnostic({
              source: 'BRIDGE',
              level: 'warning',
              message: `Bridge returned status ${response.status}.`
            });
          }
        }
      } catch (err) {
        if (!active) return;
        setBridgeStatus('offline');
        addDiagnostic({
          source: 'BRIDGE',
          level: 'error',
          message: `Connection to ${bridgeBaseUrl} failed. Bridge offline or not reachable.`
        });
      }
    }

    checkBridge();

    return () => {
      active = false;
    };
  }, [addDiagnostic, bridgeBaseUrl, clearDiagnostics, engineUrlOverride]);

  return (
    <main
      className="fixed inset-0 z-50 flex min-h-[100dvh] flex-col items-center overflow-y-auto bg-[#0a0b10] px-4 py-8 text-white sm:px-6"
      aria-labelledby="launcher-title"
    >
      {/* Background scanline effect */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_4px,6px_100%] pointer-events-none" />

      <div className="z-10 flex w-full max-w-3xl flex-col items-center gap-5">
        {/* Animated Brand Header */}
        <div className="flex max-w-full flex-col items-center space-y-3 text-center animate-pulse">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/30 shadow-[0_0_20px_var(--theme-primary-glow)]">
            <Hexagon className="h-8 w-8 text-primary animate-spin-slow" />
          </div>
          <div className="max-w-full space-y-1">
            <h1
              id="launcher-title"
              className="max-w-full break-words text-2xl font-black uppercase leading-tight tracking-[0.18em] text-white font-sans glow-text sm:text-3xl sm:tracking-[0.28em]"
            >
              SILVER WOLF VI
            </h1>
            <p className="text-xs font-mono uppercase tracking-[0.16em] text-white/55 sm:tracking-[0.22em]">
              Chat, Map, and Astronomy Workspace
            </p>
          </div>
        </div>

        {/* Git Status Warning */}
        {gitStatus.has_changes && (
          <div className="flex w-full items-start gap-3 rounded-xl border border-amber-500/25 bg-amber-500/10 p-4 animate-in fade-in slide-in-from-top-4 duration-500 sm:items-center sm:gap-4">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
              <AlertTriangle className="text-amber-500 h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                Uncommitted Edits Detected
              </div>
              <div className="mt-1 text-xs text-amber-100/75 font-mono leading-relaxed">
                {gitStatus.count} files have pending changes. Please ensure work is committed before launching
                production cycles to prevent data loss or sync drift.
              </div>
            </div>
          </div>
        )}

        {/* Core Launch Action CTA */}
        <button
          type="button"
          onClick={() => setLauncherDismissed(true)}
          className="launcher-breathe group relative flex min-h-14 w-full max-w-72 items-center justify-center rounded-xl bg-primary px-5 text-xs font-mono font-bold uppercase tracking-[0.16em] hover:bg-primary-hover active:scale-95 transition-all cursor-pointer shadow-lg hover-glitch"
          data-text="Launch Workspace"
        >
          <span className="flex items-center gap-2">
            Launch Workspace
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </span>
        </button>

        {/* 2x2 Diagnostics Metrics Grid */}
        <div className="grid w-full grid-cols-1 gap-3 font-mono text-xs sm:grid-cols-2">
          {/* Tile 1: Vite */}
          <div className="glass-panel flex min-h-16 items-center justify-between gap-3 border border-white/5 p-3">
            <div className="flex min-w-0 items-center gap-2">
              <Cpu className="h-4 w-4 text-white/30" />
              <div className="flex min-w-0 flex-col">
                <span className="text-white/45 uppercase text-[11px] tracking-wider">Web Runtime</span>
                <span className="text-white/85 font-bold">Vite Server</span>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-green-400 uppercase font-bold text-[11px]">Active</span>
            </div>
          </div>

          {/* Tile 2: Assistant Bridge */}
          <div className="glass-panel flex min-h-16 items-center justify-between gap-3 border border-white/5 p-3">
            <div className="flex min-w-0 items-center gap-2">
              <Wifi className="h-4 w-4 text-white/30" />
              <div className="flex min-w-0 flex-col">
                <span className="text-white/45 uppercase text-[11px] tracking-wider">Assistant Bridge</span>
                <span className="max-w-full truncate text-white/85 font-bold">
                  {bridgeBaseUrl.replace(/^https?:\/\//, '')}
                </span>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <div
                className={`h-2 w-2 rounded-full ${
                  bridgeStatus === 'active'
                    ? 'bg-green-500'
                    : bridgeStatus === 'checking'
                      ? 'bg-yellow-500 animate-ping'
                      : 'bg-red-500'
                }`}
              />
              <span
                className={`uppercase font-bold text-[11px] ${
                  bridgeStatus === 'active'
                    ? 'text-green-500'
                    : bridgeStatus === 'checking'
                      ? 'text-yellow-500'
                      : 'text-red-500'
                }`}
              >
                {bridgeStatus === 'active' ? 'ONLINE' : bridgeStatus === 'checking' ? 'SYNCING' : 'OFFLINE'}
              </span>
            </div>
          </div>

          {/* Tile 3: AI Model */}
          <div className="glass-panel flex min-h-16 items-center justify-between gap-3 border border-white/5 p-3">
            <div className="flex min-w-0 items-center gap-2">
              <Battery className="h-4 w-4 text-white/30" />
              <div className="flex min-w-0 flex-col">
                <span className="text-white/45 uppercase text-[11px] tracking-wider">AI Route</span>
                <span className="max-w-full truncate text-white/85 font-bold">{aiModel}</span>
              </div>
            </div>
            <span className="shrink-0 text-white/45 uppercase text-[11px] font-bold">Ready</span>
          </div>

          {/* Tile 4: Local Storage */}
          <div className="glass-panel flex min-h-16 items-center justify-between gap-3 border border-white/5 p-3">
            <div className="flex min-w-0 items-center gap-2">
              <Database className="h-4 w-4 text-white/30" />
              <div className="flex min-w-0 flex-col">
                <span className="text-white/45 uppercase text-[11px] tracking-wider">Zustand Engine</span>
                <span className="text-white/85 font-bold">IndexedDB</span>
              </div>
            </div>
            <span className="shrink-0 text-green-400 font-bold uppercase text-[11px]">Local</span>
          </div>
        </div>

        {/* Collapsible Diagnostics Logs Terminal */}
        <div className="w-full space-y-1">
          <button
            type="button"
            onClick={() => setLogsExpanded(!logsExpanded)}
            className="flex min-h-11 w-full items-center justify-between gap-3 rounded-lg border border-white/5 bg-white/5 px-3 py-2 font-mono text-xs font-bold uppercase tracking-wider text-white/55 transition-colors hover:text-white/85 cursor-pointer"
            aria-expanded={logsExpanded}
          >
            <div className="flex items-center gap-2">
              <Terminal className="h-3.5 w-3.5" />
              <span>Diagnostic Output Terminal</span>
            </div>
            {logsExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>

          {logsExpanded && (
            <div className="glass-panel h-40 space-y-2 overflow-y-auto rounded-xl border border-white/5 p-4 text-left font-mono text-xs scroller">
              {diagnostics.map((log) => (
                <div key={log.id} className="flex flex-wrap gap-x-2 gap-y-1">
                  <span className="text-white/35">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                  <span
                    className={`font-bold ${
                      log.level === 'success'
                        ? 'text-green-400'
                        : log.level === 'warning'
                          ? 'text-yellow-400'
                          : log.level === 'error'
                            ? 'text-red-400'
                            : 'text-primary'
                    }`}
                  >
                    [{log.source}]
                  </span>
                  <span className="text-white/80">{log.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Skip button in corner */}
        <button
          type="button"
          onClick={() => setLauncherDismissed(true)}
          className="relative mt-1 flex min-h-11 items-center rounded px-3 font-mono text-xs tracking-wider text-white/45 transition-colors hover:bg-white/5 hover:text-white/75 cursor-pointer sm:absolute sm:bottom-4 sm:right-4 sm:mt-0"
          aria-label="Skip boot interface"
        >
          Skip boot interface
        </button>
      </div>
    </main>
  );
}
