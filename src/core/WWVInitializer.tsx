import { useEffect, useState } from 'react';
import { injectHostGlobals } from './plugins/hostGlobals';
import { pluginManager } from './plugins/PluginManager';

export function WWVInitializer({ children }: { children: React.ReactNode }) {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    async function init() {
      // 1. Inject globals for plugins (React, SDK, Cesium, Zustand)
      await injectHostGlobals();
      // 2. Initialize the plugin manager (DataBus pub/sub, IndexDB caches)
      await pluginManager.init();
      
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

  return <>{children}</>;
}
