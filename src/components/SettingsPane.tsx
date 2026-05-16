/**
 * MODULE: Settings Pane
 * 
 * PURPOSE:
 * This component orchestrates the UI for the user settings panel. 
 * By extracting individual controls into submodules (e.g., `SettingCard`, `ToggleSetting`), 
 * this file is kept DRY and acts primarily as a composition layer connecting the UI 
 * to the global Zustand store (`useUIStore`).
 * 
 * WHY IS THIS A SEPARATE COMPONENT FROM `SettingsWindow`?
 * `SettingsWindow` is responsible for the physics-based drag interactions, the title bar, 
 * and the glassmorphic shell. `SettingsPane` is purely the scrollable content inside.
 * This Separation of Concerns means we could easily render `SettingsPane` inside a modal
 * or a full-page layout without changing its logic.
 */
import { useState, type ChangeEvent } from 'react';
import { Cpu, Globe, Image as ImageIcon, Loader2, Sparkles, Type, Volume2 } from 'lucide-react';
import { SectionHeader } from './common/SectionHeader';
import { extractThemeFromImage } from '../lib/imageTheme';
import { palettes, type PaletteKey } from '../lib/themeEngine';
import { useUIStore, type AiModel } from '../store/uiStore';

// Import our newly extracted submodules
import { SettingCard } from './settings/SettingCard';
import { ToggleSetting } from './settings/ToggleSetting';
import { PaletteOption } from './settings/PaletteOption';

const modelOptions: Array<{ label: string; value: AiModel }> = [
  { label: 'Gemini 2.5 Flash', value: 'gemini-2.5-flash' },
  { label: 'Gemini 2.5 Pro', value: 'gemini-2.5-pro' },
  { label: 'Gemini 2.0 Flash', value: 'gemini-2.0-flash' },
];

export function SettingsPane() {
  // STORE BINDINGS
  // We extract exactly what we need from the store to prevent over-rendering.
  const customWallpaper = useUIStore((state) => state.customWallpaper);
  const setCustomWallpaper = useUIStore((state) => state.setCustomWallpaper);
  const setDynamicTheme = useUIStore((state) => state.setDynamicTheme);
  const particleEffects = useUIStore((state) => state.particleEffects);
  const setParticleEffects = useUIStore((state) => state.setParticleEffects);
  const audioFeedback = useUIStore((state) => state.audioFeedback);
  const setAudioFeedback = useUIStore((state) => state.setAudioFeedback);
  const terminalFontSize = useUIStore((state) => state.terminalFontSize);
  const setTerminalFontSize = useUIStore((state) => state.setTerminalFontSize);
  const aiModel = useUIStore((state) => state.aiModel);
  const setAiModel = useUIStore((state) => state.setAiModel);
  const systemInstructions = useUIStore((state) => state.systemInstructions);
  const setSystemInstructions = useUIStore((state) => state.setSystemInstructions);
  
  // LOCAL STATE
  // `isExtracting` is true while the async image processing happens.
  const [isExtracting, setIsExtracting] = useState(false);

  /**
   * Cleans up the uploaded wallpaper to prevent memory leaks.
   */
  const clearWallpaper = () => {
    // SYNTAX NOTE: URL.revokeObjectURL
    // Browsers keep `blob:` URLs in memory until the document unloads.
    // We explicitly revoke it here to free up RAM since we no longer need it.
    if (customWallpaper?.startsWith('blob:')) {
      URL.revokeObjectURL(customWallpaper);
    }
    setCustomWallpaper(null);
    setDynamicTheme(null);
  };

  /**
   * Handles user file uploads for wallpaper and theme extraction.
   */
  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (customWallpaper?.startsWith('blob:')) {
      URL.revokeObjectURL(customWallpaper);
    }

    setIsExtracting(true);
    // Create a temporary local URL for the selected file without uploading to a server.
    const url = URL.createObjectURL(file);
    setCustomWallpaper(url);

    try {
      // Analyze the image to build a cohesive UI color palette dynamically.
      setDynamicTheme(await extractThemeFromImage(url));
    } catch (error) {
      console.error('[Silver Wolf VI] Theme extraction failed:', error);
    } finally {
      setIsExtracting(false);
      // Reset the input so the user can upload the same file again if they want to.
      event.target.value = '';
    }
  };

  return (
    <div className="h-full w-full overflow-y-auto bg-transparent">
      <div className="flex max-w-2xl flex-col gap-10 p-5 text-[15px] text-text-main sm:p-8">
        
        {/* APPEARANCE SECTION */}
        <section>
          <SectionHeader title="Appearance" eyebrow="Theme" />
          <div className="relative z-20 mb-5 flex flex-col gap-3">
            {(Object.keys(palettes) as PaletteKey[]).map((paletteKey) => (
              <PaletteOption key={paletteKey} paletteKey={paletteKey} />
            ))}
          </div>

          <div className="flex items-center justify-between gap-4 rounded-lg border border-panel-border/60 bg-panel/55 p-4">
            <div className="flex min-w-0 items-center gap-4">
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-panel-border/60 bg-base/50 ${
                  customWallpaper ? 'bg-cover bg-center' : ''
                }`}
                style={customWallpaper ? { backgroundImage: `url(${customWallpaper})` } : undefined}
              >
                {!customWallpaper && !isExtracting && <ImageIcon className="text-text-muted/40" size={20} />}
                {isExtracting && <Loader2 className="animate-spin text-primary" size={20} />}
              </div>
              <div className="min-w-0">
                <div className="font-mono text-sm tracking-wide text-text-main">Wallpaper</div>
                <div className="mt-1 text-xs text-text-muted">
                  {isExtracting ? 'Extracting matching colors…' : 'Use an image to tint the interface'}
                </div>
              </div>
            </div>

            <label className={`rounded-lg border border-primary/30 px-4 py-2 font-mono text-xs uppercase tracking-widest transition-colors ${
              isExtracting ? 'pointer-events-none opacity-50' : 'cursor-pointer bg-primary/10 text-primary hover:bg-primary/20'
            }`}
            >
              {isExtracting ? 'Reading' : 'Browse'}
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isExtracting} />
            </label>
          </div>
          {customWallpaper && (
            <button
              onClick={clearWallpaper}
              className="mt-3 font-mono text-[10px] uppercase tracking-widest text-danger transition-colors hover:text-danger/80"
            >
              Remove wallpaper
            </button>
          )}
        </section>

        {/* INTERFACE SECTION */}
        <section>
          <SectionHeader title="Interface" eyebrow="Controls" />
          <div className="flex flex-col gap-3">
            <ToggleSetting
              icon={Sparkles}
              title="Motion effects"
              description="Ambient particles and subtle visual movement"
              checked={particleEffects}
              onChange={setParticleEffects}
            />
            <ToggleSetting
              icon={Volume2}
              title="Sound feedback"
              description="Small confirmation sounds on actions"
              checked={audioFeedback}
              onChange={setAudioFeedback}
            />
            <SettingCard icon={Type} title="Chat text size" description="Adjust message and input scale">
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="12"
                  max="24"
                  value={terminalFontSize}
                  onChange={(event) => setTerminalFontSize(Number(event.target.value))}
                  className="w-24 accent-[var(--theme-primary)]"
                />
                <span className="w-6 text-right font-mono text-xs text-primary">{terminalFontSize}</span>
              </div>
            </SettingCard>
          </div>
        </section>

        {/* AI SECTION */}
        <section>
          <SectionHeader title="AI" eyebrow="Agent" />
          <div className="flex flex-col gap-3">
            <SettingCard icon={Globe} title="Model" description="Choose the Gemini model used for chat responses">
              <select
                id="ai-model-select"
                value={aiModel}
                onChange={(event) => setAiModel(event.target.value as AiModel)}
                className="rounded-lg border border-panel-border bg-base px-3 py-1.5 text-sm text-text-main outline-none focus:border-primary"
              >
                {modelOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </SettingCard>

            <div className="rounded-lg border border-panel-border/60 bg-panel/55 p-4">
              <div className="mb-3 flex items-center gap-4">
                <Cpu className="h-5 w-5 shrink-0 text-text-muted" />
                <div>
                  <div className="font-mono text-sm tracking-wide text-text-main">System instructions</div>
                  <div className="mt-1 text-xs text-text-muted">Default guidance sent with each message</div>
                </div>
              </div>
              <textarea
                id="system-instructions-input"
                className="min-h-[96px] w-full resize-none rounded-lg border border-panel-border bg-base p-3 text-sm text-text-main outline-none focus:border-primary"
                value={systemInstructions}
                onChange={(event) => setSystemInstructions(event.target.value)}
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
