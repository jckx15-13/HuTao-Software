const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

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

const { sentryQA } = require("../src/core/qa/sentryQA");

function testSentryQA() {
  // Test initialization
  sentryQA.init("https://exampleKey@sentry.io/12345");
  assert.equal(sentryQA.isInitialized(), true, "sentryQA should be initialized");

  // Test breadcrumbs
  sentryQA.clearBreadcrumbs();
  sentryQA.addBreadcrumb({
    category: "ui.click",
    message: "User toggled satellite layer",
    level: "info",
    data: { layerId: "satellites" },
  });

  const breadcrumbs = sentryQA.getBreadcrumbs();
  assert.equal(breadcrumbs.length, 1);
  assert.equal(breadcrumbs[0].category, "ui.click");
  assert.equal(breadcrumbs[0].message, "User toggled satellite layer");

  // Test exception capture
  const testError = new TypeError("Test simulation error: satellite telemetry unavailable");
  const eventId = sentryQA.captureException(testError, {
    tags: { plugin: "satellites", environment: "test" },
    extra: { telemetryUrl: "wss://live.telemetry.org" },
  });

  assert.ok(eventId.startsWith("qa-evt-"), `Invalid eventId format: ${eventId}`);

  const updatedBreadcrumbs = sentryQA.getBreadcrumbs();
  assert.equal(updatedBreadcrumbs.length, 2, "Exception capture should record a breadcrumb");
  assert.equal(updatedBreadcrumbs[1].level, "error");

  // Test message capture
  const msgId = sentryQA.captureMessage("Bridge fallback activated", "warning");
  assert.ok(msgId.startsWith("qa-msg-"), `Invalid msgId format: ${msgId}`);

  console.log("✔ Sentry QA telemetry module contract tests passed.");
}

testSentryQA();
