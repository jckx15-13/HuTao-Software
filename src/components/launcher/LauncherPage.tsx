import { useEffect, useState } from 'react';
import { useUIStore } from '@/store/uiStore';
import { Hexagon, Terminal, ChevronDown, ChevronUp, Cpu, Wifi, Battery, Database, ArrowRight, AlertTriangle } from 'lucide-react';
import { bridgeUrl, getBridgeBaseUrl } from '@/lib/bridgeConfig';

export function LauncherPage() {
  const setLauncherDismissed = useUIStore((s) => s.setLauncherDismissed);
  const aiModel = useUIStore((s) => s.aiModel);
  const diagnostics = useUIStore((s) => s.diagnostics);
  const addDiagnostic = useUIStore((s) => s.addDiagnostic);
  const clearDiagnostics = useUIStore((s) => s.clearDiagnostics);
  const engineUrlOverride = useUIStore((s) => s.engineUrlOverride);
  const bridgeBaseUrl = getBridgeBaseUrl();

  const [bridgeStatus, setBridgeStatus] = useState<'checking' | 'active' | 'offline'>('checking');
  const [gitStatus, setGitStatus] = useState<{ has_changes: boolean, count: number }>({ has_changes: false, count: 0 });
  const [logsExpanded, setLogsExpanded] = useState(false);

  // Initialize diagnostics logs and check bridge health
  useEffect(() => {
    clearDiagnostics();
    addDiagnostic({ source: 'BOOT', level: 'info', message: 'SILVER WOLF ENGINE INITIALISING...' });
    addDiagnostic({ source: 'STORE', level: 'success', message: 'State hydration complete.' });
    addDiagnostic({ source: 'THEME', level: 'success', message: 'Visual profile themes and dynamic theme engine initialised.' });
    addDiagnostic({ source: '3D-MAP', level: 'info', message: 'Cesium map engine bound to canvas background.' });
    addDiagnostic({ source: 'BRIDGE', level: 'info', message: `Pinging Assistant Bridge at ${bridgeBaseUrl}...` });

    let active = true;

    async function checkGit() {
      try {
        const response = await fetch(bridgeUrl('/git/status'));
        const data = await response.json();
        if (data.has_changes && active) {
          setGitStatus({ has_changes: true, count: data.change_count });
          addDiagnostic({ source: 'GIT', level: 'warning', message: `Found ${data.change_count} uncommitted local changes.` });
        }
      } catch (e) {}
    }

    async function checkBridge() {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);

        // Simple ping to bridge health or root
        const response = await fetch(bridgeUrl('/chat'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: 'ping_test_diagnostics' }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!active) return;

        if (response.ok || response.status === 422 || response.status === 400) {
          setBridgeStatus('active');
          addDiagnostic({ source: 'BRIDGE', level: 'success', message: `Assistant Bridge verified active at ${bridgeBaseUrl}.` });
          checkGit();
        } else {
          setBridgeStatus('offline');
          addDiagnostic({ source: 'BRIDGE', level: 'warning', message: `Bridge returned status ${response.status}.` });
        }
      } catch (err) {
        if (!active) return;
        setBridgeStatus('offline');
        addDiagnostic({ source: 'BRIDGE', level: 'error', message: `Connection to ${bridgeBaseUrl} failed. Bridge offline or not reachable.` });
      }
    }

    checkBridge();

    return () => {
      active = false;
    };
  }, [addDiagnostic, bridgeBaseUrl, clearDiagnostics, engineUrlOverride]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6 bg-[#0a0b10] text-white">
      {/* Background scanline effect */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_4px,6px_100%] pointer-events-none" />

      <div className="w-full max-w-[620px] space-y-8 flex flex-col items-center z-10">

        {/* Animated Brand Header */}
        <div className="flex flex-col items-center text-center space-y-3 animate-pulse">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/30 shadow-[0_0_20px_var(--theme-primary-glow)]">
            <Hexagon className="h-8 w-8 text-primary animate-spin-slow" />
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-black tracking-[0.4em] uppercase text-white font-sans glow-text cyber-glitch" data-text="SILVER WOLF VI">
              SILVER WOLF VI
            </h1>
            <p className="text-[9px] font-mono uppercase tracking-[0.25em] text-white/40">
              Chat, Map, and Astronomy Workspace
            </p>
          </div>
        </div>

        {/* Git Status Warning */}
        {gitStatus.has_changes && (
          <div className="w-full p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
              <AlertTriangle className="text-amber-500 h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Uncommitted Edits Detected</div>
              <div className="text-[9px] text-amber-500/60 font-mono leading-tight mt-0.5">
                {gitStatus.count} files have pending changes. Please ensure work is committed before launching production cycles to prevent data loss or sync drift.
              </div>
            </div>
          </div>
        )}

        {/* Core Launch Action CTA */}
        <button
          type="button"
          onClick={() => setLauncherDismissed(true)}
          className="launcher-breathe group relative flex h-14 w-64 items-center justify-center rounded-xl bg-primary text-xs font-mono font-bold uppercase tracking-[0.2em] hover:bg-primary-hover active:scale-95 transition-all cursor-pointer shadow-lg hover-glitch"
          data-text="Launch Workspace"
        >
          <span className="flex items-center gap-2">
            Launch Workspace
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </span>
        </button>

        {/* 2x2 Diagnostics Metrics Grid */}
        <div className="grid grid-cols-2 gap-3 w-full font-mono text-[10px]">
          {/* Tile 1: Vite */}
          <div className="glass-panel p-3 border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-white/30" />
              <div className="flex flex-col">
                <span className="text-white/40 uppercase text-[8px]">Web Runtime</span>
                <span className="text-white/80 font-bold">Vite Server</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-green-500 uppercase font-bold text-[8px]">ACTIVE</span>
            </div>
          </div>

          {/* Tile 2: Assistant Bridge */}
          <div className="glass-panel p-3 border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wifi className="h-4 w-4 text-white/30" />
              <div className="flex flex-col">
                <span className="text-white/40 uppercase text-[8px]">Assistant Bridge</span>
                <span className="text-white/80 font-bold truncate max-w-[120px]">{bridgeBaseUrl.replace(/^https?:\/\//, '')}</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <div className={`h-2 w-2 rounded-full ${
                bridgeStatus === 'active' ? 'bg-green-500' : bridgeStatus === 'checking' ? 'bg-yellow-500 animate-ping' : 'bg-red-500'
              }`} />
              <span className={`uppercase font-bold text-[8px] ${
                bridgeStatus === 'active' ? 'text-green-500' : bridgeStatus === 'checking' ? 'text-yellow-500' : 'text-red-500'
              }`}>
                {bridgeStatus === 'active' ? 'ONLINE' : bridgeStatus === 'checking' ? 'SYNCING' : 'OFFLINE'}
              </span>
            </div>
          </div>

          {/* Tile 3: AI Model */}
          <div className="glass-panel p-3 border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Battery className="h-4 w-4 text-white/30" />
              <div className="flex flex-col">
                <span className="text-white/40 uppercase text-[8px]">AI Route</span>
                <span className="text-white/80 font-bold truncate max-w-[120px]">{aiModel}</span>
              </div>
            </div>
            <span className="text-white/30 uppercase text-[8px]">READY</span>
          </div>

          {/* Tile 4: Local Storage */}
          <div className="glass-panel p-3 border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-white/30" />
              <div className="flex flex-col">
                <span className="text-white/40 uppercase text-[8px]">Zustand Engine</span>
                <span className="text-white/80 font-bold">IndexedDB</span>
              </div>
            </div>
            <span className="text-green-500 font-bold uppercase text-[8px]">LOCAL</span>
          </div>
        </div>

        {/* Collapsible Diagnostics Logs Terminal */}
        <div className="w-full space-y-1">
          <button
            type="button"
            onClick={() => setLogsExpanded(!logsExpanded)}
            className="flex min-h-11 w-full items-center justify-between rounded-lg border border-white/5 bg-white/5 px-3 py-2 font-mono text-[9px] font-bold uppercase tracking-widest text-white/40 transition-colors hover:text-white/80 cursor-pointer"
            aria-expanded={logsExpanded}
          >
            <div className="flex items-center gap-2">
              <Terminal className="h-3.5 w-3.5" />
              <span>Diagnostic Output Terminal</span>
            </div>
            {logsExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>

          {logsExpanded && (
            <div className="glass-panel p-4 font-mono text-[9px] h-32 overflow-y-auto space-y-1.5 border border-white/5 text-left scroller rounded-xl">
              {diagnostics.map((log) => (
                <div key={log.id} className="flex gap-2">
                  <span className="text-white/20">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                  <span className={`font-bold ${
                    log.level === 'success' ? 'text-green-400' : log.level === 'warning' ? 'text-yellow-400' : log.level === 'error' ? 'text-red-400' : 'text-primary'
                  }`}>[{log.source}]</span>
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
          className="absolute bottom-6 right-6 flex min-h-11 items-center rounded px-3 font-mono text-[9px] tracking-wider text-white/25 transition-colors hover:bg-white/5 hover:text-white/50 cursor-pointer"
        >
          SKIP BOOT INTERFACE →
        </button>

      </div>
    </div>
  );
}
