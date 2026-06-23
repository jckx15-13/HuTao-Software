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
    results.add(match[1]);
  }
  return [...results];
}

const wwvAssetsSource = read("src/assets/wwvVisualAssets.ts");
const odysseusAssetsSource = read("src/assets/odysseusAssets.ts");
const bridgeSource = read("bridge/server.py");
const cesiumViewerSource = read("src/hooks/cesium/useCesiumViewer.ts");
const imageryManagerSource = read("src/core/globe/useImageryManager.ts");
const imageryProviderFactorySource = read("src/core/globe/ImageryProviderFactory.ts");
const wwtViewSource = read("src/components/learning/WorldWideTelescopeView.tsx");
const googleEarthRemixSource = read("src/components/learning/GoogleEarthRemix.tsx");
const coordinateTransformsSource = read("src/lib/coordinateTransforms.ts");
const cesiumConstellationsSource = read("src/hooks/cesium/useConstellations.ts");
const cursorEngineSource = read("src/core/cursor/CursorEngine.ts");
const indexCssSource = read("src/index.css");

assertFile("package.json", "Silver Wolf root package");
assertFile("public/config.json", "Browser runtime public config");
assertFile("public/favicon.svg", "Browser favicon asset");
assertFile("worldwideview/package.json", "WorldWideView package");
assertFile("odysseus/pyproject.toml", "Odysseus Python package");
assertFile("odysseus/package.json", "Odysseus frontend package");
assertFile("bridge/server.py", "Silver Wolf bridge server");

const wwvSourcePaths = collectMatches(wwvAssetsSource, /\bsourcePath:\s*'([^']+)'/g);
assert.ok(wwvSourcePaths.length >= 29, "Expected mapped WorldWideView and derived Silver Wolf source assets");
for (const sourcePath of wwvSourcePaths) {
  assertFile(sourcePath, `WorldWideView mapped source ${sourcePath}`);
}

const wwvPublicUrls = collectMatches(wwvAssetsSource, /\burl:\s*'((?:\/wwv-assets)[^']+)'/g);
assert.ok(wwvPublicUrls.length >= 20, "Expected copied WorldWideView public asset URLs");
for (const assetUrl of wwvPublicUrls) {
  assertFile(path.join("public", assetUrl), `Copied WorldWideView public asset ${assetUrl}`);
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
assert.ok(indexCssSource.includes("--theme-ui-opacity: 0.92"), "Default CSS panel opacity must match readable non-glass UI defaults");
assert.ok(indexCssSource.includes("--theme-ui-blur: 8px"), "Default CSS blur must match runtime-clamped UI defaults");
assert.ok(wwtViewSource.includes("telemetryTimelineCollapsed"), "WWT bottom telemetry timeline must expose a collapsed bottom-bar state");
assert.ok(wwtViewSource.includes("Collapse telemetry timeline to bottom bar"), "WWT timeline must provide a centered collapse control");
assert.ok(wwtViewSource.includes("Expand telemetry timeline"), "WWT timeline must provide an expand control for the collapsed bottom bar");
assert.ok(wwtViewSource.includes("{!telemetryTimelineCollapsed &&"), "WWT timeline lanes and slider must hide when collapsed");

for (const [label, source] of [
  ["WorldWideTelescopeView", wwtViewSource],
  ["GoogleEarthRemix", googleEarthRemixSource],
]) {
  assert.ok(!source.includes("Spatial HUD collapsed. Controls moved to sidebar."), `${label} must not render the bulky collapsed-HUD notice`);
  assert.ok(!source.includes(">Open HUD<"), `${label} must not render the bulky Open HUD text button`);
  assert.ok(source.includes('aria-label="Open spatial HUD sidebar"'), `${label} must keep an accessible icon-only HUD opener`);
}

console.log("Repository integration contracts passed for Silver Wolf, WorldWideView, Odysseus, and the local bridge.");
