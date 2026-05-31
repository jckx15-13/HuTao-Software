import { useUIStore } from '@/store/uiStore';
import { SettingsSection } from './SettingsSection';
import { Map, Layers, ToggleLeft, ToggleRight, ImageIcon } from 'lucide-react';

export function MapSettings() {
  const imageryProvider = useUIStore((s) => s.imageryProvider);
  const setImageryProvider = useUIStore((s) => s.setImageryProvider);
  
  const showBorders = useUIStore((s) => s.showBorders);
  const setShowBorders = useUIStore((s) => s.setShowBorders);
  
  const showTerrain = useUIStore((s) => s.showTerrain);
  const setShowTerrain = useUIStore((s) => s.setShowTerrain);

  return (
    <div className="space-y-6">
      <SettingsSection title="Map & Imagery Layers">
        <div className="space-y-4">
          
          {/* Imagery Provider Selection */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-3">
            <label className="text-[10px] font-mono uppercase text-white/40 flex items-center gap-2">
              <ImageIcon size={14} className="text-primary" />
              Base Imagery Provider
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'cesium', name: 'Cesium Ion (Default)' },
                { id: 'google-3d', name: 'Google 3D Tiles' },
                { id: 'osm', name: 'OpenStreetMap' },
                { id: 'arcgis-world', name: 'ArcGIS World' }
              ].map(provider => (
                <button
                  key={provider.id}
                  onClick={() => setImageryProvider(provider.id)}
                  className={`flex items-center justify-center p-3 rounded-lg border font-mono text-[9px] uppercase tracking-wider transition-all cursor-pointer ${
                    imageryProvider === provider.id
                      ? 'bg-primary/20 border-primary text-primary shadow-[inset_0_0_12px_rgba(138,91,199,0.2)]'
                      : 'bg-black/30 border-white/5 text-white/40 hover:bg-white/5 hover:text-white/70 hover:border-white/20'
                  }`}
                >
                  {provider.name}
                </button>
              ))}
            </div>
            <p className="text-[8px] text-white/30 font-mono mt-1">
              Select the primary imagery source for the 3D globe. Google 3D Tiles disables standard layers.
            </p>
          </div>

          {/* Borders Toggle */}
          <div 
            onClick={() => setShowBorders(!showBorders)}
            className="flex items-center justify-between px-4 py-3.5 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <Map size={16} className={`transition-colors ${showBorders ? 'text-primary' : 'text-white/20'}`} />
              <div className="flex flex-col">
                <span className={`text-[10px] font-black uppercase tracking-wider transition-colors ${showBorders ? 'text-white/80' : 'text-white/30'}`}>
                  Political Borders
                </span>
                <span className="text-[8px] text-white/30 font-mono mt-0.5">
                  Display national and regional boundary lines on the globe.
                </span>
              </div>
            </div>
            <div>
              {showBorders ? (
                <ToggleRight className="h-6 w-6 text-primary" />
              ) : (
                <ToggleLeft className="h-6 w-6 text-white/20" />
              )}
            </div>
          </div>

          {/* Terrain Toggle */}
          <div 
            onClick={() => setShowTerrain(!showTerrain)}
            className="flex items-center justify-between px-4 py-3.5 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <Layers size={16} className={`transition-colors ${showTerrain ? 'text-primary' : 'text-white/20'}`} />
              <div className="flex flex-col">
                <span className={`text-[10px] font-black uppercase tracking-wider transition-colors ${showTerrain ? 'text-white/80' : 'text-white/30'}`}>
                  3D Terrain
                </span>
                <span className="text-[8px] text-white/30 font-mono mt-0.5">
                  Enable high-resolution elevation models (mountains, valleys).
                </span>
              </div>
            </div>
            <div>
              {showTerrain ? (
                <ToggleRight className="h-6 w-6 text-primary" />
              ) : (
                <ToggleLeft className="h-6 w-6 text-white/20" />
              )}
            </div>
          </div>

        </div>
      </SettingsSection>
    </div>
  );
}
