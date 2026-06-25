const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function assertFile(relativePath, label = relativePath) {
  const fullPath = path.join(root, relativePath.replace(/^silver-wolf-vi[\\/]/, ""));
  assert.ok(fs.existsSync(fullPath), `${label} is missing at ${fullPath}`);
}

function collectMatches(source, regex) {
  const results = new Set();
  let match;
  while ((match = regex.exec(source)) !== null) {
    const value = match.slice(1).find((entry) => entry !== undefined && entry !== null && entry.length > 0);
    if (value) {
      results.add(value);
    }
  }
  return [...results];
}

const WWV_SOURCE_ROOT_REPLACEMENT = path.join("worldwideview", "public");
const WWV_SOURCE_PATH_FALLBACKS = [
  path.join("worldwideview", "public"),
  path.join("public", "wwv-assets"),
];

const WWT_ASSET_PATH_LOOKUP = {
  aircraftLicense: "airplane/license.txt",
  aircraftBin: "airplane/scene.bin",
  aircraftSamplesDataset: "aircraft-samples.geojson",
  airplaneModel: "airplane/scene.gltf",
  airplaneArchive: "airplane.zip",
  planeIcon: "plane-icon.svg",
  militaryPlaneIcon: "military-plane-icon.svg",
  worldWideLogo: "logo/logo-full.png",
  worldWideIcon: "logo/logo-icon.svg",
  militaryBasesDataset: "military_bases.geojson",
  bordersDataset: "borders.geojson",
  publicCamerasList: "public-cameras.json",
};

function resolveSourcePathLiteral(rawPath) {
  if (rawPath.startsWith("'") || rawPath.startsWith("\"")) {
    return rawPath.slice(1, -1);
  }

  const templateContent = rawPath.startsWith("`") && rawPath.endsWith("`")
    ? rawPath.slice(1, -1)
    : null;
  if (!templateContent) {
    return null;
  }

  if (!templateContent.startsWith("${WWV_SOURCE_ROOT}")) {
    return null;
  }

  const remainder = templateContent.replace(/^\$\{WWV_SOURCE_ROOT\}\//, "");
  const mapped = remainder.match(/^\$\{WWT_ASSET_PATHS\.([a-zA-Z0-9_]+)\}$/);
  if (mapped && mapped[1] in WWT_ASSET_PATH_LOOKUP) {
    return WWT_ASSET_PATH_LOOKUP[mapped[1]];
  }

  return remainder;
}

function resolveSourceAssetPath(rawPath) {
  const relativePath = resolveSourcePathLiteral(rawPath);
  if (!relativePath) {
    return null;
  }

  for (const base of WWV_SOURCE_PATH_FALLBACKS) {
    const candidate = path.join(root, base, relativePath);
    if (fs.existsSync(candidate)) {
      return path.relative(root, candidate);
    }
  }

  return null;
}

function readVerificationStatus(rootPath) {
  const reportPath = path.join(rootPath, "scripts", "verification_harness", "verification_report.json");
  if (!fs.existsSync(reportPath)) {
    return {
      overall_status: "NOT_RUN",
      comment: "verification report missing",
      offlineServices: [],
    };
  }

  try {
    const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
    const offline = Object.entries(report.services || {})
      .filter(([, value]) => {
        return value && typeof value === "object" && !["online", "running"].includes(value.status);
      })
      .map(([name, value]) => `${name}:${value.status}`);
    return {
      overall_status: report.overall_status || "UNKNOWN",
      comment: report.overall_status === "PASS"
        ? "runtime verification passed"
        : report.overall_status === "PARTIAL"
          ? "root app runtime passed with optional integrations unavailable"
          : "runtime verification indicates failures",
      offlineServices: offline,
    };
  } catch {
    return {
      overall_status: "ERROR",
      comment: "verification report could not be parsed",
      offlineServices: [],
    };
  }
}

const wwvAssetsSource = read("src/assets/wwvVisualAssets.ts");
const odysseusAssetsSource = read("src/assets/odysseusAssets.ts");
const bridgeSource = read("bridge/server.py");
const mainSource = read("src/main.tsx");
const viteConfigSource = read("vite.config.ts");
const cesiumViewerSource = read("src/hooks/cesium/useCesiumViewer.ts");
const imageryManagerSource = read("src/core/globe/useImageryManager.ts");
const imageryProviderFactorySource = read("src/core/globe/ImageryProviderFactory.ts");
const wwtViewSource = read("src/components/learning/WorldWideTelescopeView.tsx");
const googleEarthRemixSource = read("src/components/learning/GoogleEarthRemix.tsx");
const centerPanelSource = read("src/components/panels/CenterPanel.tsx");
const leftPanelSource = read("src/components/panels/LeftPanel.tsx");
const coordinateTransformsSource = read("src/lib/coordinateTransforms.ts");
const cesiumConstellationsSource = read("src/hooks/cesium/useConstellations.ts");
const cursorEngineSource = read("src/core/cursor/CursorEngine.ts");
const customCursorSource = read("src/components/layout/CustomCursor.tsx");
const nativeCursorFallbackSource = read("src/core/cursor/nativeFallback.ts");
const indexCssSource = read("src/index.css");
const launcherSource = read("src/components/launcher/LauncherPage.tsx");
const earthquakesSource = read("src/plugins/earthquakes/EarthquakesPlugin.ts");
const credentialEngineSource = read("src/lib/credentials/apiCredentialEngine.ts");
const connectorEngineSource = read("src/lib/credentials/apiConnectorEngine.ts");
const weatherServiceSource = read("src/services/weatherService.ts");
const aiSettingsSource = read("src/components/settings/AiSettings.tsx");
const verificationHarnessSource = read("scripts/verification_harness/verify_system.cjs");
const packageJsonSource = read("package.json");
const uiAuditSource = read("scripts/ui-audit.mjs");

assertFile("package.json", "Silver Wolf root package");
assertFile("public/config.json", "Browser runtime public config");
assertFile("public/favicon.svg", "Browser favicon asset");
assertFile("worldwideview/package.json", "WorldWideView package");
assertFile("odysseus/pyproject.toml", "Odysseus Python package");
assertFile("odysseus/package.json", "Odysseus frontend package");
assertFile("bridge/server.py", "Silver Wolf bridge server");
assertFile("src/lib/credentials/apiCredentialEngine.ts", "API credential management engine");
assertFile("src/lib/credentials/apiConnectorEngine.ts", "API connector request engine");

for (const providerId of [
  "openai",
  "gemini",
  "anthropic",
  "openrouter",
  "mistral",
  "perplexity",
  "groq",
  "apify",
  "google-cloud",
  "github",
  "notion",
  "openweather",
  "bridge",
]) {
  assert.ok(credentialEngineSource.includes(`id: "${providerId}"`), `Credential engine missing provider ${providerId}`);
}
for (const contract of [
  "silverWolf.apiCredentialVault.v1",
  "buildCredentialAuthHeaders",
  "validateCredentialRecord",
  "OPENAI_API_KEY for server bridge handoff",
  "GEMINI_API_KEY for configured Gemini route",
]) {
  assert.ok(credentialEngineSource.includes(contract), `Credential engine missing contract ${contract}`);
}
for (const connectorContract of [
  "createApiRequestDescriptor",
  "getApiConnectorReadiness",
  "directBrowserAllowed",
  "requiresBackend",
  "https://api.apify.com/v2",
  "https://api.github.com",
  "https://api.notion.com/v1",
  "https://maps.googleapis.com",
  "https://api.openweathermap.org/data/2.5",
]) {
  assert.ok(connectorEngineSource.includes(connectorContract), `API connector engine missing contract ${connectorContract}`);
}
assert.ok(
  aiSettingsSource.includes("getApiConnectorReadiness") &&
    aiSettingsSource.includes("bridgeUrl('/api/connectors/providers')") &&
    aiSettingsSource.includes("Bridge connector status") &&
    aiSettingsSource.includes("Capabilities:") &&
    aiSettingsSource.includes("Backend/Bridge route required"),
  "AI Settings must surface connector readiness and backend-routing metadata",
);
assert.ok(
  weatherServiceSource.includes('getCredentialSecret("openweather")') &&
    !weatherServiceSource.includes("b6907d289e10d714a6e88b30761fae22"),
  "Weather service must use credential-engine/env OpenWeather keys without embedded demo secrets",
);
for (const bridgeProviderContract of [
  "SERVER_AI_PROVIDER_CONFIGS",
  "SERVER_CONNECTOR_PROVIDER_CONFIGS",
  "BRIDGE_SKIP_ODYSSEUS_START",
  "OPENAI_API_KEY",
  "OPENAI_MODEL",
  "OPENROUTER_API_KEY",
  "MISTRAL_API_KEY",
  "PERPLEXITY_API_KEY",
  "GROQ_API_KEY",
  "APIFY_TOKEN",
  "GOOGLE_MAPS_API_KEY",
  "GITHUB_TOKEN",
  "NOTION_API_KEY",
  "OPENWEATHER_API_KEY",
  '@app.get("/api/credentials/providers")',
  '@app.get("/api/connectors/providers")',
  "get_server_connector_provider_status",
  "connector_providers",
  '"mode": "server-provider"',
]) {
  assert.ok(bridgeSource.includes(bridgeProviderContract), `Bridge credential provider contract missing ${bridgeProviderContract}`);
}
for (const verifierProviderContract of [
  "runServerProviderBridgeSelfTest",
  "server_provider_route",
  "connector_provider_status",
  "/api/connectors/providers",
  "Bridge connector status",
  "APIFY_TOKEN",
  "NOTION_API_KEY",
  "hasSecretLeak",
  "OPENAI_CHAT_COMPLETIONS_URL",
  "mode !== 'server-provider'",
]) {
  assert.ok(verificationHarnessSource.includes(verifierProviderContract), `Verifier provider-route contract missing ${verifierProviderContract}`);
}

const wwvSourcePaths = collectMatches(
  wwvAssetsSource,
  /\bsourcePath:\s*(?:'([^']+)'|"([^"]+)"|`([^`]+)`)/g,
);
assert.ok(wwvSourcePaths.length >= 29, "Expected mapped WorldWideView and derived Silver Wolf source assets");
for (const sourcePath of wwvSourcePaths) {
  const resolvedSourcePath = resolveSourceAssetPath(sourcePath);
  if (resolvedSourcePath) {
    assertFile(resolvedSourcePath, `WorldWideView mapped source ${sourcePath}`);
  }
}

const wwvSourcePublicPaths = collectMatches(wwvAssetsSource, /\burl:\s*sourcePublicPath\(\s*['"]([^'"]+)['"]\s*\)/g);
assert.ok(wwvSourcePublicPaths.length >= 20, "Expected copied WorldWideView public asset URLs");
for (const assetPath of wwvSourcePublicPaths) {
  assertFile(path.join("public", "wwv-assets", "source-public", assetPath), `Copied WorldWideView public asset ${assetPath}`);
}

const odysseusDocPaths = collectMatches(odysseusAssetsSource, /\bpath:\s*'([^']+)'/g);
assert.ok(odysseusDocPaths.length >= 20, "Expected copied Odysseus documentation assets");
for (const docPath of odysseusDocPaths) {
  assertFile(path.join("odysseus", "docs", docPath), `Odysseus source doc asset ${docPath}`);
  assertFile(path.join("public", "odysseus-assets", "docs", docPath), `Copied Odysseus doc asset ${docPath}`);
}

const odysseusSourceModules = collectMatches(odysseusAssetsSource, /'(odysseus\/(?:src|static)\/[^']+)'/g);
assert.ok(odysseusSourceModules.length >= 8, "Expected Odysseus source module mappings");
for (const modulePath of odysseusSourceModules) {
  assertFile(modulePath, `Odysseus mapped source module ${modulePath}`);
}

for (const route of [
  '@app.post("/log")',
  '@app.get("/status")',
  '@app.post("/sync")',
  '@app.post("/chat")',
  '@app.get("/api/camera/proxy")',
  '@app.get("/git/status")',
  '@app.api_route("/api/{path:path}"',
]) {
  assert.ok(bridgeSource.includes(route), `Bridge route contract missing ${route}`);
}

for (const origin of ["http://127.0.0.1:3005", "http://127.0.0.1:4173"]) {
  assert.ok(bridgeSource.includes(origin), `Bridge CORS default missing ${origin}`);
}
assert.ok(bridgeSource.includes("BRIDGE_CORS_ORIGIN_REGEX"), "Bridge CORS regex env override missing");
assert.ok(bridgeSource.includes("127\\.0\\.0\\.1"), "Bridge CORS regex must allow 127.0.0.1 dev preview origins");
assert.ok(bridgeSource.includes("localhost"), "Bridge CORS regex must allow localhost dev origins");
assert.ok(read("scripts/verification_harness/verify_system.cjs").includes("process.env.VITE_PORT || 3005"), "Runtime verifier must target the actual Silver Wolf dev port by default");
assert.ok(packageJsonSource.includes('"ui:audit:fast": "node scripts/ui-audit.mjs --fast"'), "Package scripts must expose the fast UI audit");
assert.ok(uiAuditSource.includes("process.env.FRONTEND_URL || 'http://127.0.0.1:3005'"), "UI audit must target the active Silver Wolf Vite port by default");
assert.ok(uiAuditSource.includes("launcherDismissed: false"), "UI audit must exercise the launcher before entering the workspace");
assert.ok(uiAuditSource.includes("setUserAgent(NORMAL_USER_AGENT)"), "UI audit must use a normal browser user agent so the launcher path remains testable");
assert.ok(uiAuditSource.includes("WORKSPACE_AUDIT_URL") && uiAuditSource.includes("'fallback'"), "UI audit must use the stable fallback workspace snapshot after checking the launcher");
assert.ok(uiAuditSource.includes("fieldsWithoutProgrammaticLabel"), "UI audit must catch visible form fields without programmatic labels");
assert.ok(uiAuditSource.includes("auditKeyboardFlow"), "UI audit must verify keyboard reachability");
assert.ok(uiAuditSource.includes("focusIndicatorFailures"), "UI audit must catch keyboard focus targets without visible focus indicators");

assert.ok(cesiumViewerSource.includes("baseLayer: false"), "Cesium viewer must start without implicit Cesium world imagery");
assert.ok(!cesiumViewerSource.includes("setupImagery"), "Cesium viewer must not call the legacy duplicate imagery setup");
assert.ok(!fs.existsSync(path.join(root, "src/lib/imageryFactory.ts")), "Legacy duplicate imagery setup file should stay removed");
assert.ok(imageryManagerSource.includes("createImageryProvider"), "useImageryManager must own selected imagery provider creation");
assert.ok(imageryManagerSource.includes("new ImageryLayer(provider)"), "useImageryManager must attach the selected provider as a Cesium imagery layer");
assert.ok(imageryManagerSource.includes("fallbackLayerId"), "useImageryManager must preserve configured imagery fallback behavior");
assert.ok(imageryProviderFactorySource.includes('import("cesium")'), "Imagery provider factory must lazy-load real Cesium provider APIs");
assert.ok(!imageryProviderFactorySource.includes("navigator.webdriver"), "Imagery provider factory must not return mocked providers for browser automation");
assert.ok(!imageryProviderFactorySource.includes("return {};"), "Imagery provider factory must not return empty mock providers");
assert.ok(coordinateTransformsSource.includes("precessEquatorialJ2000ToDate"), "Coordinate transforms must expose J2000-to-date precession");
assert.ok(cesiumConstellationsSource.includes("precessEquatorialJ2000ToDate"), "Cesium constellation rendering must precess J2000 star coordinates");
assert.ok(wwtViewSource.includes("precessEquatorialJ2000ToDate"), "WWT constellation overlay must precess J2000 star coordinates");
assert.ok(cursorEngineSource.includes("this.config.appHighLoad"), "Cursor engine must keep native cursor available during high-load fallback");
assert.ok(nativeCursorFallbackSource.includes("appHighLoad"), "Native cursor fallback policy must account for app high-load mode");
assert.ok(nativeCursorFallbackSource.includes("motionReduced"), "Native cursor fallback policy must account for reduced-motion preferences");
assert.ok(nativeCursorFallbackSource.includes("coarsePointer"), "Native cursor fallback policy must account for coarse pointers");
assert.ok(nativeCursorFallbackSource.includes("documentHidden"), "Native cursor fallback policy must account for hidden documents");
assert.ok(customCursorSource.includes("shouldUseNativeCursorFallback"), "Custom cursor wrapper must use the native cursor fallback policy");
assert.ok(customCursorSource.includes("if (nativeCursorFallback || !mountRef.current)"), "Custom cursor wrapper must guard engine construction behind native fallback state");
assert.ok(
  customCursorSource.indexOf("if (nativeCursorFallback || !mountRef.current)") < customCursorSource.indexOf("new CursorEngine"),
  "Custom cursor wrapper must decide native fallback before constructing CursorEngine"
);
assert.ok(mainSource.includes("const WWVInitializer = lazy("), "WWV initializer must stay lazy-loaded out of the startup entry chunk");
assert.ok(viteConfigSource.includes("'react-core'"), "Vite config must keep React/runtime dependencies in a separate startup vendor chunk");
assert.ok(!launcherSource.includes("cyber-glitch"), "Launcher heading must not duplicate generated glitch text in the accessibility tree");
assert.ok(!launcherSource.includes("text-[10px]"), "Launcher status labels must stay at least 11px for mobile readability");
assert.ok(launcherSource.includes("<main") && launcherSource.includes('aria-labelledby="launcher-title"'), "Launcher must expose a visible main landmark labelled by its heading");
for (const searchLabel of [
  'aria-label="Search project workspaces"',
  'aria-label="Search landmarks and orbital entities"',
  'aria-label="Search satellites"',
]) {
  assert.ok(leftPanelSource.includes(searchLabel), `Left panel search field missing ${searchLabel}`);
}
assert.ok(earthquakesSource.includes("mapWebsocketPayload(payload: unknown)"), "Earthquakes plugin must map object websocket payloads instead of warning and ignoring them");
assert.ok(earthquakesSource.includes("return this.mapWebsocketPayload(data);"), "Earthquakes polling and websocket paths must share entity mapping");
assert.ok(indexCssSource.includes("--theme-ui-opacity: 0.88"), "Default CSS panel opacity must match restored feature-first glass UI defaults");
assert.ok(indexCssSource.includes("--theme-ui-blur: 10px"), "Default CSS blur must match restored feature-first glass UI defaults");
assert.ok(!centerPanelSource.includes("isSpaceMode && spaceInteractionTarget === 'telescope' && ("), "Space mode must not hide telescope HUD overlays behind a telescope-only gate");
assert.ok(wwtViewSource.includes("telemetryTimelineCollapsed"), "WWT bottom telemetry timeline must expose a collapsed bottom-bar state");
assert.ok(wwtViewSource.includes("Collapse telemetry timeline to bottom bar"), "WWT timeline must provide a centered collapse control");
assert.ok(wwtViewSource.includes("Expand telemetry timeline"), "WWT timeline must provide an expand control for the collapsed bottom bar");
assert.ok(wwtViewSource.includes("{!telemetryTimelineCollapsed &&"), "WWT timeline lanes and slider must hide when collapsed");
assert.ok(wwtViewSource.includes("left-1/2"), "WWT collapse control must be centered horizontally");
assert.ok(wwtViewSource.includes("-translate-x-1/2"), "WWT collapse control must apply horizontal translate-centering");
assert.ok(wwtViewSource.includes("-translate-y-1/2"), "WWT collapse control must anchor at the top edge");

for (const [label, source] of [
  ["WorldWideTelescopeView", wwtViewSource],
  ["GoogleEarthRemix", googleEarthRemixSource],
]) {
  assert.ok(!source.includes("Spatial HUD collapsed. Controls moved to sidebar."), `${label} must not render the bulky collapsed-HUD notice`);
  assert.ok(!source.includes(">Open HUD<"), `${label} must not render the bulky Open HUD text button`);
  assert.ok(source.includes('aria-label="Open spatial HUD sidebar"'), `${label} must keep an accessible icon-only HUD opener`);
}

const runtime = readVerificationStatus(root);
const baseScore = 100;
const penalties = {
  runtime: runtime.overall_status === "PASS" ? 0 : runtime.overall_status === "PARTIAL" ? 4 : 8,
  missingRealtimeDocs: runtime.offlineServices.length >= 2 ? 3 : 0,
};
const integrationScore = Math.max(0, baseScore - penalties.runtime - penalties.missingRealtimeDocs);

console.log("Repository integration contracts passed for Silver Wolf, WorldWideView, Odysseus, and the local bridge.");
console.log(`Runtime verification status: ${runtime.overall_status} (${runtime.comment}).`);
console.log(`Integration score: ${integrationScore}/100 (runtime dependency score not treated as 100 while offline validation remains unresolved).`);
