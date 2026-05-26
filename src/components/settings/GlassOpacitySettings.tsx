import { useUIStore } from '@/store/uiStore';

export default function GlassOpacitySettings() {
  const panelOpacity = useUIStore((s) => s.personalisation.panelOpacity);
  const updatePersonalisation = useUIStore((s) => s.updatePersonalisation);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) / 100;
    updatePersonalisation({ panelOpacity: value });
  };

  return (
    <div className="glass-panel p-4 border border-white/5 space-y-4 rounded-xl">
      <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
        Translucency
      </h3>
      <div className="space-y-2">
        <label className="text-[10px] font-mono uppercase text-white/40 block">
          Glass Panel Opacity ({Math.round(panelOpacity * 100)}%)
        </label>
        <input
          type="range"
          min={10}
          max={100}
          value={panelOpacity * 100}
          onChange={handleChange}
          className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
        />
      </div>
    </div>
  );
}
