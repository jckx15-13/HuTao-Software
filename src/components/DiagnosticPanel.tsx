import React from 'react';
import { useDiagnosticsStore } from '../store/diagnosticsStore';
import { AlertCircle, AlertTriangle, Info, Bug, Trash2, Download, Terminal } from 'lucide-react';

export function DiagnosticPanel() {
  const { entries, clear, export: exportLogs } = useDiagnosticsStore();

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

  return (
    <div className="flex flex-col h-full font-mono text-[10px]">
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-wider">
          <Bug size={14} />
          <span>Diagnostic Engine</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleDownload}
            className="p-1.5 rounded bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors"
            title="Export Logs"
          >
            <Download size={14} />
          </button>
          <button
            onClick={clear}
            className="p-1.5 rounded bg-white/5 hover:bg-red-500/20 text-white/50 hover:text-red-400 transition-colors"
            title="Clear Logs"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 scroller pr-1">
        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-white/20">
            <Terminal size={32} className="mb-2 opacity-10" />
            <span>NO DIAGNOSTIC EVENTS</span>
          </div>
        ) : (
          entries.map((entry) => (
            <div
              key={entry.id}
              className={`p-3 rounded border bg-black/20 ${
                entry.level === 'error' ? 'border-red-500/30' :
                entry.level === 'warning' ? 'border-yellow-500/30' :
                entry.level === 'info' ? 'border-cyan-500/30' : 'border-white/10'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {entry.level === 'error' && <AlertCircle size={14} className="text-red-400" />}
                  {entry.level === 'warning' && <AlertTriangle size={14} className="text-yellow-400" />}
                  {entry.level === 'info' && <Info size={14} className="text-cyan-400" />}
                  {entry.level === 'debug' && <Bug size={14} className="text-purple-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className={`font-bold uppercase tracking-tighter ${
                      entry.level === 'error' ? 'text-red-400' :
                      entry.level === 'warning' ? 'text-yellow-400' :
                      entry.level === 'info' ? 'text-cyan-400' : 'text-purple-400'
                    }`}>
                      {entry.level}
                    </span>
                    <span className="text-white/20 tabular-nums">
                      {new Date(entry.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-white/80 leading-relaxed break-words whitespace-pre-wrap">
                    {entry.message}
                  </div>
                  {entry.suggestion && (
                    <div className="mt-2 p-2 rounded bg-primary/10 border border-primary/20 text-primary-hover">
                      <span className="font-bold mr-1">FIX:</span>
                      {entry.suggestion}
                    </div>
                  )}
                  {entry.metadata && Object.keys(entry.metadata).length > 0 && (
                    <details className="mt-2 group">
                      <summary className="cursor-pointer text-white/30 hover:text-white/50 transition-colors uppercase text-[8px] font-bold tracking-widest outline-none">
                        View Metadata
                      </summary>
                      <pre className="mt-2 p-2 rounded bg-black/40 text-[8px] text-white/50 overflow-x-auto scroller">
                        {JSON.stringify(entry.metadata, null, 2)}
                      </pre>
                    </details>
                  )}
                  {entry.stack && (
                    <details className="mt-1 group">
                      <summary className="cursor-pointer text-white/30 hover:text-white/50 transition-colors uppercase text-[8px] font-bold tracking-widest outline-none">
                        View Stack Trace
                      </summary>
                      <pre className="mt-2 p-2 rounded bg-red-950/20 text-[8px] text-red-400/50 overflow-x-auto scroller">
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
