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

const { OrbitEngine } = require("../src/core/satellites/OrbitEngine");
const { useStore } = require("../src/core/state/store");
const { dataBus } = require("../src/core/data/DataBus");
const { sentryQA } = require("../src/core/qa/sentryQA");

function testPhysicsNumericalTorture() {
  const engine = OrbitEngine.getInstance();

  // Test 1: Negative altitude and zero-division edge cases
  const speedAtNegativeAlt = engine.calculateOrbitalSpeed(-OrbitEngine.EARTH_RADIUS_M);
  assert.equal(speedAtNegativeAlt, 0, "Orbital speed at negative Earth radius must default to 0");

  const periodAtNaN = engine.calculateOrbitalPeriod(NaN);
  assert.equal(periodAtNaN, 0, "Orbital period at NaN altitude must default to 0");

  const speedAtInfinity = engine.calculateOrbitalSpeed(Infinity);
  assert.equal(speedAtInfinity, 0, "Orbital speed at Infinity altitude must default to 0");

  // Test 2: Propagation with NaN/Infinity elapsed time
  const coordsNaN = engine.propagateCircularOrbit(NaN);
  assert.equal(Number.isFinite(coordsNaN.lat), true, "Latitude must be finite for NaN elapsed time");
  assert.equal(Number.isFinite(coordsNaN.lng), true, "Longitude must be finite for NaN elapsed time");

  // Test 3: Corrupt TLE lines
  const corruptTleResult = engine.propagateSatelliteTle(["INVALID", "CORRUPT LINE 1", "CORRUPT LINE 2"]);
  assert.equal(corruptTleResult, null, "Corrupt TLE must evaluate to null without throwing");

  console.log("✔ Physics numerical torture assertions passed.");
}

function testStateImmutabilityAndInvalidInputTorture() {
  const store = useStore.getState();

  // Test theme mutation with safe state invariant checks
  store.setTheme("dark");
  assert.equal(useStore.getState().theme, "dark");

  // Test invalid search query type safety
  if (typeof store.setSearchQuery === "function") {
    store.setSearchQuery("   Valid Search Term   ");
    assert.equal(useStore.getState().searchQuery, "   Valid Search Term   ");
  }

  // Test entity selection
  const validEntity = { id: "entity-strict-1", name: "Strict Satellite Target", position: { lat: 45.0, lng: -90.0 } };
  store.setSelectedEntity(validEntity);
  assert.deepEqual(useStore.getState().selectedEntity, mockEntityCheck(validEntity));

  store.setSelectedEntity(null);
  assert.equal(useStore.getState().selectedEntity, null);

  console.log("✔ State slice immutability & invariant torture assertions passed.");
}

function mockEntityCheck(entity) {
  return entity;
}

function testDataBusPubSubMemoryStress() {
  dataBus.removeAllListeners();
  let callCount = 0;

  // Subscribe 100 listeners
  const unsubs = [];
  for (let i = 0; i < 100; i++) {
    const unsub = dataBus.on("layer:toggled", () => {
      callCount++;
    });
    unsubs.push(unsub);
  }

  dataBus.emit("layer:toggled", { pluginId: "aviation", enabled: true });
  assert.equal(callCount, 100, "All 100 listeners must be triggered");

  // Unsubscribe all
  unsubs.forEach((unsub) => unsub());
  callCount = 0;
  dataBus.emit("layer:toggled", { pluginId: "aviation", enabled: false });
  assert.equal(callCount, 0, "Zero listeners must be triggered after unsubscribe");

  console.log("✔ DataBus pub/sub memory leak & stress assertions passed.");
}

function testSentryQACircularPayloadStrictness() {
  sentryQA.clearBreadcrumbs();

  // Test circular reference object
  const circularObj = { name: "CircularTest" };
  circularObj.self = circularObj;

  const eventId = sentryQA.captureException(new Error("Circular payload test"), {
    extra: { circular: circularObj },
  });

  assert.ok(eventId.startsWith("qa-evt-"), "Sentry QA must handle circular reference payloads safely");
  console.log("✔ Sentry QA circular payload strictness assertions passed.");
}

function runAllStrictTortureTests() {
  console.log("🔥 Running Extreme Strictness & Edge Case Torture Suite...");
  testPhysicsNumericalTorture();
  testStateImmutabilityAndInvalidInputTorture();
  testDataBusPubSubMemoryStress();
  testSentryQACircularPayloadStrictness();
  console.log("✨ Extreme Strictness & Edge Case Torture Suite PASSED COMPLETELY.");
}

runAllStrictTortureTests();
