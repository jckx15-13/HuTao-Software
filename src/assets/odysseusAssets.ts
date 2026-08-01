export type OdysseusAsset = {
  id: string;
  label: string;
  type: 'image' | 'motion-demo';
  url: string;
  sourcePath: string;
  intendedUse: string;
  motionSensitive?: boolean;
};

export type OdysseusFeatureMapItem = {
  id: string;
  label: string;
  sourceModules: string[];
  silverWolfSurface: string;
  integrationState: 'Bridge-backed' | 'Source-mapped' | 'Asset-copied' | 'Not integrated';
  currentScope: string;
  securityBoundary: string;
};

export type OdysseusSourceDocAsset = {
  path: string;
  url: string;
  sourcePath: string;
  kind: 'image' | 'motion-demo' | 'a11y-screenshot' | 'page';
  motionSensitive?: boolean;
};

// import.meta.env.BASE_URL ends with '/', so this stays sub-path correct
// (e.g. '/HuTao-Software/odysseus-assets') without a trailing slash of its own.
export const ODYSSEUS_ASSET_ROOT = `${import.meta.env.BASE_URL}odysseus-assets`;

export const ODYSSEUS_SOURCE_DOC_ASSETS: OdysseusSourceDocAsset[] = [
  {
    path: 'a11y/focus-after.png',
    url: `${ODYSSEUS_ASSET_ROOT}/docs/a11y/focus-after.png`,
    sourcePath: 'odysseus/docs/a11y/focus-after.png',
    kind: 'a11y-screenshot'
  },
  {
    path: 'a11y/focus-before.png',
    url: `${ODYSSEUS_ASSET_ROOT}/docs/a11y/focus-before.png`,
    sourcePath: 'odysseus/docs/a11y/focus-before.png',
    kind: 'a11y-screenshot'
  },
  {
    path: 'a11y/login-after.png',
    url: `${ODYSSEUS_ASSET_ROOT}/docs/a11y/login-after.png`,
    sourcePath: 'odysseus/docs/a11y/login-after.png',
    kind: 'a11y-screenshot'
  },
  {
    path: 'a11y/login-before.png',
    url: `${ODYSSEUS_ASSET_ROOT}/docs/a11y/login-before.png`,
    sourcePath: 'odysseus/docs/a11y/login-before.png',
    kind: 'a11y-screenshot'
  },
  {
    path: 'bg.webm',
    url: `${ODYSSEUS_ASSET_ROOT}/docs/bg.webm`,
    sourcePath: 'odysseus/docs/bg.webm',
    kind: 'motion-demo',
    motionSensitive: true
  },
  {
    path: 'chat.gif',
    url: `${ODYSSEUS_ASSET_ROOT}/docs/chat.gif`,
    sourcePath: 'odysseus/docs/chat.gif',
    kind: 'motion-demo',
    motionSensitive: true
  },
  {
    path: 'chat.webm',
    url: `${ODYSSEUS_ASSET_ROOT}/docs/chat.webm`,
    sourcePath: 'odysseus/docs/chat.webm',
    kind: 'motion-demo',
    motionSensitive: true
  },
  {
    path: 'compare.gif',
    url: `${ODYSSEUS_ASSET_ROOT}/docs/compare.gif`,
    sourcePath: 'odysseus/docs/compare.gif',
    kind: 'motion-demo',
    motionSensitive: true
  },
  {
    path: 'compare.webm',
    url: `${ODYSSEUS_ASSET_ROOT}/docs/compare.webm`,
    sourcePath: 'odysseus/docs/compare.webm',
    kind: 'motion-demo',
    motionSensitive: true
  },
  {
    path: 'document.gif',
    url: `${ODYSSEUS_ASSET_ROOT}/docs/document.gif`,
    sourcePath: 'odysseus/docs/document.gif',
    kind: 'motion-demo',
    motionSensitive: true
  },
  {
    path: 'document.webm',
    url: `${ODYSSEUS_ASSET_ROOT}/docs/document.webm`,
    sourcePath: 'odysseus/docs/document.webm',
    kind: 'motion-demo',
    motionSensitive: true
  },
  {
    path: 'gallery-314-desktop.png',
    url: `${ODYSSEUS_ASSET_ROOT}/docs/gallery-314-desktop.png`,
    sourcePath: 'odysseus/docs/gallery-314-desktop.png',
    kind: 'image'
  },
  {
    path: 'gallery-314-mobile.png',
    url: `${ODYSSEUS_ASSET_ROOT}/docs/gallery-314-mobile.png`,
    sourcePath: 'odysseus/docs/gallery-314-mobile.png',
    kind: 'image'
  },
  {
    path: 'gallery.webm',
    url: `${ODYSSEUS_ASSET_ROOT}/docs/gallery.webm`,
    sourcePath: 'odysseus/docs/gallery.webm',
    kind: 'motion-demo',
    motionSensitive: true
  },
  {
    path: 'index.html',
    url: `${ODYSSEUS_ASSET_ROOT}/docs/index.html`,
    sourcePath: 'odysseus/docs/index.html',
    kind: 'page'
  },
  {
    path: 'notes.gif',
    url: `${ODYSSEUS_ASSET_ROOT}/docs/notes.gif`,
    sourcePath: 'odysseus/docs/notes.gif',
    kind: 'motion-demo',
    motionSensitive: true
  },
  {
    path: 'notes.webm',
    url: `${ODYSSEUS_ASSET_ROOT}/docs/notes.webm`,
    sourcePath: 'odysseus/docs/notes.webm',
    kind: 'motion-demo',
    motionSensitive: true
  },
  {
    path: 'odysseus.jpg',
    url: `${ODYSSEUS_ASSET_ROOT}/docs/odysseus.jpg`,
    sourcePath: 'odysseus/docs/odysseus.jpg',
    kind: 'image'
  },
  {
    path: 'research.gif',
    url: `${ODYSSEUS_ASSET_ROOT}/docs/research.gif`,
    sourcePath: 'odysseus/docs/research.gif',
    kind: 'motion-demo',
    motionSensitive: true
  },
  {
    path: 'research.webm',
    url: `${ODYSSEUS_ASSET_ROOT}/docs/research.webm`,
    sourcePath: 'odysseus/docs/research.webm',
    kind: 'motion-demo',
    motionSensitive: true
  },
  {
    path: 'theme.webm',
    url: `${ODYSSEUS_ASSET_ROOT}/docs/theme.webm`,
    sourcePath: 'odysseus/docs/theme.webm',
    kind: 'motion-demo',
    motionSensitive: true
  }
];

export const ODYSSEUS_ASSET_AUDIT = {
  sourceRoot: 'odysseus/docs',
  copiedRoot: `${ODYSSEUS_ASSET_ROOT}/docs`,
  copiedFileCount: ODYSSEUS_SOURCE_DOC_ASSETS.length,
  copiedMediaFileCount: ODYSSEUS_SOURCE_DOC_ASSETS.filter((asset) => asset.kind !== 'page').length,
  motionAssetsNotAutoplayed: true,
  executionBoundary:
    'Copied Odysseus media and page assets are provenance inputs only. Upstream scripts are not executed inside Silver Wolf.'
};

export const ODYSSEUS_ASSETS: OdysseusAsset[] = [
  {
    id: 'odysseus-hero',
    label: 'Odysseus hero artwork',
    type: 'image',
    url: `${ODYSSEUS_ASSET_ROOT}/docs/odysseus.jpg`,
    sourcePath: 'odysseus/docs/odysseus.jpg',
    intendedUse: 'Static identity and provenance artwork inside the Silver Wolf Odysseus console.'
  },
  {
    id: 'chat-demo',
    label: 'Chat and agents demo',
    type: 'motion-demo',
    url: `${ODYSSEUS_ASSET_ROOT}/docs/chat.gif`,
    sourcePath: 'odysseus/docs/chat.gif',
    intendedUse: 'Source demo clip for chat and agent workflows; listed but not autoplayed in Silver Wolf.',
    motionSensitive: true
  },
  {
    id: 'research-demo',
    label: 'Deep research demo',
    type: 'motion-demo',
    url: `${ODYSSEUS_ASSET_ROOT}/docs/research.gif`,
    sourcePath: 'odysseus/docs/research.gif',
    intendedUse: 'Source demo clip for research workflows; listed but not autoplayed in Silver Wolf.',
    motionSensitive: true
  },
  {
    id: 'documents-demo',
    label: 'Documents demo',
    type: 'motion-demo',
    url: `${ODYSSEUS_ASSET_ROOT}/docs/document.gif`,
    sourcePath: 'odysseus/docs/document.gif',
    intendedUse: 'Source demo clip for document workflows; listed but not autoplayed in Silver Wolf.',
    motionSensitive: true
  },
  {
    id: 'notes-demo',
    label: 'Notes and tasks demo',
    type: 'motion-demo',
    url: `${ODYSSEUS_ASSET_ROOT}/docs/notes.gif`,
    sourcePath: 'odysseus/docs/notes.gif',
    intendedUse: 'Source demo clip for notes and tasks workflows; listed but not autoplayed in Silver Wolf.',
    motionSensitive: true
  },
  {
    id: 'compare-demo',
    label: 'Model compare demo',
    type: 'motion-demo',
    url: `${ODYSSEUS_ASSET_ROOT}/docs/compare.gif`,
    sourcePath: 'odysseus/docs/compare.gif',
    intendedUse: 'Source demo clip for model comparison workflows; listed but not autoplayed in Silver Wolf.',
    motionSensitive: true
  },
  {
    id: 'gallery-desktop',
    label: 'Gallery desktop screenshot',
    type: 'image',
    url: `${ODYSSEUS_ASSET_ROOT}/docs/gallery-314-desktop.png`,
    sourcePath: 'odysseus/docs/gallery-314-desktop.png',
    intendedUse: 'Static visual source for future gallery/editor integration work.'
  },
  {
    id: 'gallery-mobile',
    label: 'Gallery mobile screenshot',
    type: 'image',
    url: `${ODYSSEUS_ASSET_ROOT}/docs/gallery-314-mobile.png`,
    sourcePath: 'odysseus/docs/gallery-314-mobile.png',
    intendedUse: 'Static visual source for future responsive gallery/editor integration work.'
  }
];

export const ODYSSEUS_FEATURE_MAP: OdysseusFeatureMapItem[] = [
  {
    id: 'chat-agent',
    label: 'Chat and agent loop',
    sourceModules: ['odysseus/static/js/chat.js', 'odysseus/src/agent_loop.py', 'odysseus/src/tool_schemas.py'],
    silverWolfSurface: 'Bridge status and model endpoint tabs',
    integrationState: 'Source-mapped',
    currentScope: 'Local or API model chat plus agent tool orchestration when the bridge exposes those routes.',
    securityBoundary:
      'Do not execute upstream browser scripts inside Silver Wolf; route through the local authenticated bridge.'
  },
  {
    id: 'models-cookbook',
    label: 'Model discovery and serving',
    sourceModules: ['odysseus/static/js/models.js', 'odysseus/src/tool_schemas.py'],
    silverWolfSurface: 'Models tab reads /api/models from the configured Silver Wolf bridge',
    integrationState: 'Bridge-backed',
    currentScope: 'List configured endpoints and models when the Odysseus bridge is reachable.',
    securityBoundary:
      'Model serving/download actions remain outside this UI until explicit admin-gated actions are wired.'
  },
  {
    id: 'memory-rag',
    label: 'Memory and RAG',
    sourceModules: ['odysseus/static/js/memory.js', 'odysseus/static/js/rag.js', 'odysseus/src/tool_schemas.py'],
    silverWolfSurface: 'Memory tab reads DB/RAG stats from the configured Silver Wolf bridge',
    integrationState: 'Bridge-backed',
    currentScope: 'Show local memory/vector-store availability without exposing raw memory contents.',
    securityBoundary: 'No memory mutation or document ingestion is performed by this Silver Wolf panel.'
  },
  {
    id: 'tasks',
    label: 'Tasks and scheduled automation',
    sourceModules: ['odysseus/static/js/tasks.js', 'odysseus/src/tool_schemas.py'],
    silverWolfSurface: 'Tasks tab lists and controls bridge-provided tasks',
    integrationState: 'Bridge-backed',
    currentScope: 'List, run, pause, and resume tasks when the bridge exposes them.',
    securityBoundary: 'Actions post only to the local bridge endpoint already used by the console.'
  },
  {
    id: 'research-docs-gallery',
    label: 'Research, documents, gallery, compare',
    sourceModules: [
      'odysseus/static/js/research/panel.js',
      'odysseus/static/js/document.js',
      'odysseus/static/js/gallery.js',
      'odysseus/static/js/compare/index.js'
    ],
    silverWolfSurface: 'Source map and copied demo assets only',
    integrationState: 'Asset-copied',
    currentScope:
      'These workflows are documented as upstream capabilities but are not yet fully user-accessible inside Silver Wolf.',
    securityBoundary: 'Needs route-by-route bridge integration before it can be presented as functional.'
  }
];

export function getOdysseusAssetSummary(): string {
  return ODYSSEUS_ASSETS.map((asset) => asset.label).join(', ');
}

export function getOdysseusSourceAssetSummary(): string {
  return `${ODYSSEUS_ASSET_AUDIT.copiedMediaFileCount} media and accessibility assets copied from ${ODYSSEUS_ASSET_AUDIT.sourceRoot}`;
}
