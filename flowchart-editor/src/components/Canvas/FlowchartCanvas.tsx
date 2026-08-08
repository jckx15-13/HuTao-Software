import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Maximize2, Minus, Plus, Trash2 } from 'lucide-react';
import { geographyCurriculum, type CurriculumTopic } from '../../data/geographyCurriculum';
import { silverWolfViNodes, silverWolfViEdges, type ArchitectureNode } from '../../data/silverWolfViArchitectureData';
import { wwvArchitectureNodes, wwvArchitectureEdges } from '../../data/wwvArchitectureData';
import { wwtArchitectureNodes, wwtArchitectureEdges } from '../../data/wwtArchitectureData';
import { layoutGraph } from '../../utils/layout';

/**
 * Visual canvas views:
 * 1. "Master Matrix": 3-Column by 2-Row Master Integration Flowchart.
 * 2. "WWV Source Arch": Interconnected WorldWideView Source Systems Diagram.
 * 3. "WWT Source Arch": Interconnected World Wide Telescope System Diagram.
 * 4. "Curriculum": Laid-out GCE O-Level graph (~108 nodes).
 * 5. "Freeform": Editable drag-and-drop flowchart builder.
 */

type ViewMode = 'master-matrix' | 'wwv-arch' | 'wwt-arch' | 'curriculum' | 'freeform';

const TOPIC_FILL: Record<CurriculumTopic, string> = {
  tectonics: '#7f1d4a',
  everyday: '#1e3a8a',
  tourism: '#14532d',
  system: '#4c1d95',
};

const TOPIC_STROKE: Record<CurriculumTopic, string> = {
  tectonics: '#fda4af',
  everyday: '#7dd3fc',
  tourism: '#6ee7b7',
  system: '#c4b5fd',
};

const CATEGORY_FILL: Record<ArchitectureNode['category'], string> = {
  wwt: '#1e1b4b',
  wwv: '#064e3b',
  prisma: '#581c87',
  agent: '#701a75',
  adapter: '#451a03',
  swvi: '#0f172a',
};

const CATEGORY_STROKE: Record<ArchitectureNode['category'], string> = {
  wwt: '#818cf8',
  wwv: '#10b981',
  prisma: '#c084fc',
  agent: '#f43f5e',
  adapter: '#fbbf24',
  swvi: '#38bdf8',
};

const ZOOM_MIN = 0.15;
const ZOOM_MAX = 2;

type FreeType = 'start' | 'end' | 'process' | 'decision' | 'io';

interface FreeNode {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: FreeType;
  label: string;
}

const SEED_NODES: FreeNode[] = [
  { id: 'f1', x: 260, y: 80, width: 180, height: 54, type: 'start', label: 'Start' },
  { id: 'f2', x: 260, y: 260, width: 180, height: 54, type: 'process', label: 'Do something' },
  { id: 'f3', x: 260, y: 440, width: 180, height: 54, type: 'end', label: 'End' },
];

const SEED_EDGES = [
  { from: 'f1', to: 'f2' },
  { from: 'f2', to: 'f3' },
];

const FREE_FILL: Record<FreeType, string> = {
  start: 'url(#grad-terminal)',
  end: 'url(#grad-terminal)',
  process: 'url(#grad-process)',
  decision: 'url(#grad-decision)',
  io: 'url(#grad-io)',
};

export default function FlowchartCanvas() {
  const [mode, setMode] = useState<ViewMode>('master-matrix');
  const layout = useMemo(() => layoutGraph(geographyCurriculum), []);

  const [zoom, setZoom] = useState(0.56);
  const [pan, setPan] = useState({ x: 40, y: 15 });
  const [selected, setSelected] = useState<string | null>(null);

  const [freeNodes, setFreeNodes] = useState<FreeNode[]>(SEED_NODES);
  const [freeEdges, setFreeEdges] = useState(SEED_EDGES);

  const panDrag = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const nodeDrag = useRef<{
    id: string;
    x: number;
    y: number;
    nodeX: number;
    nodeY: number;
  } | null>(null);
  const shell = useRef<HTMLDivElement>(null);

  const positions = useMemo(() => new Map(layout.nodes.map((n) => [n.id, n])), [layout]);
  const nodeMap = useMemo(() => new Map(silverWolfViNodes.map((n) => [n.id, n])), []);

  const bounds = useMemo(() => {
    if (mode === 'curriculum') return layout.bounds;
    if (mode === 'master-matrix') return { width: 1140, height: 1040 };
    if (mode === 'wwv-arch') return { width: 1100, height: 720 };
    if (mode === 'wwt-arch') return { width: 1100, height: 620 };
    let maxX = 0;
    let maxY = 0;
    for (const n of freeNodes) {
      maxX = Math.max(maxX, n.x + n.width);
      maxY = Math.max(maxY, n.y + n.height);
    }
    return { width: maxX + 120, height: maxY + 120 };
  }, [mode, layout.bounds, freeNodes]);

  const fit = useCallback(() => {
    const box = shell.current?.getBoundingClientRect();
    if (!box) return;

    const pad = 56;
    const scale = Math.min((box.width - pad) / bounds.width, (box.height - pad) / bounds.height);
    const next = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, scale));
    setZoom(next);
    setPan({
      x: (box.width / next - bounds.width) / 2,
      y: (box.height / next - bounds.height) / 2,
    });
  }, [bounds]);

  useEffect(() => {
    fit();
  }, [mode, fit]);

  const onWheel = (e: React.WheelEvent) => {
    setZoom((z) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z * (e.deltaY < 0 ? 1.1 : 0.9))));
  };

  const onBackgroundDown = (e: React.MouseEvent) => {
    panDrag.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
  };

  const onNodeDown = (e: React.MouseEvent, node: FreeNode) => {
    e.stopPropagation();
    setSelected(node.id);
    nodeDrag.current = {
      id: node.id,
      x: e.clientX,
      y: e.clientY,
      nodeX: node.x,
      nodeY: node.y,
    };
  };

  const onMove = (e: React.MouseEvent) => {
    if (nodeDrag.current) {
      const d = nodeDrag.current;
      const dx = (e.clientX - d.x) / zoom;
      const dy = (e.clientY - d.y) / zoom;
      setFreeNodes((prev) =>
        prev.map((n) =>
          n.id === d.id ? { ...n, x: Math.max(0, d.nodeX + dx), y: Math.max(0, d.nodeY + dy) } : n,
        ),
      );
      return;
    }
    if (panDrag.current) {
      const d = panDrag.current;
      setPan({
        x: d.panX + (e.clientX - d.x) / zoom,
        y: d.panY + (e.clientY - d.y) / zoom,
      });
    }
  };

  const onUp = () => {
    panDrag.current = null;
    nodeDrag.current = null;
  };

  const addNode = () => {
    const id = `f${Date.now().toString(36)}`;
    setFreeNodes((prev) => [
      ...prev,
      {
        id,
        x: 520,
        y: 80 + prev.length * 40,
        width: 180,
        height: 54,
        type: 'process',
        label: 'New step',
      },
    ]);
    setSelected(id);
  };

  const deleteSelected = () => {
    if (!selected) return;
    setFreeNodes((prev) => prev.filter((n) => n.id !== selected));
    setFreeEdges((prev) => prev.filter((e) => e.from !== selected && e.to !== selected));
    setSelected(null);
  };

  const selectedCurriculum = mode === 'curriculum' && selected ? positions.get(selected) : null;
  const activeNode = selected ? nodeMap.get(selected) : null;

  const toggle = (target: ViewMode, label: string) => (
    <button
      key={target}
      onClick={() => {
        setMode(target);
        setSelected(null);
      }}
      aria-pressed={mode === target}
      className={`min-h-[36px] rounded-lg px-3 text-xs font-medium transition-colors duration-150
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400
                  ${
                    mode === target
                      ? 'bg-violet-500/70 text-white font-semibold'
                      : 'text-slate-400 hover:bg-white/10 hover:text-slate-200'
                  }`}
    >
      {label}
    </button>
  );

  const activeNodes = mode === 'wwv-arch' ? wwvArchitectureNodes : mode === 'wwt-arch' ? wwtArchitectureNodes : silverWolfViNodes;
  const activeEdges = mode === 'wwv-arch' ? wwvArchitectureEdges : mode === 'wwt-arch' ? wwtArchitectureEdges : silverWolfViEdges;

  return (
    <div ref={shell} className="relative flex h-full w-full flex-col overflow-hidden">
      <div className="absolute left-4 top-4 z-10 flex flex-wrap items-center gap-2">
        <div
          role="group"
          aria-label="Canvas view"
          className="glass-panel flex flex-wrap items-center gap-1 rounded-xl p-1 ring-1 ring-white/10"
        >
          {toggle('master-matrix', 'Master Matrix (3 Col x 2 Row)')}
          {toggle('wwv-arch', 'WWV Source Arch')}
          {toggle('wwt-arch', 'WWT Source Arch')}
          {toggle('curriculum', 'Curriculum')}
          {toggle('freeform', 'Freeform')}
        </div>

        <div className="glass-panel flex items-center gap-1 rounded-xl p-1 ring-1 ring-white/10">
          <button
            onClick={() => setZoom((z) => Math.max(ZOOM_MIN, z * 0.85))}
            aria-label="Zoom out"
            className="grid h-9 w-9 place-items-center rounded-lg text-slate-300
                       transition-colors duration-150 hover:bg-white/10 hover:text-violet-200
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          >
            <Minus className="h-4 w-4" aria-hidden="true" />
          </button>
          <span className="w-12 text-center font-mono text-xs text-slate-400 [font-variant-numeric:tabular-nums]">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom((z) => Math.min(ZOOM_MAX, z * 1.15))}
            aria-label="Zoom in"
            className="grid h-9 w-9 place-items-center rounded-lg text-slate-300
                       transition-colors duration-150 hover:bg-white/10 hover:text-violet-200
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            onClick={fit}
            aria-label="Fit to view"
            className="grid h-9 w-9 place-items-center rounded-lg text-slate-300
                       transition-colors duration-150 hover:bg-white/10 hover:text-violet-200
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          >
            <Maximize2 className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {mode === 'freeform' && (
          <div className="glass-panel flex items-center gap-1 rounded-xl p-1 ring-1 ring-white/10">
            <button
              onClick={addNode}
              className="flex min-h-[36px] items-center gap-2 rounded-lg px-3 text-xs font-medium
                         text-slate-200 transition-colors duration-150 hover:bg-white/10
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Add node
            </button>
            <button
              onClick={deleteSelected}
              disabled={!selected}
              className="flex min-h-[36px] items-center gap-2 rounded-lg px-3 text-xs font-medium
                         text-rose-300 transition-colors duration-150 hover:bg-rose-500/15
                         disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2
                         focus-visible:ring-cyan-400"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> Delete
            </button>
          </div>
        )}

        <p className="glass-panel rounded-xl px-3 py-2 text-xs text-slate-400 ring-1 ring-white/10 font-mono">
          {mode === 'master-matrix'
            ? 'Master Matrix: 3 Columns (Source ➔ Changes ➔ Destination) ✕ 2 Source Rows (WWV & WWT)'
            : mode === 'wwv-arch'
              ? 'WorldWideView System Arch: GeoJSON Feeds ➔ DataBus ➔ Zustand Store ➔ Resium Globe'
              : mode === 'wwt-arch'
                ? 'WWT System Arch: WebGL Engine ➔ postMessage ➔ Precession Math ➔ Camera Sync'
                : mode === 'curriculum'
                  ? `${layout.nodes.length} topics · drag to pan · scroll to zoom`
                  : `${freeNodes.length} nodes · drag a node to move it`}
        </p>
      </div>

      {selectedCurriculum && (
        <aside className="glass-panel rise-in absolute right-4 top-4 z-10 max-w-xs rounded-xl p-4 ring-1 ring-white/10">
          <p
            className="mb-1 text-[10px] uppercase tracking-[0.14em]"
            style={{ color: TOPIC_STROKE[selectedCurriculum.topic] }}
          >
            {selectedCurriculum.tier}
          </p>
          <p className="text-sm text-slate-100 [text-wrap:pretty]">{selectedCurriculum.label}</p>
        </aside>
      )}

      {activeNode && (
        <aside className="glass-panel rise-in absolute right-4 top-4 z-10 max-w-xs rounded-xl p-4 ring-1 ring-white/10">
          <p
            className="mb-1 text-[10px] uppercase tracking-[0.14em]"
            style={{ color: CATEGORY_STROKE[activeNode.category] }}
          >
            {activeNode.row ? `${activeNode.row} · ${activeNode.column}` : activeNode.category.toUpperCase()}
          </p>
          <p className="text-sm font-semibold text-slate-100">{activeNode.label}</p>
          {activeNode.sublabel && (
            <p className="mt-1 text-xs text-slate-400">{activeNode.sublabel}</p>
          )}
        </aside>
      )}

      <svg
        className="h-full w-full cursor-grab active:cursor-grabbing"
        onWheel={onWheel}
        onMouseDown={onBackgroundDown}
        onMouseMove={onMove}
        onMouseUp={onUp}
        onMouseLeave={onUp}
        role="img"
        aria-label="Silver Wolf VI Architecture canvas"
      >
        <defs>
          <marker id="cur-arrow" markerWidth="8" markerHeight="8" refX="7" refY="2.5" orient="auto">
            <polygon points="0 0, 8 2.5, 0 5" fill="rgba(196,181,253,.55)" />
          </marker>
          <marker id="green-arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
            <polygon points="0 0, 10 3, 0 6" fill="#10b981" />
          </marker>
          <marker id="adapter-arrow" markerWidth="8" markerHeight="8" refX="7" refY="2.5" orient="auto">
            <polygon points="0 0, 8 2.5, 0 5" fill="#f59e0b" />
          </marker>
          <linearGradient id="grad-process" x1="0" y1="0" x2="0.4" y2="1">
            <stop offset="0%" stopColor="#3a2560" />
            <stop offset="100%" stopColor="#1c1136" />
          </linearGradient>
          <linearGradient id="grad-terminal" x1="0" y1="0" x2="0.4" y2="1">
            <stop offset="0%" stopColor="#9333ea" />
            <stop offset="100%" stopColor="#5b21b6" />
          </linearGradient>
          <linearGradient id="grad-decision" x1="0" y1="0" x2="0.4" y2="1">
            <stop offset="0%" stopColor="#5b2b8a" />
            <stop offset="100%" stopColor="#2e1550" />
          </linearGradient>
          <linearGradient id="grad-io" x1="0" y1="0" x2="0.4" y2="1">
            <stop offset="0%" stopColor="#86308f" />
            <stop offset="100%" stopColor="#4a1a55" />
          </linearGradient>
        </defs>

        <g transform={`scale(${zoom}) translate(${pan.x} ${pan.y})`}>
          {mode === 'master-matrix' || mode === 'wwv-arch' || mode === 'wwt-arch' ? (
            <>
              {mode === 'master-matrix' && (
                <>
                  <text x={40} y={18} fontSize={12} fontWeight={700} fill="#94a3b8" letterSpacing="0.08em">
                    COLUMN 1: SOURCE ARCHITECTURE
                  </text>
                  <text x={430} y={18} fontSize={12} fontWeight={700} fill="#f59e0b" letterSpacing="0.08em">
                    COLUMN 2: CHANGES / ADAPTERS
                  </text>
                  <text x={800} y={18} fontSize={12} fontWeight={700} fill="#38bdf8" letterSpacing="0.08em">
                    COLUMN 3: DESTINATION FILES
                  </text>

                  <text x={40} y={32} fontSize={13} fontWeight={700} fill="#34d399" letterSpacing="0.06em">
                    ROW 1: WORLDWIDEVIEW (WWV) INTEGRATION PIPELINE
                  </text>
                  <line x1={40} y1={36} x2={1100} y2={36} stroke="#34d399" strokeOpacity={0.35} strokeDasharray="4,4" />

                  <text x={40} y={502} fontSize={13} fontWeight={700} fill="#818cf8" letterSpacing="0.06em">
                    ROW 2: WORLD WIDE TELESCOPE (WWT) INTEGRATION PIPELINE
                  </text>
                  <line x1={40} y1={506} x2={1100} y2={506} stroke="#818cf8" strokeOpacity={0.35} strokeDasharray="4,4" />
                </>
              )}

              {/* Edge Vectors */}
              {activeEdges.map((e, i) => {
                const a = activeNodes.find((n) => n.id === e.from);
                const b = activeNodes.find((n) => n.id === e.to);
                if (!a || !b) return null;

                const x1 = a.x + a.width;
                const y1 = a.y + a.height / 2;
                const x2 = b.x;
                const y2 = b.y + b.height / 2;
                const midX = (x1 + x2) / 2;

                return (
                  <g key={i}>
                    <path
                      d={`M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`}
                      fill="none"
                      stroke={e.implemented ? '#10b981' : '#f59e0b'}
                      strokeWidth={e.implemented ? 2.5 : 1.5}
                      strokeDasharray={e.implemented ? undefined : '5,5'}
                      markerEnd={e.implemented ? 'url(#green-arrow)' : 'url(#adapter-arrow)'}
                    />
                    {e.label && (
                      <text
                        x={midX}
                        y={(y1 + y2) / 2 - 6}
                        textAnchor="middle"
                        fontSize={10}
                        fill={e.implemented ? '#34d399' : '#fbbf24'}
                      >
                        {e.label}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Node Rectangles */}
              {activeNodes.map((n) => {
                const isSelected = selected === n.id;
                return (
                  <g
                    key={n.id}
                    className="cursor-pointer transition-transform duration-150 hover:scale-[1.02]"
                    onMouseDown={(ev) => ev.stopPropagation()}
                    onClick={() => setSelected(isSelected ? null : n.id)}
                  >
                    <rect
                      x={n.x}
                      y={n.y}
                      width={n.width}
                      height={n.height}
                      rx={10}
                      fill={CATEGORY_FILL[n.category]}
                      stroke={isSelected ? '#ffffff' : CATEGORY_STROKE[n.category]}
                      strokeWidth={isSelected ? 2.5 : 1.5}
                    />
                    <text
                      x={n.x + n.width / 2}
                      y={n.y + 21}
                      textAnchor="middle"
                      fontSize={11.5}
                      fontWeight={600}
                      fill="#f8fafc"
                      pointerEvents="none"
                    >
                      {n.label}
                    </text>
                    {n.sublabel && (
                      <text
                        x={n.x + n.width / 2}
                        y={n.y + 39}
                        textAnchor="middle"
                        fontSize={9}
                        fill="#94a3b8"
                        pointerEvents="none"
                      >
                        {n.sublabel}
                      </text>
                    )}
                  </g>
                );
              })}
            </>
          ) : mode === 'curriculum' ? (
            <>
              {layout.edges.map((e, i) => {
                const a = positions.get(e.from);
                const b = positions.get(e.to);
                if (!a || !b) return null;

                const x1 = a.x + a.width / 2;
                const y1 = a.y + a.height;
                const x2 = b.x + b.width / 2;
                const y2 = b.y;
                const mid = (y1 + y2) / 2;

                return (
                  <path
                    key={i}
                    d={`M ${x1} ${y1} C ${x1} ${mid}, ${x2} ${mid}, ${x2} ${y2}`}
                    fill="none"
                    stroke="rgba(196,181,253,.28)"
                    strokeWidth={1.2}
                    markerEnd="url(#cur-arrow)"
                  />
                );
              })}

              {layout.nodes.map((n) => {
                const isSelected = selected === n.id;
                return (
                  <g
                    key={n.id}
                    className="node-3d cursor-pointer"
                    onMouseDown={(ev) => ev.stopPropagation()}
                    onClick={() => setSelected(isSelected ? null : n.id)}
                  >
                    <rect
                      x={n.x}
                      y={n.y}
                      width={n.width}
                      height={n.height}
                      rx={n.tier === 'root' || n.tier === 'topic' ? 14 : 8}
                      fill={TOPIC_FILL[n.topic]}
                      fillOpacity={0.85}
                      stroke={isSelected ? '#f0abfc' : TOPIC_STROKE[n.topic]}
                      strokeOpacity={isSelected ? 1 : 0.5}
                      strokeWidth={isSelected ? 2.5 : 1.2}
                    />
                    <text
                      x={n.x + n.width / 2}
                      y={n.y + n.height / 2}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize={n.tier === 'root' ? 17 : n.tier === 'topic' ? 15 : 12}
                      fontWeight={n.tier === 'root' || n.tier === 'topic' ? 600 : 400}
                      fill="#f1e9ff"
                      pointerEvents="none"
                    >
                      {n.label.length > 34 ? n.label.slice(0, 33) + '…' : n.label}
                    </text>
                  </g>
                );
              })}
            </>
          ) : (
            <>
              {freeEdges.map((e, i) => {
                const a = freeNodes.find((n) => n.id === e.from);
                const b = freeNodes.find((n) => n.id === e.to);
                if (!a || !b) return null;

                const x1 = a.x + a.width / 2;
                const y1 = a.y + a.height;
                const x2 = b.x + b.width / 2;
                const y2 = b.y;
                const mid = (y1 + y2) / 2;

                return (
                  <path
                    key={i}
                    className="edge-flow"
                    d={`M ${x1} ${y1} C ${x1} ${mid}, ${x2} ${mid}, ${x2} ${y2}`}
                    fill="none"
                    stroke="var(--accent)"
                    strokeOpacity={0.75}
                    strokeWidth={1.75}
                    markerEnd="url(#cur-arrow)"
                  />
                );
              })}

              {freeNodes.map((n) => {
                const isSelected = selected === n.id;
                const terminal = n.type === 'start' || n.type === 'end';
                return (
                  <g
                    key={n.id}
                    className={`node-3d cursor-move${isSelected ? ' is-selected' : ''}`}
                    onMouseDown={(ev) => onNodeDown(ev, n)}
                  >
                    <rect
                      x={n.x}
                      y={n.y}
                      width={n.width}
                      height={n.height}
                      rx={terminal ? n.height / 2 : n.type === 'decision' ? 14 : 8}
                      fill={FREE_FILL[n.type]}
                      stroke={isSelected ? 'var(--node-selected)' : 'var(--node-stroke)'}
                      strokeWidth={isSelected ? 2.5 : 1.5}
                    />
                    <text
                      x={n.x + n.width / 2}
                      y={n.y + n.height / 2}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize={13}
                      fill="var(--text)"
                      pointerEvents="none"
                    >
                      {n.label}
                    </text>
                  </g>
                );
              })}
            </>
          )}
        </g>
      </svg>
    </div>
  );
}
