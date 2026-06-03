import React from 'react';
import { pluginManager } from '@/core/plugins/PluginManager';
import { Settings, Puzzle, AlertCircle } from 'lucide-react';

export default function PluginSettingsList() {
  const plugins = pluginManager.getAllPlugins();
  const pluginsWithSettings = plugins.filter(p => p.plugin.getSettingsComponent);

  if (pluginsWithSettings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 border border-dashed border-white/10 rounded-xl bg-white/5 text-center">
        <Puzzle className="h-8 w-8 text-white/20 mb-3" />
        <p className="text-xs text-text-muted">No active plugins require custom configuration.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {pluginsWithSettings.map(({ plugin, enabled }) => {
        const SettingsComponent = plugin.getSettingsComponent!();
        const IconComponent = typeof plugin.icon !== 'string' ? plugin.icon as React.ComponentType<any> : null;
        
        return (
          <div key={plugin.id} className={`p-4 rounded-xl border transition-all ${
            enabled ? 'border-primary/20 bg-primary/5' : 'border-white/5 bg-black/20 opacity-60'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/5">
                  {typeof plugin.icon === 'string' ? (
                    <img src={plugin.icon} className="w-5 h-5" alt="" />
                  ) : (
                    IconComponent && <IconComponent size={20} className="text-primary" />
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white/90">{plugin.name}</h4>
                  <p className="text-[10px] text-white/40 uppercase tracking-wider">{plugin.id} v{plugin.version}</p>
                </div>
              </div>
              {!enabled && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[9px] font-bold">
                  <AlertCircle size={10} />
                  DISABLED
                </div>
              )}
            </div>
            
            <div className="pl-12">
              <SettingsComponent pluginId={plugin.id} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
