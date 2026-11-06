const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

// Mock browser DOM environment for Node.js execution
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
  querySelectorAll: () => [],
};

globalThis.window = {
  localStorage: globalThis.localStorage,
  document: globalThis.document,
  innerWidth: 1920,
  innerHeight: 1080,
  addEventListener: () => {},
  removeEventListener: () => {},
  location: { href: 'http://localhost:3005', search: '' },
};

globalThis.navigator = {
  userAgent: 'Mozilla/5.0 (Adversarial-Stress-Harness)',
  webdriver: false,
};

if (globalThis.performance) {
  globalThis.performance.getEntriesByType = () => [];
} else {
  globalThis.performance = {
    now: () => Date.now(),
    getEntriesByType: () => [],
  };
}

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

// Load stores and utilities
const { useLayoutStore } = require("../src/store/layoutStore");
const { useThemeStore } = require("../src/store/themeStore");
const { useChatStore } = require("../src/store/chatStore");
const { useTelemetryStore } = require("../src/store/telemetryStore");
const { useAstronomyStore } = require("../src/store/astronomyStore");
const { useUIStore } = require("../src/store/uiStore");
const { useDiagnosticsStore } = require("../src/store/diagnosticsStore");
const {
  PERSONALISATION_DEFAULTS,
  ACTIVE_AI_MODELS,
  normalizeAiModel,
  normalizePersonalisation,
  resolveStartupLayout,
  enforcePanelBudget,
  buildDefaultUiState,
  sanitizePersistedUiState,
  UI_DEFAULTS,
  SATELLITE_CATEGORY_DEFAULTS,
  SATELLITE_SETTINGS_DEFAULTS,
} = require("../src/core/defaults/uiDefaults");

console.log("================================================================================");
console.log("⚡ INITIATING ADVERSARIAL STRESS TEST SUITE: ZUSTAND STORES & UI FACADE");
console.log("================================================================================");

// -----------------------------------------------------------------------------
// TEST 1: CONCURRENT & HIGH-VOLUME MUTATIONS ACROSS ALL 5 SLICES
// -----------------------------------------------------------------------------
async function testConcurrentHighVolumeMutations() {
  console.log("\n[TEST 1] Stress-testing 10,000 concurrent mutations across 5 slices...");

  const ITERATIONS = 2000; // 2000 x 5 = 10,000 operations
  const promises = [];

  const layout = useLayoutStore.getState();
  const theme = useThemeStore.getState();
  const chat = useChatStore.getState();
  const telemetry = useTelemetryStore.getState();
  const astronomy = useAstronomyStore.getState();

  const start = Date.now();

  for (let i = 0; i < ITERATIONS; i++) {
    // 1. Layout mutation
    promises.push(
      (async () => {
        const toggle = i % 2 === 0;
        layout.setLeftPanelOpen(toggle);
        layout.setRightPanelTab(i % 3 === 0 ? 'context' : i % 3 === 1 ? 'browser' : 'telemetry');
        layout.setSpaceHudTab(i % 2 === 0 ? 'layers' : 'navigation');
      })()
    );

    // 2. Theme mutation
    promises.push(
      (async () => {
        theme.updatePersonalisation({
          panelOpacity: 0.75 + (i % 20) * 0.01,
          blurIntensity: (i % 16),
          animationIntensity: (i % 100) / 100,
        });
        theme.setTerminalFontSize(12 + (i % 10));
      })()
    );

    // 3. Chat mutation
    promises.push(
      (async () => {
        chat.addMessage({
          id: `stress-msg-${i}`,
          sender: i % 2 === 0 ? 'user' : 'assistant',
          content: `Message chunk payload ${i}`,
          timestamp: Date.now(),
        });
        if (i % 10 === 0) {
          chat.setIsProcessing(i % 20 === 0);
        }
      })()
    );

    // 4. Telemetry mutation
    promises.push(
      (async () => {
        telemetry.setCpuLoad(Math.min(1.0, (i % 100) / 100));
        telemetry.updateSystemMetrics({
          ramUsage: (i % 100) / 100,
          networkLatency: (i % 50) / 100,
        });
        telemetry.addChangeLog('CONCURRENT_TEST', `Burst log payload index ${i}`, i % 2 === 0 ? 'info' : 'warning');
      })()
    );

    // 5. Astronomy mutation
    promises.push(
      (async () => {
        astronomy.setCameraSensitivity(1.0 + (i % 40) / 10);
        astronomy.setSpaceBlendOpacity((i % 100) / 100);
        astronomy.setCelestialOverlaySettings({
          showGrid: i % 2 === 0,
          showConstellationLines: i % 3 === 0,
        });
      })()
    );
  }

  await Promise.all(promises);
  const elapsed = Date.now() - start;
  console.log(`✔ Completed 10,000 concurrent mutations in ${elapsed}ms (${(10000 / (elapsed / 1000)).toFixed(0)} ops/sec)`);

  // Assert state invariants
  assert.equal(typeof useLayoutStore.getState().leftPanelOpen, 'boolean');
  assert.ok(useThemeStore.getState().personalisation.panelOpacity >= 0.72 && useThemeStore.getState().personalisation.panelOpacity <= 0.98);
  assert.ok(useChatStore.getState().messages.length >= ITERATIONS);
  assert.equal(useTelemetryStore.getState().changeLogs.length, 100, "Changelogs must be capped at 100 after 2000 writes");
  assert.ok(useAstronomyStore.getState().cameraSensitivity >= 1.0);
}

// -----------------------------------------------------------------------------
// TEST 2: RING BUFFER LIMITS & DIAGNOSTIC CHANGELOG STRESS
// -----------------------------------------------------------------------------
function testRingBufferLimits() {
  console.log("\n[TEST 2] Verifying ring buffer limits (changeLogs: 100, diagnosticsStore: 500)...");

  const telemetry = useTelemetryStore.getState();
  telemetry.clearChangeLogs();
  assert.equal(useTelemetryStore.getState().changeLogs.length, 0, "clearChangeLogs should empty changeLogs");

  // Push 350 items sequentially
  for (let i = 1; i <= 350; i++) {
    telemetry.addChangeLog(`CATEGORY_${i}`, `Log message sequence ${i}`, i % 2 === 0 ? 'success' : 'error');
  }

  const logs = useTelemetryStore.getState().changeLogs;
  assert.equal(logs.length, 100, "Ring buffer MUST be strictly capped at 100 items");
  assert.equal(logs[0].category, "CATEGORY_350", "Index 0 must always be the newest entry (LIFO ring buffer)");
  assert.equal(logs[99].category, "CATEGORY_251", "Index 99 must be the 100th most recent entry");
  assert.ok(logs[0].id.startsWith("log-"), "Log ID must have correct prefix");
  assert.ok(typeof logs[0].timestamp === 'string', "Timestamp must be string formatted");

  // Test sanitizeChangeLogs with over-sized and corrupted entries
  const oversizedRaw = Array.from({ length: 250 }, (_, i) => ({
    id: `custom-id-${i}`,
    timestamp: `2026-08-21T20:00:00.${i}Z`,
    category: `RAW_${i}`,
    message: `Message ${i}`,
    level: i % 2 === 0 ? 'info' : 'invalid_level'
  }));

  const sanitizedLogs = sanitizePersistedUiState({ changeLogs: oversizedRaw }).state.changeLogs;
  assert.ok(Array.isArray(sanitizedLogs), "Sanitized changeLogs must be array");
  assert.equal(sanitizedLogs.length, 100, "Sanitized changeLogs must be capped at 100 items");
  assert.equal(sanitizedLogs[0].id, "custom-id-0");
  assert.equal(sanitizedLogs[1].level, "info", "Invalid level must fall back to 'info'");

  // Test useDiagnosticsStore ring buffer (500 limit)
  const diagnostics = useDiagnosticsStore.getState();
  diagnostics.clear();
  assert.equal(useDiagnosticsStore.getState().entries.length, 0);

  for (let i = 1; i <= 600; i++) {
    diagnostics.add({
      level: 'info',
      message: `Diagnostic entry ${i}`,
      metadata: { sequence: i }
    });
  }

  const diagEntries = useDiagnosticsStore.getState().entries;
  assert.equal(diagEntries.length, 500, "DiagnosticsStore must be strictly capped at 500 entries");
  assert.equal(diagEntries[0].message, "Diagnostic entry 600", "Index 0 must be newest diagnostic");
  console.log("✔ Ring buffer strict limit (100 items changeLogs, 500 items diagnostics) verified.");
}

// -----------------------------------------------------------------------------
// TEST 3: PERSISTENCE SERIALIZATION / DESERIALIZATION & STORAGE KEYS
// -----------------------------------------------------------------------------
function testPersistenceSerialization() {
  console.log("\n[TEST 3] Testing persistence serialization, partialize boundaries, and rehydration...");

  // Verify slice persist names
  const expectedStores = [
    { name: 'silver-wolf-v6-layout', store: useLayoutStore },
    { name: 'silver-wolf-v6-theme', store: useThemeStore },
    { name: 'silver-wolf-v6-chat', store: useChatStore },
    { name: 'silver-wolf-v6-telemetry', store: useTelemetryStore },
    { name: 'silver-wolf-v6-astronomy', store: useAstronomyStore },
  ];

  // Inspect storage keys
  for (const { name, store } of expectedStores) {
    const raw = storage.get(name);
    assert.ok(raw !== undefined, `Storage key '${name}' should exist after store mutations`);
    const parsed = JSON.parse(raw);
    assert.ok(typeof parsed === 'object' && parsed !== null, `Parsed storage value for '${name}' must be an object`);
    assert.ok('state' in parsed, `Storage for '${name}' must have 'state' envelope`);
  }

  // Verify partialize boundaries: non-persisted fields MUST NOT exist in storage
  const layoutStored = JSON.parse(storage.get('silver-wolf-v6-layout')).state;
  assert.equal(layoutStored.rightPanelTab, undefined, "rightPanelTab must not be persisted in layout store");
  assert.equal(layoutStored.topBarOpen, undefined, "topBarOpen must not be persisted in layout store");
  assert.equal(layoutStored.currentPage, undefined, "currentPage must not be persisted in layout store");
  assert.ok('leftPanelOpen' in layoutStored, "leftPanelOpen must be persisted");
  assert.ok('rightPanelOpen' in layoutStored, "rightPanelOpen must be persisted");

  const chatStored = JSON.parse(storage.get('silver-wolf-v6-chat')).state;
  assert.equal(chatStored.messages, undefined, "chat messages must NOT be persisted in chatStore persist envelope");
  assert.equal(chatStored.chatSessions, undefined, "chatSessions must NOT be persisted in chatStore persist envelope");
  assert.equal(chatStored.isProcessing, undefined, "isProcessing must NOT be persisted");
  assert.ok('aiModel' in chatStored, "aiModel must be persisted");

  const telemetryStored = JSON.parse(storage.get('silver-wolf-v6-telemetry')).state;
  assert.equal(telemetryStored.cpuLoad, undefined, "cpuLoad must not be persisted");
  assert.equal(telemetryStored.systemMetrics, undefined, "systemMetrics must not be persisted");
  assert.equal(telemetryStored.diagnostics, undefined, "diagnostics must not be persisted in telemetry store");
  assert.ok('changeLogs' in telemetryStored, "changeLogs must be persisted");
  assert.ok('satelliteCategories' in telemetryStored, "satelliteCategories must be persisted");

  const astronomyStored = JSON.parse(storage.get('silver-wolf-v6-astronomy')).state;
  assert.equal(astronomyStored.activeLocation, undefined, "activeLocation must not be persisted");
  assert.equal(astronomyStored.measureStart, undefined, "measureStart must not be persisted");
  assert.ok('interactionMode' in astronomyStored, "interactionMode must be persisted");
  assert.ok('cameraSensitivity' in astronomyStored, "cameraSensitivity must be persisted");

  console.log("✔ Persistence isolation and partialize boundaries verified.");
}

// -----------------------------------------------------------------------------
// TEST 4: CORRUPTED LOCALSTORAGE STATE & SANITIZER RECOVERY
// -----------------------------------------------------------------------------
function testCorruptedLocalStorageAndSanitizers() {
  console.log("\n[TEST 4] Adversarially stress-testing sanitizers with malformed, extreme, and polluted payloads...");

  // Case 1: Corrupted primitives and non-objects
  assert.deepEqual(sanitizePersistedUiState(null).state, {});
  assert.deepEqual(sanitizePersistedUiState(undefined).state, {});
  assert.deepEqual(sanitizePersistedUiState(12345).state, {});
  assert.deepEqual(sanitizePersistedUiState("corrupted json string").state, {});
  assert.deepEqual(sanitizePersistedUiState([1, 2, 3]).state, {});
  assert.deepEqual(sanitizePersistedUiState(true).state, {});

  // Case 2: Extreme numerical values, NaN, Infinity, -Infinity
  const extremePayload = {
    cameraSensitivity: NaN,
    spaceBlendOpacity: Infinity,
    lastSyncTime: -Infinity,
    personalisation: {
      panelOpacity: NaN,
      blurIntensity: Infinity,
      animationIntensity: -50,
      cornerRadius: 9999,
      shadowIntensity: -10,
      fontScale: 1e10,
      accentColor: 12345, // invalid type
      borderStyle: 'non-existent-border-style',
      chatBubbleStyle: 'hacker-glow',
      iconStyle: 'neon-cube',
      uiDensity: 'ultra-dense',
      fontFamily: 'Comic Sans MS',
      panelTransitionStyle: 'warp-speed',
      minimalMode: 'not-a-boolean'
    }
  };

  const extremeResult = sanitizePersistedUiState(extremePayload);
  assert.ok(extremeResult.rejected.includes('cameraSensitivity'), "NaN cameraSensitivity must be rejected");
  assert.ok(extremeResult.rejected.includes('spaceBlendOpacity'), "Infinity spaceBlendOpacity must be rejected");
  assert.ok(extremeResult.rejected.includes('lastSyncTime'), "-Infinity lastSyncTime must be rejected");

  const sanitizedP = extremeResult.state.personalisation;
  assert.equal(sanitizedP.panelOpacity, PERSONALISATION_DEFAULTS.panelOpacity, "NaN panelOpacity must fall back to default");
  assert.equal(sanitizedP.blurIntensity, PERSONALISATION_DEFAULTS.blurIntensity, "Infinity blurIntensity must fall back to default");
  assert.equal(sanitizedP.animationIntensity, 0, "Negative animation intensity must clamp to min 0");
  assert.equal(sanitizedP.cornerRadius, 14, "Extreme cornerRadius must clamp to max 14");
  assert.equal(sanitizedP.shadowIntensity, 0, "Negative shadowIntensity must clamp to 0");
  assert.equal(sanitizedP.fontScale, 1.6, "Extreme fontScale must clamp to max 1.6");
  assert.equal(sanitizedP.accentColor, PERSONALISATION_DEFAULTS.accentColor, "Non-string accentColor must fall back");
  assert.equal(sanitizedP.borderStyle, PERSONALISATION_DEFAULTS.borderStyle, "Invalid borderStyle enum must fall back");
  assert.equal(sanitizedP.chatBubbleStyle, PERSONALISATION_DEFAULTS.chatBubbleStyle, "Invalid chatBubbleStyle enum must fall back");
  assert.equal(sanitizedP.iconStyle, PERSONALISATION_DEFAULTS.iconStyle, "Invalid iconStyle enum must fall back");
  assert.equal(sanitizedP.uiDensity, PERSONALISATION_DEFAULTS.uiDensity, "Invalid uiDensity enum must fall back");
  assert.equal(sanitizedP.fontFamily, PERSONALISATION_DEFAULTS.fontFamily, "Invalid fontFamily enum must fall back");
  assert.equal(sanitizedP.panelTransitionStyle, PERSONALISATION_DEFAULTS.panelTransitionStyle, "Invalid transition enum must fall back");
  assert.equal(sanitizedP.minimalMode, PERSONALISATION_DEFAULTS.minimalMode, "Invalid minimalMode type must fall back");

  // Case 3: Malformed satellite data
  const malformedSatellites = {
    satelliteData: {
      valid1: { tle: ["1 25544U 98067A", "2 25544 51.64"], timestamp: 1787345000 },
      invalidTleNotArray: { tle: "1 25544U", timestamp: 1787345000 },
      invalidTleBadArrayTypes: { tle: [123, 456], timestamp: 1787345000 },
      invalidTimestampNaN: { tle: ["1 25544U", "2 25544"], timestamp: NaN },
      invalidTimestampInfinity: { tle: ["1 25544U", "2 25544"], timestamp: Infinity },
      invalidTimestampString: { tle: ["1 25544U", "2 25544"], timestamp: "2026-08-21" },
      invalidEntryPrimitive: "just-a-string",
    }
  };

  const satResult = sanitizePersistedUiState(malformedSatellites);
  assert.deepEqual(Object.keys(satResult.state.satelliteData), ["valid1"], "Only valid satellite data entries must survive");

  // Case 4: Prototype pollution injection attempt
  const pollutionPayload = JSON.parse('{"__proto__": {"polluted": true}, "constructor": {"prototype": {"polluted": true}}}');
  const pollutionResult = sanitizePersistedUiState(pollutionPayload);
  assert.equal(({}).polluted, undefined, "Prototype pollution must NOT pollute Object prototype");
  assert.deepEqual(pollutionResult.state, {}, "Empty clean object returned for pollution payload");

  // Case 5: URL sanitization & injection attempt in browserUrl
  const maliciousUrls = [
    "javascript:alert('XSS')",
    "data:text/html,<script>alert(1)</script>",
    "vbscript:msgbox(1)",
    "file:///etc/passwd",
    "",
    null,
    12345
  ];

  for (const url of maliciousUrls) {
    const res = sanitizePersistedUiState({ browserUrl: url });
    assert.equal(res.state.browserUrl, undefined, `Malicious or invalid URL '${url}' must be rejected`);
    assert.ok(res.rejected.includes('browserUrl'));
  }

  const validUrls = ["https://nasa.gov", "http://localhost:3005", "https://worldwidetelescope.org/webclient/"];
  for (const url of validUrls) {
    const res = sanitizePersistedUiState({ browserUrl: url });
    assert.equal(res.state.browserUrl, url, `Valid URL '${url}' must be preserved`);
  }

  console.log("✔ All corrupted localStorage, extreme number, prototype pollution, and URL sanitizer tests passed.");
}

// -----------------------------------------------------------------------------
// TEST 5: LEGACY STATE MIGRATIONS & NORMALIZERS
// -----------------------------------------------------------------------------
function testLegacyStateMigrations() {
  console.log("\n[TEST 5] Verifying legacy state migrations, model aliases, and provider replacements...");

  // AI Model normalization & legacy aliases
  assert.equal(normalizeAiModel("gemini-3-flash"), "gemini-3-flash-preview");
  assert.equal(normalizeAiModel("gemini-3-pro"), "gemini-3.1-pro-preview");
  assert.equal(normalizeAiModel("gpt-4"), "local-assistant");
  assert.equal(normalizeAiModel("gpt-4o"), "local-assistant");
  assert.equal(normalizeAiModel("claude-3-opus"), "local-assistant");
  assert.equal(normalizeAiModel("non-existent-ai"), "local-assistant");
  assert.equal(normalizeAiModel(null), "local-assistant");
  assert.equal(normalizeAiModel(undefined), "local-assistant");
  assert.equal(normalizeAiModel(12345), "local-assistant");

  for (const validModel of ACTIVE_AI_MODELS) {
    assert.equal(normalizeAiModel(validModel), validModel, `Active model ${validModel} must preserve`);
  }

  // Retired imagery provider migration
  const retiredProvider = sanitizePersistedUiState({ imageryProvider: "cesium" });
  assert.equal(retiredProvider.state.imageryProvider, "arcgis-world", "Retired 'cesium' provider must migrate to 'arcgis-world'");

  const validProvider = sanitizePersistedUiState({ imageryProvider: "sentinel-2" });
  assert.equal(validProvider.state.imageryProvider, "sentinel-2");

  // Corrupted / black sphere WWT background layer migration
  const corruptedWwt = sanitizePersistedUiState({ wwtBackgroundLayer: "Visible Imagery" });
  assert.equal(corruptedWwt.state.wwtBackgroundLayer, undefined, "'Visible Imagery' must be rejected so default applies");

  const validWwt = sanitizePersistedUiState({ wwtBackgroundLayer: "3D Solar System View" });
  assert.equal(validWwt.state.wwtBackgroundLayer, "3D Solar System View");

  // AstronomyStore legacy alias primaryView <-> interactionMode
  const astronomy = useAstronomyStore.getState();
  astronomy.setPrimaryView("telescope");
  assert.equal(useAstronomyStore.getState().interactionMode, "telescope");
  assert.equal(useAstronomyStore.getState().primaryView, "telescope");

  astronomy.setInteractionMode("orbital");
  assert.equal(useAstronomyStore.getState().interactionMode, "orbital");
  assert.equal(useAstronomyStore.getState().primaryView, "orbital");

  // LayoutStore legacy aliases: sidebarOpen, showSettings
  const layout = useLayoutStore.getState();
  layout.setShowSettings(true);
  assert.equal(useLayoutStore.getState().currentPage, "settings");
  assert.equal(useLayoutStore.getState().showSettings, true);

  layout.setShowSettings(false);
  assert.equal(useLayoutStore.getState().currentPage, "workspace");
  assert.equal(useLayoutStore.getState().showSettings, false);

  layout.setCurrentPage("settings");
  assert.equal(useLayoutStore.getState().showSettings, true);

  layout.setLauncherDismissed(true);
  assert.equal(useLayoutStore.getState().currentPage, "workspace");
  assert.equal(useLayoutStore.getState().launcherDismissed, true);

  console.log("✔ Legacy state migrations and backward-compatibility aliases verified.");
}

// -----------------------------------------------------------------------------
// TEST 6: CROSS-STORE REACTIVITY & UI FACADE INTEGRATION
// -----------------------------------------------------------------------------
function testCrossStoreReactivityAndFacade() {
  console.log("\n[TEST 6] Testing cross-store reactivity and useUIStore facade unified lifecycle...");

  // 1. Cross-store interaction: setActiveLocation triggering layoutStore panel
  useLayoutStore.setState({ rightPanelOpen: false, rightPanelTab: 'telemetry' });
  assert.equal(useLayoutStore.getState().rightPanelOpen, false);

  useAstronomyStore.getState().setActiveLocation({
    id: 'tokyo',
    name: 'Tokyo Observatory',
    lat: 35.6762,
    lng: 139.6503,
  });

  assert.equal(useAstronomyStore.getState().activeLocation?.id, 'tokyo');
  assert.equal(useLayoutStore.getState().rightPanelOpen, true, "setActiveLocation must open right panel");
  assert.equal(useLayoutStore.getState().rightPanelTab, 'context', "setActiveLocation must switch right panel tab to 'context'");

  // 2. Facade Subscription reactivity
  let subscriberCallCount = 0;
  let lastSeenState = null;
  let lastSeenPrev = null;

  const unsubscribe = useUIStore.subscribe((curr, prev) => {
    subscriberCallCount++;
    lastSeenState = curr;
    lastSeenPrev = prev;
  });

  // Mutate ThemeStore -> Subscriber notified
  useThemeStore.getState().setActivePalette('cyberpunk');
  assert.ok(subscriberCallCount > 0, "Subscriber must be notified on themeStore change");
  assert.equal(lastSeenState.activePalette, 'cyberpunk');

  // Mutate LayoutStore -> Subscriber notified
  const countBefore = subscriberCallCount;
  useLayoutStore.getState().setLeftPanelOpen(false);
  assert.ok(subscriberCallCount > countBefore, "Subscriber must be notified on layoutStore change");
  assert.equal(lastSeenState.leftPanelOpen, false);

  // Unsubscribe and verify no more notifications
  unsubscribe();
  const countAfterUnsub = subscriberCallCount;
  useThemeStore.getState().setActivePalette('holographic');
  assert.equal(subscriberCallCount, countAfterUnsub, "Unsubscribed listener must NOT receive further events");

  // 3. Facade updateSettings multi-slice update
  useUIStore.getState().updateSettings({
    activePalette: 'synthwave',
    aiModel: 'gemini-2.5-flash',
    cameraSensitivity: 2.8,
    launcherDismissed: true,
    terminalFontSize: 16
  });

  assert.equal(useThemeStore.getState().activePalette, 'synthwave');
  assert.equal(useThemeStore.getState().terminalFontSize, 16);
  assert.equal(useChatStore.getState().aiModel, 'gemini-2.5-flash');
  assert.equal(useAstronomyStore.getState().cameraSensitivity, 2.8);
  assert.equal(useLayoutStore.getState().launcherDismissed, true);

  // 4. Facade setState with functional updater
  useUIStore.setState((s) => ({
    cameraSensitivity: s.cameraSensitivity + 1.0,
    terminalFontSize: s.terminalFontSize + 2
  }));

  assert.equal(useAstronomyStore.getState().cameraSensitivity, 3.8);
  assert.equal(useThemeStore.getState().terminalFontSize, 18);

  console.log("✔ Cross-store reactivity and facade unified state binding verified.");
}

// -----------------------------------------------------------------------------
// TEST 7: STORE SETTER BOUNDARY & EDGE CASE TORTURE
// -----------------------------------------------------------------------------
function testStoreSetterEdgeCases() {
  console.log("\n[TEST 7] Torture-testing individual store setters with extreme and invalid types...");

  // ThemeStore updatePersonalisation
  const theme = useThemeStore.getState();
  theme.updatePersonalisation(null);
  theme.updatePersonalisation(undefined);
  theme.updatePersonalisation({});
  theme.updatePersonalisation({ panelOpacity: -999, blurIntensity: 999 });
  assert.equal(useThemeStore.getState().personalisation.panelOpacity, 0.72);
  assert.equal(useThemeStore.getState().personalisation.blurIntensity, 16);

  // ChatStore session & message mutations
  const chat = useChatStore.getState();
  const origSessions = chat.chatSessions.length;
  chat.addChatSession("Project Alpha", "project", "Odysseus Research");
  assert.equal(useChatStore.getState().chatSessions.length, origSessions + 1);
  const newSessionId = useChatStore.getState().activeChatId;
  assert.ok(newSessionId.startsWith("session-"));

  // Attempt removing protected 'global-main'
  chat.removeChatSession("global-main");
  assert.ok(useChatStore.getState().chatSessions.some(s => s.id === "global-main"), "global-main cannot be removed");

  // Append to non-existent message
  chat.appendToMessage("non-existent-msg-id", "some content");

  // Set message content on non-existent message
  chat.setMessageContent("non-existent-msg-id", "new content");

  // Remove active custom session -> falls back to global-main
  chat.removeChatSession(newSessionId);
  assert.equal(useChatStore.getState().activeChatId, "global-main");

  // TelemetryStore toggleSatelliteCategory with arbitrary strings
  const telemetry = useTelemetryStore.getState();
  telemetry.toggleSatelliteCategory("customNewCategory");
  assert.equal(useTelemetryStore.getState().satelliteCategories.customNewCategory, true);
  telemetry.toggleSatelliteCategory("customNewCategory");
  assert.equal(useTelemetryStore.getState().satelliteCategories.customNewCategory, false);

  // AstronomyStore setCelestialOverlaySettings partial merge
  const astronomy = useAstronomyStore.getState();
  const prevConstLines = astronomy.celestialOverlaySettings.showConstellationLines;
  astronomy.setCelestialOverlaySettings({ showGrid: true });
  assert.equal(useAstronomyStore.getState().celestialOverlaySettings.showGrid, true);
  assert.equal(useAstronomyStore.getState().celestialOverlaySettings.showConstellationLines, prevConstLines, "Unchanged settings must stay intact");

  // Responsive panel budget clamping on mobile resize
  globalThis.window.innerWidth = 800; // mobile / tablet < 1024
  layout = useLayoutStore.getState();
  layout.setLeftPanelOpen(true);
  assert.equal(useLayoutStore.getState().leftPanelOpen, true);
  assert.equal(useLayoutStore.getState().rightPanelOpen, false, "Opening left panel on mobile must close right panel");

  layout.setRightPanelOpen(true);
  assert.equal(useLayoutStore.getState().rightPanelOpen, true);
  assert.equal(useLayoutStore.getState().leftPanelOpen, false, "Opening right panel on mobile must close left panel");

  // Reset window width
  globalThis.window.innerWidth = 1920;

  console.log("✔ Store setter boundary torture tests passed.");
}

// -----------------------------------------------------------------------------
// TEST 8: CHAT STREAMING ISOLATION & MULTI-SESSION CONCURRENCY
// -----------------------------------------------------------------------------
function testStreamingChatIsolationAndConcurrentSessions() {
  console.log("\n[TEST 8] Stress-testing LLM streaming token bursts across concurrent chat sessions...");

  const chat = useChatStore.getState();
  
  // Create 3 parallel sessions
  chat.addChatSession("Session 1", "project", "Odysseus Analysis");
  const s1 = useChatStore.getState().activeChatId;
  chat.addMessage({ id: "stream-msg-1", sender: "assistant", content: "", timestamp: Date.now() });

  chat.addChatSession("Session 2", "global");
  const s2 = useChatStore.getState().activeChatId;
  chat.addMessage({ id: "stream-msg-2", sender: "assistant", content: "", timestamp: Date.now() });

  // Stream 100 tokens to active Session 2
  for (let i = 0; i < 100; i++) {
    chat.appendToMessage("stream-msg-2", `token_${i} `);
  }

  const s2Messages = useChatStore.getState().messages;
  const s2Msg = s2Messages.find(m => m.id === "stream-msg-2");
  assert.ok(s2Msg.content.includes("token_0 ") && s2Msg.content.includes("token_99 "));

  // Attempt appending to Session 1 while Session 2 is active (should safely no-op without corrupting)
  chat.appendToMessage("stream-msg-1", "rogue token");
  
  // Switch to Session 1 and verify isolation
  chat.setActiveChatId(s1);
  const s1Messages = useChatStore.getState().messages;
  const s1Msg = s1Messages.find(m => m.id === "stream-msg-1");
  assert.equal(s1Msg.content, "", "Session 1 message must not receive rogue tokens while Session 2 was active");

  // Stream tokens to Session 1 now that it is active
  for (let i = 0; i < 50; i++) {
    chat.appendToMessage("stream-msg-1", `s1_chunk_${i} `);
  }
  const updatedS1Msg = useChatStore.getState().messages.find(m => m.id === "stream-msg-1");
  assert.ok(updatedS1Msg.content.startsWith("s1_chunk_0 ") && updatedS1Msg.content.includes("s1_chunk_49 "));

  // Clean up sessions
  chat.removeChatSession(s1);
  chat.removeChatSession(s2);
  assert.equal(useChatStore.getState().activeChatId, "global-main");
  console.log("✔ Chat multi-session streaming isolation verified.");
}

// -----------------------------------------------------------------------------
// TEST 9: TELEMETRY LONG-RUN RING BUFFER MEMORY STABILITY (50,000 items)
// -----------------------------------------------------------------------------
function testTelemetryLongRunRingBufferMemoryStability() {
  console.log("\n[TEST 9] Pounding telemetry ring buffer with 50,000 sequential entries to test GC & memory stability...");

  const telemetry = useTelemetryStore.getState();
  const startHeap = process.memoryUsage().heapUsed;
  const start = Date.now();

  for (let i = 1; i <= 50000; i++) {
    telemetry.addChangeLog(`CATEGORY_${i % 10}`, `Continuous load test entry ${i} with padding data 1234567890`, i % 2 === 0 ? 'info' : 'warning');
  }

  const duration = Date.now() - start;
  const endHeap = process.memoryUsage().heapUsed;
  const logs = useTelemetryStore.getState().changeLogs;

  assert.equal(logs.length, 100, "Ring buffer must stay strictly 100 items after 50,000 insertions");
  assert.equal(logs[0].category, "CATEGORY_0", "Newest item must be at index 0");
  assert.ok(logs[0].message.includes("50000"));

  const heapDiffMb = (endHeap - startHeap) / (1024 * 1024);
  console.log(`✔ 50,000 ring buffer insertions completed in ${duration}ms (${(50000 / (duration / 1000)).toFixed(0)} ops/sec), heap delta: ${heapDiffMb.toFixed(2)} MB`);
}

// -----------------------------------------------------------------------------
// TEST 10: STORAGE QUOTA EXCEEDED / WRITE FAILURE RESILIENCE
// -----------------------------------------------------------------------------
function testStorageQuotaFailureAndResilience() {
  console.log("\n[TEST 10] Testing store resilience against localStorage QuotaExceededError / write exceptions...");

  const origSetItem = globalThis.localStorage.setItem;
  let throwError = true;

  // Make localStorage throw QuotaExceededError
  globalThis.localStorage.setItem = (key, val) => {
    if (throwError) {
      const err = new Error("QuotaExceededError: The quota has been exceeded.");
      err.name = "QuotaExceededError";
      throw err;
    }
    return origSetItem(key, val);
  };

  // Mutating stores updates in-memory state even if synchronous storage persist throws
  let themeThrew = false;
  let layoutThrew = false;
  let astronomyThrew = false;

  try {
    try {
      useThemeStore.getState().setActivePalette("neon-cyber");
    } catch (err) {
      themeThrew = true;
      assert.equal(err.name, "QuotaExceededError");
    }

    try {
      useLayoutStore.getState().setLeftPanelOpen(false);
    } catch (err) {
      layoutThrew = true;
      assert.equal(err.name, "QuotaExceededError");
    }

    try {
      useAstronomyStore.getState().setCameraSensitivity(4.2);
    } catch (err) {
      astronomyThrew = true;
      assert.equal(err.name, "QuotaExceededError");
    }

    // Verify that exceptions bubbled as expected when raw localStorage throws
    assert.ok(themeThrew && layoutThrew && astronomyThrew, "Raw localStorage QuotaExceededError bubbles through synchronous persist");

    // Verify that in-memory store state was successfully updated despite storage write failure
    assert.equal(useThemeStore.getState().activePalette, "neon-cyber", "In-memory activePalette updated despite storage error");
    assert.equal(useLayoutStore.getState().leftPanelOpen, false, "In-memory leftPanelOpen updated despite storage error");
    assert.equal(useAstronomyStore.getState().cameraSensitivity, 4.2, "In-memory cameraSensitivity updated despite storage error");
  } finally {
    throwError = false;
    globalThis.localStorage.setItem = origSetItem;
  }

  console.log("✔ Store mutations continue operating in memory even when storage writes throw.");
}

// -----------------------------------------------------------------------------
// TEST 11: FACADE SUBSCRIBER MULTIPLEXING UNDER RAPID LOAD
// -----------------------------------------------------------------------------
function testFacadeSubscriberMultiplexingUnderRapidLoad() {
  console.log("\n[TEST 11] Multiplexing 20 concurrent UI facade subscribers under rapid multi-slice mutations...");

  const subscriberEvents = new Array(20).fill(0);
  const unsubs = [];

  for (let i = 0; i < 20; i++) {
    const idx = i;
    unsubs.push(
      useUIStore.subscribe((curr, prev) => {
        subscriberEvents[idx]++;
      })
    );
  }

  // Fire 100 multi-slice updates via facade updateSettings
  for (let i = 0; i < 100; i++) {
    useUIStore.getState().updateSettings({
      terminalFontSize: 12 + (i % 8),
      cameraSensitivity: 1.0 + (i % 20) / 10
    });
  }

  // Verify all 20 subscribers received equal events
  const firstCount = subscriberEvents[0];
  assert.ok(firstCount > 0, "Subscribers must receive events");
  for (let i = 1; i < 20; i++) {
    assert.equal(subscriberEvents[i], firstCount, `Subscriber ${i} count (${subscriberEvents[i]}) must equal Subscriber 0 count (${firstCount})`);
  }

  // Unsubscribe 10 of them
  for (let i = 0; i < 10; i++) {
    unsubs[i]();
  }

  // Fire 50 more updates
  for (let i = 0; i < 50; i++) {
    useThemeStore.getState().setTerminalFontSize(14 + (i % 4));
  }

  // Verify unsubscribed stayed at firstCount, while active ones received more
  for (let i = 0; i < 10; i++) {
    assert.equal(subscriberEvents[i], firstCount, `Unsubscribed listener ${i} must not receive additional events`);
  }
  for (let i = 10; i < 20; i++) {
    assert.ok(subscriberEvents[i] > firstCount, `Active listener ${i} must receive additional events`);
  }

  // Clean up remaining unsubs
  for (let i = 10; i < 20; i++) {
    unsubs[i]();
  }

  console.log("✔ Facade subscriber multiplexing and cleanup verified under rapid multi-slice updates.");
}

async function runAdversarialStressSuite() {
  await testConcurrentHighVolumeMutations();
  testRingBufferLimits();
  testPersistenceSerialization();
  testCorruptedLocalStorageAndSanitizers();
  testLegacyStateMigrations();
  testCrossStoreReactivityAndFacade();
  testStoreSetterEdgeCases();
  testStreamingChatIsolationAndConcurrentSessions();
  testTelemetryLongRunRingBufferMemoryStability();
  testStorageQuotaFailureAndResilience();
  testFacadeSubscriberMultiplexingUnderRapidLoad();

  console.log("\n================================================================================");
  console.log("🏆 ALL 11 ADVERSARIAL ZUSTAND STRESS AND TORTURE SUITES PASSED WITH ZERO FAILURES");
  console.log("================================================================================");
}

runAdversarialStressSuite().catch((err) => {
  console.error("❌ ADVERSARIAL STRESS TEST FAILED:", err);
  process.exit(1);
});
