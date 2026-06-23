const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function assertFile(relativePath, label = relativePath) {
  const fullPath = path.join(root, relativePath.replace(/^silver-wolf-vi[\\/]/, ""));
  assert.ok(fs.existsSync(fullPath), `${label} is missing at ${fullPath}`);
}

function collectMatches(source, regex) {
  const results = new Set();
  let match;
  while ((match = regex.exec(source)) !== null) {
    results.add(match[1]);
  }
  return [...results];
}

const wwvAssetsSource = read("src/assets/wwvVisualAssets.ts");
const odysseusAssetsSource = read("src/assets/odysseusAssets.ts");
const bridgeSource = read("bridge/server.py");

assertFile("package.json", "Silver Wolf root package");
assertFile("public/config.json", "Browser runtime public config");
assertFile("worldwideview/package.json", "WorldWideView package");
assertFile("odysseus/pyproject.toml", "Odysseus Python package");
assertFile("odysseus/package.json", "Odysseus frontend package");
assertFile("bridge/server.py", "Silver Wolf bridge server");

const wwvSourcePaths = collectMatches(wwvAssetsSource, /\bsourcePath:\s*'([^']+)'/g);
assert.ok(wwvSourcePaths.length >= 29, "Expected mapped WorldWideView and derived Silver Wolf source assets");
for (const sourcePath of wwvSourcePaths) {
  assertFile(sourcePath, `WorldWideView mapped source ${sourcePath}`);
}

const wwvPublicUrls = collectMatches(wwvAssetsSource, /\burl:\s*'((?:\/wwv-assets)[^']+)'/g);
assert.ok(wwvPublicUrls.length >= 20, "Expected copied WorldWideView public asset URLs");
for (const assetUrl of wwvPublicUrls) {
  assertFile(path.join("public", assetUrl), `Copied WorldWideView public asset ${assetUrl}`);
}

const odysseusDocPaths = collectMatches(odysseusAssetsSource, /\bpath:\s*'([^']+)'/g);
assert.ok(odysseusDocPaths.length >= 20, "Expected copied Odysseus documentation assets");
for (const docPath of odysseusDocPaths) {
  assertFile(path.join("odysseus", "docs", docPath), `Odysseus source doc asset ${docPath}`);
  assertFile(path.join("public", "odysseus-assets", "docs", docPath), `Copied Odysseus doc asset ${docPath}`);
}

const odysseusSourceModules = collectMatches(odysseusAssetsSource, /'(odysseus\/(?:src|static)\/[^']+)'/g);
assert.ok(odysseusSourceModules.length >= 8, "Expected Odysseus source module mappings");
for (const modulePath of odysseusSourceModules) {
  assertFile(modulePath, `Odysseus mapped source module ${modulePath}`);
}

for (const route of [
  '@app.post("/log")',
  '@app.get("/status")',
  '@app.post("/sync")',
  '@app.post("/chat")',
  '@app.get("/api/camera/proxy")',
  '@app.get("/git/status")',
  '@app.api_route("/api/{path:path}"',
]) {
  assert.ok(bridgeSource.includes(route), `Bridge route contract missing ${route}`);
}

for (const origin of ["http://127.0.0.1:3005", "http://127.0.0.1:4173"]) {
  assert.ok(bridgeSource.includes(origin), `Bridge CORS default missing ${origin}`);
}

console.log("Repository integration contracts passed for Silver Wolf, WorldWideView, Odysseus, and the local bridge.");
