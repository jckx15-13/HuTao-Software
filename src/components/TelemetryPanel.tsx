import React, { useState, useEffect } from 'react';
import { dataBus } from '../core/data/DataBus';
import { Activity, Clock, Database, Trash2, Terminal } from 'lucide-react';

export function TelemetryPanel() {
  const [events, setEvents] = useState(dataBus.history);

  useEffect(() => {
    // Poll for history updates as DataBus doesn't have a history listener yet
    const interval = setInterval(() => {
      setEvents([...dataBus.history]);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const clearHistory = () => {
    dataBus.history = [];
    setEvents([]);
  };

  return (
    <div className="flex flex-col h-full font-mono text-[10px]">
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-wider">
          <Activity size={14} />
          <span>DataBus Telemetry</span>
        </div>
        <button
          onClick={clearHistory}
          className="inline-flex min-h-11 min-w-11 items-center justify-center p-2 rounded bg-white/5 hover:bg-red-500/20 text-white/50 hover:text-red-400 transition-colors"
          title="Clear History"
          aria-label="Clear telemetry history"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 scroller pr-1">
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-white/20">
            <Terminal size={32} className="mb-2 opacity-10" />
            <span>NO TELEMETRY EVENTS</span>
          </div>
        ) : (
          events.map((event, idx) => (
            <div key={`${event.timestamp}-${idx}`} className="p-2 rounded border border-white/5 bg-black/15">
              <div className="flex items-center justify-between mb-1.5 opacity-60">
                <div className="flex items-center gap-1.5">
                  <Clock size={10} className="text-primary" />
                  <span className="tabular-nums">{new Date(event.timestamp).toLocaleTimeString()}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Database size={10} />
                  <span className="uppercase tracking-tighter font-bold">{event.event}</span>
                </div>
              </div>
              <div className="p-1.5 rounded bg-black/40 text-[9px] text-white/70 overflow-x-auto scroller">
                <pre>{JSON.stringify(event.data, null, 2)}</pre>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
