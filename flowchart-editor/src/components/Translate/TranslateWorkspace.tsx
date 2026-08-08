import { useMemo, useState } from 'react';
import {
  ArrowLeftRight,
  Blocks,
  Check,
  Copy,
  GitBranch,
  MousePointer2,
  Play,
  Workflow,
} from 'lucide-react';
import { parseCode, toFlowchart, translateTo, type Lang } from '../../lib/translate';

/**
 * Google-Translate-shaped workspace: a source pane, a swap control, and a
 * target pane.
 *
 * The panes sit inside a capped container rather than stretching edge to edge,
 * so there is deliberate gutter left over. That gutter is where the
 * drag-and-drop mini editor lives, giving visual languages somewhere to go
 * without needing a second screen.
 */

export type LangId = Lang | 'flowchart' | 'blocks' | 'spike';

interface LangDef {
  id: LangId;
  label: string;
  /** Visual languages get an editor surface instead of a textarea. */
  visual: boolean;
}

const LANGUAGES: LangDef[] = [
  { id: 'python', label: 'Python', visual: false },
  { id: 'javascript', label: 'JavaScript', visual: false },
  { id: 'pseudocode', label: 'Pseudocode', visual: false },
  { id: 'flowchart', label: 'Flowchart', visual: true },
  { id: 'blocks', label: 'Blocks', visual: true },
  { id: 'spike', label: 'SPIKE Prime', visual: true },
];

const TEXT_LANGS: LangId[] = ['python', 'javascript', 'pseudocode'];
const isTextLang = (id: LangId): id is Lang => TEXT_LANGS.includes(id);

const SAMPLE: Record<string, string> = {
  python:
    'def greet(name):\n    if name:\n        print(f"Hi, {name}")\n    else:\n        print("Hi there")\n    return name',
  javascript:
    'function greet(name) {\n  if (name) {\n    console.log(`Hi, ${name}`);\n  } else {\n    console.log("Hi there");\n  }\n  return name;\n}',
  pseudocode:
    'START\n  IF name THEN\n    PRINT "Hi, " + name\n  ELSE\n    PRINT "Hi there"\n  END IF\nEND',
};

/** Palette for the mini editor — the pieces you drag onto a visual canvas. */
const PALETTE = [
  { id: 'start', icon: Play, label: 'Start', tone: 'text-violet-300' },
  { id: 'process', icon: Workflow, label: 'Process', tone: 'text-fuchsia-300' },
  { id: 'decision', icon: GitBranch, label: 'Decision', tone: 'text-purple-300' },
  { id: 'block', icon: Blocks, label: 'Block', tone: 'text-indigo-300' },
] as const;

function LanguagePicker({
  value,
  onChange,
  label,
}: {
  value: LangId;
  onChange: (id: LangId) => void;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] uppercase tracking-[0.14em] text-slate-500">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as LangId)}
        aria-label={`${label} language`}
        className="appearance-none rounded-lg bg-white/5 px-3 py-1.5 pr-8 text-sm font-medium
                   text-slate-200 ring-1 ring-white/10 cursor-pointer
                   transition-[background-color,box-shadow] duration-150 ease-out
                   hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-400/60
                   bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 20 20%22 fill=%22%239d84c4%22><path d=%22M5.5 7.5l4.5 5 4.5-5z%22/></svg>')]
                   bg-no-repeat bg-[right_0.5rem_center] bg-[length:1.1rem]"
      >
        {LANGUAGES.map((l) => (
          <option key={l.id} value={l.id} className="bg-slate-900">
            {l.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/** Renders the derived flowchart as a simple vertical diagram. */
function FlowPreview({ source, lang }: { source: string; lang: Lang }) {
  const flow = useMemo(() => toFlowchart(parseCode(source, lang)), [source, lang]);

  if (flow.nodes.length <= 2) {
    return <DropSurface hint="Write some code on the left and the diagram appears here." />;
  }

  const W = 260;
  const H = 46;
  const GAP = 30;
  const height = flow.nodes.length * (H + GAP);

  return (
    <div className="glass-sunken h-full min-h-[16rem] overflow-auto rounded-xl p-3 ring-1 ring-white/10">
      <svg width="100%" viewBox={`0 0 ${W + 40} ${height}`} role="img" aria-label="Generated flowchart">
        {flow.nodes.map((node, i) => {
          const y = i * (H + GAP);
          const cx = (W + 40) / 2;
          const terminal = node.type === 'start' || node.type === 'end';
          const fill =
            node.type === 'decision'
              ? '#5b2b8a'
              : terminal
                ? '#7c3aed'
                : node.type === 'io'
                  ? '#86308f'
                  : '#2b1a4d';

          return (
            <g key={node.id}>
              {i > 0 && (
                <line
                  x1={cx}
                  y1={y - GAP}
                  x2={cx}
                  y2={y}
                  stroke="var(--accent)"
                  strokeOpacity="0.6"
                  strokeWidth="1.5"
                />
              )}
              <rect
                x={cx - W / 2}
                y={y}
                width={W}
                height={H}
                rx={terminal ? H / 2 : node.type === 'decision' ? 14 : 8}
                fill={fill}
                stroke="var(--node-stroke)"
              />
              <text
                x={cx}
                y={y + H / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="12"
                fill="#e4dbf5"
              >
                {node.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/** Drop target shown when the selected language is visual rather than textual. */
function DropSurface({
  hint,
  onDropPiece,
  dropped,
}: {
  hint: string;
  onDropPiece?: (piece: string) => void;
  dropped?: string[];
}) {
  const [over, setOver] = useState(false);

  return (
    <div
      onDragOver={(e) => {
        if (!onDropPiece) return;
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        if (!onDropPiece) return;
        e.preventDefault();
        setOver(false);
        const piece = e.dataTransfer.getData('text/plain');
        if (piece) onDropPiece(piece);
      }}
      className={`flex h-full min-h-[16rem] flex-col items-center justify-center gap-3 rounded-xl
                  border border-dashed p-6 text-center
                  transition-[background-color,border-color] duration-150 ease-out
                  ${over ? 'border-violet-400/70 bg-violet-400/10' : 'border-white/15'}`}
    >
      {dropped && dropped.length > 0 ? (
        <ul className="flex w-full flex-col items-center gap-2">
          {dropped.map((piece, i) => (
            <li
              key={i}
              className="rise-in w-full max-w-[16rem] rounded-lg bg-white/8 px-3 py-2 text-sm
                         text-slate-200 ring-1 ring-white/15"
            >
              {piece}
            </li>
          ))}
        </ul>
      ) : (
        <>
          <MousePointer2 className="h-5 w-5 text-slate-500" aria-hidden="true" />
          <p className="max-w-[24ch] text-sm text-slate-400 [text-wrap:pretty]">{hint}</p>
        </>
      )}
    </div>
  );
}

export default function TranslateWorkspace() {
  const [source, setSource] = useState<LangId>('python');
  const [target, setTarget] = useState<LangId>('flowchart');
  const [text, setText] = useState(SAMPLE.python);
  const [copied, setCopied] = useState(false);
  const [pieces, setPieces] = useState<string[]>([]);

  const sourceLang = LANGUAGES.find((l) => l.id === source)!;
  const targetLang = LANGUAGES.find((l) => l.id === target)!;

  // The real conversion. Blocks and SPIKE Prime are output-only — there is no
  // parser for either, so they never appear on the source side of this check.
  // After the `target === 'flowchart'` guard, LangId narrows to exactly
  // Target (Lang | 'blocks' | 'spike'), so no cast is needed below.
  // Guarded so a malformed paste surfaces a message instead of blanking the
  // pane or throwing past the render boundary.
  const output = useMemo(() => {
    if (!isTextLang(source) || target === 'flowchart') return '';
    if (text.trim() === '') return '';
    try {
      return translateTo(text, source, target);
    } catch {
      return "// Couldn't parse that — check the source language is right.";
    }
  }, [text, source, target]);

  const swap = () => {
    setSource(target);
    setTarget(source);
    setText(isTextLang(target) ? (output || SAMPLE[target] || '') : '');
    setPieces([]);
  };

  const pickSource = (id: LangId) => {
    setSource(id);
    if (isTextLang(id)) setText(SAMPLE[id] ?? '');
    setPieces([]);
  };

  const copy = async () => {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="grid flex-1 place-items-center overflow-auto px-6 py-8 lg:px-10">
      <div className="mx-auto flex w-full max-w-[84rem] flex-col gap-8">
        <div className="flex flex-col items-stretch gap-4 md:flex-row">
          {/* Source */}
          <section className="glass-panel flex min-h-[22rem] min-w-0 flex-1 basis-0 flex-col rounded-2xl p-5 ring-1 ring-white/10">
            <header className="mb-4 flex items-center justify-between gap-3">
              <LanguagePicker value={source} onChange={pickSource} label="From" />
            </header>

            {sourceLang.visual ? (
              <DropSurface
                hint="Drag pieces from the palette below to build your diagram."
                onDropPiece={(p) => setPieces((prev) => [...prev, p])}
                dropped={pieces}
              />
            ) : (
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                spellCheck={false}
                aria-label="Source code"
                placeholder="Paste or write your code here…"
                className="glass-sunken h-full min-h-[16rem] w-full resize-none rounded-xl p-4
                           font-mono text-[13px] leading-relaxed text-slate-200
                           placeholder:text-slate-500 ring-1 ring-white/10
                           transition-[box-shadow] duration-150 ease-out
                           focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
              />
            )}

            <footer className="mt-3 text-[11px] text-slate-500 [font-variant-numeric:tabular-nums]">
              {sourceLang.visual
                ? `${pieces.length} ${pieces.length === 1 ? 'piece' : 'pieces'}`
                : `${text.length} characters`}
            </footer>
          </section>

          {/* Swap — the conversion control between the two panes */}
          <div className="flex shrink-0 items-center justify-center md:px-1">
            <button
              type="button"
              onClick={swap}
              title="Swap direction"
              aria-label="Swap source and target languages"
              className="group grid h-11 w-11 place-items-center rounded-full
                         bg-white/5 ring-1 ring-white/15 text-slate-300
                         transition-[transform,background-color,box-shadow] duration-150 ease-out
                         hover:bg-white/10 hover:text-violet-200 hover:shadow-[0_0_20px_rgba(168,85,247,.35)]
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400
                         active:scale-[0.94]"
            >
              {/* Rotated when the panes stack, so the arrow points along the
                  axis the conversion actually runs. */}
              <ArrowLeftRight
                className="h-4 w-4 rotate-90 transition-transform duration-200 ease-out
                           group-hover:rotate-[270deg] md:rotate-0 md:group-hover:rotate-180"
                aria-hidden="true"
              />
            </button>
          </div>

          {/* Target */}
          <section className="glass-panel flex min-h-[22rem] min-w-0 flex-1 basis-0 flex-col rounded-2xl p-5 ring-1 ring-white/10">
            <header className="mb-4 flex items-center justify-between gap-3">
              <LanguagePicker value={target} onChange={setTarget} label="To" />
              {output !== '' && (
                <button
                  type="button"
                  onClick={copy}
                  disabled={output === ''}
                  title="Copy result"
                  aria-label="Copy result"
                  className="grid h-9 w-9 place-items-center rounded-lg text-slate-400
                             transition-[background-color,color] duration-150 ease-out
                             hover:bg-white/10 hover:text-violet-200 disabled:opacity-40
                             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-emerald-300" aria-hidden="true" />
                  ) : (
                    <Copy className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              )}
            </header>

            {target === 'flowchart' && isTextLang(source) ? (
              <FlowPreview source={text} lang={source} />
            ) : (target === 'blocks' || target === 'spike') && isTextLang(source) ? (
              // Blocks and SPIKE Prime are output-only, but with a text source
              // there is a real conversion — show it instead of a drop hint
              // that would be lying about there being nothing to see.
              <pre
                className="glass-sunken h-full min-h-[16rem] overflow-auto rounded-xl p-4
                           font-mono text-[13px] leading-relaxed text-slate-300 ring-1 ring-white/10"
              >
                <code>{output || '// Nothing to show yet'}</code>
              </pre>
            ) : targetLang.visual ? (
              <DropSurface hint="Pick a code language on the left to generate this view." />
            ) : (
              <pre
                className="glass-sunken h-full min-h-[16rem] overflow-auto rounded-xl p-4
                           font-mono text-[13px] leading-relaxed text-slate-300 ring-1 ring-white/10"
              >
                <code>
                  {output || (
                    <span className="text-slate-500">Type on the left to see the result.</span>
                  )}
                </code>
              </pre>
            )}

            <footer className="mt-3 text-[11px] text-slate-500" aria-live="polite">
              {copied ? 'Copied to clipboard' : 'Updates as you type'}
            </footer>
          </section>
        </div>

        {/* Mini editor rail — lives in the space the capped panes leave behind */}
        <section className="glass-panel rounded-2xl p-5 ring-1 ring-white/10">
          <div className="mb-4 flex items-baseline justify-between gap-4">
            <h2 className="text-sm font-semibold text-slate-200 [text-wrap:balance]">
              Building blocks
            </h2>
            <p className="text-xs text-slate-500 [text-wrap:pretty]">
              Drag a piece onto any visual pane
            </p>
          </div>

          <ul className="flex flex-wrap gap-3">
            {PALETTE.map(({ id, icon: Icon, label, tone }) => (
              <li key={id}>
                <button
                  type="button"
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData('text/plain', label)}
                  onClick={() => setPieces((prev) => [...prev, label])}
                  className="flex min-h-[44px] items-center gap-2.5 rounded-xl bg-white/5 px-4 py-2.5
                             text-sm text-slate-200 ring-1 ring-white/10 cursor-grab
                             transition-[transform,background-color,box-shadow] duration-150 ease-out
                             hover:bg-white/10 hover:shadow-[0_6px_18px_-6px_rgba(0,0,0,.7)]
                             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400
                             active:scale-[0.96] active:cursor-grabbing"
                >
                  <Icon className={`h-4 w-4 ${tone}`} aria-hidden="true" />
                  {label}
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
