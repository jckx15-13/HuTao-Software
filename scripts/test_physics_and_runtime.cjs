const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const path = require("node:path");
const ts = require("typescript");

require.extensions[".ts"] = function loadTypeScript(module, filename) {
  const source = fs.readFileSync(filename, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
      skipLibCheck: true,
    },
    fileName: filename,
  }).outputText;
  module._compile(output, filename);
};

const root = path.resolve(__dirname, "..");
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function resolveAlias(request, parent, isMain, options) {
  if (request.startsWith("@/")) {
    return originalResolve(path.join(root, "src", request.slice(2)), parent, isMain, options);
  }
  return originalResolve(request, parent, isMain, options);
};

const {
  ISS_ALTITUDE_M,
  ISS_INCLINATION_RAD,
  calculateOrbitalPeriod,
  calculateOrbitalSpeed,
  propagateCircularOrbit,
} = require("../src/lib/simulation");
const {
  getGreenwichMeanSiderealDegrees,
  projectTelescopeTargetToEarth,
} = require("../src/lib/earthObserverProjection");
const {
  apparentPlanetEquatorialCoordinates,
} = require("../src/lib/astronomy");
const {
  TELESCOPE_PRESETS,
  resolveTelescopePresetCoordinates,
} = require("../src/data/telescopePresets");
const {
  aiChat,
  createLocalAssistantResponse,
} = require("../src/lib/ai");
const { createMessage } = require("../src/lib/messages");

const storage = new Map();
globalThis.localStorage = {
  getItem: (key) => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, String(value)),
  removeItem: (key) => storage.delete(key),
};
globalThis.window = { localStorage: globalThis.localStorage };

const { useUIStore } = require("../src/store/uiStore");
const {
  bridgeUrl,
  getBridgeBaseUrl,
  normalizeBridgeBaseUrl,
} = require("../src/lib/bridgeConfig");

function assertValidLatLng(point) {
  assert.ok(Number.isFinite(point.lat));
  assert.ok(Number.isFinite(point.lng));
  assert.ok(point.lat >= -90 && point.lat <= 90);
  assert.ok(point.lng >= -180 && point.lng <= 180);
}

async function run() {
  const issSpeed = calculateOrbitalSpeed(ISS_ALTITUDE_M);
  assert.ok(issSpeed > 7600 && issSpeed < 7700, `unexpected ISS speed ${issSpeed}`);

  const issPeriod = calculateOrbitalPeriod(ISS_ALTITUDE_M);
  assert.ok(issPeriod > 5500 && issPeriod < 5700, `unexpected ISS period ${issPeriod}`);

  const orbitStart = propagateCircularOrbit(0, ISS_ALTITUDE_M, ISS_INCLINATION_RAD, 0, 0);
  const orbitLater = propagateCircularOrbit(900, ISS_ALTITUDE_M, ISS_INCLINATION_RAD, 0, 0);
  assertValidLatLng(orbitStart);
  assertValidLatLng(orbitLater);
  assert.notEqual(orbitStart.lng.toFixed(3), orbitLater.lng.toFixed(3));

  const j2000 = new Date(Date.UTC(2000, 0, 1, 12, 0, 0));
  const gmstHours = getGreenwichMeanSiderealDegrees(j2000) / 15;
  const zenith = projectTelescopeTargetToEarth(gmstHours, 0, j2000);
  assert.ok(Math.abs(zenith.longitudeDegrees) < 1e-9);
  assert.equal(zenith.latitudeDegrees, 0);

  const marsNow = apparentPlanetEquatorialCoordinates("mars", j2000);
  const marsLater = apparentPlanetEquatorialCoordinates("mars", new Date(Date.UTC(2000, 1, 1, 12, 0, 0)));
  assert.ok(marsNow.raHours >= 0 && marsNow.raHours < 24);
  assert.ok(marsNow.decDegrees >= -90 && marsNow.decDegrees <= 90);
  assert.ok(marsNow.distanceAu > 0.3);
  assert.notEqual(marsNow.raHours.toFixed(3), marsLater.raHours.toFixed(3));

  const marsPreset = TELESCOPE_PRESETS.find((preset) => preset.id === "mars");
  assert.ok(marsPreset, "Mars preset missing");
  const marsPresetNow = resolveTelescopePresetCoordinates(marsPreset, j2000);
  const marsPresetLater = resolveTelescopePresetCoordinates(marsPreset, new Date(Date.UTC(2000, 1, 1, 12, 0, 0)));
  assert.equal(marsPresetNow.source, "kepler-planet");
  assert.notEqual(marsPresetNow.ra, marsPresetLater.ra);

  const localText = createLocalAssistantResponse("Confirm chat works");
  assert.match(localText, /chat loop is working locally/i);

  const localResponse = await aiChat("local-assistant", "Confirm chat works");
  assert.match(localResponse.text, /I received/i);
  assert.equal(localResponse.error, undefined);

  const store = useUIStore.getState();
  assert.equal(store.aiModel, "local-assistant");
  assert.equal(store.leftPanelOpen, false);
  assert.equal(store.rightPanelOpen, false);
  assert.equal(store.particleEffects, false);
  assert.equal(store.imageryProvider, "arcgis-world");
  assert.ok(store.personalisation.panelOpacity >= 0.88);
  assert.equal(store.personalisation.chatBubbleStyle, "solid");

  store.updatePersonalisation({ panelOpacity: 0.2, blurIntensity: 40, chatBubbleStyle: "glass" });
  assert.equal(useUIStore.getState().personalisation.panelOpacity, 0.88);
  assert.equal(useUIStore.getState().personalisation.blurIntensity, 10);
  assert.equal(useUIStore.getState().personalisation.chatBubbleStyle, "solid");

  store.updatePersonalisation({ minimalMode: true, panelOpacity: 0.5, blurIntensity: 3 });
  assert.equal(useUIStore.getState().personalisation.minimalMode, true);
  assert.equal(useUIStore.getState().personalisation.panelOpacity, 0.5);
  assert.equal(useUIStore.getState().personalisation.blurIntensity, 3);

  store.setAiModel("gemini-3-flash");
  assert.equal(useUIStore.getState().aiModel, "gemini-3-flash-preview");
  useUIStore.getState().setAiModel("gpt-4o");
  assert.equal(useUIStore.getState().aiModel, "local-assistant");

  assert.equal(normalizeBridgeBaseUrl("ws://127.0.0.1:8001/stream"), "http://127.0.0.1:8001");
  assert.equal(normalizeBridgeBaseUrl("https://example.test/bridge/stream"), "https://example.test/bridge");
  useUIStore.getState().setEngineUrlOverride("ws://127.0.0.1:8001/stream");
  assert.equal(getBridgeBaseUrl(), "http://127.0.0.1:8001");
  assert.equal(bridgeUrl("/status"), "http://127.0.0.1:8001/status");
  useUIStore.getState().setEngineUrlOverride("");

  useUIStore.getState().clearMessages();
  useUIStore.getState().setAiModel("local-assistant");
  useUIStore.getState().addMessage(createMessage("user", "Runtime smoke ping"));
  const chatResponse = await aiChat(useUIStore.getState().aiModel, "Runtime smoke ping");
  useUIStore.getState().addMessage(createMessage("ai", chatResponse.text));

  const chatMessages = useUIStore.getState().messages.slice(-2);
  assert.equal(chatMessages[0].sender, "user");
  assert.equal(chatMessages[0].content, "Runtime smoke ping");
  assert.equal(chatMessages[1].sender, "ai");
  assert.match(chatMessages[1].content, /chat loop is working locally/i);

  console.log("Physics, astronomy, imagery, UI defaults, and local AI runtime tests passed.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
