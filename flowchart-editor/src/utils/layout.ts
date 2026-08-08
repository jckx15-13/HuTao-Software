/**
 * Layered layout for the curriculum graph, arranged as side-by-side topic
 * columns.
 *
 * An earlier version packed every node of a rank into one global row. With ~108
 * curriculum nodes that produced a diagram roughly 8000px wide and only ten
 * ranks tall, so fitting it to a viewport clamped the zoom to ~15% and every
 * label became illegible. Laying each syllabus strand out as its own column
 * keeps the aspect ratio close to the viewport's, which is what makes the text
 * readable at fit zoom.
 *
 * Ranks come from longest-path depth so children always sit below their
 * parents. Cycles are expected — the Case Study Curator points back at the
 * topics it curates — so ranking uses bounded relaxation rather than a
 * topological sort, which would not terminate here.
 */

import type {
  CurriculumEdge,
  CurriculumGraph,
  CurriculumNode,
} from '../data/geographyCurriculum';

export interface PositionedNode extends CurriculumNode {
  x: number;
  y: number;
  width: number;
  height: number;
  rank: number;
}

export interface LayoutResult {
  nodes: PositionedNode[];
  edges: CurriculumEdge[];
  bounds: { width: number; height: number };
}

const TIER_SIZE: Record<CurriculumNode['tier'], { w: number; h: number }> = {
  root: { w: 300, h: 60 },
  topic: { w: 270, h: 54 },
  theme: { w: 230, h: 46 },
  outcome: { w: 250, h: 44 },
  case: { w: 240, h: 44 },
  mode: { w: 240, h: 46 },
  agent: { w: 230, h: 44 },
};

/**
 * Spacing is deliberately generous. The connector between two ranks has to
 * clear both boxes and still read as a distinct line, so the vertical gap is
 * more than three times a node's height.
 */
const RANK_GAP = 165;
const NODE_GAP = 40;
const COLUMN_GUTTER = 190;
const MARGIN = 90;

export const nodeSize = (tier: CurriculumNode['tier']) => TIER_SIZE[tier];

/** Column order left-to-right; `system` trails the three syllabus strands. */
const TOPIC_ORDER: CurriculumNode['topic'][] = ['tectonics', 'everyday', 'tourism', 'system'];

function assignRanks(graph: CurriculumGraph): Map<string, number> {
  const children = new Map<string, string[]>();
  const indegree = new Map<string, number>();

  for (const n of graph.nodes) {
    children.set(n.id, []);
    indegree.set(n.id, 0);
  }
  for (const e of graph.edges) {
    if (!children.has(e.from) || !indegree.has(e.to)) continue;
    children.get(e.from)!.push(e.to);
    indegree.set(e.to, indegree.get(e.to)! + 1);
  }

  const rank = new Map<string, number>();
  const roots = graph.nodes.filter((n) => indegree.get(n.id) === 0);
  const seeds = roots.length > 0 ? roots : [graph.nodes[0]];

  const queue = seeds.map((n) => ({ id: n.id, depth: 0 }));
  const cap = graph.nodes.length;

  while (queue.length > 0) {
    const { id, depth } = queue.shift()!;
    if (depth > cap) continue; // cycle guard
    if ((rank.get(id) ?? -1) >= depth) continue;
    rank.set(id, depth);
    for (const c of children.get(id) ?? []) queue.push({ id: c, depth: depth + 1 });
  }

  // Anything only reachable through a cycle still needs a home.
  for (const n of graph.nodes) if (!rank.has(n.id)) rank.set(n.id, 0);
  return rank;
}

function meanParentX(
  id: string,
  parents: Map<string, string[]>,
  centreX: Map<string, number>,
): number | null {
  const placed = (parents.get(id) ?? []).filter((p) => centreX.has(p));
  if (placed.length === 0) return null;
  return placed.reduce((s, p) => s + centreX.get(p)!, 0) / placed.length;
}

export function layoutGraph(graph: CurriculumGraph): LayoutResult {
  const rank = assignRanks(graph);

  const parents = new Map<string, string[]>();
  for (const n of graph.nodes) parents.set(n.id, []);
  for (const e of graph.edges) parents.get(e.to)?.push(e.from);

  const positioned: PositionedNode[] = [];
  const centreX = new Map<string, number>();
  let columnCursor = MARGIN;

  for (const topic of TOPIC_ORDER) {
    const members = graph.nodes.filter((n) => n.topic === topic);
    if (members.length === 0) continue;

    const byRank = new Map<number, CurriculumNode[]>();
    for (const n of members) {
      const r = rank.get(n.id)!;
      if (!byRank.has(r)) byRank.set(r, []);
      byRank.get(r)!.push(n);
    }

    const ranks = [...byRank.keys()].sort((a, b) => a - b);

    // A column is as wide as its own widest rank, not the global maximum —
    // that is what stops one dense rank from stretching the whole diagram.
    let columnWidth = 0;
    for (const r of ranks) {
      const row = byRank.get(r)!;
      const w = row.reduce((s, n) => s + nodeSize(n.tier).w, 0) + NODE_GAP * (row.length - 1);
      columnWidth = Math.max(columnWidth, w);
    }

    for (const r of ranks) {
      const row = byRank.get(r)!;

      // Order within a rank by the mean x of already-placed parents, so each
      // branch stays under the node it descends from.
      row.sort((a, b) => {
        const ba = meanParentX(a.id, parents, centreX);
        const bb = meanParentX(b.id, parents, centreX);
        if (ba !== null && bb !== null) return ba - bb;
        if (ba !== null) return -1;
        if (bb !== null) return 1;
        return a.id.localeCompare(b.id);
      });

      const rowWidth =
        row.reduce((s, n) => s + nodeSize(n.tier).w, 0) + NODE_GAP * (row.length - 1);

      // Centre each rank inside its column.
      let cursor = columnCursor + (columnWidth - rowWidth) / 2;
      const y = MARGIN + r * RANK_GAP;

      for (const n of row) {
        const { w, h } = nodeSize(n.tier);
        centreX.set(n.id, cursor + w / 2);
        positioned.push({ ...n, x: cursor, y, width: w, height: h, rank: r });
        cursor += w + NODE_GAP;
      }
    }

    columnCursor += columnWidth + COLUMN_GUTTER;
  }

  // Bounds come from the real extent so fit-to-view cannot leave nodes outside
  // the viewport.
  let maxX = 0;
  let maxY = 0;
  for (const n of positioned) {
    maxX = Math.max(maxX, n.x + n.width);
    maxY = Math.max(maxY, n.y + n.height);
  }

  return {
    nodes: positioned,
    edges: graph.edges,
    bounds: { width: maxX + MARGIN, height: maxY + MARGIN },
  };
}
