import React, { useState, useEffect } from 'react';
import { pluginManager } from '@/core/plugins/PluginManager';
import { Bug, Eye, Database, Activity, Shield, RefreshCw, ChevronDown, ChevronRight, Box } from 'lucide-react';
import { dataBus } from '@/core/data/DataBus';
import { useDataBusMulti } from '@/hooks/useDataBus';

export default function PluginInspector() {
  const [plugins, setPlugins] = useState(pluginManager.getAllPlugins());
  const [selectedPluginId, setSelectedPluginId] = useState<string | null>(null);
  const [expandedEntityId, setExpandedEntityId] = useState<string | null>(null);
  const [, setTick] = useState(0);

  // Force re-render periodically to update entity counts
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 2000);
    return () => clearInterval(interval);
  }, []);

  // Listen for plugin changes
  useDataBusMulti({
    pluginRegistered: () => setPlugins(pluginManager.getAllPlugins()),
    pluginUnregistered: () => setPlugins(pluginManager.getAllPlugins()),
    layerToggled: () => setPlugins(pluginManager.getAllPlugins()),
  });

  const selectedPlugin = plugins.find(p => p.plugin.id === selectedPluginId);
  const entities = selectedPluginId ? pluginManager.getEntities(selectedPluginId) : [];

  return (
    <div className="flex flex-col gap-4 font-mono text-[11px]">
      <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-wider mb-2">
        <Database size={14} />
        <span>Plugin Runtime Inspector</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Plugin List */}
        <div className="space-y-2 max-h-[400px] overflow-y-auto scroller pr-2">
          {plugins.map((p) => (
            <div 
              key={p.plugin.id}
              onClick={() => setSelectedPluginId(p.plugin.id)}
              className={`p-3 rounded border cursor-pointer transition-all ${
                selectedPluginId === p.plugin.id 
                  ? 'border-primary bg-primary/10' 
                  : 'border-white/5 bg-black/20 hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${p.enabled ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-white/20'}`} />
                  <span className="font-bold text-white/90">{p.plugin.name}</span>
                </div>
                <span className="text-[9px] text-white/30 uppercase">{p.plugin.version}</span>
              </div>
              <div className="flex items-center justify-between text-[9px] text-white/50 uppercase">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1"><Activity size={10} /> {p.entities.length} Entities</span>
                  <span className="flex items-center gap-1"><Shield size={10} /> {p.plugin.category}</span>
                </div>
                <span>ID: {p.plugin.id}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Entity Inspector */}
        <div className="flex flex-col h-[400px] border border-white/10 rounded bg-black/30 overflow-hidden">
          <div className="p-2 border-b border-white/10 bg-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-white/60">
              <Box size={12} />
              <span>{selectedPluginId ? `${selectedPluginId} Telemetry` : 'Select a plugin'}</span>
            </div>
            {selectedPluginId && (
              <button 
                onClick={() => setTick(t => t + 1)}
                className="p-1 hover:bg-white/10 rounded transition-colors text-white/40"
              >
                <RefreshCw size={12} />
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto scroller p-2 space-y-1">
            {!selectedPluginId ? (
              <div className="h-full flex flex-col items-center justify-center text-white/20 text-center p-4">
                <Bug size={32} className="mb-2 opacity-10" />
                <span>Select a plugin from the left to inspect raw telemetry buffers.</span>
              </div>
            ) : entities.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-white/20 text-center p-4">
                <span>No active entities found for this plugin.</span>
              </div>
            ) : (
              entities.map((entity) => (
                <div key={entity.id} className="border border-white/5 bg-black/20 rounded overflow-hidden">
                  <div 
                    onClick={() => setExpandedEntityId(expandedEntityId === entity.id ? null : entity.id)}
                    className="flex items-center justify-between p-2 cursor-pointer hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      {expandedEntityId === entity.id ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                      <span className="text-white/80 font-bold">{entity.label || entity.id}</span>
                    </div>
                    <span className="text-[9px] text-white/30">
                      {entity.latitude.toFixed(4)}, {entity.longitude.toFixed(4)}
                    </span>
                  </div>
                  
                  {expandedEntityId === entity.id && (
                    <div className="p-2 border-t border-white/5 bg-black/40">
                      <pre className="text-[9px] text-cyan-400/80 overflow-x-auto scroller max-h-[200px]">
                        {JSON.stringify(entity.properties, (key, value) => {
                          if (key === 'rawEntity') return '[Circular/Suppressed]';
                          return value;
                        }, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
