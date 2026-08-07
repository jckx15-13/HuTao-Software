import { type ChangeEvent, useRef, useState } from 'react';
import { ImageIcon, Loader2, Check, Sparkles, Layout, Type, Palette, Globe, Satellite, Map, ToggleLeft, ToggleRight } from 'lucide-react';
import { useUIStore, type Personalisation } from '@/store/uiStore';
import { useStore } from '@/core/state/store';
import { palettes, type PaletteKey, formatPaletteName } from '../../lib/themeEngine';
import { extractThemeFromImage } from '../../lib/imageTheme';
import { IMAGERY_LAYERS } from '../../core/globe/ImageryProviderFactory';
import CURSOR_DESIGNS from '@/components/layout/cursorDesigns';
import { resolveCursorProfile, validateCursorProfile } from '@/core/cursor';

const STANDARD_PRESET: Personalisation = {
  accentColor: '',
  panelOpacity: 0.88,
  blurIntensity: 10,
  cornerRadius: 20,
  shadowIntensity: 0.45,
  borderStyle: 'glow',
  uiDensity: 'compact',
  chatBubbleStyle: 'glass',
  iconStyle: 'outlined',
  panelTransitionStyle: 'fade',
  fontScale: 1.0,
  fontFamily: 'Outfit',
  animationIntensity: 0.7,
  motionReduced: false,
  minimalMode: false,
};

const MINIMAL_PRESET: Personalisation = {
  accentColor: '',
  panelOpacity: 0.88,
  blurIntensity: 8,
  cornerRadius: 20,
  shadowIntensity: 0.35,
  borderStyle: 'subtle',
  uiDensity: 'compact',
  chatBubbleStyle: 'glass',
  iconStyle: 'outlined',
  panelTransitionStyle: 'slide',
  fontScale: 1.0,
  fontFamily: 'Outfit',
  animationIntensity: 0.2,
  motionReduced: true,
  minimalMode: true,
};

export function PersonalisationSettings() {
  const personalisation = useUIStore((s) => s.personalisation) || STANDARD_PRESET;
  const updatePersonalisation = useUIStore((s) => s.updatePersonalisation);
  const activePalette = useUIStore((s) => s.activePalette);
  const updateSettings = useUIStore((s) => s.updateSettings);
  const scanlineOverlay = useUIStore((s) => s.scanlineOverlay);
  const particleEffects = useUIStore((s) => s.particleEffects);
  const setScanlineOverlay = useUIStore((s) => s.setScanlineOverlay);
  const setParticleEffects = useUIStore((s) => s.setParticleEffects);
  const cameraSensitivity = useUIStore((s) => s.cameraSensitivity ?? 1.0);
  const setCameraSensitivity = useUIStore((s) => s.setCameraSensitivity);
  const setShowBorders = useUIStore((s) => s.setShowBorders);
  const showBorders = useUIStore((s) => s.showBorders);
  
  const [uploadLoading, setUploadLoading] = useState(false);
  const minimalRestoreState = useRef<{
    particleEffects: boolean;
    scanlineOverlay: boolean;
    showBorders: boolean;
  } | null>(null);

  // Background atmosphere extractor
  const onUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadLoading(true);
    const url = URL.createObjectURL(file);
    updateSettings({ customWallpaper: url });
    try {
      const theme = await extractThemeFromImage(url);
      updateSettings({ dynamicTheme: theme });
    } catch (err) {
      console.error('Failed to extract theme:', err);
    } finally {
      setUploadLoading(false);
    }
  };

  const applyMinimalPreset = () => {
    if (!minimalRestoreState.current) {
      minimalRestoreState.current = {
        particleEffects,
        scanlineOverlay,
        showBorders,
      };
    }

    updatePersonalisation({
      ...MINIMAL_PRESET,
      accentColor: personalisation.accentColor,
      fontScale: personalisation.fontScale,
      fontFamily: personalisation.fontFamily,
    });
    setShowBorders(false);
    setParticleEffects(false);
    setScanlineOverlay(false);
  };

  const resetMinimalPreset = () => {
    const restore = minimalRestoreState.current;
    const restoreState = restore ?? {
      particleEffects: true,
      scanlineOverlay: false,
      showBorders: true,
    };

    updatePersonalisation({
      ...STANDARD_PRESET,
      accentColor: personalisation.accentColor,
      fontScale: personalisation.fontScale,
      fontFamily: personalisation.fontFamily,
    });
    setShowBorders(restoreState.showBorders);
    setParticleEffects(restoreState.particleEffects);
    setScanlineOverlay(restoreState.scanlineOverlay);
    minimalRestoreState.current = null;
  };

  return (
    <div className="space-y-6">
      {/* SECTION 1: COLOR SYSTEMS */}
      <div className="glass-panel p-4 border border-white/5 space-y-4 rounded-xl">
        <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
          <Palette className="h-4 w-4" />
          <span>Color & Theme Systems</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Palette Selector */}
          <div className="space-y-2">
            <label htmlFor="visual-profile-palette" className="text-[10px] font-mono uppercase text-white/40 block">Visual Profile Palette</label>
            <div id="visual-profile-palette" className="grid grid-cols-2 gap-2">
              {(Object.keys(palettes) as PaletteKey[]).map((pk) => {
                const isSelected = activePalette === pk;
                const paletteColors = palettes[pk];
                return (
                  <button
                    key={pk}
                    type="button"
                    onClick={() => updateSettings({ activePalette: pk })}
                    className={`flex min-h-11 items-center justify-between px-3 py-2.5 rounded-lg border text-[9px] font-mono uppercase tracking-wider transition-all cursor-pointer ${
                      isSelected
                        ? 'border-primary bg-primary/10 text-primary font-bold'
                        : 'border-white/5 bg-white/5 text-white/50 hover:border-white/10 hover:text-white/80'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full border border-white/10"
                        style={{ backgroundColor: paletteColors['--theme-primary'] }}
                      />
                      <span>{formatPaletteName(pk)}</span>
                    </div>
                    {isSelected && <Check className="h-3.5 w-3.5" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Accent Override */}
          <div className="space-y-2">
            <label htmlFor="accent-color-picker" className="text-[10px] font-mono uppercase text-white/40 block">Accent Color Override</label>
            <div className="flex gap-2">
              <input
                id="accent-color-picker"
                name="accent-color-picker"
                type="color"
                value={personalisation.accentColor || palettes[activePalette]['--theme-primary']}
                onChange={(e) => updatePersonalisation({ accentColor: e.target.value })}
                className="h-11 w-11 rounded-lg bg-white/5 border border-white/10 p-1 cursor-pointer"
              />
              <input
                id="accent-color-text"
                name="accent-color-text"
                type="text"
                value={personalisation.accentColor}
                onChange={(e) => updatePersonalisation({ accentColor: e.target.value })}
                placeholder="Hex override (e.g. #00ffff)"
                className="min-h-11 flex-1 rounded-lg bg-white/5 border border-white/5 px-3 text-xs text-text-main focus:outline-none focus:ring-1 focus:ring-primary/35 font-mono"
              />
              {personalisation.accentColor && (
                <button
                  type="button"
                  onClick={() => updatePersonalisation({ accentColor: '' })}
                  className="min-h-11 px-2.5 py-2 text-[9px] font-mono uppercase rounded bg-white/5 text-white/40 hover:bg-white/10"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Theme Profile Dropdown */}
          <div className="space-y-2 col-span-1 md:col-span-2 mt-2">
            <label htmlFor="theme-profile-select" className="text-[10px] font-mono uppercase text-white/40 block">Theme Profile Dropdown</label>
            <select
              id="theme-profile-select"
              name="theme-profile-select"
              value={activePalette}
              onChange={(e) => updateSettings({ activePalette: e.target.value as PaletteKey })}
              className="min-h-11 w-full bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-xs font-mono text-white/70 focus:outline-none focus:ring-1 focus:ring-primary/35 cursor-pointer"
            >
              <option value="holographic" className="bg-neutral-900">Holographic (Silver Wolf)</option>
              <option value="coreHacker" className="bg-neutral-900">Core Hacker</option>
              <option value="glitchNeon" className="bg-neutral-900">Glitch Neon</option>
              <option value="silverPunk" className="bg-neutral-900">Silver Punk</option>
              <option value="randomFan" className="bg-neutral-900">Random Fan</option>
              <option value="pastelDream" className="bg-neutral-900">Pastel Dream</option>
            </select>
          </div>
        </div>

        {/* Wallpaper Image Upload */}
        <div className="p-3.5 rounded-lg bg-white/5 border border-white/5 flex items-center justify-between mt-2">
          <div className="flex items-center gap-3 text-white/40">
            {uploadLoading ? <Loader2 className="animate-spin text-cyan-400" size={16} /> : <ImageIcon size={16} />}
            <div className="flex flex-col">
              <span className="text-[10px] font-mono uppercase text-white/80">Atmosphere Wallpaper</span>
              <span className="text-[8px] text-white/30 font-mono">sampling colors from image background</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {useUIStore((s) => s.customWallpaper) && (
              <button
                type="button"
                onClick={() => updateSettings({ customWallpaper: null, dynamicTheme: null })}
                className="inline-flex min-h-11 items-center px-3 py-1.5 text-[9px] font-mono border border-white/5 rounded-lg uppercase bg-white/5 text-red-400 hover:bg-red-950/20"
              >
                Clear
              </button>
            )}
            <label className="inline-flex min-h-11 items-center px-3 py-1.5 text-[9px] font-mono bg-primary/20 border border-primary/20 text-primary hover:bg-primary-hover hover:text-white rounded-lg uppercase cursor-pointer transition-all">
              Upload
              <input id="personalisation-wallpaper-upload" name="personalisation-wallpaper-upload" type="file" hidden onChange={onUpload} />
            </label>
          </div>
        </div>
      </div>

      {/* SECTION 2: BLURS, OPACITIES, SHADOWS */}
      <div className="glass-panel p-4 border border-white/5 space-y-4 rounded-xl">
        <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
          <Layout className="h-4 w-4" />
          <span>Layout & Depth Systems</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Panel Opacity */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] font-mono">
              <span className="uppercase text-white/40">Panel Transparency</span>
              <span className="text-primary font-bold">{Math.round(personalisation.panelOpacity * 100)}%</span>
            </div>
            <input
              id="personalisation-panel-transparency"
              name="personalisation-panel-transparency"
              type="range"
              min={92}
              max={98}
              value={personalisation.panelOpacity * 100}
              onChange={(e) => updatePersonalisation({ panelOpacity: parseFloat(e.target.value) / 100 })}
              className="w-full range-hit-target bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>

          {/* Blur Intensity */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] font-mono">
              <span className="uppercase text-white/40">Background Blur</span>
              <span className="text-primary font-bold">{personalisation.blurIntensity}px</span>
            </div>
            <input
              id="personalisation-background-blur"
              name="personalisation-background-blur"
              type="range"
              min={0}
              max={personalisation.minimalMode ? 3 : 10}
              value={personalisation.blurIntensity}
              onChange={(e) => updatePersonalisation({ blurIntensity: parseInt(e.target.value) })}
              className="w-full range-hit-target bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>

          {/* Corner Roundness */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] font-mono">
              <span className="uppercase text-white/40">Corner Roundness</span>
              <span className="text-primary font-bold">{personalisation.cornerRadius}px</span>
            </div>
            <input
              id="personalisation-corner-roundness"
              name="personalisation-corner-roundness"
              type="range"
              min={0}
              max={24}
              value={personalisation.cornerRadius}
              onChange={(e) => updatePersonalisation({ cornerRadius: parseInt(e.target.value) })}
              className="w-full range-hit-target bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>

          {/* Shadow Depth */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] font-mono">
              <span className="uppercase text-white/40">Shadow Intensity</span>
              <span className="text-primary font-bold">{Math.round(personalisation.shadowIntensity * 100)}%</span>
            </div>
            <input
              id="personalisation-shadow-intensity"
              name="personalisation-shadow-intensity"
              type="range"
              min={0}
              max={100}
              value={personalisation.shadowIntensity * 100}
              onChange={(e) => updatePersonalisation({ shadowIntensity: parseFloat(e.target.value) / 100 })}
              className="w-full range-hit-target bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>

          {/* Border Styles */}
          <div className="space-y-2">
            <label htmlFor="border-style-group" className="text-[10px] font-mono uppercase text-white/40 block">Border Style</label>
            <div id="border-style-group" className="flex bg-white/5 p-1 rounded-lg border border-white/5 gap-1 text-[9px] font-mono">
              {['subtle', 'glow', 'solid', 'none'].map((style) => (
                <button
                  key={style}
                  type="button"
                  onClick={() => updatePersonalisation({ borderStyle: style as any })}
                  className={`flex-1 min-h-11 px-2 py-1 rounded transition-colors uppercase cursor-pointer ${
                    personalisation.borderStyle === style ? 'bg-primary text-white font-bold' : 'text-white/40 hover:text-white/70'
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          {/* UI Density */}
          <div className="space-y-2">
            <label htmlFor="ui-spacing-density-group" className="text-[10px] font-mono uppercase text-white/40 block">UI Spacing Density</label>
            <div id="ui-spacing-density-group" className="flex bg-white/5 p-1 rounded-lg border border-white/5 gap-1 text-[9px] font-mono">
              {['compact', 'comfortable', 'spacious'].map((density) => (
                <button
                  key={density}
                  type="button"
                  onClick={() => updatePersonalisation({ uiDensity: density as any })}
                  className={`flex-1 min-h-11 px-2 py-1 rounded transition-colors uppercase cursor-pointer ${
                    personalisation.uiDensity === density ? 'bg-primary text-white font-bold' : 'text-white/40 hover:text-white/70'
                  }`}
                >
                  {density}
                </button>
              ))}
            </div>
          </div>

          {/* Chat Bubble Style */}
          <div className="space-y-2">
            <label htmlFor="chat-bubble-appearance-group" className="text-[10px] font-mono uppercase text-white/40 block">Chat Bubble Appearance</label>
            <div id="chat-bubble-appearance-group" className="flex bg-white/5 p-1 rounded-lg border border-white/5 gap-1 text-[9px] font-mono">
              {['solid', 'minimal'].map((style) => (
                <button
                  key={style}
                  type="button"
                  onClick={() => updatePersonalisation({ chatBubbleStyle: style as any })}
                  className={`flex-1 min-h-11 px-2 py-1 rounded transition-colors uppercase cursor-pointer ${
                    personalisation.chatBubbleStyle === style ? 'bg-primary text-white font-bold' : 'text-white/40 hover:text-white/70'
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          {/* Icon Style */}
          <div className="space-y-2">
            <label htmlFor="system-icon-style-group" className="text-[10px] font-mono uppercase text-white/40 block">System Icon Style</label>
            <div id="system-icon-style-group" className="flex bg-white/5 p-1 rounded-lg border border-white/5 gap-1 text-[9px] font-mono">
              {['outlined', 'filled'].map((style) => (
                <button
                  key={style}
                  type="button"
                  onClick={() => updatePersonalisation({ iconStyle: style as any })}
                  className={`flex-1 min-h-11 px-2 py-1 rounded transition-colors uppercase cursor-pointer ${
                    personalisation.iconStyle === style ? 'bg-primary text-white font-bold' : 'text-white/40 hover:text-white/70'
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          {/* Panel Transition Style */}
          <div className="space-y-2 col-span-1 md:col-span-2">
            <label htmlFor="panel-transition-animation-group" className="text-[10px] font-mono uppercase text-white/40 block">Panel Transition Animation</label>
            <div id="panel-transition-animation-group" className="flex bg-white/5 p-1 rounded-lg border border-white/5 gap-1 text-[9px] font-mono">
              {[
                { key: 'slide', label: 'Slide Out' },
                { key: 'swing-3d', label: 'Swing 3D' },
                { key: 'fade', label: 'Fade Only' },
              ].map((style) => (
                <button
                  key={style.key}
                  type="button"
                  onClick={() => updatePersonalisation({ panelTransitionStyle: style.key as any })}
                  className={`flex-1 min-h-11 px-2 py-1 rounded transition-colors uppercase cursor-pointer ${
                    personalisation.panelTransitionStyle === style.key ? 'bg-primary text-white font-bold' : 'text-white/40 hover:text-white/70'
                  }`}
                >
                  {style.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: TEXT & FONTS */}
      <div className="glass-panel p-4 border border-white/5 space-y-4 rounded-xl">
        <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
          <Type className="h-4 w-4" />
          <span>Text & Typography</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Text size scaling */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] font-mono">
              <span className="uppercase text-white/40">Text Size Scale</span>
              <span className="text-primary font-bold">{Math.round(personalisation.fontScale * 100)}%</span>
            </div>
            <input
              id="personalisation-font-scale"
              name="personalisation-font-scale"
              type="range"
              min={80}
              max={140}
              value={personalisation.fontScale * 100}
              onChange={(e) => updatePersonalisation({ fontScale: parseFloat(e.target.value) / 100 })}
              className="w-full range-hit-target bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>

          {/* Font Family selection */}
          <div className="space-y-2">
            <label htmlFor="personalisation-font-family" className="text-[10px] font-mono uppercase text-white/40 block">Font Family</label>
            <select
              id="personalisation-font-family"
              name="personalisation-font-family"
              value={personalisation.fontFamily}
              onChange={(e) => updatePersonalisation({ fontFamily: e.target.value as any })}
              className="w-full bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-xs font-mono text-white/70 focus:outline-none focus:ring-1 focus:ring-primary/35"
            >
              <option value="Outfit" className="bg-neutral-900">Outfit (Default)</option>
              <option value="Inter" className="bg-neutral-900">Inter (Modern)</option>
              <option value="system-ui" className="bg-neutral-900">System UI</option>
            </select>
          </div>
        </div>
      </div>

      {/* SECTION 4: MOTION & EFFECTS */}
      <div className="glass-panel p-4 border border-white/5 space-y-4 rounded-xl">
        <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
          <Sparkles className="h-4 w-4" />
          <span>Performance & Animation Effects</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Animation speed slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] font-mono">
              <span className="uppercase text-white/40">Animation Speed</span>
              <span className="text-primary font-bold">{Math.round(personalisation.animationIntensity * 100)}%</span>
            </div>
            <input
              id="personalisation-animation-speed"
              name="personalisation-animation-speed"
              type="range"
              min={0}
              max={100}
              value={personalisation.animationIntensity * 100}
              onChange={(e) => updatePersonalisation({ animationIntensity: parseFloat(e.target.value) / 100 })}
              className="w-full range-hit-target bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>

          {/* Camera sensitivity slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] font-mono">
              <span className="uppercase text-white/40">Camera Sensitivity</span>
              <span className="text-primary font-bold">{Math.round(cameraSensitivity * 100)}%</span>
            </div>
            <input
              id="personalisation-camera-sensitivity"
              name="personalisation-camera-sensitivity"
              type="range"
              min={50}
              max={200}
              value={cameraSensitivity * 100}
              onChange={(e) => setCameraSensitivity(parseFloat(e.target.value) / 100)}
              className="w-full range-hit-target bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>

          {/* Motion reduced toggle */}
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/5 border border-white/5">
            <div className="flex flex-col">
              <span className="text-[10px] font-mono uppercase text-white/80 font-bold">Reduce Motion</span>
              <span className="text-[8px] text-white/30 font-mono mt-0.5">Disables animated canvas particles</span>
            </div>
            <input
              id="personalisation-reduce-motion"
              name="personalisation-reduce-motion"
              type="checkbox"
              checked={personalisation.motionReduced}
              onChange={(e) => updatePersonalisation({ motionReduced: e.target.checked })}
              className="h-4 w-4 accent-primary cursor-pointer"
            />
          </div>

          {/* Scanline / CRT overlay toggle */}
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/5 border border-white/5">
            <div className="flex flex-col">
              <span className="text-[10px] font-mono uppercase text-white/80 font-bold">Scanline Overlay</span>
              <span className="text-[8px] text-white/30 font-mono mt-0.5">Enable CRT-style scanline overlay across the workspace</span>
            </div>
            <input
              id="personalisation-scanline-overlay"
              name="personalisation-scanline-overlay"
              type="checkbox"
              checked={scanlineOverlay}
              onChange={(e) => setScanlineOverlay(e.target.checked)}
              className="h-4 w-4 accent-primary cursor-pointer"
            />
          </div>

          <button
            type="button"
            onClick={applyMinimalPreset}
            className="col-span-1 md:col-span-2 inline-flex min-h-11 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 px-3 py-2 text-[9px] font-mono uppercase tracking-wider text-primary hover:bg-primary/15"
          >
            Apply Minimal Performance Preset
          </button>
          <div className="col-span-1 md:col-span-2 flex items-center justify-between rounded-lg bg-white/5 border border-white/10 p-2.5 text-[9px] font-mono">
            <div className="space-y-0.5">
              <div className="text-white/80 uppercase font-bold">Minimal Mode</div>
              <div className="text-white/35">
                {personalisation.minimalMode
                  ? 'Minimal preset is active. Manual edits can still override individual values.'
                  : 'Minimal mode is not enabled.'}
              </div>
            </div>
            <button
              type="button"
              onClick={personalisation.minimalMode ? resetMinimalPreset : applyMinimalPreset}
              className={`inline-flex min-h-11 items-center rounded-lg px-3 py-2 text-[9px] font-mono uppercase tracking-wider transition-colors ${
                personalisation.minimalMode
                  ? 'border border-white/10 bg-white/8 text-white/60 hover:bg-white/15'
                  : 'border border-primary/20 bg-primary/10 text-primary hover:bg-primary/15'
              }`}
            >
              {personalisation.minimalMode ? 'Exit minimal mode' : 'Enable minimal mode'}
            </button>
          </div>
        </div>
      </div>

      {/* SECTION: IMAGERY PROVIDER SELECTOR */}
      <CursorDesignSelector />
      <ImageryProviderSelector />

      {/* SECTION: SATELLITE TRACKER SETTINGS */}
      <SatelliteTrackerSettings />
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   Imagery Provider Selector — card grid for globe imagery layers
   ──────────────────────────────────────────────────────────── */
function CursorDesignSelector() {
  const cursorDesign = useUIStore((s) => s.cursorDesign);
  const setCursorDesign = useUIStore((s) => s.setCursorDesign);
  const personalisation = useUIStore((s) => s.personalisation);
  const particleEffects = useUIStore((s) => s.particleEffects);
  const profile = resolveCursorProfile({
    enabled: true,
    cursorDesign,
    reducedMotion: personalisation.motionReduced,
    appHighLoad: false,
    animationIntensity: personalisation.animationIntensity,
    accentColor: personalisation.accentColor,
    particleEffects,
  });
  const diagnostic = validateCursorProfile(profile);

  return (
    <div className="glass-panel p-4 border border-white/5 space-y-3 rounded-xl">
      <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
        <Map className="h-4 w-4" />
        <span>Cursor & Pointer</span>
      </h3>
      <p className="text-[9px] font-mono text-white/30 uppercase">Choose a pointer design optimized for responsiveness.</p>

      <div className="rounded-lg border border-white/5 bg-white/[0.03] p-3 font-mono">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[10px] uppercase text-white/45">Active Profile</span>
          <span className="text-[10px] font-bold uppercase text-primary">{profile.label}</span>
        </div>
        <div className="mt-1 text-[9px] uppercase text-white/35">{diagnostic.tier}</div>
        <div className="mt-1 text-[9px] leading-relaxed text-white/45">{diagnostic.message}</div>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mt-2">
        {CURSOR_DESIGNS.map((d) => {
          const isSelected = cursorDesign === d.id;
          return (
            <button
              key={d.id}
              type="button"
              onClick={() => setCursorDesign(d.id)}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all cursor-pointer text-[9px] text-white/70 ${
                isSelected ? 'border-primary bg-primary/12 shadow-[0_0_10px_rgba(138,91,199,0.08)]' : 'border-white/5 bg-white/5 hover:border-white/10 hover:bg-white/8'
              }`}
            >
              <div className="w-12 h-12 flex items-center justify-center">{d.preview}</div>
              <span className={`truncate w-full text-[9px] font-mono uppercase ${isSelected ? 'text-primary font-bold' : 'text-white/60'}`}>{d.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ImageryProviderSelector() {
  const imageryProvider = useUIStore((s) => s.imageryProvider);
  const setImageryProvider = useUIStore((s) => s.setImageryProvider);
  const updateMapConfig = useStore((s) => s.updateMapConfig);

  const handleSelect = (layerId: string) => {
    setImageryProvider(layerId);
    // Bridge to the configSlice store so useImageryManager picks it up
    updateMapConfig({ baseLayerId: layerId });
  };

  return (
    <div className="glass-panel p-4 border border-white/5 space-y-4 rounded-xl">
      <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
        <Globe className="h-4 w-4" />
        <span>Globe Imagery Provider</span>
      </h3>
      <p className="text-[9px] font-mono text-white/30 uppercase">
        Select the base imagery layer for the 3D globe rendering engine.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {IMAGERY_LAYERS.map((layer) => {
          const isSelected = (imageryProvider || 'cesium') === layer.id;
          return (
            <button
              key={layer.id}
              type="button"
              onClick={() => handleSelect(layer.id)}
              className={`group relative flex flex-col overflow-hidden rounded-lg border transition-all duration-300 ${
                isSelected
                  ? 'border-primary bg-primary/10 shadow-[0_0_15px_color-mix(in_srgb,var(--theme-primary)_20%,transparent)] scale-[1.02]'
                  : 'border-white/5 bg-white/5 hover:border-white/20 hover:bg-white/10'
              }`}
            >
              {/* Thumbnail Container */}
              <div className="relative h-20 w-full overflow-hidden bg-black/40">
                {layer.thumbnail ? (
                  <img 
                    src={layer.thumbnail} 
                    alt={layer.name}
                    className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-110 ${
                      isSelected ? 'opacity-100' : 'opacity-60 grayscale-[40%]'
                    }`}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-white/10">
                    <Map size={24} />
                  </div>
                )}
                
                {/* Selection Overlay */}
                {isSelected && (
                  <div className="absolute inset-0 bg-primary/20 backdrop-blur-[1px] flex items-center justify-center">
                    <div className="bg-primary rounded-full p-1 shadow-lg">
                      <Check size={14} className="text-white" />
                    </div>
                  </div>
                )}
              </div>

              {/* Label Area */}
              <div className="p-2.5 space-y-0.5">
                <div className={`text-[10px] font-mono font-bold uppercase tracking-wider truncate ${
                  isSelected ? 'text-primary' : 'text-white/70 group-hover:text-white'
                }`}>
                  {layer.name}
                </div>
                <div className="text-[8px] font-mono text-white/30 uppercase leading-tight line-clamp-1">
                  {layer.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   Satellite Tracker Settings — category toggles & trail config
   ──────────────────────────────────────────────────────────── */
function SatelliteTrackerSettings() {
  const satelliteCategories = useUIStore((s) => s.satelliteCategories);
  const toggleSatelliteCategory = useUIStore((s) => s.toggleSatelliteCategory);
  const satelliteSettings = useUIStore((s) => s.satelliteSettings);
  const updateSatelliteSettings = useUIStore((s) => s.updateSatelliteSettings);

  const categories = [
    { key: 'spaceStations', label: 'Space Stations', color: '#00FFF7' },
    { key: 'brightest', label: 'Brightest', color: '#F0ABFC' },
    { key: 'weather', label: 'Weather', color: '#A78BFA' },
    { key: 'gps', label: 'GPS / GNSS', color: '#22C55E' },
    { key: 'earthObs', label: 'Earth Observation', color: '#F97316' },
    { key: 'starlink', label: 'Starlink', color: '#FFFFFF' },
    { key: 'military', label: 'Military', color: '#3B82F6' },
    { key: 'other', label: 'Other', color: '#94A3B8' },
  ];

  return (
    <div className="glass-panel p-4 border border-white/5 space-y-4 rounded-xl">
      <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
        <Satellite className="h-4 w-4" />
        <span>Satellite Tracker Categories</span>
      </h3>
      <p className="text-[9px] font-mono text-white/30 uppercase">
        Toggle visibility of satellite categories on the orbital display.
      </p>

      {/* Category grid */}
      <div className="grid grid-cols-2 gap-2">
        {categories.map(({ key, label, color }) => {
          const isActive = satelliteCategories[key] !== false;
          return (
            <button
              key={key}
              type="button"
              onClick={() => toggleSatelliteCategory(key)}
              className={`flex min-h-11 items-center justify-between px-3 py-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                isActive
                  ? 'border-white/10 bg-white/8'
                  : 'border-white/5 bg-white/3 opacity-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="h-3 w-3 shrink-0 rounded-sm border border-white/15"
                  style={{
                    backgroundColor: isActive ? color : 'transparent',
                    boxShadow: isActive ? `0 0 6px ${color}60` : 'none',
                  }}
                />
                <span className={`text-[9px] font-mono font-bold uppercase tracking-wider ${
                  isActive ? 'text-white/80' : 'text-white/30'
                }`}>
                  {label}
                </span>
              </div>
              <div
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{
                  backgroundColor: isActive ? color : 'transparent',
                  border: `1.5px solid ${isActive ? color : 'rgba(255,255,255,0.15)'}`,
                  boxShadow: isActive ? `0 0 6px ${color}60` : 'none',
                }}
              />
            </button>
          );
        })}
      </div>

      {/* Trail settings */}
      <div className="border-t border-white/5 pt-3 space-y-2">
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/5 border border-white/5">
          <div className="flex flex-col">
            <span className="text-[10px] font-mono uppercase text-white/80 font-bold">Show Selected Trail</span>
            <span className="text-[8px] text-white/30 font-mono mt-0.5">Display orbital path trail for the selected satellite</span>
          </div>
          <button
            type="button"
            onClick={() => updateSatelliteSettings({ showTrails: !satelliteSettings.showTrails })}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded text-white/60 transition-colors hover:bg-white/5 hover:text-white"
            aria-label={`${satelliteSettings.showTrails ? 'Disable' : 'Enable'} selected satellite trail`}
          >
            {satelliteSettings.showTrails ? (
              <ToggleRight className="h-5 w-5 text-primary" />
            ) : (
              <ToggleLeft className="h-5 w-5 text-white/20" />
            )}
          </button>
        </div>

        <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/5 border border-white/5">
          <div className="flex flex-col">
            <span className="text-[10px] font-mono uppercase text-white/80 font-bold">Show All Trails</span>
            <span className="text-[8px] text-white/30 font-mono mt-0.5">Display trails for all visible satellites simultaneously</span>
          </div>
          <button
            type="button"
            onClick={() => updateSatelliteSettings({ showAllTrails: !satelliteSettings.showAllTrails })}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded text-white/60 transition-colors hover:bg-white/5 hover:text-white"
            aria-label={`${satelliteSettings.showAllTrails ? 'Disable' : 'Enable'} all satellite trails`}
          >
            {satelliteSettings.showAllTrails ? (
              <ToggleRight className="h-5 w-5 text-primary" />
            ) : (
              <ToggleLeft className="h-5 w-5 text-white/20" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

