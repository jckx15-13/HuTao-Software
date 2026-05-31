import { useEffect, useState } from 'react';
import { injectHostGlobals } from './plugins/hostGlobals';
import { pluginManager } from './plugins/PluginManager';
import { pluginRegistry } from './plugins/PluginRegistry';
import { IssPlugin } from '../plugins/iss/IssPlugin';
import { EarthquakesPlugin } from '../plugins/earthquakes/EarthquakesPlugin';
import { WeatherPlugin } from '../plugins/weather/WeatherPlugin';
import { SatellitesPlugin } from '../plugins/satellites/SatellitesPlugin';
import { EntityDensityPlugin } from '../plugins/hexagons/EntityDensityPlugin';
import { DataBusSubscriber } from '../components/layout/DataBusSubscriber';
import { TimelineSync } from './globe/TimelineSync';
import { satelliteService } from '../services/satelliteService';
import { weatherService } from '../services/weatherService';

let mountCount = 0;

export function WWVInitializer({ children }: { children: React.ReactNode }) {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    mountCount++;
    let active = true;

    async function init() {
      // 1. Inject globals for plugins (React, SDK, Cesium, Zustand)
      await injectHostGlobals();
      // 2. Initialize the plugin manager (DataBus pub/sub, IndexDB caches)
      await pluginManager.init();

      if (!active) return;

      // Register built-in plugins
      const iss = new IssPlugin();
      const earthquakes = new EarthquakesPlugin();
      const weather = new WeatherPlugin();
      const satellites = new SatellitesPlugin();
      const entityDensity = new EntityDensityPlugin();
      
      await pluginManager.registerPlugin(iss);
      pluginRegistry.register(iss);
      
      await pluginManager.registerPlugin(earthquakes);
      pluginRegistry.register(earthquakes);

      await pluginManager.registerPlugin(weather);
      pluginRegistry.register(weather);
      
      await pluginManager.registerPlugin(satellites);
      pluginRegistry.register(satellites);
      
      await pluginManager.registerPlugin(entityDensity);
      pluginRegistry.register(entityDensity);
      
      // Enable them by default
      pluginManager.enablePlugin(iss.id);
      pluginManager.enablePlugin(earthquakes.id);
      pluginManager.enablePlugin(weather.id);
      pluginManager.enablePlugin(satellites.id);
      pluginManager.enablePlugin(entityDensity.id);
      
      // 3. Start Background Ingestion Services
      satelliteService.start();
      weatherService.start();
      
      if (!active) return;
      // Setup complete
      setInitialized(true);
    }
    init();
    
    return () => {
      active = false;
      mountCount--;
      if (mountCount === 0) {
        pluginManager.destroy();
        satelliteService.stop();
        weatherService.stop();
      }
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
      <TimelineSync />
      {children}
    </>
  );
}
