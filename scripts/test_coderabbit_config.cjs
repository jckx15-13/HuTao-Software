const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

require.extensions[".ts"] = function loadTypeScript(module, filename) {
  const source = fs.readFileSync(filename, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    fileName: filename,
  }).outputText;
  const wrapper = `(function (exports, require, module, __filename, __dirname) {\n${output}\n});`;
  vm.runInThisContext(wrapper, { filename })(module.exports, module.require.bind(module), module, filename, path.dirname(filename));
};

const root = path.resolve(__dirname, "..");
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function resolveAlias(request, parent, isMain, options) {
  if (request.startsWith("@/")) return originalResolve(path.join(root, "src", request.slice(2)), parent, isMain, options);
  return originalResolve(request, parent, isMain, options);
};

function testCodeRabbitConfig() {
  const configPath = path.resolve(__dirname, "..", ".coderabbit.yaml");
  assert.ok(fs.existsSync(configPath), ".coderabbit.yaml does not exist");

  const content = fs.readFileSync(configPath, "utf8");

  // Validate key sections and strict QA requirements
  assert.ok(content.includes("profile: assertive"), "CodeRabbit profile must be set to assertive for strict QA");
  assert.ok(content.includes("request_changes_workflow: true"), "request_changes_workflow must be enabled");
  assert.ok(content.includes("bridge/**"), "Missing path instruction for bridge/**");
  assert.ok(content.includes("src/core/qa/**"), "Missing path instruction for src/core/qa/**");
  assert.ok(content.includes("src/core/state/**"), "Missing path instruction for src/core/state/**");
  assert.ok(content.includes("src/components/**"), "Missing path instruction for src/components/**");
  assert.ok(content.includes("src/plugins/**"), "Missing path instruction for src/plugins/**");
  assert.ok(content.includes("src/lib/**"), "Missing path instruction for src/lib/**");
  assert.ok(content.includes("scripts/**"), "Missing path instruction for scripts/**");
  assert.ok(content.includes("Sentry"), "CodeRabbit config must include Sentry telemetry inspection rules");

  const { coderabbitService } = require("../src/services/coderabbitService");
  const summary = coderabbitService.getCodeRabbitConfigSummary();
  assert.equal(summary.profile, "assertive", "Dashboard profile must match .coderabbit.yaml");
  assert.equal(summary.pathInstructionCount, 7, "Dashboard must report all configured path instructions");
  assert.deepEqual(summary.targetPaths, [
    "bridge/**", "src/core/qa/**", "src/core/state/**", "src/components/**",
    "src/plugins/**", "src/lib/**", "scripts/**",
  ], "Dashboard path list must match .coderabbit.yaml");
  const audit = coderabbitService.runAudit();
  assert.equal(audit.rulesCount, 7);
  assert.ok(audit.checks.every((check) => check.status === "warning"), "A local config inspection must not claim hosted reviews passed");

  console.log("CodeRabbit (Code Bunny) QA configuration validation passed.");
}

testCodeRabbitConfig();
