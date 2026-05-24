import { useEffect, useState } from 'react';
import { injectHostGlobals } from './plugins/hostGlobals';
import { pluginManager } from './plugins/PluginManager';
import { pluginRegistry } from './plugins/PluginRegistry';
import { IssPlugin } from '../plugins/iss/IssPlugin';
import { EarthquakesPlugin } from '../plugins/earthquakes/EarthquakesPlugin';
import { DataBusSubscriber } from '../components/layout/DataBusSubscriber';

export function WWVInitializer({ children }: { children: React.ReactNode }) {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    async function init() {
      // 1. Inject globals for plugins (React, SDK, Cesium, Zustand)
      await injectHostGlobals();
      // 2. Initialize the plugin manager (DataBus pub/sub, IndexDB caches)
      await pluginManager.init();

      // Register built-in plugins
      const iss = new IssPlugin();
      const earthquakes = new EarthquakesPlugin();
      
      await pluginManager.registerPlugin(iss);
      pluginRegistry.register(iss);
      
      await pluginManager.registerPlugin(earthquakes);
      pluginRegistry.register(earthquakes);
      
      // Setup complete
      setInitialized(true);
    }
    init();
    
    return () => {
      pluginManager.destroy();
    };
  }, []);

  if (!initialized) {
    return (
      <div className="absolute inset-0 bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-primary animate-pulse">
            Initializing Core Data Engine...
          </span>
        </div>
      </div>
    );
  }

  return (
    <>
      <DataBusSubscriber />
      {children}
    </>
  );
}
