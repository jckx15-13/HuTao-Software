// Behavioural tests for the responsive layout system and the startup/fallback
// defaults. Unlike the source-text contract tests, these transpile the real
// modules and execute them, so a regression in the maths fails here.
//
// Run: node scripts/test_responsive_layout.cjs

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");

// Minimal loader: transpile a project .ts file to CommonJS and run it, resolving
// the project's own path aliases and stubbing modules that pull in the DOM.
const moduleCache = new Map();

const THEME_ENGINE_STUB = {
  palettes: { holographic: {}, pastelDream: {}, goldRush: {} },
};

function loadTs(relativePath) {
  const fullPath = path.join(root, relativePath);
  if (moduleCache.has(fullPath)) return moduleCache.get(fullPath);

  const source = fs.readFileSync(fullPath, "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: fullPath,
  });

  const mod = { exports: {} };
  moduleCache.set(fullPath, mod.exports);

  const localRequire = (specifier) => {
    if (specifier.includes("themeEngine")) return THEME_ENGINE_STUB;

    const resolved = specifier.startsWith("@/")
      ? path.join(root, "src", specifier.slice(2))
      : path.resolve(path.dirname(fullPath), specifier);

    const relative = path.relative(root, resolved);
    for (const ext of [".ts", ".tsx", "/index.ts"]) {
      if (fs.existsSync(path.join(root, relative + ext))) return loadTs(relative + ext);
    }
    return require(specifier);
  };

  // eslint-disable-next-line no-new-func
  new Function("exports", "require", "module", "__filename", "__dirname", outputText)(
    mod.exports,
    localRequire,
    mod,
    fullPath,
    path.dirname(fullPath)
  );

  moduleCache.set(fullPath, mod.exports);
  return mod.exports;
}

const {
  resolveDeviceProfile,
  resolveDeviceClass,
  resolveChromeTier,
  resolveChromeTierForWidth,
  normalizeViewport,
  DEVICE_CLASS_SPECS,
} = loadTs("src/core/layout/deviceProfile.ts");

const { resolvePipWindowDimensions } = loadTs("src/core/layout/pipDimensions.ts");
const { resolveChromeTopAnchor } = loadTs("src/hooks/useChromeTopAnchor.ts");

const { buildSpatialPanelGeometry, buildWorkspaceRailPx } = loadTs(
  "src/components/panels/panelGeometry.ts"
);

const {
  sanitizePersistedUiState,
  buildDefaultUiState,
  resolveStartupLayout,
  enforcePanelBudget,
  normalizePersonalisation,
  normalizeAiModel,
  UI_DEFAULTS,
  STARTUP_LAYOUT_BY_DEVICE,
} = loadTs("src/core/defaults/uiDefaults.ts");

// ---------------------------------------------------------------------------
// Device classification
// ---------------------------------------------------------------------------

// Representative real hardware, so a breakpoint edit that strands a real device
// shows up as a named failure rather than a bare number.
const DEVICES = [
  { label: "Apple Watch Ultra", width: 205, height: 251, expected: "watch" },
  { label: "Wear OS round", width: 320, height: 320, expected: "watch" },
  { label: "iPhone SE", width: 375, height: 667, expected: "phone" },
  { label: "iPhone 15", width: 393, height: 852, expected: "phone" },
  { label: "Pixel 8 Pro", width: 448, height: 998, expected: "phone" },
  { label: "iPad mini portrait", width: 744, height: 1133, expected: "phablet" },
  { label: "iPad Air portrait", width: 820, height: 1180, expected: "tablet" },
  { label: "iPad Pro landscape", width: 1366, height: 1024, expected: "laptop" },
  { label: "MacBook Air 13", width: 1280, height: 800, expected: "laptop" },
  { label: "1080p monitor", width: 1920, height: 1080, expected: "ultrawide" },
  { label: "1440p monitor", width: 2560, height: 1440, expected: "ultrawide" },
  { label: "Ultrawide 21:9", width: 3440, height: 1440, expected: "ultrawide" },
];

for (const device of DEVICES) {
  assert.equal(
    resolveDeviceClass(device.width),
    device.expected,
    `${device.label} (${device.width}px) should classify as ${device.expected}`
  );
}

// Chrome tiers are derived from the existing device ladder, never a second
// set of breakpoints. Their ordering must therefore stay monotonic.
const CHROME_TIER_RANK = { compact: 0, standard: 1, expansive: 2 };
let previousChromeTierRank = -1;
for (const [deviceClass] of [...DEVICE_CLASS_SPECS].reverse()) {
  const tier = resolveChromeTier(deviceClass);
  assert.ok(CHROME_TIER_RANK[tier] >= previousChromeTierRank, `${deviceClass} chrome tier must be monotonic`);
  previousChromeTierRank = CHROME_TIER_RANK[tier];
}

// A 1280px desktop with both docked rails open should use the density for its
// actual centre workspace, not its full window width.
const tierViewport = { width: 1280, height: 800 };
const tierProfile = resolveDeviceProfile(tierViewport, { dualPanels: true });
const tierNetWidth =
  tierViewport.width -
  buildWorkspaceRailPx(tierViewport, true, true, "left", tierProfile) -
  buildWorkspaceRailPx(tierViewport, true, true, "right", tierProfile);
assert.equal(resolveChromeTierForWidth(tierNetWidth), "compact", "1280px with both rails needs compact chrome");

for (let availableWidth = 320; availableWidth <= 3840; availableWidth += 40) {
  const dimensions = resolvePipWindowDimensions(availableWidth, 1080);
  assert.ok(dimensions.normal.width >= 360, `normal PiP floor failed at ${availableWidth}px`);
  assert.ok(dimensions.normal.height >= 260, `normal PiP height floor failed at ${availableWidth}px`);
  assert.ok(dimensions.large.width >= 480, `large PiP floor failed at ${availableWidth}px`);
  assert.ok(dimensions.large.height >= 340, `large PiP height floor failed at ${availableWidth}px`);
  assert.ok(
    dimensions.large.width >= dimensions.normal.width + 120,
    `large PiP width invariant failed at ${availableWidth}px`
  );
}

assert.equal(resolveChromeTopAnchor(56, 120), 120, "the lower measured chrome edge must win");
assert.equal(resolveChromeTopAnchor(72, 48), 72, "header collapse/expand must update the shared anchor");
assert.equal(resolveChromeTopAnchor(-10, null), 0, "invalid measured edges must not create negative CSS offsets");

// Boundaries are inclusive on the lower edge.
for (const [deviceClass, spec] of DEVICE_CLASS_SPECS) {
  if (spec.minWidth === 0) continue;
  assert.equal(
    resolveDeviceClass(spec.minWidth),
    deviceClass,
    `exactly ${spec.minWidth}px must be the lower bound of ${deviceClass}, not the class below`
  );
}

// ---------------------------------------------------------------------------
// Degenerate viewports must not produce NaN CSS
// ---------------------------------------------------------------------------

const DEGENERATE = [
  undefined,
  null,
  {},
  { width: 0, height: 0 },
  { width: NaN, height: NaN },
  { width: -500, height: -500 },
  { width: Infinity, height: Infinity },
  { width: "1280", height: "720" },
];

for (const input of DEGENERATE) {
  const viewport = normalizeViewport(input);
  assert.ok(
    Number.isFinite(viewport.width) && viewport.width > 0,
    `normalizeViewport(${JSON.stringify(input)}) must yield a positive width`
  );

  const profile = resolveDeviceProfile(input, { coarsePointer: false });
  for (const key of ["edgeInsetPx", "panelWidthPx", "topInsetPx", "bottomInsetPx"]) {
    assert.ok(
      Number.isFinite(profile[key]),
      `profile.${key} must be finite for viewport ${JSON.stringify(input)}, got ${profile[key]}`
    );
  }
}

// ---------------------------------------------------------------------------
// Panels must never overlap the centre column, at any size
// ---------------------------------------------------------------------------

// This is the invariant the last three layout commits were chasing by hand:
// left rail + right rail must leave the centre column real estate.
for (const device of DEVICES) {
  const viewport = { width: device.width, height: device.height };
  const profile = resolveDeviceProfile(viewport, { coarsePointer: false, dualPanels: true });

  const leftRail = buildWorkspaceRailPx(viewport, true, true, "left", profile);
  const rightRail = buildWorkspaceRailPx(viewport, true, true, "right", profile);

  if (profile.reservesRail) {
    assert.ok(
      viewport.width - leftRail - rightRail >= 40,
      `${device.label}: centre column would be ${viewport.width - leftRail - rightRail}px — too narrow to use`
    );
  } else {
    assert.equal(
      leftRail + rightRail,
      0,
      `${device.label}: sheets float over the workspace, so no rail may be reserved`
    );
  }
}

// Panel geometry must stay inside the viewport on every device.
for (const device of DEVICES) {
  const viewport = { width: device.width, height: device.height };

  for (const placement of ["left", "right"]) {
    for (const [leftOpen, rightOpen] of [[true, false], [false, true], [true, true]]) {
      const style = buildSpatialPanelGeometry({
        placement,
        viewport,
        leftPanelOpen: leftOpen,
        rightPanelOpen: rightOpen,
      });

      const widthPx = Number.parseFloat(style.width);
      assert.ok(
        Number.isFinite(widthPx) && widthPx > 0,
        `${device.label} ${placement}: width must be a positive px value, got "${style.width}"`
      );
      assert.ok(
        widthPx <= viewport.width,
        `${device.label} ${placement}: panel width ${widthPx}px exceeds the ${viewport.width}px viewport`
      );

      for (const key of ["top", "bottom", "maxHeight", "width"]) {
        assert.ok(
          !/NaN|undefined/.test(String(style[key])),
          `${device.label} ${placement}: style.${key} contains NaN/undefined ("${style[key]}")`
        );
      }
    }
  }
}

// A watch gets one full-bleed sheet; two would hide each other.
const watchProfile = resolveDeviceProfile({ width: 205, height: 251 }, { coarsePointer: true });
assert.equal(watchProfile.panelPresentation, "fullbleed-sheet");
assert.equal(watchProfile.maxConcurrentPanels, 1);
assert.equal(watchProfile.reservesRail, false);

// A phone gets an inset sheet, not the wrist-sized full-bleed treatment, and
// still never reserves a rail that would push the workspace off-screen.
const phoneProfile = resolveDeviceProfile({ width: 393, height: 852 }, { coarsePointer: true });
assert.equal(phoneProfile.panelPresentation, "stacked-sheet");
assert.equal(phoneProfile.reservesRail, false);
assert.ok(phoneProfile.edgeInsetPx > 0, "a phone sheet must be inset from the screen edge");

// A desktop docks two panels and shows telemetry.
const desktopProfile = resolveDeviceProfile({ width: 1920, height: 1080 }, { coarsePointer: false });
assert.equal(desktopProfile.panelPresentation, "docked");
assert.equal(desktopProfile.maxConcurrentPanels, 2);
assert.equal(desktopProfile.showsPassiveTelemetry, true);

// Two docked panels each get no more width than one docked panel.
const solo = resolveDeviceProfile({ width: 1280, height: 800 }, { dualPanels: false }).panelWidthPx;
const dual = resolveDeviceProfile({ width: 1280, height: 800 }, { dualPanels: true }).panelWidthPx;
assert.ok(dual <= solo, `two docked panels (${dual}px) must not be wider than one (${solo}px)`);

// ---------------------------------------------------------------------------
// Startup layout defaults
// ---------------------------------------------------------------------------

for (const [deviceClass, layout] of Object.entries(STARTUP_LAYOUT_BY_DEVICE)) {
  assert.equal(typeof layout.leftPanelOpen, "boolean", `${deviceClass} startup layout needs leftPanelOpen`);
  assert.equal(typeof layout.rightPanelOpen, "boolean", `${deviceClass} startup layout needs rightPanelOpen`);
}

// The budget closes the left panel first, keeping context visible.
assert.deepEqual(
  enforcePanelBudget({ leftPanelOpen: true, rightPanelOpen: true }, watchProfile),
  { leftPanelOpen: false, rightPanelOpen: true },
  "a single-panel profile must keep the right (context) panel, not close both"
);
assert.deepEqual(
  enforcePanelBudget({ leftPanelOpen: true, rightPanelOpen: true }, desktopProfile),
  { leftPanelOpen: true, rightPanelOpen: true },
  "a two-panel profile must leave both panels alone"
);

// Startup never violates the profile's own budget.
for (const device of DEVICES) {
  const profile = resolveDeviceProfile({ width: device.width, height: device.height });
  const layout = resolveStartupLayout(profile);
  const openCount = Number(layout.leftPanelOpen) + Number(layout.rightPanelOpen);
  assert.ok(
    openCount <= profile.maxConcurrentPanels,
    `${device.label}: startup opens ${openCount} panels but the profile allows ${profile.maxConcurrentPanels}`
  );
}

// ---------------------------------------------------------------------------
// Reset produces fresh, unaliased collections
// ---------------------------------------------------------------------------

const resetA = buildDefaultUiState(desktopProfile);
const resetB = buildDefaultUiState(desktopProfile);
resetA.satelliteCategories.gps = false;
resetA.personalisation.fontScale = 99;
resetA.changeLogs.push({ id: "x", timestamp: "", category: "", message: "", level: "info" });

assert.equal(resetB.satelliteCategories.gps, true, "reset must not alias the shared category defaults");
assert.equal(
  resetB.personalisation.fontScale,
  UI_DEFAULTS.personalisation.fontScale,
  "reset must not alias personalisation"
);
assert.equal(resetB.changeLogs.length, 0, "reset must not alias the changeLogs array");
assert.equal(UI_DEFAULTS.satelliteCategories.gps, true, "mutating a reset snapshot must not corrupt UI_DEFAULTS");

// ---------------------------------------------------------------------------
// Fallback: corrupt persisted state must degrade per-field
// ---------------------------------------------------------------------------

assert.deepEqual(sanitizePersistedUiState(null).state, {}, "null payload yields no state");
assert.deepEqual(sanitizePersistedUiState("garbage").state, {}, "string payload yields no state");
assert.deepEqual(sanitizePersistedUiState([1, 2, 3]).state, {}, "array payload yields no state");

const corrupt = sanitizePersistedUiState({
  activePalette: "notARealPalette",
  aiModel: "gpt-4-turbo",
  cameraSensitivity: "fast",
  spaceBlendOpacity: 42,
  leftPanelOpen: "yes",
  rightPanelOpen: false,
  personalisation: null,
  browserUrl: "javascript:alert(1)",
  interactionMode: "wormhole",
  changeLogs: "not-an-array",
  satelliteData: { good: { tle: ["1 x", "2 y"], timestamp: 1 }, bad: { tle: [42] } },
  unknownFutureKey: "ignored",
});

assert.ok(corrupt.rejected.includes("activePalette"), "an unknown palette must be rejected");
assert.ok(corrupt.rejected.includes("cameraSensitivity"), "a non-numeric sensitivity must be rejected");
assert.ok(corrupt.rejected.includes("leftPanelOpen"), "a non-boolean panel flag must be rejected");
assert.ok(corrupt.rejected.includes("browserUrl"), "a non-http(s) browser URL must be rejected");
assert.ok(corrupt.rejected.includes("interactionMode"), "an unknown interaction mode must be rejected");
assert.ok(corrupt.rejected.includes("changeLogs"), "a non-array changeLogs must be rejected");

assert.equal(corrupt.state.activePalette, undefined, "rejected fields must be absent so the default applies");
assert.equal(corrupt.state.rightPanelOpen, false, "a valid field alongside corrupt ones must survive");
assert.equal(corrupt.state.aiModel, "local-assistant", "a retired model id must normalise, not reject");
assert.equal(corrupt.state.spaceBlendOpacity, 1, "an out-of-range opacity must clamp into range");
assert.equal("unknownFutureKey" in corrupt.state, false, "unknown keys must be dropped");
assert.deepEqual(
  Object.keys(corrupt.state.satelliteData),
  ["good"],
  "malformed satellite entries must be dropped individually"
);
// personalisation: null is repairable (every field falls back), so it is kept.
assert.deepEqual(
  corrupt.state.personalisation,
  UI_DEFAULTS.personalisation,
  "a null personalisation must rebuild from defaults rather than propagate"
);

// A wholly valid payload must survive untouched.
const clean = sanitizePersistedUiState({
  activePalette: "holographic",
  aiModel: "gemini-2.5-pro",
  cameraSensitivity: 1.5,
  leftPanelOpen: false,
  browserUrl: "https://nasa.gov",
});
assert.deepEqual(clean.rejected, [], `a valid payload must reject nothing, rejected: ${clean.rejected}`);
assert.equal(clean.state.aiModel, "gemini-2.5-pro");
assert.equal(clean.state.cameraSensitivity, 1.5);

// Personalisation clamping still honours minimal mode's tighter ranges.
assert.equal(normalizePersonalisation({ minimalMode: true, panelOpacity: 0.1 }).panelOpacity, 0.78);
assert.equal(normalizePersonalisation({ minimalMode: false, panelOpacity: 0.1 }).panelOpacity, 0.72);
assert.equal(normalizePersonalisation({ blurIntensity: 999 }).blurIntensity, 16);
assert.equal(normalizeAiModel("gemini-3-pro"), "gemini-3.1-pro-preview", "legacy model aliases must still map");
assert.equal(normalizeAiModel(undefined), "local-assistant");

console.log(`Responsive layout: ${DEVICES.length} device profiles verified (watch → ultrawide).`);
console.log("Panel geometry: no overlap, no NaN, centre column preserved at every size.");
console.log("Defaults: startup layout respects panel budget; reset returns unaliased state.");
console.log("Fallback: corrupt persisted fields degrade individually; valid fields survive.");
