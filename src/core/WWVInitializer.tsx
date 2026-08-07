import { useEffect, useState } from 'react';
import { injectHostGlobals } from './plugins/hostGlobals';
import { pluginManager } from './plugins/PluginManager';
import { pluginRegistry } from './plugins/PluginRegistry';
import { EarthquakesPlugin } from '../plugins/earthquakes/EarthquakesPlugin';
import { WeatherPlugin } from '../plugins/weather/WeatherPlugin';
import { SatellitesPlugin } from '../plugins/satellites/SatellitesPlugin';
import { EntityDensityPlugin } from '../plugins/hexagons/EntityDensityPlugin';
import { MilitaryBasesPlugin } from '../plugins/military/MilitaryBasesPlugin';
import { WwvAviationPlugin } from '../plugins/aviation/WwvAviationPlugin';
import { WwvPublicCamerasPlugin } from '../plugins/cameras/WwvPublicCamerasPlugin';
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
    let initTimer: ReturnType<typeof setTimeout> | null = null;

    async function init() {
      // 1. Inject globals for plugins (React, SDK, Cesium, Zustand)
      await injectHostGlobals();
      // 2. Initialize the plugin manager (DataBus pub/sub, IndexDB caches)
      await pluginManager.init();

      if (!active) return;

      // Register built-in plugins
      const earthquakes = new EarthquakesPlugin();
      const weather = new WeatherPlugin();
      const satellites = new SatellitesPlugin();
      const entityDensity = new EntityDensityPlugin();
      const militaryBases = new MilitaryBasesPlugin();
      const wwvAviation = new WwvAviationPlugin();
      const wwvPublicCameras = new WwvPublicCamerasPlugin();
      
      await pluginManager.registerPlugin(earthquakes);
      pluginRegistry.register(earthquakes);

      await pluginManager.registerPlugin(weather);
      pluginRegistry.register(weather);
      
      await pluginManager.registerPlugin(satellites);
      pluginRegistry.register(satellites);
      
      await pluginManager.registerPlugin(entityDensity);
      pluginRegistry.register(entityDensity);

      await pluginManager.registerPlugin(militaryBases);
      pluginRegistry.register(militaryBases);

      await pluginManager.registerPlugin(wwvAviation);
      pluginRegistry.register(wwvAviation);

      await pluginManager.registerPlugin(wwvPublicCameras);
      pluginRegistry.register(wwvPublicCameras);
      
      // Enable all built-in layers before revealing the application shell.
      await Promise.all([
        pluginManager.enablePlugin(earthquakes.id),
        pluginManager.enablePlugin(weather.id),
        pluginManager.enablePlugin(satellites.id),
        pluginManager.enablePlugin(entityDensity.id),
        pluginManager.enablePlugin(militaryBases.id),
        pluginManager.enablePlugin(wwvAviation.id),
        pluginManager.enablePlugin(wwvPublicCameras.id)
      ]);
      
      // 3. Start Background Ingestion Services
      satelliteService.start();
      weatherService.start();
      
      if (!active) return;
      // Setup complete
      setInitialized(true);
    }
    initTimer = setTimeout(init, 0);
    
    return () => {
      active = false;
      if (initTimer) {
        clearTimeout(initTimer);
      }
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
      <>
        <DataBusSubscriber />
        <div className="absolute inset-0 bg-black flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-primary animate-pulse">
              Initializing Core Data Engine...
            </span>
          </div>
        </div>
      </>
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
