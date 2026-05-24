import { ChangeEvent, useState } from 'react';
import { ImageIcon, Loader2, Check } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { palettes, type PaletteKey } from '../../lib/themeEngine';
import { extractThemeFromImage } from '../../lib/imageTheme';
import { SettingsSection } from './SettingsSection';

export function ThemeSettings() {
  const activePalette = useUIStore((state) => state.activePalette);
  const updateSettings = useUIStore((state) => state.updateSettings);
  const [loading, setLoading] = useState(false);

  const onUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    const url = URL.createObjectURL(file);
    updateSettings({ customWallpaper: url });
    try {
      const theme = await extractThemeFromImage(url);
      updateSettings({ dynamicTheme: theme });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SettingsSection title="Appearance">
      <div className="grid grid-cols-2 gap-3 mb-4">
        {(Object.keys(palettes) as PaletteKey[]).map(pk => (
          <button 
            key={pk} 
            onClick={() => updateSettings({ activePalette: pk })} 
            className={`flex items-center justify-between px-4 py-3 rounded-xl border text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${
              activePalette === pk 
                ? 'border-primary bg-primary/10 text-primary shadow-[0_0_15px_var(--primary-glow)]'
                : 'border-white/5 bg-white/5 text-white/40 hover:border-white/20 hover:text-white/60'
            }`}
          >
            {pk} 
            {activePalette === pk && <Check size={12} strokeWidth={3} />}
          </button>
        ))}
      </div>
      <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3 text-white/40">
          {loading ? <Loader2 className="animate-spin text-primary" size={16} /> : <ImageIcon size={16} />}
          <span className="text-[10px] font-black uppercase tracking-[0.1em]">Atmosphere</span>
        </div>
        <label className="text-[10px] font-black px-4 py-2 bg-white/10 border border-white/10 rounded-lg uppercase cursor-pointer hover:bg-white/20 transition-all active:scale-95">
          Source
          <input type="file" hidden onChange={onUpload} />
        </label>
      </div>
    </SettingsSection>
  );
}
