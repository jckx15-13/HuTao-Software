import { Download, PenLine, Sparkles, Upload } from 'lucide-react';

export type AppMode = 'translate' | 'editor';

interface HeaderProps {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
}

const MODES: Array<{ id: AppMode; label: string; icon: typeof Sparkles }> = [
  { id: 'translate', label: 'Translate', icon: Sparkles },
  { id: 'editor', label: 'Editor', icon: PenLine },
];

/**
 * Segmented pill for the two top-level modes.
 *
 * The moving highlight is a single absolutely-positioned element that slides,
 * rather than a background toggled per-button — that way the transition
 * retargets cleanly if the user changes their mind mid-slide.
 */
function ModeSwitch({ mode, setMode }: HeaderProps) {
  const index = MODES.findIndex((m) => m.id === mode);

  return (
    // grid-cols-2 keeps both tabs exactly equal width. A plain flex row sizes
    // each tab to its label, so the 50%-wide highlight would sit off-centre on
    // the longer one.
    <div
      role="tablist"
      aria-label="Workspace mode"
      className="relative grid grid-cols-2 rounded-full bg-white/5 p-1 ring-1 ring-white/10"
    >
      <span
        aria-hidden="true"
        className="absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full
                   bg-gradient-to-r from-violet-500/80 to-fuchsia-500/70
                   shadow-[0_0_18px_rgba(168,85,247,.45)]
                   transition-transform duration-300 ease-[cubic-bezier(.22,1,.36,1)]"
        style={{ transform: `translateX(${index * 100}%)` }}
      />
      {MODES.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          role="tab"
          aria-selected={mode === id}
          onClick={() => setMode(id)}
          className={`relative z-10 flex min-h-[38px] items-center justify-center gap-2 rounded-full px-5 text-sm font-medium
                      transition-[color,transform] duration-150 ease-out active:scale-[0.97]
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400
                      ${mode === id ? 'text-white' : 'text-slate-400 hover:text-slate-200'}`}
        >
          <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
          {label}
        </button>
      ))}
    </div>
  );
}

export default function Header({ mode, setMode }: HeaderProps) {
  return (
    <header className="glass-panel z-10 flex shrink-0 items-center justify-between gap-4 border-b border-white/10 px-6 py-3">
      <div className="flex items-center gap-2.5">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-violet-500/30 to-fuchsia-500/20 ring-1 ring-white/15">
          <Sparkles className="h-4 w-4 text-violet-200" aria-hidden="true" />
        </div>
        <div className="leading-tight">
          <h1 className="text-sm font-semibold text-slate-100">Flowchart Studio</h1>
          <p className="text-[11px] text-slate-500">Code ↔ diagrams, both ways</p>
        </div>
      </div>

      <ModeSwitch mode={mode} setMode={setMode} />

      <div className="flex gap-1">
        <button
          title="Open a saved file"
          aria-label="Open a saved file"
          className="grid h-10 w-10 place-items-center rounded-xl text-slate-400
                     transition-[background-color,color,transform] duration-150 ease-out
                     hover:bg-white/10 hover:text-violet-200 active:scale-[0.95]
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
        >
          <Upload className="h-4 w-4" aria-hidden="true" />
        </button>
        <button
          title="Save your work"
          aria-label="Save your work"
          className="grid h-10 w-10 place-items-center rounded-xl text-slate-400
                     transition-[background-color,color,transform] duration-150 ease-out
                     hover:bg-white/10 hover:text-violet-200 active:scale-[0.95]
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
