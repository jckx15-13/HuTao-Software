const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const path = require("node:path");
const { performance } = require("node:perf_hooks");
const ts = require("typescript");

global.performance = performance;
global.DOMRect = class DOMRect {
  constructor(x = 0, y = 0, width = 0, height = 0) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.left = x;
    this.top = y;
    this.right = x + width;
    this.bottom = y + height;
  }
};

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

const { CursorTargetRegistry, deriveRuntimePolicy, validateCursorProfile, CURSOR_PROFILES } = require("../src/core/cursor");

function testTargetPriority() {
  const registry = new CursorTargetRegistry();
  registry.publish({
    id: "cesium-1",
    kind: "cesiumEntity",
    source: "cesium",
    screenPosition: { x: 100, y: 100 },
    priority: 84,
    confidence: 0.9,
    explicitLock: true,
    expiresAt: performance.now() + 1000,
  });
  registry.publish({
    id: "button-1",
    kind: "ui",
    source: "ui",
    rect: new DOMRect(96, 96, 32, 32),
    priority: 100,
    confidence: 0.95,
    expiresAt: performance.now() + 1000,
  });
  const resolved = registry.resolve({ x: 104, y: 104 }, performance.now(), 16);
  assert.equal(resolved.selectedTarget.id, "button-1");
}

function testStaleTargetExpiry() {
  const registry = new CursorTargetRegistry();
  registry.publish({
    id: "stale",
    kind: "cesiumEntity",
    source: "cesium",
    screenPosition: { x: 0, y: 0 },
    expiresAt: performance.now() - 1,
  });
  const resolved = registry.resolve({ x: 0, y: 0 }, performance.now(), 16);
  assert.equal(resolved.selectedTarget, null);
}

function testExplicitLock() {
  const registry = new CursorTargetRegistry();
  registry.publish({
    id: "entity",
    kind: "cesiumEntity",
    source: "cesium",
    screenPosition: { x: 300, y: 300 },
    confidence: 0.9,
    explicitLock: true,
    expiresAt: performance.now() + 1000,
  });
  const resolved = registry.resolve({ x: 302, y: 301 }, performance.now(), 16);
  assert.equal(resolved.lockedTarget.id, "entity");
}

function testPolicyDegradation() {
  const policy = deriveRuntimePolicy(
    {
      enabled: true,
      cursorDesign: "reticle-v1",
      reducedMotion: true,
      appHighLoad: false,
      animationIntensity: 1,
      particleEffects: true,
    },
    CURSOR_PROFILES.tactical,
    16,
    true
  );
  assert.equal(policy.trailsEnabled, false);
  assert.equal(policy.particlesEnabled, false);
  assert.equal(policy.lockAssistEnabled, false);
  assert.ok(policy.recoilStrength <= 0.12);

  const highLoadPolicy = deriveRuntimePolicy(
    {
      enabled: true,
      cursorDesign: "reticle-v1",
      reducedMotion: false,
      appHighLoad: true,
      animationIntensity: 1,
      particleEffects: true,
    },
    CURSOR_PROFILES.tactical,
    16,
    true
  );
  assert.equal(highLoadPolicy.disabledReason, "app high-load mode");
  assert.equal(highLoadPolicy.trailsEnabled, false);
  assert.equal(highLoadPolicy.lockAssistEnabled, false);
}

function testDiagnostics() {
  const diagnostic = validateCursorProfile({
    ...CURSOR_PROFILES.tactical,
    snapSpeed: 0,
  });
  assert.equal(diagnostic.tier, "UNSTABLE MATRIX");
  assert.equal(diagnostic.blocking, true);
}

testTargetPriority();
testStaleTargetExpiry();
testExplicitLock();
testPolicyDegradation();
testDiagnostics();

console.log("Cursor engine contract tests passed.");
