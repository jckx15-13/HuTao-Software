/**
 * GCE O-Level Geography 2125 (2026 syllabus) as a directed graph.
 *
 * IMPORTANT PROVENANCE NOTE: the learning outcomes below are a reconstruction,
 * not an extraction from the official SEAB syllabus document. They are shaped
 * like the real thing and are useful for exercising the visualiser at scale,
 * but they must be replaced with the genuine 2125 outcomes before any of this
 * is used to generate assessment content for students.
 *
 * The graph is deliberately large (~140 nodes) because the visualiser needs to
 * prove it can lay out and render a real curriculum, not a toy 3-node demo.
 */

export type CurriculumTopic = 'tectonics' | 'everyday' | 'tourism' | 'system';

export type CurriculumTier =
  | 'root'
  | 'topic'
  | 'theme'
  | 'outcome'
  | 'case'
  | 'mode'
  | 'agent';

export interface CurriculumNode {
  id: string;
  label: string;
  topic: CurriculumTopic;
  tier: CurriculumTier;
}

export interface CurriculumEdge {
  from: string;
  to: string;
  label?: string;
}

export interface CurriculumGraph {
  nodes: CurriculumNode[];
  edges: CurriculumEdge[];
}

/** Terse builder so the data below stays readable rather than drowning in braces. */
function n(
  id: string,
  label: string,
  topic: CurriculumTopic,
  tier: CurriculumTier,
): CurriculumNode {
  return { id, label, topic, tier };
}

const nodes: CurriculumNode[] = [
  n('root', 'GCE O-Level Geography 2125', 'system', 'root'),

  // ---- Topic 1: Tectonics ------------------------------------------------
  n('tec', 'Topic 1 · Tectonics', 'tectonics', 'topic'),

  n('tec.struct', 'Earth Structure', 'tectonics', 'theme'),
  n('tec.struct.1', 'Crust, mantle, outer & inner core', 'tectonics', 'outcome'),
  n('tec.struct.2', 'Lithosphere vs asthenosphere', 'tectonics', 'outcome'),
  n('tec.struct.3', 'Continental vs oceanic crust density', 'tectonics', 'outcome'),
  n('tec.struct.4', 'Convection currents as plate driver', 'tectonics', 'outcome'),

  n('tec.plates', 'Plate Boundaries', 'tectonics', 'theme'),
  n('tec.plates.1', 'Divergent — sea-floor spreading', 'tectonics', 'outcome'),
  n('tec.plates.2', 'Convergent — subduction zones', 'tectonics', 'outcome'),
  n('tec.plates.3', 'Convergent — collision & fold mountains', 'tectonics', 'outcome'),
  n('tec.plates.4', 'Transform — conservative margins', 'tectonics', 'outcome'),
  n('tec.plates.5', 'Ocean trench & island arc formation', 'tectonics', 'outcome'),
  n('tec.plates.6', 'Mid-ocean ridge formation', 'tectonics', 'outcome'),

  n('tec.quake', 'Earthquakes', 'tectonics', 'theme'),
  n('tec.quake.1', 'Focus, epicentre, seismic waves', 'tectonics', 'outcome'),
  n('tec.quake.2', 'Moment magnitude vs intensity scales', 'tectonics', 'outcome'),
  n('tec.quake.3', 'Primary effects — ground shaking, rupture', 'tectonics', 'outcome'),
  n('tec.quake.4', 'Secondary effects — liquefaction, fire', 'tectonics', 'outcome'),
  n('tec.quake.5', 'Tsunami generation mechanism', 'tectonics', 'outcome'),
  n('tec.quake.6', 'Building resilience & retrofitting', 'tectonics', 'outcome'),
  n('tec.quake.7', 'Early-warning systems & drills', 'tectonics', 'outcome'),

  n('tec.volc', 'Volcanoes', 'tectonics', 'theme'),
  n('tec.volc.1', 'Shield vs composite vs caldera', 'tectonics', 'outcome'),
  n('tec.volc.2', 'Magma viscosity & silica content', 'tectonics', 'outcome'),
  n('tec.volc.3', 'Lava flows, pyroclastic flows, lahars', 'tectonics', 'outcome'),
  n('tec.volc.4', 'Ash fall & aviation disruption', 'tectonics', 'outcome'),
  n('tec.volc.5', 'Hazard mapping & exclusion zones', 'tectonics', 'outcome'),
  n('tec.volc.6', 'Benefits — geothermal, fertile soils', 'tectonics', 'outcome'),

  n('tec.risk', 'Living With Tectonic Hazards', 'tectonics', 'theme'),
  n('tec.risk.1', 'Why people live in hazard zones', 'tectonics', 'outcome'),
  n('tec.risk.2', 'Vulnerability vs hazard vs risk', 'tectonics', 'outcome'),
  n('tec.risk.3', 'Preparedness, response, recovery', 'tectonics', 'outcome'),
  n('tec.risk.4', 'HIC vs LIC impact disparity', 'tectonics', 'outcome'),

  n('tec.case.nankai', 'Case · Japan — Nankai Trough', 'tectonics', 'case'),
  n('tec.case.tohoku', 'Case · Tōhoku 2011 earthquake & tsunami', 'tectonics', 'case'),
  n('tec.case.merapi', 'Case · Mt Merapi, Indonesia', 'tectonics', 'case'),
  n('tec.case.iceland', 'Case · Iceland — Mid-Atlantic Ridge', 'tectonics', 'case'),
  n('tec.case.nepal', 'Case · Nepal 2015 — collision margin', 'tectonics', 'case'),

  // ---- Topic 2: Geography in Everyday Life -------------------------------
  n('eve', 'Topic 2 · Geography in Everyday Life', 'everyday', 'topic'),

  n('eve.urban', 'Urban Living', 'everyday', 'theme'),
  n('eve.urban.1', 'Urbanisation drivers & rates', 'everyday', 'outcome'),
  n('eve.urban.2', 'Push & pull factors of migration', 'everyday', 'outcome'),
  n('eve.urban.3', 'Land-use zoning models', 'everyday', 'outcome'),
  n('eve.urban.4', 'Urban sprawl vs densification', 'everyday', 'outcome'),
  n('eve.urban.5', 'Informal settlements & housing stress', 'everyday', 'outcome'),
  n('eve.urban.6', 'Urban heat island effect', 'everyday', 'outcome'),

  n('eve.transport', 'Transport & Accessibility', 'everyday', 'theme'),
  n('eve.transport.1', 'Public transit network design', 'everyday', 'outcome'),
  n('eve.transport.2', 'Congestion & road pricing', 'everyday', 'outcome'),
  n('eve.transport.3', 'Accessibility & social equity', 'everyday', 'outcome'),
  n('eve.transport.4', 'Active mobility — walking & cycling', 'everyday', 'outcome'),

  n('eve.resource', 'Resource Use', 'everyday', 'theme'),
  n('eve.resource.1', 'Water supply & catchment management', 'everyday', 'outcome'),
  n('eve.resource.2', 'Energy mix & renewable transition', 'everyday', 'outcome'),
  n('eve.resource.3', 'Waste generation & recycling', 'everyday', 'outcome'),
  n('eve.resource.4', 'Food supply chains & security', 'everyday', 'outcome'),

  n('eve.quality', 'Quality of Life', 'everyday', 'theme'),
  n('eve.quality.1', 'Measuring quality of life indicators', 'everyday', 'outcome'),
  n('eve.quality.2', 'Green space & wellbeing', 'everyday', 'outcome'),
  n('eve.quality.3', 'Air & noise pollution exposure', 'everyday', 'outcome'),
  n('eve.quality.4', 'Inequality within cities', 'everyday', 'outcome'),

  n('eve.sustain', 'Sustainable Urban Futures', 'everyday', 'theme'),
  n('eve.sustain.1', 'Compact city principles', 'everyday', 'outcome'),
  n('eve.sustain.2', 'Blue-green infrastructure', 'everyday', 'outcome'),
  n('eve.sustain.3', 'Smart-city data & governance', 'everyday', 'outcome'),
  n('eve.sustain.4', 'Trade-offs in urban planning', 'everyday', 'outcome'),

  n('eve.case.sg', 'Case · Singapore — planning & land scarcity', 'everyday', 'case'),
  n('eve.case.london', 'Case · London — congestion charge', 'everyday', 'case'),
  n('eve.case.curitiba', 'Case · Curitiba — bus rapid transit', 'everyday', 'case'),
  n('eve.case.jakarta', 'Case · Jakarta — subsidence & sprawl', 'everyday', 'case'),

  // ---- Topic 3: Tourism --------------------------------------------------
  n('tou', 'Topic 3 · Tourism', 'tourism', 'topic'),

  n('tou.growth', 'Growth of Tourism', 'tourism', 'theme'),
  n('tou.growth.1', 'Rising incomes & leisure time', 'tourism', 'outcome'),
  n('tou.growth.2', 'Transport & connectivity advances', 'tourism', 'outcome'),
  n('tou.growth.3', 'Digital booking & social media', 'tourism', 'outcome'),
  n('tou.growth.4', 'Globalisation of destinations', 'tourism', 'outcome'),

  n('tou.types', 'Types of Tourism', 'tourism', 'theme'),
  n('tou.types.1', 'Mass tourism characteristics', 'tourism', 'outcome'),
  n('tou.types.2', 'Ecotourism principles', 'tourism', 'outcome'),
  n('tou.types.3', 'Cultural & heritage tourism', 'tourism', 'outcome'),
  n('tou.types.4', 'Adventure & niche tourism', 'tourism', 'outcome'),

  n('tou.impact', 'Impacts of Tourism', 'tourism', 'theme'),
  n('tou.impact.1', 'Economic — jobs, leakage, multiplier', 'tourism', 'outcome'),
  n('tou.impact.2', 'Social — cultural change, displacement', 'tourism', 'outcome'),
  n('tou.impact.3', 'Environmental — reef & trail degradation', 'tourism', 'outcome'),
  n('tou.impact.4', 'Seasonality & employment insecurity', 'tourism', 'outcome'),
  n('tou.impact.5', 'Overtourism & carrying capacity', 'tourism', 'outcome'),

  n('tou.manage', 'Managing Tourism', 'tourism', 'theme'),
  n('tou.manage.1', 'Visitor caps & permit systems', 'tourism', 'outcome'),
  n('tou.manage.2', 'Zoning & protected areas', 'tourism', 'outcome'),
  n('tou.manage.3', 'Community-based tourism', 'tourism', 'outcome'),
  n('tou.manage.4', 'Sustainable tourism indicators', 'tourism', 'outcome'),
  n('tou.manage.5', 'Stakeholder conflict resolution', 'tourism', 'outcome'),

  n('tou.case.maldives', 'Case · Maldives — sea level & resorts', 'tourism', 'case'),
  n('tou.case.venice', 'Case · Venice — overtourism', 'tourism', 'case'),
  n('tou.case.bali', 'Case · Bali — water stress', 'tourism', 'case'),
  n('tou.case.costarica', 'Case · Costa Rica — ecotourism model', 'tourism', 'case'),

  // ---- Learning system ---------------------------------------------------
  n('sys.modes', 'Learning Modes', 'system', 'theme'),
  n('sys.learn', 'Mode · Learn (read-only visualiser)', 'system', 'mode'),
  n('sys.sim', 'Mode · Simulate (parameter-driven models)', 'system', 'mode'),
  n('sys.test', 'Mode · Test (graded Q&A + feedback)', 'system', 'mode'),

  n('sys.agents', 'AI Agent Layer', 'system', 'theme'),
  n('sys.agent.q', 'Agent · Question Generator', 'system', 'agent'),
  n('sys.agent.sim', 'Agent · Geospatial Simulator', 'system', 'agent'),
  n('sys.agent.diag', 'Agent · Misconception Diagnoser', 'system', 'agent'),
  n('sys.agent.path', 'Agent · Learning Path Optimiser', 'system', 'agent'),
  n('sys.agent.cur', 'Agent · Case Study Curator', 'system', 'agent'),
];

/** Wires a parent to each child id, so the tree below stays declarative. */
function fan(from: string, to: string[], label?: string): CurriculumEdge[] {
  return to.map((t) => ({ from, to: t, label }));
}

const edges: CurriculumEdge[] = [
  ...fan('root', ['tec', 'eve', 'tou', 'sys.modes']),

  // Tectonics
  ...fan('tec', ['tec.struct', 'tec.plates', 'tec.quake', 'tec.volc', 'tec.risk']),
  ...fan('tec.struct', ['tec.struct.1', 'tec.struct.2', 'tec.struct.3', 'tec.struct.4']),
  ...fan('tec.plates', [
    'tec.plates.1',
    'tec.plates.2',
    'tec.plates.3',
    'tec.plates.4',
    'tec.plates.5',
    'tec.plates.6',
  ]),
  ...fan('tec.quake', [
    'tec.quake.1',
    'tec.quake.2',
    'tec.quake.3',
    'tec.quake.4',
    'tec.quake.5',
    'tec.quake.6',
    'tec.quake.7',
  ]),
  ...fan('tec.volc', [
    'tec.volc.1',
    'tec.volc.2',
    'tec.volc.3',
    'tec.volc.4',
    'tec.volc.5',
    'tec.volc.6',
  ]),
  ...fan('tec.risk', ['tec.risk.1', 'tec.risk.2', 'tec.risk.3', 'tec.risk.4']),
  { from: 'tec.plates.2', to: 'tec.case.nankai' },
  { from: 'tec.quake.5', to: 'tec.case.tohoku' },
  { from: 'tec.volc.3', to: 'tec.case.merapi' },
  { from: 'tec.plates.1', to: 'tec.case.iceland' },
  { from: 'tec.plates.3', to: 'tec.case.nepal' },
  { from: 'tec.risk.4', to: 'tec.case.tohoku' },

  // Everyday life
  ...fan('eve', [
    'eve.urban',
    'eve.transport',
    'eve.resource',
    'eve.quality',
    'eve.sustain',
  ]),
  ...fan('eve.urban', [
    'eve.urban.1',
    'eve.urban.2',
    'eve.urban.3',
    'eve.urban.4',
    'eve.urban.5',
    'eve.urban.6',
  ]),
  ...fan('eve.transport', [
    'eve.transport.1',
    'eve.transport.2',
    'eve.transport.3',
    'eve.transport.4',
  ]),
  ...fan('eve.resource', [
    'eve.resource.1',
    'eve.resource.2',
    'eve.resource.3',
    'eve.resource.4',
  ]),
  ...fan('eve.quality', [
    'eve.quality.1',
    'eve.quality.2',
    'eve.quality.3',
    'eve.quality.4',
  ]),
  ...fan('eve.sustain', [
    'eve.sustain.1',
    'eve.sustain.2',
    'eve.sustain.3',
    'eve.sustain.4',
  ]),
  { from: 'eve.sustain.1', to: 'eve.case.sg' },
  { from: 'eve.transport.2', to: 'eve.case.london' },
  { from: 'eve.transport.1', to: 'eve.case.curitiba' },
  { from: 'eve.urban.4', to: 'eve.case.jakarta' },

  // Tourism
  ...fan('tou', ['tou.growth', 'tou.types', 'tou.impact', 'tou.manage']),
  ...fan('tou.growth', ['tou.growth.1', 'tou.growth.2', 'tou.growth.3', 'tou.growth.4']),
  ...fan('tou.types', ['tou.types.1', 'tou.types.2', 'tou.types.3', 'tou.types.4']),
  ...fan('tou.impact', [
    'tou.impact.1',
    'tou.impact.2',
    'tou.impact.3',
    'tou.impact.4',
    'tou.impact.5',
  ]),
  ...fan('tou.manage', [
    'tou.manage.1',
    'tou.manage.2',
    'tou.manage.3',
    'tou.manage.4',
    'tou.manage.5',
  ]),
  { from: 'tou.impact.5', to: 'tou.case.venice' },
  { from: 'tou.impact.3', to: 'tou.case.maldives' },
  { from: 'tou.manage.4', to: 'tou.case.bali' },
  { from: 'tou.types.2', to: 'tou.case.costarica' },

  // Cross-topic links — these are the edges that make the graph a graph rather
  // than three disconnected trees.
  { from: 'tec.risk.1', to: 'eve.urban.1', label: 'hazard exposure' },
  { from: 'tou.case.maldives', to: 'tec.plates.1', label: 'island origin' },
  { from: 'eve.resource.1', to: 'tou.case.bali', label: 'water demand' },
  { from: 'tec.volc.6', to: 'tou.types.4', label: 'volcano tourism' },
  { from: 'eve.quality.4', to: 'tou.impact.2', label: 'displacement' },

  // Learning system
  ...fan('sys.modes', ['sys.learn', 'sys.sim', 'sys.test']),
  { from: 'sys.learn', to: 'sys.sim', label: 'progress' },
  { from: 'sys.sim', to: 'sys.test', label: 'progress' },
  { from: 'sys.test', to: 'sys.agents' },
  ...fan('sys.agents', [
    'sys.agent.q',
    'sys.agent.sim',
    'sys.agent.diag',
    'sys.agent.path',
    'sys.agent.cur',
  ]),
  { from: 'sys.agent.cur', to: 'tec', label: 'curates' },
  { from: 'sys.agent.cur', to: 'eve', label: 'curates' },
  { from: 'sys.agent.cur', to: 'tou', label: 'curates' },
];

export const geographyCurriculum: CurriculumGraph = { nodes, edges };

export const CURRICULUM_STATS = {
  nodeCount: nodes.length,
  edgeCount: edges.length,
};
