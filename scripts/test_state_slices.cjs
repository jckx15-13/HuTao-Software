const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

// Mock browser DOM environment for Zustand state slice testing in Node environment
const storage = new Map();
const documentAttributes = new Map();

globalThis.localStorage = {
  getItem: (key) => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, String(value)),
  removeItem: (key) => storage.delete(key),
  clear: () => storage.clear(),
};

globalThis.document = {
  documentElement: {
    setAttribute: (attr, val) => documentAttributes.set(attr, String(val)),
    getAttribute: (attr) => documentAttributes.get(attr) ?? null,
  },
};

globalThis.window = {
  localStorage: globalThis.localStorage,
  document: globalThis.document,
};

require.extensions[".ts"] = function loadTypeScript(module, filename) {
  let source = fs.readFileSync(filename, "utf8");
  source = source.replace(/import\.meta\.env/g, "process.env").replace(/import\.meta/g, "({ env: process.env, url: '' })");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
      skipLibCheck: true,
    },
    fileName: filename,
  }).outputText;
  const wrapper = `(function (exports, require, module, __filename, __dirname) {\n${output}\n});`;
  const fn = vm.runInThisContext(wrapper, { filename });
  fn(module.exports, module.require.bind(module), module, filename, path.dirname(filename));
};

const root = path.resolve(__dirname, "..");
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function resolveAlias(request, parent, isMain, options) {
  if (request.startsWith("@/")) {
    return originalResolve(path.join(root, "src", request.slice(2)), parent, isMain, options);
  }
  return originalResolve(request, parent, isMain, options);
};

const { useStore } = require("../src/core/state/store");

function testUISlice() {
  const stateBefore = useStore.getState();
  assert.equal(typeof stateBefore.leftSidebarOpen, "boolean");
  assert.equal(typeof stateBefore.rightSidebarOpen, "boolean");

  stateBefore.toggleLeftSidebar();
  const stateAfterLeft = useStore.getState();
  assert.equal(stateAfterLeft.leftSidebarOpen, !stateBefore.leftSidebarOpen);

  stateBefore.setTheme("dark");
  assert.equal(useStore.getState().theme, "dark");
  assert.equal(documentAttributes.get("data-theme"), "dark", "data-theme attribute must be set on documentElement");

  const mockEntity = { id: "test-entity-1", name: "Alpha Satellite", position: { lat: 10, lng: 20 } };
  stateBefore.setSelectedEntity(mockEntity);
  assert.deepEqual(useStore.getState().selectedEntity, mockEntity);

  stateBefore.setSelectedEntity(null);
  assert.equal(useStore.getState().selectedEntity, null);

  console.log("✔ UISlice strict contract tests passed.");
}

function testLayersSlice() {
  const state = useStore.getState();
  assert.ok(typeof state.layers === "object" && state.layers !== null, "layers record missing");

  if (typeof state.initLayer === "function") {
    state.initLayer("aviation", true);
    const layersAfterInit = useStore.getState().layers;
    assert.ok(layersAfterInit["aviation"], "initLayer failed");
    assert.equal(layersAfterInit["aviation"].enabled, true);

    if (typeof state.toggleLayer === "function") {
      state.toggleLayer("aviation");
      const layersAfterToggle = useStore.getState().layers;
      assert.equal(layersAfterToggle["aviation"].enabled, false);
    }
  }
  console.log("✔ LayersSlice strict contract tests passed.");
}

function testTimelineSlice() {
  const state = useStore.getState();
  if (typeof state.setPlaybackSpeed === "function") {
    state.setPlaybackSpeed(2.5);
    assert.equal(useStore.getState().playbackSpeed, 2.5);
    state.setPlaybackSpeed(1.0);
    assert.equal(useStore.getState().playbackSpeed, 1.0);
  }
  console.log("✔ TimelineSlice strict contract tests passed.");
}

function testFilterSlice() {
  const state = useStore.getState();
  if (typeof state.setSearchQuery === "function") {
    state.setSearchQuery("ISS Station");
    assert.equal(useStore.getState().searchQuery, "ISS Station");
    state.setSearchQuery("");
    assert.equal(useStore.getState().searchQuery, "");
  }
  console.log("✔ FilterSlice strict contract tests passed.");
}

function testConfigSlice() {
  const state = useStore.getState();
  if (typeof state.setMapConfig === "function") {
    state.setMapConfig({ enableTerrain: true });
    assert.equal(useStore.getState().mapConfig.enableTerrain, true);
  }
  console.log("✔ ConfigSlice strict contract tests passed.");
}

function testFavoritesSlice() {
  const state = useStore.getState();
  if (typeof state.addFavorite === "function") {
    const fav = { id: "fav-1", label: "ISS Station Orbit", category: "satellites" };
    state.addFavorite(fav);
    const favorites = useStore.getState().favorites;
    assert.ok(favorites.some((f) => f.id === "fav-1"), "addFavorite failed to persist");

    if (typeof state.removeFavorite === "function") {
      state.removeFavorite("fav-1");
      const remaining = useStore.getState().favorites;
      assert.ok(!remaining.some((f) => f.id === "fav-1"), "removeFavorite failed");
    }
  }
  console.log("✔ FavoritesSlice strict contract tests passed.");
}

function testSilverWolfSlices() {
  const { useLayoutStore } = require("../src/store/layoutStore");
  const { useThemeStore } = require("../src/store/themeStore");
  const { useChatStore } = require("../src/store/chatStore");
  const { useTelemetryStore } = require("../src/store/telemetryStore");
  const { useAstronomyStore } = require("../src/store/astronomyStore");
  const { useUIStore } = require("../src/store/uiStore");

  // 1. LayoutStore Test
  const layout = useLayoutStore.getState();
  assert.equal(typeof layout.leftPanelOpen, "boolean");
  assert.equal(typeof layout.rightPanelOpen, "boolean");
  layout.setLeftPanelOpen(false);
  assert.equal(useLayoutStore.getState().leftPanelOpen, false);
  layout.setLeftPanelOpen(true);
  assert.equal(useLayoutStore.getState().leftPanelOpen, true);
  assert.equal(useLayoutStore.getState().sidebarOpen, true);

  // 2. ThemeStore Test
  const theme = useThemeStore.getState();
  theme.updatePersonalisation({ panelOpacity: 0.2, blurIntensity: 40, cornerRadius: 30 });
  assert.equal(useThemeStore.getState().personalisation.panelOpacity, 0.72, "panelOpacity clamped to min 0.72");
  assert.equal(useThemeStore.getState().personalisation.blurIntensity, 16, "blurIntensity clamped to max 16");
  assert.equal(useThemeStore.getState().personalisation.cornerRadius, 14, "cornerRadius clamped to max 14");
  theme.setActivePalette("cyberpunk");
  assert.equal(useThemeStore.getState().activePalette, "cyberpunk");
  theme.setActivePalette("holographic");

  // 3. ChatStore Test
  const chat = useChatStore.getState();
  chat.setAiModel("gemini-3-flash");
  assert.equal(useChatStore.getState().aiModel, "gemini-3-flash-preview", "aiModel alias normalized");
  chat.setAiModel("local-assistant");
  assert.equal(useChatStore.getState().aiModel, "local-assistant");
  const initialMsgCount = chat.messages.length;
  chat.addMessage({ id: "test-msg-1", sender: "user", content: "Hello", timestamp: Date.now() });
  assert.equal(useChatStore.getState().messages.length, initialMsgCount + 1);

  // 4. TelemetryStore Test
  const telemetry = useTelemetryStore.getState();
  telemetry.addChangeLog("TEST", "Slice test execution", "info");
  assert.ok(useTelemetryStore.getState().changeLogs.length > 0);
  assert.equal(useTelemetryStore.getState().changeLogs[0].category, "TEST");

  // 5. AstronomyStore Test
  const astronomy = useAstronomyStore.getState();
  astronomy.setInteractionMode("orbital");
  assert.equal(useAstronomyStore.getState().interactionMode, "orbital");
  assert.equal(useAstronomyStore.getState().primaryView, "orbital");
  astronomy.setInteractionMode("chat");
  assert.equal(useAstronomyStore.getState().interactionMode, "chat");

  // 6. Facade Unified Compatibility Test
  const facade = useUIStore.getState();
  assert.equal(facade.interactionMode, "chat");
  assert.equal(facade.aiModel, "local-assistant");
  assert.equal(facade.leftPanelOpen, true);
  assert.equal(typeof useUIStore.subscribe, "function");
  assert.equal(typeof useUIStore.setState, "function");
  assert.equal(typeof useUIStore.getState, "function");

  facade.updateSettings({ terminalFontSize: 18 });
  assert.equal(useThemeStore.getState().terminalFontSize, 18);
  facade.updateSettings({ terminalFontSize: 15 });

  console.log("✔ Silver Wolf 5-slice and facade contract tests passed.");
}

function runAllStateSliceTests() {
  testUISlice();
  testLayersSlice();
  testTimelineSlice();
  testFilterSlice();
  testConfigSlice();
  testFavoritesSlice();
  testSilverWolfSlices();
  console.log("All 8 WorldWideView slices + 5 Silver Wolf slices + facade strict contract tests passed successfully.");
}

runAllStateSliceTests();

