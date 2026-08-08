const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

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

  console.log("CodeRabbit (Code Bunny) QA configuration validation passed.");
}

testCodeRabbitConfig();
