import React from 'react';
import { useDiagnosticsStore } from '@/store/diagnosticsStore';

function LevelBadge({ level }: { level: string }) {
  const color = level === 'error' ? 'bg-red-600' : level === 'warning' ? 'bg-amber-500' : level === 'info' ? 'bg-blue-500' : 'bg-gray-500';
  return <span className={`px-2 py-0.5 rounded text-[11px] font-mono ${color} text-white`}>{level.toUpperCase()}</span>;
}

export default function DiagnosticPanel() {
  const entries = useDiagnosticsStore((s) => s.entries);
  const clear = useDiagnosticsStore((s) => s.clear);
  const exp = useDiagnosticsStore((s) => s.export);

  return (
    <div className="fixed right-4 top-16 z-50 w-[560px] max-h-[80vh] overflow-auto glass-panel border border-white/5 p-3 text-white pointer-events-auto">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-mono font-bold">Diagnostics</div>
        <div className="flex items-center gap-2">
          <button onClick={() => { navigator.clipboard?.writeText(exp()); }} className="px-2 py-1 rounded bg-white/5">Copy JSON</button>
          <button onClick={() => clear()} className="px-2 py-1 rounded bg-amber-700/10">Clear</button>
        </div>
      </div>

      {entries.length === 0 && <div className="text-[12px] text-white/40">No diagnostics recorded.</div>}

      <div className="space-y-2">
        {entries.map((e) => (
          <div key={e.id} className="border border-white/5 rounded p-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <LevelBadge level={e.level} />
                <div className="font-mono text-[12px] font-bold">{e.message}</div>
              </div>
              <div className="text-[11px] text-white/40">{new Date(e.timestamp).toLocaleString()}</div>
            </div>
            {e.suggestion && (
              <div className="mt-1 text-[12px] text-amber-200">Suggested: {e.suggestion}</div>
            )}
            {e.stack && (
              <pre className="mt-2 text-[11px] text-white/60 whitespace-pre-wrap max-h-40 overflow-auto">{e.stack}</pre>
            )}
            {e.metadata?.snapshot && (
              <details className="mt-2 text-[11px] text-white/50">
                <summary>Context snapshot</summary>
                <pre className="mt-2 max-h-40 overflow-auto">{JSON.stringify(e.metadata.snapshot, null, 2)}</pre>
              </details>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
