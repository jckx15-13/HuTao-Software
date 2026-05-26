import { useState, type ChangeEvent, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Cpu, Globe, Image as ImageIcon, Loader2, Palette, Sparkles, Type, Volume2 } from 'lucide-react';
import { SectionHeader } from './common/SectionHeader';
import { extractThemeFromImage } from '../lib/imageTheme';
import { formatPaletteName, palettes, type PaletteKey, type ThemeVars } from '../lib/themeEngine';
import { useUIStore, type AiModel } from '../store/uiStore';

const modelOptions: Array<{ label: string; value: AiModel }> = [
  { label: 'Gemini 3.1 Pro Preview', value: 'gemini-3.1-pro-preview' },
  { label: 'Gemini 1.5 Pro', value: 'gemini-1.5-pro' },
  { label: 'Gemini 1.5 Flash', value: 'gemini-1.5-flash' },
];

const paletteSwatches: Array<keyof ThemeVars> = [
  '--theme-bg-base',
  '--theme-primary',
  '--theme-accent-triad-1',
  '--theme-accent-triad-2',
  '--theme-accent-phi-1',
  '--theme-accent-phi-2',
];

interface SettingCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  children: ReactNode;
}

function SettingCard({ icon: Icon, title, description, children }: SettingCardProps) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-panel-border/60 bg-panel/55 p-4 transition-colors hover:border-primary/40">
      <div className="flex min-w-0 items-center gap-4">
        <Icon className="h-5 w-5 shrink-0 text-text-muted" />
        <div className="min-w-0">
          <div className="font-mono text-sm tracking-wide text-text-main">{title}</div>
          <div className="mt-1 text-xs text-text-muted">{description}</div>
        </div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

interface ToggleSettingProps {
  icon: LucideIcon;
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function ToggleSetting({ icon, title, description, checked, onChange }: ToggleSettingProps) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-panel-border/60 bg-panel/55 p-4 transition-colors hover:border-primary/40">
      <div className="flex min-w-0 items-center gap-4">
        {(() => {
          const Icon = icon;
          return <Icon className="h-5 w-5 shrink-0 text-text-muted" />;
        })()}
        <div className="min-w-0">
          <div className="font-mono text-sm tracking-wide text-text-main">{title}</div>
          <div className="mt-1 text-xs text-text-muted">{description}</div>
        </div>
      </div>
      <input
        type="checkbox"
        className="h-4 w-4 shrink-0 accent-[var(--theme-primary)]"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  );
}

function PaletteOption({ paletteKey }: { paletteKey: PaletteKey }) {
  const activePalette = useUIStore((state) => state.activePalette);
  const setActivePalette = useUIStore((state) => state.setActivePalette);
  const palette = palettes[paletteKey];
  const isActive = activePalette === paletteKey;

  return (
    <button
      key={paletteKey}
      onClick={() => setActivePalette(paletteKey)}
      className={`flex items-center justify-between gap-4 rounded-lg border p-4 text-left transition-colors ${
        isActive
          ? 'border-primary bg-primary/10 text-primary shadow-[0_0_15px_color-mix(in_srgb,var(--theme-primary)_14%,transparent)]'
          : 'border-panel-border/60 bg-panel/55 text-text-muted hover:border-primary/40'
      }`}
    >
      <div className="flex min-w-0 items-center gap-4">
        <Palette className="h-5 w-5 shrink-0" style={{ color: palette['--theme-primary'] }} />
        <span className="truncate font-mono text-sm tracking-wide">{formatPaletteName(paletteKey)}</span>
      </div>
      <div className="flex max-w-[92px] flex-wrap justify-end gap-1.5">
        {paletteSwatches.map((token) => (
          <span
            key={token}
            className="h-3 w-3 rounded-full border border-black/20"
            style={{ background: palette[token] }}
            title={token.replace('--theme-', '')}
          />
        ))}
      </div>
    </button>
  );
}

export function SettingsPane() {
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
  const [isExtracting, setIsExtracting] = useState(false);

  const clearWallpaper = () => {
    if (customWallpaper?.startsWith('blob:')) {
      URL.revokeObjectURL(customWallpaper);
    }

    setCustomWallpaper(null);
    setDynamicTheme(null);
  };

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (customWallpaper?.startsWith('blob:')) {
      URL.revokeObjectURL(customWallpaper);
    }

    setIsExtracting(true);
    const url = URL.createObjectURL(file);
    setCustomWallpaper(url);

    try {
      setDynamicTheme(await extractThemeFromImage(url));
    } catch (error) {
      console.error('Theme extraction failed', error);
    } finally {
      setIsExtracting(false);
      event.target.value = '';
    }
  };

  return (
    <div className="h-full w-full overflow-y-auto bg-transparent">
      <div className="flex max-w-2xl flex-col gap-10 p-5 text-[15px] text-text-main sm:p-8">
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
                  {isExtracting ? 'Extracting matching colors...' : 'Use an image to tint the interface'}
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

        <section>
          <SectionHeader title="AI" eyebrow="Agent" />
          <div className="flex flex-col gap-3">
            <SettingCard icon={Globe} title="Model" description="Choose the Gemini model used for chat responses">
              <select
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
