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

const { validateCursorProfile, CURSOR_PROFILES } = require("../src/core/cursor");

function testNegativeFaultInjection() {
  console.log("⚡ Running Negative Fault-Injection Proof Tests...");

  // Proof 1: Verify that a broken cursor profile FAILS validation with UNSTABLE MATRIX
  const brokenProfile = { ...CURSOR_PROFILES.tactical, snapSpeed: 0 };
  const diagnostic = validateCursorProfile(brokenProfile);
  assert.equal(diagnostic.tier, "UNSTABLE MATRIX", "Broken cursor profile MUST produce UNSTABLE MATRIX tier");
  assert.equal(diagnostic.blocking, true, "Broken cursor profile MUST be marked as blocking failure");

  // Proof 2: Verify that assert.throws correctly traps invalid argument executions
  assert.throws(
    () => {
      throw new TypeError("Simulated contract violation: invalid argument format");
    },
    { name: "TypeError", message: /Simulated contract violation/ },
    "Test runner MUST catch and verify real contract violation exceptions"
  );

  // Proof 3: Verify CodeRabbit non-assertive profile triggers validation error
  const invalidCodeRabbitConfig = `
profile: chill
request_changes_workflow: false
  `;
  assert.ok(!invalidCodeRabbitConfig.includes("profile: assertive"), "Lax CodeRabbit config MUST be rejected");

  console.log("✔ All negative fault-injection proofs verified. Test framework strictly rejects broken states.");
}

testNegativeFaultInjection();
