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
  formatDecDegrees,
  formatRaHours,
  geometricPlanetEquatorialCoordinates,
  PLANET_IDS,
} = require("../src/lib/astronomy");
const {
  precessEquatorialJ2000ToDate,
} = require("../src/lib/coordinateTransforms");
const {
  TELESCOPE_PRESETS,
  resolveTelescopePresetCoordinates,
} = require("../src/data/telescopePresets");
const {
  aiChat,
  createLocalAssistantResponse,
} = require("../src/lib/ai");
const { createMessage } = require("../src/lib/messages");
const useAIChatSource = fs.readFileSync(path.join(root, "src/hooks/useAIChat.ts"), "utf8");

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

  const siriusJ2000 = { ra: 6.752477, dec: -16.716116 };
  const siriusAtJ2000 = precessEquatorialJ2000ToDate(siriusJ2000, j2000);
  const siriusAt2026 = precessEquatorialJ2000ToDate(siriusJ2000, new Date(Date.UTC(2026, 0, 1, 0, 0, 0)));
  assert.ok(Math.abs(siriusAtJ2000.ra - siriusJ2000.ra) < 1e-9);
  assert.ok(Math.abs(siriusAtJ2000.dec - siriusJ2000.dec) < 1e-9);
  assert.ok(
    Math.abs(siriusAt2026.ra - siriusJ2000.ra) > 0.001 ||
      Math.abs(siriusAt2026.dec - siriusJ2000.dec) > 0.001,
    "constellation star coordinates should precess away from their J2000 catalog positions by 2026"
  );

  const marsNow = apparentPlanetEquatorialCoordinates("mars", j2000);
  const marsGeometricNow = geometricPlanetEquatorialCoordinates("mars", j2000);
  const marsLater = apparentPlanetEquatorialCoordinates("mars", new Date(Date.UTC(2000, 1, 1, 12, 0, 0)));
  assert.ok(marsNow.raHours >= 0 && marsNow.raHours < 24);
  assert.ok(marsNow.decDegrees >= -90 && marsNow.decDegrees <= 90);
  assert.ok(marsNow.distanceAu > 0.3);
  assert.ok(marsNow.lightTimeMinutes > 2, `unexpected Mars light time ${marsNow.lightTimeMinutes}`);
  assert.ok(
    Math.abs(marsNow.raHours - marsGeometricNow.raHours) > 0.000001 ||
      Math.abs(marsNow.decDegrees - marsGeometricNow.decDegrees) > 0.000001,
    "apparent Mars coordinates should include non-zero light-time correction"
  );
  assert.notEqual(marsNow.raHours.toFixed(3), marsLater.raHours.toFixed(3));

  assert.equal(formatRaHours(23.9999999), "00h 00m 00s");
  assert.equal(formatDecDegrees(-12.9999999), "-13° 00' 00\"");

  // Planet targets (Mercury..Neptune) were intentionally removed from
  // TELESCOPE_PRESETS: this view is a fixed vantage between Earth and the
  // Moon, not a solar-system navigator, so "fly to and zoom into a planet"
  // is out of scope. Every remaining preset resolves from the fixed catalog.
  const planetPresets = TELESCOPE_PRESETS.filter((preset) => 'planetId' in preset);
  assert.equal(planetPresets.length, 0, "planet telescope presets should not exist");
  for (const preset of TELESCOPE_PRESETS) {
    assert.equal(
      resolveTelescopePresetCoordinates(preset, j2000).source,
      "fixed-catalog",
      `${preset.id} should resolve from the fixed catalog, not planet ephemeris`
    );
  }

  const localText = createLocalAssistantResponse("Confirm chat works");
  assert.match(localText, /chat loop verified/i);
  assert.match(localText, /without echoing the prompt text/i);
  assert.doesNotMatch(localText, /Confirm chat works/);

  const localResponse = await aiChat("local-assistant", "Confirm chat works");
  assert.match(localResponse.text, /without echoing the prompt text/i);
  assert.doesNotMatch(localResponse.text, /Confirm chat works/);
  assert.equal(localResponse.error, undefined);

  assert.ok(
    !/requestContents\s*\.push\(\s*\{\s*role:\s*['"]user['"]/.test(useAIChatSource),
    "AI chat dispatcher must not append a second user turn for Gemini requests",
  );

  const store = useUIStore.getState();
  assert.equal(store.aiModel, "local-assistant");
  assert.equal(store.leftPanelOpen, true);
  assert.equal(store.rightPanelOpen, true);
  // Performance defaults (see PERFORMANCE.md): particle effects ship OFF so the
  // app does not saturate the GPU on low-spec laptops. Users re-enable them in
  // Settings -> Personalisation. Pinned here so the default cannot drift back
  // silently.
  assert.equal(store.particleEffects, false);
  assert.equal(store.imageryProvider, "arcgis-world");
  assert.equal(store.personalisation.panelOpacity, 0.88);
  assert.equal(store.personalisation.minimalMode, false);
  assert.equal(store.personalisation.motionReduced, false);
  // Also a performance default: solid bubbles avoid a per-message backdrop-filter.
  assert.equal(store.personalisation.chatBubbleStyle, "solid");

  store.updatePersonalisation({ panelOpacity: 0.2, blurIntensity: 40, chatBubbleStyle: "glass" });
  assert.equal(useUIStore.getState().personalisation.panelOpacity, 0.72);
  assert.equal(useUIStore.getState().personalisation.blurIntensity, 16);
  assert.equal(useUIStore.getState().personalisation.chatBubbleStyle, "glass");

  store.updatePersonalisation({ minimalMode: true, panelOpacity: 0.5, blurIntensity: 3 });
  assert.equal(useUIStore.getState().personalisation.minimalMode, true);
  assert.equal(useUIStore.getState().personalisation.panelOpacity, 0.78);
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
  assert.match(chatMessages[1].content, /chat loop verified/i);

  console.log("Physics, astronomy, imagery, UI defaults, and local AI runtime tests passed.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
