import React from 'react';
import { useDiagnosticsStore } from '../store/diagnosticsStore';
import { AlertCircle, AlertTriangle, Info, Bug, Trash2, Download, Terminal } from 'lucide-react';

export function DiagnosticPanel() {
  const { entries, clear, export: exportLogs } = useDiagnosticsStore();
  const [filter, setFilter] = React.useState<'all' | 'error' | 'warning' | 'info'>('all');

  const errorsCount = entries.filter((e) => e.level === 'error').length;
  const warningsCount = entries.filter((e) => e.level === 'warning').length;
  const infoCount = entries.filter((e) => e.level === 'info' || e.level === 'debug').length;
  const healthScore = Math.max(0, 100 - (errorsCount * 15) - (warningsCount * 3));

  const handleDownload = () => {
    const data = exportLogs();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `silver-wolf-diagnostics-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredEntries = entries.filter((entry) => {
    if (filter === 'all') return true;
    if (filter === 'info') return entry.level === 'info' || entry.level === 'debug';
    return entry.level === filter;
  });

  return (
    <div className="flex flex-col h-full font-mono text-[10px] select-text">
      {/* Engine Status Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-wider">
          <Bug size={14} className="text-primary animate-pulse" />
          <span>Diagnostic Engine</span>
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={handleDownload}
            className="p-1.5 rounded bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors"
            title="Export Logs"
          >
            <Download size={12} />
          </button>
          <button
            onClick={clear}
            className="p-1.5 rounded bg-white/5 hover:bg-red-500/20 text-white/50 hover:text-red-400 transition-colors"
            title="Clear Logs"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Vitals Summary Card */}
      <div className="glass-panel p-3 border border-white/5 bg-black/25 rounded-xl space-y-2 mb-3">
        <div className="flex justify-between items-center text-[9px] text-white/30 uppercase tracking-widest font-bold">
          <span>System Vitals Score</span>
          <span className={`font-mono font-bold ${
            healthScore > 80 ? 'text-green-400' : healthScore > 50 ? 'text-yellow-400' : 'text-red-400'
          }`}>
            {healthScore}%
          </span>
        </div>
        
        {/* Neon Progress Bar */}
        <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ${
              healthScore > 80 ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' :
              healthScore > 50 ? 'bg-yellow-500 shadow-[0_0_8px_#eab308]' :
              'bg-red-500 shadow-[0_0_8px_#ef4444]'
            }`}
            style={{ width: `${healthScore}%` }}
          />
        </div>

        {/* Diagnostic counters grid */}
        <div className="grid grid-cols-3 gap-1 pt-1.5 text-center text-[8px] font-bold">
          <div className="bg-red-500/10 border border-red-500/20 rounded py-1">
            <span className="text-red-400 block text-[9px]">{errorsCount}</span>
            <span className="text-white/30 uppercase text-[7px]">Errors</span>
          </div>
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded py-1">
            <span className="text-yellow-400 block text-[9px]">{warningsCount}</span>
            <span className="text-white/30 uppercase text-[7px]">Warns</span>
          </div>
          <div className="bg-cyan-500/10 border border-cyan-500/20 rounded py-1">
            <span className="text-cyan-400 block text-[9px]">{infoCount}</span>
            <span className="text-white/30 uppercase text-[7px]">Vitals</span>
          </div>
        </div>
      </div>

      {/* Log Filter Pills */}
      <div className="flex gap-1 bg-black/10 border border-white/5 rounded-lg p-0.5 mb-3">
        {(['all', 'error', 'warning', 'info'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`flex-1 py-1 rounded text-center uppercase text-[8px] font-bold tracking-wider transition-all duration-150 ${
              filter === tab 
                ? 'bg-primary/20 text-primary font-bold shadow' 
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Logs Viewport */}
      <div className="flex-1 overflow-y-auto space-y-2.5 scroller pr-1">
        {filteredEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-white/20">
            <Terminal size={24} className="mb-2 opacity-10" />
            <span className="uppercase text-[8px] tracking-wider">No logged events found</span>
          </div>
        ) : (
          filteredEntries.map((entry) => (
            <div
              key={entry.id}
              className={`p-3 rounded-xl border bg-black/20 ${
                entry.level === 'error' ? 'border-red-500/25 bg-red-950/5' :
                entry.level === 'warning' ? 'border-yellow-500/25 bg-yellow-950/5' :
                entry.level === 'info' ? 'border-cyan-500/25 bg-cyan-950/5' : 'border-white/10'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <div className="mt-0.5 shrink-0">
                  {entry.level === 'error' && <AlertCircle size={13} className="text-red-400 animate-pulse" />}
                  {entry.level === 'warning' && <AlertTriangle size={13} className="text-yellow-400" />}
                  {entry.level === 'info' && <Info size={13} className="text-cyan-400" />}
                  {entry.level === 'debug' && <Bug size={13} className="text-purple-400" />}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1 border-b border-white/5 pb-1">
                    <span className={`font-bold uppercase tracking-wider text-[8px] ${
                      entry.level === 'error' ? 'text-red-400' :
                      entry.level === 'warning' ? 'text-yellow-400' :
                      entry.level === 'info' ? 'text-cyan-400' : 'text-purple-400'
                    }`}>
                      {entry.level}
                    </span>
                    <span className="text-white/20 text-[8px] tabular-nums">
                      {new Date(entry.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  <div className="text-white/80 leading-relaxed break-words whitespace-pre-wrap text-[9px] mb-1">
                    {entry.message}
                  </div>

                  {entry.suggestion && (
                    <div className="mt-2 p-2 rounded bg-primary/10 border border-primary/20 text-primary-hover text-[8.5px]">
                      <span className="font-bold mr-1 uppercase">Diagnostics Solve:</span>
                      {entry.suggestion}
                    </div>
                  )}

                  {entry.metadata && Object.keys(entry.metadata).length > 0 && (
                    <details className="mt-2 group">
                      <summary className="cursor-pointer text-white/30 hover:text-white/50 transition-colors uppercase text-[7.5px] font-bold tracking-widest outline-none select-none">
                        View Metadata
                      </summary>
                      <pre className="mt-1.5 p-2 rounded bg-black/40 text-[8px] text-white/50 overflow-x-auto scroller font-mono border border-white/5">
                        {JSON.stringify(entry.metadata, null, 2)}
                      </pre>
                    </details>
                  )}

                  {entry.stack && (
                    <details className="mt-1 group">
                      <summary className="cursor-pointer text-white/30 hover:text-white/50 transition-colors uppercase text-[7.5px] font-bold tracking-widest outline-none select-none">
                        View Stack Trace
                      </summary>
                      <pre className="mt-1.5 p-2 rounded bg-red-950/20 text-[8px] text-red-400/50 overflow-x-auto scroller font-mono border border-red-500/10">
                        {entry.stack}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
