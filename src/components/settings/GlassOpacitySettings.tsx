import { useThemeStore } from '@/store/themeStore';

export default function GlassOpacitySettings() {
  const panelOpacity = useThemeStore((s) => s.personalisation.panelOpacity);
  const updatePersonalisation = useThemeStore((s) => s.updatePersonalisation);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) / 100;
    updatePersonalisation({ panelOpacity: value });
  };

  return (
    <div className="glass-panel p-4 border border-white/5 space-y-4 rounded-lg">
      <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
        Translucency & Readability
      </h3>
      <div className="space-y-2">
        <label
          htmlFor="glass-panel-opacity-slider"
          className="text-[10px] font-mono uppercase text-white/40 block"
        >
          Glass Panel Opacity ({Math.round(panelOpacity * 100)}%) — WCAG AA Guardrail (Min 80%)
        </label>
        <input
          id="glass-panel-opacity-slider"
          name="glass-panel-opacity-slider"
          type="range"
          min={80}
          max={98}
          value={Math.round(panelOpacity * 100)}
          onChange={handleChange}
          className="w-full range-hit-target bg-white/10 rounded-md appearance-none cursor-pointer accent-primary"
        />
      </div>
    </div>
  );
}
