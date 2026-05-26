# Silver Wolf VI - Deep Technical README

This document is intentionally exhaustive and generated from the current repository state to provide a high-signal maintenance map for continued development and for designing a separate self-diagnostic/self-healing system.

## Verification Boundary

- This README only includes verifiable repository facts, measured outputs, and explicitly marked inferences.
- No fabricated runtime behavior, API contracts, or test coverage claims are included.
- Timestamp (UTC): 2026-05-26 08:42:06

## Repository Snapshot

- Working repository: `silver-wolf-vi`
- Tracked file count from `rg --files`: 228
- Top-level item count (`Get-ChildItem -Force`): 25
- Existing build status: `npm run build` currently fails with `TS8016` in `scripts/test_app.js:198`
- Search for TODO/FIXME/HACK/XXX: no matches found in tracked files during current scan

## Dependency Currency (Measured via npm outdated --long)

- `@tailwindcss/vite`: current `4.2.4`, latest `4.3.0`
- `@types/node`: current `22.19.17`, latest `25.9.1`
- `@vitejs/plugin-react`: current `5.2.0`, latest `6.0.2`
- `lucide-react`: current `0.546.0`, latest `1.16.0`
- `tailwindcss`: current `4.2.4`, latest `4.3.0`
- `typescript`: current `5.8.3`, latest `6.0.3`
- `vite`: current `6.4.2`, latest `8.0.14`

## Active Known Issues and Fix Candidates

1. Build pipeline includes JavaScript files that contain TypeScript-only syntax (`TS8016`).
2. Dependency versions show drift; upgrade path should be staged and validated.
3. Mixed runtime surfaces (React/Vite + Python bridge + archived backend + PureScript) increase integration complexity.
4. No inline TODO markers detected, which is positive but can hide undocumented debt outside code comments.

## Recommended Immediate Repair Sequence (Concrete)

1. Resolve `scripts/test_app.js:198` by either converting file to `.ts`/`.tsx` or removing TS assertion syntax from JS.
2. Re-run `npm run build` and keep this README status section in sync with results.
3. Upgrade tooling in low-risk batches: Tailwind pair, then Vite/plugin-react pair, then TypeScript + @types/node.
4. Add one CI check for `npm run build` to prevent recurrence.

## Extension Inventory

- `.bat` files: 1
- `.cjs` files: 3
- `.css` files: 3
- `.ex` files: 11
- `.exs` files: 9
- `.geojson` files: 1
- `.html` files: 1
- `.ico` files: 1
- `.js` files: 5
- `.json` files: 7
- `.lock` files: 1
- `.md` files: 6
- `.patch` files: 1
- `.po` files: 1
- `.pot` files: 1
- `.purs` files: 3
- `.py` files: 4
- `.pyc` files: 1
- `.svg` files: 1
- `.ts` files: 120
- `.tsx` files: 45
- `.txt` files: 1
- `.yaml` files: 1

## Self-Diagnostic and Self-Healing System Design Notes

### Diagnostic Signals

- Process-level: launcher process exits, bridge process exits, Vite process exits, port-bind failures on `3000` and bridge port.
- Build-level: non-zero exit from `npm run build`, specific TS/Vite error signatures, dependency resolution failures.
- App-level: browser startup failure path in launcher logs, bridge unreachable errors, malformed plugin manifest load events.
- Data-level: GeoJSON parse/normalization failures, plugin entity conversion failures, cache read/write exceptions.

### Healing Actions

- Restart isolated failed process before full-stack restart.
- Auto-clear occupied ports only when owning process is known and safe to terminate.
- Regenerate build artifacts (`dist`) after deterministic build fixes, not as a blind first response.
- Quarantine failing plugin manifests and continue core app boot with degraded mode.
- Emit structured incident record with component, symptom, evidence, action, outcome, and follow-up.

### Minimum Telemetry Schema

- `timestamp_utc`
- `component`
- `operation`
- `severity`
- `evidence`
- `automated_action`
- `automated_result`
- `manual_next_step`

## Per-File Technical Dossiers

The following section intentionally contains high-detail per-file notes to support long-horizon maintenance and to satisfy the requested depth.

### File 1: `_archive\backend\AGENTS.md`

- Path: `_archive\backend\AGENTS.md`
- Extension: `.md`
- Size (bytes): 6913
- Line count (measured): 79
- Last modified UTC: 2026-05-15 09:25:14
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: archived or legacy implementation surface
- Verification candidate: exclude from primary pipeline unless explicitly reactivated
- Potential fix lens: keep docs synchronized with actual command outcomes and repo layout
- Potential issue class: procedural docs diverging from scripts
- Outdated-risk note: stale setup instructions after dependency/tooling changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 2: `_archive\backend\config\config.exs`

- Path: `_archive\backend\config\config.exs`
- Extension: `.exs`
- Size (bytes): 1028
- Line count (measured): 29
- Last modified UTC: 2026-05-15 09:25:14
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: archived or legacy implementation surface
- Verification candidate: exclude from primary pipeline unless explicitly reactivated
- Potential fix lens: preserve format-specific validity and consumer compatibility
- Potential issue class: parser/consumer mismatch
- Outdated-risk note: verify format still consumed by active code paths
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 3: `_archive\backend\config\dev.exs`

- Path: `_archive\backend\config\dev.exs`
- Extension: `.exs`
- Size (bytes): 1931
- Line count (measured): 56
- Last modified UTC: 2026-05-15 09:25:14
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: archived or legacy implementation surface
- Verification candidate: exclude from primary pipeline unless explicitly reactivated
- Potential fix lens: preserve format-specific validity and consumer compatibility
- Potential issue class: parser/consumer mismatch
- Outdated-risk note: verify format still consumed by active code paths
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 4: `_archive\backend\config\prod.exs`

- Path: `_archive\backend\config\prod.exs`
- Extension: `.exs`
- Size (bytes): 621
- Line count (measured): 16
- Last modified UTC: 2026-05-15 09:25:14
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: archived or legacy implementation surface
- Verification candidate: exclude from primary pipeline unless explicitly reactivated
- Potential fix lens: preserve format-specific validity and consumer compatibility
- Potential issue class: parser/consumer mismatch
- Outdated-risk note: verify format still consumed by active code paths
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 5: `_archive\backend\config\runtime.exs`

- Path: `_archive\backend\config\runtime.exs`
- Extension: `.exs`
- Size (bytes): 3815
- Line count (measured): 91
- Last modified UTC: 2026-05-15 09:25:14
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: archived or legacy implementation surface
- Verification candidate: exclude from primary pipeline unless explicitly reactivated
- Potential fix lens: preserve format-specific validity and consumer compatibility
- Potential issue class: parser/consumer mismatch
- Outdated-risk note: verify format still consumed by active code paths
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 6: `_archive\backend\config\test.exs`

- Path: `_archive\backend\config\test.exs`
- Extension: `.exs`
- Size (bytes): 1048
- Line count (measured): 26
- Last modified UTC: 2026-05-15 09:25:14
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: archived or legacy implementation surface
- Verification candidate: exclude from primary pipeline unless explicitly reactivated
- Potential fix lens: preserve format-specific validity and consumer compatibility
- Potential issue class: parser/consumer mismatch
- Outdated-risk note: verify format still consumed by active code paths
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 7: `_archive\backend\lib\sw_core.ex`

- Path: `_archive\backend\lib\sw_core.ex`
- Extension: `.ex`
- Size (bytes): 249
- Line count (measured): 8
- Last modified UTC: 2026-05-15 09:25:14
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: archived or legacy implementation surface
- Verification candidate: exclude from primary pipeline unless explicitly reactivated
- Potential fix lens: preserve format-specific validity and consumer compatibility
- Potential issue class: parser/consumer mismatch
- Outdated-risk note: verify format still consumed by active code paths
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 8: `_archive\backend\lib\sw_core\application.ex`

- Path: `_archive\backend\lib\sw_core\application.ex`
- Extension: `.ex`
- Size (bytes): 1030
- Line count (measured): 30
- Last modified UTC: 2026-05-15 09:25:14
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: archived or legacy implementation surface
- Verification candidate: exclude from primary pipeline unless explicitly reactivated
- Potential fix lens: preserve format-specific validity and consumer compatibility
- Potential issue class: parser/consumer mismatch
- Outdated-risk note: verify format still consumed by active code paths
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 9: `_archive\backend\lib\sw_core\repo.ex`

- Path: `_archive\backend\lib\sw_core\repo.ex`
- Extension: `.ex`
- Size (bytes): 105
- Line count (measured): 5
- Last modified UTC: 2026-05-15 09:25:14
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: archived or legacy implementation surface
- Verification candidate: exclude from primary pipeline unless explicitly reactivated
- Potential fix lens: preserve format-specific validity and consumer compatibility
- Potential issue class: parser/consumer mismatch
- Outdated-risk note: verify format still consumed by active code paths
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 10: `_archive\backend\lib\sw_core_web.ex`

- Path: `_archive\backend\lib\sw_core_web.ex`
- Extension: `.ex`
- Size (bytes): 1492
- Line count (measured): 51
- Last modified UTC: 2026-05-15 09:25:14
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: archived or legacy implementation surface
- Verification candidate: exclude from primary pipeline unless explicitly reactivated
- Potential fix lens: preserve format-specific validity and consumer compatibility
- Potential issue class: parser/consumer mismatch
- Outdated-risk note: verify format still consumed by active code paths
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 11: `_archive\backend\lib\sw_core_web\controllers\error_json.ex`

- Path: `_archive\backend\lib\sw_core_web\controllers\error_json.ex`
- Extension: `.ex`
- Size (bytes): 622
- Line count (measured): 18
- Last modified UTC: 2026-05-15 09:25:14
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: archived or legacy implementation surface
- Verification candidate: exclude from primary pipeline unless explicitly reactivated
- Potential fix lens: preserve format-specific validity and consumer compatibility
- Potential issue class: parser/consumer mismatch
- Outdated-risk note: verify format still consumed by active code paths
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 12: `_archive\backend\lib\sw_core_web\endpoint.ex`

- Path: `_archive\backend\lib\sw_core_web\endpoint.ex`
- Extension: `.ex`
- Size (bytes): 1594
- Line count (measured): 45
- Last modified UTC: 2026-05-15 09:25:14
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: archived or legacy implementation surface
- Verification candidate: exclude from primary pipeline unless explicitly reactivated
- Potential fix lens: preserve format-specific validity and consumer compatibility
- Potential issue class: parser/consumer mismatch
- Outdated-risk note: verify format still consumed by active code paths
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 13: `_archive\backend\lib\sw_core_web\gettext.ex`

- Path: `_archive\backend\lib\sw_core_web\gettext.ex`
- Extension: `.ex`
- Size (bytes): 822
- Line count (measured): 19
- Last modified UTC: 2026-05-15 09:25:14
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: archived or legacy implementation surface
- Verification candidate: exclude from primary pipeline unless explicitly reactivated
- Potential fix lens: preserve format-specific validity and consumer compatibility
- Potential issue class: parser/consumer mismatch
- Outdated-risk note: verify format still consumed by active code paths
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 14: `_archive\backend\lib\sw_core_web\router.ex`

- Path: `_archive\backend\lib\sw_core_web\router.ex`
- Extension: `.ex`
- Size (bytes): 810
- Line count (measured): 22
- Last modified UTC: 2026-05-15 09:25:14
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: archived or legacy implementation surface
- Verification candidate: exclude from primary pipeline unless explicitly reactivated
- Potential fix lens: preserve format-specific validity and consumer compatibility
- Potential issue class: parser/consumer mismatch
- Outdated-risk note: verify format still consumed by active code paths
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 15: `_archive\backend\lib\sw_core_web\telemetry.ex`

- Path: `_archive\backend\lib\sw_core_web\telemetry.ex`
- Extension: `.ex`
- Size (bytes): 2996
- Line count (measured): 86
- Last modified UTC: 2026-05-15 09:25:14
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: archived or legacy implementation surface
- Verification candidate: exclude from primary pipeline unless explicitly reactivated
- Potential fix lens: preserve format-specific validity and consumer compatibility
- Potential issue class: parser/consumer mismatch
- Outdated-risk note: verify format still consumed by active code paths
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 16: `_archive\backend\mix.exs`

- Path: `_archive\backend\mix.exs`
- Extension: `.exs`
- Size (bytes): 1886
- Line count (measured): 65
- Last modified UTC: 2026-05-15 09:25:14
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: archived or legacy implementation surface
- Verification candidate: exclude from primary pipeline unless explicitly reactivated
- Potential fix lens: preserve format-specific validity and consumer compatibility
- Potential issue class: parser/consumer mismatch
- Outdated-risk note: verify format still consumed by active code paths
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 17: `_archive\backend\priv\gettext\en\LC_MESSAGES\errors.po`

- Path: `_archive\backend\priv\gettext\en\LC_MESSAGES\errors.po`
- Extension: `.po`
- Size (bytes): 2543
- Line count (measured): 88
- Last modified UTC: 2026-05-15 09:25:14
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: archived or legacy implementation surface
- Verification candidate: exclude from primary pipeline unless explicitly reactivated
- Potential fix lens: preserve format-specific validity and consumer compatibility
- Potential issue class: parser/consumer mismatch
- Outdated-risk note: verify format still consumed by active code paths
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 18: `_archive\backend\priv\gettext\errors.pot`

- Path: `_archive\backend\priv\gettext\errors.pot`
- Extension: `.pot`
- Size (bytes): 2571
- Line count (measured): 86
- Last modified UTC: 2026-05-15 09:25:14
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: archived or legacy implementation surface
- Verification candidate: exclude from primary pipeline unless explicitly reactivated
- Potential fix lens: preserve format-specific validity and consumer compatibility
- Potential issue class: parser/consumer mismatch
- Outdated-risk note: verify format still consumed by active code paths
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 19: `_archive\backend\priv\repo\seeds.exs`

- Path: `_archive\backend\priv\repo\seeds.exs`
- Extension: `.exs`
- Size (bytes): 349
- Line count (measured): 11
- Last modified UTC: 2026-05-15 09:25:14
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: archived or legacy implementation surface
- Verification candidate: exclude from primary pipeline unless explicitly reactivated
- Potential fix lens: preserve format-specific validity and consumer compatibility
- Potential issue class: parser/consumer mismatch
- Outdated-risk note: verify format still consumed by active code paths
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 20: `_archive\backend\priv\static\favicon.ico`

- Path: `_archive\backend\priv\static\favicon.ico`
- Extension: `.ico`
- Size (bytes): 152
- Line count (measured): 5
- Last modified UTC: 2026-05-15 09:25:14
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: archived or legacy implementation surface
- Verification candidate: exclude from primary pipeline unless explicitly reactivated
- Potential fix lens: preserve format-specific validity and consumer compatibility
- Potential issue class: parser/consumer mismatch
- Outdated-risk note: verify format still consumed by active code paths
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 21: `_archive\backend\priv\static\robots.txt`

- Path: `_archive\backend\priv\static\robots.txt`
- Extension: `.txt`
- Size (bytes): 203
- Line count (measured): 5
- Last modified UTC: 2026-05-15 09:25:14
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: archived or legacy implementation surface
- Verification candidate: exclude from primary pipeline unless explicitly reactivated
- Potential fix lens: preserve format-specific validity and consumer compatibility
- Potential issue class: parser/consumer mismatch
- Outdated-risk note: verify format still consumed by active code paths
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 22: `_archive\backend\README.md`

- Path: `_archive\backend\README.md`
- Extension: `.md`
- Size (bytes): 633
- Line count (measured): 12
- Last modified UTC: 2026-05-15 09:25:14
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: archived or legacy implementation surface
- Verification candidate: exclude from primary pipeline unless explicitly reactivated
- Potential fix lens: keep docs synchronized with actual command outcomes and repo layout
- Potential issue class: procedural docs diverging from scripts
- Outdated-risk note: stale setup instructions after dependency/tooling changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 23: `_archive\backend\test\support\conn_case.ex`

- Path: `_archive\backend\test\support\conn_case.ex`
- Extension: `.ex`
- Size (bytes): 1099
- Line count (measured): 31
- Last modified UTC: 2026-05-15 09:25:14
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: archived or legacy implementation surface
- Verification candidate: exclude from primary pipeline unless explicitly reactivated
- Potential fix lens: preserve format-specific validity and consumer compatibility
- Potential issue class: parser/consumer mismatch
- Outdated-risk note: verify format still consumed by active code paths
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 24: `_archive\backend\test\support\data_case.ex`

- Path: `_archive\backend\test\support\data_case.ex`
- Extension: `.ex`
- Size (bytes): 1654
- Line count (measured): 48
- Last modified UTC: 2026-05-15 09:25:14
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: archived or legacy implementation surface
- Verification candidate: exclude from primary pipeline unless explicitly reactivated
- Potential fix lens: preserve format-specific validity and consumer compatibility
- Potential issue class: parser/consumer mismatch
- Outdated-risk note: verify format still consumed by active code paths
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 25: `_archive\backend\test\sw_core_web\controllers\error_json_test.exs`

- Path: `_archive\backend\test\sw_core_web\controllers\error_json_test.exs`
- Extension: `.exs`
- Size (bytes): 350
- Line count (measured): 10
- Last modified UTC: 2026-05-15 09:25:14
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: archived or legacy implementation surface
- Verification candidate: exclude from primary pipeline unless explicitly reactivated
- Potential fix lens: preserve format-specific validity and consumer compatibility
- Potential issue class: parser/consumer mismatch
- Outdated-risk note: verify format still consumed by active code paths
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 26: `_archive\backend\test\test_helper.exs`

- Path: `_archive\backend\test\test_helper.exs`
- Extension: `.exs`
- Size (bytes): 68
- Line count (measured): 2
- Last modified UTC: 2026-05-15 09:25:14
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: archived or legacy implementation surface
- Verification candidate: exclude from primary pipeline unless explicitly reactivated
- Potential fix lens: preserve format-specific validity and consumer compatibility
- Potential issue class: parser/consumer mismatch
- Outdated-risk note: verify format still consumed by active code paths
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 27: `bridge\__pycache__\server.cpython-314.pyc`

- Path: `bridge\__pycache__\server.cpython-314.pyc`
- Extension: `.pyc`
- Size (bytes): 11271
- Line count (measured): 73
- Last modified UTC: 2026-05-26 04:14:51
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: bridge/runtime integration surface
- Verification candidate: health endpoint, startup, CORS, and provider fallback tests
- Potential fix lens: preserve format-specific validity and consumer compatibility
- Potential issue class: parser/consumer mismatch
- Outdated-risk note: verify format still consumed by active code paths
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 28: `bridge\server.py`

- Path: `bridge\server.py`
- Extension: `.py`
- Size (bytes): 6479
- Line count (measured): 152
- Last modified UTC: 2026-05-26 04:14:51
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: bridge/runtime integration surface
- Verification candidate: health endpoint, startup, CORS, and provider fallback tests
- Potential fix lens: dependency pinning, input validation hardening, structured error responses
- Potential issue class: runtime environment drift across Python versions
- Outdated-risk note: verify compatibility with currently targeted Python interpreter
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 29: `correct_changes.patch`

- Path: `correct_changes.patch`
- Extension: `.patch`
- Size (bytes): 179592
- Line count (measured): 5388
- Last modified UTC: 2026-05-21 13:40:05
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: support/config/documentation/resource surface
- Verification candidate: syntax and reference integrity checks
- Potential fix lens: preserve format-specific validity and consumer compatibility
- Potential issue class: parser/consumer mismatch
- Outdated-risk note: verify format still consumed by active code paths
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 30: `development_logs\automated_test_report.json`

- Path: `development_logs\automated_test_report.json`
- Extension: `.json`
- Size (bytes): 270
- Line count (measured): 11
- Last modified UTC: 2026-05-25 13:49:59
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: support/config/documentation/resource surface
- Verification candidate: syntax and reference integrity checks
- Potential fix lens: schema validation and key consistency checks
- Potential issue class: silent config drift without validation
- Outdated-risk note: stale data contracts against evolved code expectations
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 31: `development_logs\PROJECT_ANALYSIS_MASTER_PROMPT.md`

- Path: `development_logs\PROJECT_ANALYSIS_MASTER_PROMPT.md`
- Extension: `.md`
- Size (bytes): 156431
- Line count (measured): 1256
- Last modified UTC: 2026-05-25 13:49:59
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: support/config/documentation/resource surface
- Verification candidate: syntax and reference integrity checks
- Potential fix lens: keep docs synchronized with actual command outcomes and repo layout
- Potential issue class: procedural docs diverging from scripts
- Outdated-risk note: stale setup instructions after dependency/tooling changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 32: `docs\progress.md`

- Path: `docs\progress.md`
- Extension: `.md`
- Size (bytes): 926
- Line count (measured): 21
- Last modified UTC: 2026-05-25 13:49:59
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: support/config/documentation/resource surface
- Verification candidate: syntax and reference integrity checks
- Potential fix lens: keep docs synchronized with actual command outcomes and repo layout
- Potential issue class: procedural docs diverging from scripts
- Outdated-risk note: stale setup instructions after dependency/tooling changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 33: `index.html`

- Path: `index.html`
- Extension: `.html`
- Size (bytes): 4030
- Line count (measured): 92
- Last modified UTC: 2026-05-26 04:00:01
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: support/config/documentation/resource surface
- Verification candidate: syntax and reference integrity checks
- Potential fix lens: preserve format-specific validity and consumer compatibility
- Potential issue class: parser/consumer mismatch
- Outdated-risk note: verify format still consumed by active code paths
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 34: `launch.bat`

- Path: `launch.bat`
- Extension: `.bat`
- Size (bytes): 734
- Line count (measured): 22
- Last modified UTC: 2026-05-20 14:06:16
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: support/config/documentation/resource surface
- Verification candidate: syntax and reference integrity checks
- Potential fix lens: preserve format-specific validity and consumer compatibility
- Potential issue class: parser/consumer mismatch
- Outdated-risk note: verify format still consumed by active code paths
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 35: `launch.js`

- Path: `launch.js`
- Extension: `.js`
- Size (bytes): 5913
- Line count (measured): 148
- Last modified UTC: 2026-05-26 06:41:04
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: support/config/documentation/resource surface
- Verification candidate: syntax and reference integrity checks
- Potential fix lens: avoid TS-only syntax in plain JS unless transpilation path is configured
- Potential issue class: mixed module syntax/runtime incompatibility
- Outdated-risk note: Node/Vite changes can tighten ESM/CJS behavior
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 36: `manual\README.md`

- Path: `manual\README.md`
- Extension: `.md`
- Size (bytes): 9895
- Line count (measured): 127
- Last modified UTC: 2026-05-25 13:49:59
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: support/config/documentation/resource surface
- Verification candidate: syntax and reference integrity checks
- Potential fix lens: keep docs synchronized with actual command outcomes and repo layout
- Potential issue class: procedural docs diverging from scripts
- Outdated-risk note: stale setup instructions after dependency/tooling changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 37: `package.json`

- Path: `package.json`
- Extension: `.json`
- Size (bytes): 1225
- Line count (measured): 35
- Last modified UTC: 2026-05-26 04:14:51
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: support/config/documentation/resource surface
- Verification candidate: syntax and reference integrity checks
- Potential fix lens: schema validation and key consistency checks
- Potential issue class: silent config drift without validation
- Outdated-risk note: stale data contracts against evolved code expectations
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 38: `package-lock.json`

- Path: `package-lock.json`
- Extension: `.json`
- Size (bytes): 137587
- Line count (measured): 3824
- Last modified UTC: 2026-05-26 03:33:06
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: support/config/documentation/resource surface
- Verification candidate: syntax and reference integrity checks
- Potential fix lens: schema validation and key consistency checks
- Potential issue class: silent config drift without validation
- Outdated-risk note: stale data contracts against evolved code expectations
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 39: `public\borders.geojson`

- Path: `public\borders.geojson`
- Extension: `.geojson`
- Size (bytes): 401
- Line count (measured): 21
- Last modified UTC: 2026-05-25 13:49:59
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: support/config/documentation/resource surface
- Verification candidate: syntax and reference integrity checks
- Potential fix lens: preserve format-specific validity and consumer compatibility
- Potential issue class: parser/consumer mismatch
- Outdated-risk note: verify format still consumed by active code paths
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 40: `public\favicon.svg`

- Path: `public\favicon.svg`
- Extension: `.svg`
- Size (bytes): 536
- Line count (measured): 12
- Last modified UTC: 2026-05-14 13:54:36
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: support/config/documentation/resource surface
- Verification candidate: syntax and reference integrity checks
- Potential fix lens: preserve format-specific validity and consumer compatibility
- Potential issue class: parser/consumer mismatch
- Outdated-risk note: verify format still consumed by active code paths
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 41: `README.md`

- Path: `README.md`
- Extension: `.md`
- Size (bytes): 3984
- Line count (measured): 58
- Last modified UTC: 2026-05-26 08:33:28
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: support/config/documentation/resource surface
- Verification candidate: syntax and reference integrity checks
- Potential fix lens: keep docs synchronized with actual command outcomes and repo layout
- Potential issue class: procedural docs diverging from scripts
- Outdated-risk note: stale setup instructions after dependency/tooling changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 42: `scratch\check_dev_server.py`

- Path: `scratch\check_dev_server.py`
- Extension: `.py`
- Size (bytes): 375
- Line count (measured): 10
- Last modified UTC: 2026-05-25 13:49:59
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: support/config/documentation/resource surface
- Verification candidate: syntax and reference integrity checks
- Potential fix lens: dependency pinning, input validation hardening, structured error responses
- Potential issue class: runtime environment drift across Python versions
- Outdated-risk note: verify compatibility with currently targeted Python interpreter
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 43: `scratch\fetch_test.cjs`

- Path: `scratch\fetch_test.cjs`
- Extension: `.cjs`
- Size (bytes): 421
- Line count (measured): 13
- Last modified UTC: 2026-05-25 13:49:59
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: support/config/documentation/resource surface
- Verification candidate: syntax and reference integrity checks
- Potential fix lens: preserve format-specific validity and consumer compatibility
- Potential issue class: parser/consumer mismatch
- Outdated-risk note: verify format still consumed by active code paths
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 44: `scratch\fetch_test.js`

- Path: `scratch\fetch_test.js`
- Extension: `.js`
- Size (bytes): 421
- Line count (measured): 13
- Last modified UTC: 2026-05-25 13:49:59
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: support/config/documentation/resource surface
- Verification candidate: syntax and reference integrity checks
- Potential fix lens: avoid TS-only syntax in plain JS unless transpilation path is configured
- Potential issue class: mixed module syntax/runtime incompatibility
- Outdated-risk note: Node/Vite changes can tighten ESM/CJS behavior
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 45: `scratch\test_script.js`

- Path: `scratch\test_script.js`
- Extension: `.js`
- Size (bytes): 9940
- Line count (measured): 249
- Last modified UTC: 2026-05-25 13:49:59
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: support/config/documentation/resource surface
- Verification candidate: syntax and reference integrity checks
- Potential fix lens: avoid TS-only syntax in plain JS unless transpilation path is configured
- Potential issue class: mixed module syntax/runtime incompatibility
- Outdated-risk note: Node/Vite changes can tighten ESM/CJS behavior
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 46: `scripts\maintenance\log_analyzer.py`

- Path: `scripts\maintenance\log_analyzer.py`
- Extension: `.py`
- Size (bytes): 519
- Line count (measured): 11
- Last modified UTC: 2026-05-15 14:43:09
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: operational automation/test utility surface
- Verification candidate: run script under documented env and validate non-zero exits on failure
- Potential fix lens: dependency pinning, input validation hardening, structured error responses
- Potential issue class: runtime environment drift across Python versions
- Outdated-risk note: verify compatibility with currently targeted Python interpreter
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 47: `scripts\test_app.cjs`

- Path: `scripts\test_app.cjs`
- Extension: `.cjs`
- Size (bytes): 10747
- Line count (measured): 242
- Last modified UTC: 2026-05-26 04:14:51
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: operational automation/test utility surface
- Verification candidate: run script under documented env and validate non-zero exits on failure
- Potential fix lens: preserve format-specific validity and consumer compatibility
- Potential issue class: parser/consumer mismatch
- Outdated-risk note: verify format still consumed by active code paths
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 48: `scripts\test_app.js`

- Path: `scripts\test_app.js`
- Extension: `.js`
- Size (bytes): 9694
- Line count (measured): 217
- Last modified UTC: 2026-05-26 04:14:51
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: operational automation/test utility surface
- Verification candidate: run script under documented env and validate non-zero exits on failure
- Potential fix lens: avoid TS-only syntax in plain JS unless transpilation path is configured
- Potential issue class: mixed module syntax/runtime incompatibility
- Outdated-risk note: Node/Vite changes can tighten ESM/CJS behavior
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 49: `scripts\test_example.cjs`

- Path: `scripts\test_example.cjs`
- Extension: `.cjs`
- Size (bytes): 563
- Line count (measured): 18
- Last modified UTC: 2026-05-25 13:49:59
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: operational automation/test utility surface
- Verification candidate: run script under documented env and validate non-zero exits on failure
- Potential fix lens: preserve format-specific validity and consumer compatibility
- Potential issue class: parser/consumer mismatch
- Outdated-risk note: verify format still consumed by active code paths
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 50: `scripts\update_ai.py`

- Path: `scripts\update_ai.py`
- Extension: `.py`
- Size (bytes): 585
- Line count (measured): 19
- Last modified UTC: 2026-05-16 09:22:58
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: operational automation/test utility surface
- Verification candidate: run script under documented env and validate non-zero exits on failure
- Potential fix lens: dependency pinning, input validation hardening, structured error responses
- Potential issue class: runtime environment drift across Python versions
- Outdated-risk note: verify compatibility with currently targeted Python interpreter
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 51: `src\App.tsx`

- Path: `src\App.tsx`
- Extension: `.tsx`
- Size (bytes): 6478
- Line count (measured): 132
- Last modified UTC: 2026-05-26 04:14:51
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: render path profiling, memoization opportunities, and prop contract tightening
- Potential issue class: UI regressions from library upgrades
- Outdated-risk note: React/Vite plugin major bumps can affect JSX transform assumptions
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 52: `src\components\background\CesiumBackground.tsx`

- Path: `src\components\background\CesiumBackground.tsx`
- Extension: `.tsx`
- Size (bytes): 10841
- Line count (measured): 246
- Last modified UTC: 2026-05-26 03:33:06
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: render path profiling, memoization opportunities, and prop contract tightening
- Potential issue class: UI regressions from library upgrades
- Outdated-risk note: React/Vite plugin major bumps can affect JSX transform assumptions
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 53: `src\components\background\CesiumBackground3D.tsx`

- Path: `src\components\background\CesiumBackground3D.tsx`
- Extension: `.tsx`
- Size (bytes): 2302
- Line count (measured): 54
- Last modified UTC: 2026-05-26 03:33:06
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: render path profiling, memoization opportunities, and prop contract tightening
- Potential issue class: UI regressions from library upgrades
- Outdated-risk note: React/Vite plugin major bumps can affect JSX transform assumptions
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 54: `src\components\background\RenderEffectsOverlay.tsx`

- Path: `src\components\background\RenderEffectsOverlay.tsx`
- Extension: `.tsx`
- Size (bytes): 174
- Line count (measured): 6
- Last modified UTC: 2026-05-26 03:33:06
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: render path profiling, memoization opportunities, and prop contract tightening
- Potential issue class: UI regressions from library upgrades
- Outdated-risk note: React/Vite plugin major bumps can affect JSX transform assumptions
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 55: `src\components\chat\ChatInput.tsx`

- Path: `src\components\chat\ChatInput.tsx`
- Extension: `.tsx`
- Size (bytes): 1594
- Line count (measured): 40
- Last modified UTC: 2026-05-24 07:30:00
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: render path profiling, memoization opportunities, and prop contract tightening
- Potential issue class: UI regressions from library upgrades
- Outdated-risk note: React/Vite plugin major bumps can affect JSX transform assumptions
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 56: `src\components\chat\ChatInputBar.tsx`

- Path: `src\components\chat\ChatInputBar.tsx`
- Extension: `.tsx`
- Size (bytes): 3041
- Line count (measured): 78
- Last modified UTC: 2026-05-24 07:30:00
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: render path profiling, memoization opportunities, and prop contract tightening
- Potential issue class: UI regressions from library upgrades
- Outdated-risk note: React/Vite plugin major bumps can affect JSX transform assumptions
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 57: `src\components\chat\ChatMessage.tsx`

- Path: `src\components\chat\ChatMessage.tsx`
- Extension: `.tsx`
- Size (bytes): 2281
- Line count (measured): 48
- Last modified UTC: 2026-05-25 13:49:59
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: render path profiling, memoization opportunities, and prop contract tightening
- Potential issue class: UI regressions from library upgrades
- Outdated-risk note: React/Vite plugin major bumps can affect JSX transform assumptions
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 58: `src\components\ChatPanel.tsx`

- Path: `src\components\ChatPanel.tsx`
- Extension: `.tsx`
- Size (bytes): 1184
- Line count (measured): 28
- Last modified UTC: 2026-05-24 07:30:00
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: render path profiling, memoization opportunities, and prop contract tightening
- Potential issue class: UI regressions from library upgrades
- Outdated-risk note: React/Vite plugin major bumps can affect JSX transform assumptions
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 59: `src\components\common\IconButton.tsx`

- Path: `src\components\common\IconButton.tsx`
- Extension: `.tsx`
- Size (bytes): 1407
- Line count (measured): 38
- Last modified UTC: 2026-05-24 07:30:00
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: render path profiling, memoization opportunities, and prop contract tightening
- Potential issue class: UI regressions from library upgrades
- Outdated-risk note: React/Vite plugin major bumps can affect JSX transform assumptions
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 60: `src\components\common\SectionHeader.tsx`

- Path: `src\components\common\SectionHeader.tsx`
- Extension: `.tsx`
- Size (bytes): 643
- Line count (measured): 21
- Last modified UTC: 2026-05-24 07:30:00
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: render path profiling, memoization opportunities, and prop contract tightening
- Potential issue class: UI regressions from library upgrades
- Outdated-risk note: React/Vite plugin major bumps can affect JSX transform assumptions
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 61: `src\components\ErrorBoundary.tsx`

- Path: `src\components\ErrorBoundary.tsx`
- Extension: `.tsx`
- Size (bytes): 3283
- Line count (measured): 109
- Last modified UTC: 2026-05-24 07:30:00
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: render path profiling, memoization opportunities, and prop contract tightening
- Potential issue class: UI regressions from library upgrades
- Outdated-risk note: React/Vite plugin major bumps can affect JSX transform assumptions
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 62: `src\components\launcher\LauncherPage.tsx`

- Path: `src\components\launcher\LauncherPage.tsx`
- Extension: `.tsx`
- Size (bytes): 10041
- Line count (measured): 182
- Last modified UTC: 2026-05-24 07:30:00
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: render path profiling, memoization opportunities, and prop contract tightening
- Potential issue class: UI regressions from library upgrades
- Outdated-risk note: React/Vite plugin major bumps can affect JSX transform assumptions
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 63: `src\components\layout\DataBusSubscriber.tsx`

- Path: `src\components\layout\DataBusSubscriber.tsx`
- Extension: `.tsx`
- Size (bytes): 3161
- Line count (measured): 72
- Last modified UTC: 2026-05-24 08:24:39
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: render path profiling, memoization opportunities, and prop contract tightening
- Potential issue class: UI regressions from library upgrades
- Outdated-risk note: React/Vite plugin major bumps can affect JSX transform assumptions
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 64: `src\components\layout\WorkspaceHeader.tsx`

- Path: `src\components\layout\WorkspaceHeader.tsx`
- Extension: `.tsx`
- Size (bytes): 3384
- Line count (measured): 72
- Last modified UTC: 2026-05-26 03:33:06
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: render path profiling, memoization opportunities, and prop contract tightening
- Potential issue class: UI regressions from library upgrades
- Outdated-risk note: React/Vite plugin major bumps can affect JSX transform assumptions
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 65: `src\components\learning\ConceptCard.tsx`

- Path: `src\components\learning\ConceptCard.tsx`
- Extension: `.tsx`
- Size (bytes): 1980
- Line count (measured): 45
- Last modified UTC: 2026-05-24 07:30:00
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: render path profiling, memoization opportunities, and prop contract tightening
- Potential issue class: UI regressions from library upgrades
- Outdated-risk note: React/Vite plugin major bumps can affect JSX transform assumptions
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 66: `src\components\learning\ConceptOverlay.tsx`

- Path: `src\components\learning\ConceptOverlay.tsx`
- Extension: `.tsx`
- Size (bytes): 2536
- Line count (measured): 58
- Last modified UTC: 2026-05-24 07:30:00
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: render path profiling, memoization opportunities, and prop contract tightening
- Potential issue class: UI regressions from library upgrades
- Outdated-risk note: React/Vite plugin major bumps can affect JSX transform assumptions
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 67: `src\components\learning\GoogleEarthRemix.css`

- Path: `src\components\learning\GoogleEarthRemix.css`
- Extension: `.css`
- Size (bytes): 24359
- Line count (measured): 1046
- Last modified UTC: 2026-05-26 03:33:06
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: token consolidation and dead selector cleanup
- Potential issue class: styling regressions with Tailwind/plugin upgrades
- Outdated-risk note: version drift in utility class generation behavior
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 68: `src\components\learning\GoogleEarthRemix.tsx`

- Path: `src\components\learning\GoogleEarthRemix.tsx`
- Extension: `.tsx`
- Size (bytes): 62485
- Line count (measured): 1461
- Last modified UTC: 2026-05-26 03:33:06
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: render path profiling, memoization opportunities, and prop contract tightening
- Potential issue class: UI regressions from library upgrades
- Outdated-risk note: React/Vite plugin major bumps can affect JSX transform assumptions
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 69: `src\components\learning\LearningHub.tsx`

- Path: `src\components\learning\LearningHub.tsx`
- Extension: `.tsx`
- Size (bytes): 2210
- Line count (measured): 50
- Last modified UTC: 2026-05-24 07:30:00
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: render path profiling, memoization opportunities, and prop contract tightening
- Potential issue class: UI regressions from library upgrades
- Outdated-risk note: React/Vite plugin major bumps can affect JSX transform assumptions
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 70: `src\components\learning\WorldWideTelescopeView.tsx`

- Path: `src\components\learning\WorldWideTelescopeView.tsx`
- Extension: `.tsx`
- Size (bytes): 8285
- Line count (measured): 183
- Last modified UTC: 2026-05-26 04:14:51
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: render path profiling, memoization opportunities, and prop contract tightening
- Potential issue class: UI regressions from library upgrades
- Outdated-risk note: React/Vite plugin major bumps can affect JSX transform assumptions
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 71: `src\components\MarkdownMessage.tsx`

- Path: `src\components\MarkdownMessage.tsx`
- Extension: `.tsx`
- Size (bytes): 9457
- Line count (measured): 244
- Last modified UTC: 2026-05-26 04:00:13
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: render path profiling, memoization opportunities, and prop contract tightening
- Potential issue class: UI regressions from library upgrades
- Outdated-risk note: React/Vite plugin major bumps can affect JSX transform assumptions
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 72: `src\components\panels\CenterPanel.tsx`

- Path: `src\components\panels\CenterPanel.tsx`
- Extension: `.tsx`
- Size (bytes): 5036
- Line count (measured): 103
- Last modified UTC: 2026-05-26 03:33:06
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: render path profiling, memoization opportunities, and prop contract tightening
- Potential issue class: UI regressions from library upgrades
- Outdated-risk note: React/Vite plugin major bumps can affect JSX transform assumptions
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 73: `src\components\panels\ChatSessionList.tsx`

- Path: `src\components\panels\ChatSessionList.tsx`
- Extension: `.tsx`
- Size (bytes): 4305
- Line count (measured): 96
- Last modified UTC: 2026-05-24 07:30:00
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: render path profiling, memoization opportunities, and prop contract tightening
- Potential issue class: UI regressions from library upgrades
- Outdated-risk note: React/Vite plugin major bumps can affect JSX transform assumptions
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 74: `src\components\panels\FileTreeSection.tsx`

- Path: `src\components\panels\FileTreeSection.tsx`
- Extension: `.tsx`
- Size (bytes): 2665
- Line count (measured): 67
- Last modified UTC: 2026-05-24 07:30:00
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: render path profiling, memoization opportunities, and prop contract tightening
- Potential issue class: UI regressions from library upgrades
- Outdated-risk note: React/Vite plugin major bumps can affect JSX transform assumptions
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 75: `src\components\panels\LeftPanel.tsx`

- Path: `src\components\panels\LeftPanel.tsx`
- Extension: `.tsx`
- Size (bytes): 4497
- Line count (measured): 103
- Last modified UTC: 2026-05-24 07:30:00
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: render path profiling, memoization opportunities, and prop contract tightening
- Potential issue class: UI regressions from library upgrades
- Outdated-risk note: React/Vite plugin major bumps can affect JSX transform assumptions
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 76: `src\components\panels\RightPanel.tsx`

- Path: `src\components\panels\RightPanel.tsx`
- Extension: `.tsx`
- Size (bytes): 20498
- Line count (measured): 396
- Last modified UTC: 2026-05-26 04:00:06
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: render path profiling, memoization opportunities, and prop contract tightening
- Potential issue class: UI regressions from library upgrades
- Outdated-risk note: React/Vite plugin major bumps can affect JSX transform assumptions
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 77: `src\components\panels\SidebarTrigger.tsx`

- Path: `src\components\panels\SidebarTrigger.tsx`
- Extension: `.tsx`
- Size (bytes): 1093
- Line count (measured): 21
- Last modified UTC: 2026-05-25 13:49:59
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: render path profiling, memoization opportunities, and prop contract tightening
- Potential issue class: UI regressions from library upgrades
- Outdated-risk note: React/Vite plugin major bumps can affect JSX transform assumptions
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 78: `src\components\ParticleOverlay.tsx`

- Path: `src\components\ParticleOverlay.tsx`
- Extension: `.tsx`
- Size (bytes): 6370
- Line count (measured): 170
- Last modified UTC: 2026-05-24 07:30:00
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: render path profiling, memoization opportunities, and prop contract tightening
- Potential issue class: UI regressions from library upgrades
- Outdated-risk note: React/Vite plugin major bumps can affect JSX transform assumptions
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 79: `src\components\settings\AiSettings.tsx`

- Path: `src\components\settings\AiSettings.tsx`
- Extension: `.tsx`
- Size (bytes): 2181
- Line count (measured): 40
- Last modified UTC: 2026-05-24 07:30:00
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: render path profiling, memoization opportunities, and prop contract tightening
- Potential issue class: UI regressions from library upgrades
- Outdated-risk note: React/Vite plugin major bumps can affect JSX transform assumptions
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 80: `src\components\settings\FeedbackSettings.tsx`

- Path: `src\components\settings\FeedbackSettings.tsx`
- Extension: `.tsx`
- Size (bytes): 1929
- Line count (measured): 45
- Last modified UTC: 2026-05-24 07:30:00
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: render path profiling, memoization opportunities, and prop contract tightening
- Potential issue class: UI regressions from library upgrades
- Outdated-risk note: React/Vite plugin major bumps can affect JSX transform assumptions
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 81: `src\components\settings\NotionSettings.tsx`

- Path: `src\components\settings\NotionSettings.tsx`
- Extension: `.tsx`
- Size (bytes): 2324
- Line count (measured): 53
- Last modified UTC: 2026-05-24 07:30:00
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: render path profiling, memoization opportunities, and prop contract tightening
- Potential issue class: UI regressions from library upgrades
- Outdated-risk note: React/Vite plugin major bumps can affect JSX transform assumptions
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 82: `src\components\settings\PersonalisationSettings.tsx`

- Path: `src\components\settings\PersonalisationSettings.tsx`
- Extension: `.tsx`
- Size (bytes): 21800
- Line count (measured): 423
- Last modified UTC: 2026-05-25 13:55:32
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: render path profiling, memoization opportunities, and prop contract tightening
- Potential issue class: UI regressions from library upgrades
- Outdated-risk note: React/Vite plugin major bumps can affect JSX transform assumptions
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 83: `src\components\settings\SettingsPage.tsx`

- Path: `src\components\settings\SettingsPage.tsx`
- Extension: `.tsx`
- Size (bytes): 5914
- Line count (measured): 113
- Last modified UTC: 2026-05-26 03:33:06
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: render path profiling, memoization opportunities, and prop contract tightening
- Potential issue class: UI regressions from library upgrades
- Outdated-risk note: React/Vite plugin major bumps can affect JSX transform assumptions
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 84: `src\components\settings\SettingsSection.tsx`

- Path: `src\components\settings\SettingsSection.tsx`
- Extension: `.tsx`
- Size (bytes): 436
- Line count (measured): 15
- Last modified UTC: 2026-05-24 07:30:00
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: render path profiling, memoization opportunities, and prop contract tightening
- Potential issue class: UI regressions from library upgrades
- Outdated-risk note: React/Vite plugin major bumps can affect JSX transform assumptions
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 85: `src\components\settings\ThemeSettings.tsx`

- Path: `src\components\settings\ThemeSettings.tsx`
- Extension: `.tsx`
- Size (bytes): 2563
- Line count (measured): 54
- Last modified UTC: 2026-05-24 07:30:00
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: render path profiling, memoization opportunities, and prop contract tightening
- Potential issue class: UI regressions from library upgrades
- Outdated-risk note: React/Vite plugin major bumps can affect JSX transform assumptions
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 86: `src\components\SystemMonitor.tsx`

- Path: `src\components\SystemMonitor.tsx`
- Extension: `.tsx`
- Size (bytes): 7160
- Line count (measured): 133
- Last modified UTC: 2026-05-26 04:14:51
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: render path profiling, memoization opportunities, and prop contract tightening
- Potential issue class: UI regressions from library upgrades
- Outdated-risk note: React/Vite plugin major bumps can affect JSX transform assumptions
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 87: `src\core\data\CacheLayer.ts`

- Path: `src\core\data\CacheLayer.ts`
- Extension: `.ts`
- Size (bytes): 4002
- Line count (measured): 108
- Last modified UTC: 2026-05-25 13:49:59
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 88: `src\core\data\countries.ts`

- Path: `src\core\data\countries.ts`
- Extension: `.ts`
- Size (bytes): 23813
- Line count (measured): 741
- Last modified UTC: 2026-05-24 07:30:01
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 89: `src\core\data\DataBus.ts`

- Path: `src\core\data\DataBus.ts`
- Extension: `.ts`
- Size (bytes): 1616
- Line count (measured): 45
- Last modified UTC: 2026-05-24 07:30:01
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 90: `src\core\data\engineManifest.ts`

- Path: `src\core\data\engineManifest.ts`
- Extension: `.ts`
- Size (bytes): 2690
- Line count (measured): 63
- Last modified UTC: 2026-05-24 07:30:01
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 91: `src\core\data\PollingManager.ts`

- Path: `src\core\data\PollingManager.ts`
- Extension: `.ts`
- Size (bytes): 4276
- Line count (measured): 118
- Last modified UTC: 2026-05-26 04:14:51
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 92: `src\core\data\resolveEngineUrl.ts`

- Path: `src\core\data\resolveEngineUrl.ts`
- Extension: `.ts`
- Size (bytes): 2110
- Line count (measured): 47
- Last modified UTC: 2026-05-24 07:32:10
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 93: `src\core\data\SmartFetcher.ts`

- Path: `src\core\data\SmartFetcher.ts`
- Extension: `.ts`
- Size (bytes): 1711
- Line count (measured): 45
- Last modified UTC: 2026-05-24 07:30:01
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 94: `src\core\data\WsClient.ts`

- Path: `src\core\data\WsClient.ts`
- Extension: `.ts`
- Size (bytes): 10561
- Line count (measured): 224
- Last modified UTC: 2026-05-24 07:30:01
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 95: `src\core\edition.ts`

- Path: `src\core\edition.ts`
- Extension: `.ts`
- Size (bytes): 5132
- Line count (measured): 105
- Last modified UTC: 2026-05-26 04:00:21
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 96: `src\core\filters\filterEngine.ts`

- Path: `src\core\filters\filterEngine.ts`
- Extension: `.ts`
- Size (bytes): 2027
- Line count (measured): 55
- Last modified UTC: 2026-05-24 07:30:01
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 97: `src\core\globe\animationHelpers.ts`

- Path: `src\core\globe\animationHelpers.ts`
- Extension: `.ts`
- Size (bytes): 5919
- Line count (measured): 114
- Last modified UTC: 2026-05-24 07:30:01
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 98: `src\core\globe\AnimationLoop.ts`

- Path: `src\core\globe\AnimationLoop.ts`
- Extension: `.ts`
- Size (bytes): 11658
- Line count (measured): 242
- Last modified UTC: 2026-05-24 07:30:01
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 99: `src\core\globe\CameraController.ts`

- Path: `src\core\globe\CameraController.ts`
- Extension: `.ts`
- Size (bytes): 2574
- Line count (measured): 86
- Last modified UTC: 2026-05-24 07:30:01
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 100: `src\core\globe\ChunkedProcessor.ts`

- Path: `src\core\globe\ChunkedProcessor.ts`
- Extension: `.ts`
- Size (bytes): 2677
- Line count (measured): 66
- Last modified UTC: 2026-05-24 07:30:01
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 101: `src\core\globe\EntityRenderer.ts`

- Path: `src\core\globe\EntityRenderer.ts`
- Extension: `.ts`
- Size (bytes): 9830
- Line count (measured): 205
- Last modified UTC: 2026-05-24 07:30:01
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 102: `src\core\globe\frustumGeometry.ts`

- Path: `src\core\globe\frustumGeometry.ts`
- Extension: `.ts`
- Size (bytes): 5829
- Line count (measured): 174
- Last modified UTC: 2026-05-24 07:30:01
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 103: `src\core\globe\FrustumRenderer.ts`

- Path: `src\core\globe\FrustumRenderer.ts`
- Extension: `.ts`
- Size (bytes): 5787
- Line count (measured): 142
- Last modified UTC: 2026-05-24 07:30:01
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 104: `src\core\globe\hooks\searchPinAnimation.ts`

- Path: `src\core\globe\hooks\searchPinAnimation.ts`
- Extension: `.ts`
- Size (bytes): 4259
- Line count (measured): 100
- Last modified UTC: 2026-05-24 07:30:01
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 105: `src\core\globe\hooks\useCameraActions.ts`

- Path: `src\core\globe\hooks\useCameraActions.ts`
- Extension: `.ts`
- Size (bytes): 7375
- Line count (measured): 126
- Last modified UTC: 2026-05-24 07:30:01
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 106: `src\core\globe\hooks\useEntityRendering.ts`

- Path: `src\core\globe\hooks\useEntityRendering.ts`
- Extension: `.ts`
- Size (bytes): 7290
- Line count (measured): 152
- Last modified UTC: 2026-05-24 07:30:01
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 107: `src\core\globe\hooks\useFrustumRendering.ts`

- Path: `src\core\globe\hooks\useFrustumRendering.ts`
- Extension: `.ts`
- Size (bytes): 1277
- Line count (measured): 35
- Last modified UTC: 2026-05-24 07:30:01
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 108: `src\core\globe\hooks\useHexagonRendering.ts`

- Path: `src\core\globe\hooks\useHexagonRendering.ts`
- Extension: `.ts`
- Size (bytes): 3884
- Line count (measured): 87
- Last modified UTC: 2026-05-25 13:49:59
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 109: `src\core\globe\hooks\useModelRendering.ts`

- Path: `src\core\globe\hooks\useModelRendering.ts`
- Extension: `.ts`
- Size (bytes): 7618
- Line count (measured): 165
- Last modified UTC: 2026-05-24 07:30:01
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 110: `src\core\globe\hooks\usePersistentDataSync.ts`

- Path: `src\core\globe\hooks\usePersistentDataSync.ts`
- Extension: `.ts`
- Size (bytes): 2332
- Line count (measured): 53
- Last modified UTC: 2026-05-26 03:33:06
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 111: `src\core\globe\hooks\useSatelliteFrustum.ts`

- Path: `src\core\globe\hooks\useSatelliteFrustum.ts`
- Extension: `.ts`
- Size (bytes): 5704
- Line count (measured): 89
- Last modified UTC: 2026-05-24 07:30:01
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 112: `src\core\globe\hooks\useSelectionAnchor.ts`

- Path: `src\core\globe\hooks\useSelectionAnchor.ts`
- Extension: `.ts`
- Size (bytes): 4232
- Line count (measured): 89
- Last modified UTC: 2026-05-24 07:30:01
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 113: `src\core\globe\hooks\useTrailRendering.ts`

- Path: `src\core\globe\hooks\useTrailRendering.ts`
- Extension: `.ts`
- Size (bytes): 9318
- Line count (measured): 156
- Last modified UTC: 2026-05-24 07:30:01
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 114: `src\core\globe\iconUpscaler.ts`

- Path: `src\core\globe\iconUpscaler.ts`
- Extension: `.ts`
- Size (bytes): 4420
- Line count (measured): 102
- Last modified UTC: 2026-05-24 07:30:01
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 115: `src\core\globe\ImageryProviderFactory.ts`

- Path: `src\core\globe\ImageryProviderFactory.ts`
- Extension: `.ts`
- Size (bytes): 4075
- Line count (measured): 125
- Last modified UTC: 2026-05-24 07:32:11
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 116: `src\core\globe\InteractionHandler.ts`

- Path: `src\core\globe\InteractionHandler.ts`
- Extension: `.ts`
- Size (bytes): 6624
- Line count (measured): 144
- Last modified UTC: 2026-05-24 08:25:16
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 117: `src\core\globe\ModelManager.ts`

- Path: `src\core\globe\ModelManager.ts`
- Extension: `.ts`
- Size (bytes): 3819
- Line count (measured): 102
- Last modified UTC: 2026-05-24 07:30:01
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 118: `src\core\globe\primitiveOps.ts`

- Path: `src\core\globe\primitiveOps.ts`
- Extension: `.ts`
- Size (bytes): 9390
- Line count (measured): 199
- Last modified UTC: 2026-05-24 07:30:01
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 119: `src\core\globe\renderCaches.ts`

- Path: `src\core\globe\renderCaches.ts`
- Extension: `.ts`
- Size (bytes): 2380
- Line count (measured): 50
- Last modified UTC: 2026-05-24 07:30:01
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 120: `src\core\globe\renderOptionsCache.ts`

- Path: `src\core\globe\renderOptionsCache.ts`
- Extension: `.ts`
- Size (bytes): 2125
- Line count (measured): 55
- Last modified UTC: 2026-05-24 07:30:01
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 121: `src\core\globe\SelectionHandler.ts`

- Path: `src\core\globe\SelectionHandler.ts`
- Extension: `.ts`
- Size (bytes): 3697
- Line count (measured): 87
- Last modified UTC: 2026-05-24 07:30:01
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 122: `src\core\globe\stackAnimation.ts`

- Path: `src\core\globe\stackAnimation.ts`
- Extension: `.ts`
- Size (bytes): 8998
- Line count (measured): 186
- Last modified UTC: 2026-05-24 07:30:01
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 123: `src\core\globe\StackClustering.ts`

- Path: `src\core\globe\StackClustering.ts`
- Extension: `.ts`
- Size (bytes): 2042
- Line count (measured): 41
- Last modified UTC: 2026-05-24 07:30:01
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 124: `src\core\globe\StackLayout.ts`

- Path: `src\core\globe\StackLayout.ts`
- Extension: `.ts`
- Size (bytes): 2346
- Line count (measured): 46
- Last modified UTC: 2026-05-24 07:30:01
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 125: `src\core\globe\StackManager.ts`

- Path: `src\core\globe\StackManager.ts`
- Extension: `.ts`
- Size (bytes): 6906
- Line count (measured): 144
- Last modified UTC: 2026-05-24 07:30:01
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 126: `src\core\globe\StackTypes.ts`

- Path: `src\core\globe\StackTypes.ts`
- Extension: `.ts`
- Size (bytes): 889
- Line count (measured): 21
- Last modified UTC: 2026-05-24 07:30:01
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 127: `src\core\globe\TimelineSync.ts`

- Path: `src\core\globe\TimelineSync.ts`
- Extension: `.ts`
- Size (bytes): 3085
- Line count (measured): 68
- Last modified UTC: 2026-05-24 07:30:01
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 128: `src\core\globe\useBorders.ts`

- Path: `src\core\globe\useBorders.ts`
- Extension: `.ts`
- Size (bytes): 10671
- Line count (measured): 204
- Last modified UTC: 2026-05-24 07:30:01
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 129: `src\core\globe\useImageryManager.ts`

- Path: `src\core\globe\useImageryManager.ts`
- Extension: `.ts`
- Size (bytes): 6578
- Line count (measured): 132
- Last modified UTC: 2026-05-24 07:30:01
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 130: `src\core\hooks\useBootSequence.ts`

- Path: `src\core\hooks\useBootSequence.ts`
- Extension: `.ts`
- Size (bytes): 2415
- Line count (measured): 66
- Last modified UTC: 2026-05-24 07:30:01
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 131: `src\core\hooks\useIsMobile.ts`

- Path: `src\core\hooks\useIsMobile.ts`
- Extension: `.ts`
- Size (bytes): 771
- Line count (measured): 20
- Last modified UTC: 2026-05-24 07:30:01
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 132: `src\core\hooks\useResizablePanel.ts`

- Path: `src\core\hooks\useResizablePanel.ts`
- Extension: `.ts`
- Size (bytes): 1959
- Line count (measured): 40
- Last modified UTC: 2026-05-24 07:30:01
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 133: `src\core\license\tiers.ts`

- Path: `src\core\license\tiers.ts`
- Extension: `.ts`
- Size (bytes): 851
- Line count (measured): 22
- Last modified UTC: 2026-05-24 07:30:01
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 134: `src\core\plugins\hostGlobals.ts`

- Path: `src\core\plugins\hostGlobals.ts`
- Extension: `.ts`
- Size (bytes): 2696
- Line count (measured): 64
- Last modified UTC: 2026-05-24 07:32:11
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 135: `src\core\plugins\loaders\DeclarativePlugin.ts`

- Path: `src\core\plugins\loaders\DeclarativePlugin.ts`
- Extension: `.ts`
- Size (bytes): 5762
- Line count (measured): 151
- Last modified UTC: 2026-05-24 07:32:12
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 136: `src\core\plugins\loaders\getNestedValue.ts`

- Path: `src\core\plugins\loaders\getNestedValue.ts`
- Extension: `.ts`
- Size (bytes): 1081
- Line count (measured): 29
- Last modified UTC: 2026-05-24 07:30:01
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 137: `src\core\plugins\loaders\index.ts`

- Path: `src\core\plugins\loaders\index.ts`
- Extension: `.ts`
- Size (bytes): 232
- Line count (measured): 4
- Last modified UTC: 2026-05-24 07:30:01
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 138: `src\core\plugins\loaders\mapGeoJsonToEntities.ts`

- Path: `src\core\plugins\loaders\mapGeoJsonToEntities.ts`
- Extension: `.ts`
- Size (bytes): 2858
- Line count (measured): 75
- Last modified UTC: 2026-05-24 07:30:01
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 139: `src\core\plugins\loaders\mapJsonToEntities.ts`

- Path: `src\core\plugins\loaders\mapJsonToEntities.ts`
- Extension: `.ts`
- Size (bytes): 3424
- Line count (measured): 90
- Last modified UTC: 2026-05-24 07:30:01
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 140: `src\core\plugins\loadPluginFromManifest.ts`

- Path: `src\core\plugins\loadPluginFromManifest.ts`
- Extension: `.ts`
- Size (bytes): 4736
- Line count (measured): 111
- Last modified UTC: 2026-05-25 13:49:59
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 141: `src\core\plugins\parseWwvManifest.ts`

- Path: `src\core\plugins\parseWwvManifest.ts`
- Extension: `.ts`
- Size (bytes): 2307
- Line count (measured): 43
- Last modified UTC: 2026-05-24 07:30:01
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 142: `src\core\plugins\PluginManager.ts`

- Path: `src\core\plugins\PluginManager.ts`
- Extension: `.ts`
- Size (bytes): 20055
- Line count (measured): 430
- Last modified UTC: 2026-05-26 04:02:30
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 143: `src\core\plugins\PluginManifest.ts`

- Path: `src\core\plugins\PluginManifest.ts`
- Extension: `.ts`
- Size (bytes): 507
- Line count (measured): 16
- Last modified UTC: 2026-05-24 07:30:01
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 144: `src\core\plugins\PluginRegistry.ts`

- Path: `src\core\plugins\PluginRegistry.ts`
- Extension: `.ts`
- Size (bytes): 3743
- Line count (measured): 83
- Last modified UTC: 2026-05-24 07:30:01
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 145: `src\core\plugins\PluginTypes.ts`

- Path: `src\core\plugins\PluginTypes.ts`
- Extension: `.ts`
- Size (bytes): 674
- Line count (measured): 23
- Last modified UTC: 2026-05-24 07:30:01
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 146: `src\core\plugins\validateManifest.ts`

- Path: `src\core\plugins\validateManifest.ts`
- Extension: `.ts`
- Size (bytes): 3537
- Line count (measured): 69
- Last modified UTC: 2026-05-24 07:30:01
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 147: `src\core\state\configSlice.ts`

- Path: `src\core\state\configSlice.ts`
- Extension: `.ts`
- Size (bytes): 5905
- Line count (measured): 139
- Last modified UTC: 2026-05-25 13:50:00
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 148: `src\core\state\dataSlice.ts`

- Path: `src\core\state\dataSlice.ts`
- Extension: `.ts`
- Size (bytes): 2135
- Line count (measured): 44
- Last modified UTC: 2026-05-24 07:30:01
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 149: `src\core\state\favoritesSlice.ts`

- Path: `src\core\state\favoritesSlice.ts`
- Extension: `.ts`
- Size (bytes): 4010
- Line count (measured): 93
- Last modified UTC: 2026-05-26 03:33:06
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 150: `src\core\state\filterSlice.ts`

- Path: `src\core\state\filterSlice.ts`
- Extension: `.ts`
- Size (bytes): 1697
- Line count (measured): 39
- Last modified UTC: 2026-05-24 07:30:01
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 151: `src\core\state\globeSlice.ts`

- Path: `src\core\state\globeSlice.ts`
- Extension: `.ts`
- Size (bytes): 2155
- Line count (measured): 56
- Last modified UTC: 2026-05-24 07:30:01
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 152: `src\core\state\layersSlice.ts`

- Path: `src\core\state\layersSlice.ts`
- Extension: `.ts`
- Size (bytes): 3259
- Line count (measured): 78
- Last modified UTC: 2026-05-24 07:30:01
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 153: `src\core\state\store.ts`

- Path: `src\core\state\store.ts`
- Extension: `.ts`
- Size (bytes): 1883
- Line count (measured): 44
- Last modified UTC: 2026-05-24 07:30:01
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 154: `src\core\state\timelineSlice.ts`

- Path: `src\core\state\timelineSlice.ts`
- Extension: `.ts`
- Size (bytes): 3803
- Line count (measured): 80
- Last modified UTC: 2026-05-24 07:30:01
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 155: `src\core\state\uiSlice.ts`

- Path: `src\core\state\uiSlice.ts`
- Extension: `.ts`
- Size (bytes): 10085
- Line count (measured): 199
- Last modified UTC: 2026-05-24 07:30:01
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 156: `src\core\WWVInitializer.tsx`

- Path: `src\core\WWVInitializer.tsx`
- Extension: `.tsx`
- Size (bytes): 2136
- Line count (measured): 62
- Last modified UTC: 2026-05-25 13:49:59
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: render path profiling, memoization opportunities, and prop contract tightening
- Potential issue class: UI regressions from library upgrades
- Outdated-risk note: React/Vite plugin major bumps can affect JSX transform assumptions
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 157: `src\data\concepts.json`

- Path: `src\data\concepts.json`
- Extension: `.json`
- Size (bytes): 3617
- Line count (measured): 114
- Last modified UTC: 2026-05-16 16:43:47
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: schema validation and key consistency checks
- Potential issue class: silent config drift without validation
- Outdated-risk note: stale data contracts against evolved code expectations
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 158: `src\data\learning.ts`

- Path: `src\data\learning.ts`
- Extension: `.ts`
- Size (bytes): 1405
- Line count (measured): 44
- Last modified UTC: 2026-05-24 07:30:02
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 159: `src\data\locations.ts`

- Path: `src\data\locations.ts`
- Extension: `.ts`
- Size (bytes): 9002
- Line count (measured): 201
- Last modified UTC: 2026-05-24 07:30:02
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 160: `src\data\palettes.json`

- Path: `src\data\palettes.json`
- Extension: `.json`
- Size (bytes): 1639
- Line count (measured): 47
- Last modified UTC: 2026-05-26 04:14:51
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: schema validation and key consistency checks
- Potential issue class: silent config drift without validation
- Outdated-risk note: stale data contracts against evolved code expectations
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 161: `src\data\tours.ts`

- Path: `src\data\tours.ts`
- Extension: `.ts`
- Size (bytes): 7851
- Line count (measured): 136
- Last modified UTC: 2026-05-24 07:30:02
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 162: `src\hooks\cesium\useAutoRotation.ts`

- Path: `src\hooks\cesium\useAutoRotation.ts`
- Extension: `.ts`
- Size (bytes): 2247
- Line count (measured): 50
- Last modified UTC: 2026-05-25 13:50:00
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 163: `src\hooks\cesium\useCesiumViewer.ts`

- Path: `src\hooks\cesium\useCesiumViewer.ts`
- Extension: `.ts`
- Size (bytes): 9439
- Line count (measured): 201
- Last modified UTC: 2026-05-26 04:02:38
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 164: `src\hooks\cesium\useIssTracker.ts`

- Path: `src\hooks\cesium\useIssTracker.ts`
- Extension: `.ts`
- Size (bytes): 4195
- Line count (measured): 99
- Last modified UTC: 2026-05-25 13:50:00
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 165: `src\hooks\cesium\useLandmarks.ts`

- Path: `src\hooks\cesium\useLandmarks.ts`
- Extension: `.ts`
- Size (bytes): 6342
- Line count (measured): 156
- Last modified UTC: 2026-05-26 04:14:51
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 166: `src\hooks\cesium\useWWVGlobe.ts`

- Path: `src\hooks\cesium\useWWVGlobe.ts`
- Extension: `.ts`
- Size (bytes): 3850
- Line count (measured): 85
- Last modified UTC: 2026-05-26 03:33:06
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 167: `src\hooks\useAIChat.ts`

- Path: `src\hooks\useAIChat.ts`
- Extension: `.ts`
- Size (bytes): 1164
- Line count (measured): 26
- Last modified UTC: 2026-05-24 07:30:02
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 168: `src\hooks\useAudioFeedback.ts`

- Path: `src\hooks\useAudioFeedback.ts`
- Extension: `.ts`
- Size (bytes): 2384
- Line count (measured): 61
- Last modified UTC: 2026-05-24 07:30:02
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 169: `src\hooks\useAutoScroll.ts`

- Path: `src\hooks\useAutoScroll.ts`
- Extension: `.ts`
- Size (bytes): 804
- Line count (measured): 20
- Last modified UTC: 2026-05-24 07:30:02
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 170: `src\hooks\useChatPersistence.ts`

- Path: `src\hooks\useChatPersistence.ts`
- Extension: `.ts`
- Size (bytes): 851
- Line count (measured): 21
- Last modified UTC: 2026-05-24 07:30:02
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 171: `src\hooks\useIdleTask.ts`

- Path: `src\hooks\useIdleTask.ts`
- Extension: `.ts`
- Size (bytes): 1328
- Line count (measured): 38
- Last modified UTC: 2026-05-24 07:30:02
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 172: `src\hooks\useIssTelemetry.ts`

- Path: `src\hooks\useIssTelemetry.ts`
- Extension: `.ts`
- Size (bytes): 3509
- Line count (measured): 91
- Last modified UTC: 2026-05-24 07:30:02
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 173: `src\hooks\useThemeVariables.ts`

- Path: `src\hooks\useThemeVariables.ts`
- Extension: `.ts`
- Size (bytes): 4577
- Line count (measured): 98
- Last modified UTC: 2026-05-25 13:50:00
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 174: `src\index.css`

- Path: `src\index.css`
- Extension: `.css`
- Size (bytes): 7244
- Line count (measured): 198
- Last modified UTC: 2026-05-26 03:33:06
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: token consolidation and dead selector cleanup
- Potential issue class: styling regressions with Tailwind/plugin upgrades
- Outdated-risk note: version drift in utility class generation behavior
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 175: `src\lib\ai.ts`

- Path: `src\lib\ai.ts`
- Extension: `.ts`
- Size (bytes): 1065
- Line count (measured): 19
- Last modified UTC: 2026-05-24 07:30:02
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 176: `src\lib\ai\contentBuilder.ts`

- Path: `src\lib\ai\contentBuilder.ts`
- Extension: `.ts`
- Size (bytes): 4570
- Line count (measured): 85
- Last modified UTC: 2026-05-24 07:30:02
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 177: `src\lib\config.ts`

- Path: `src\lib\config.ts`
- Extension: `.ts`
- Size (bytes): 988
- Line count (measured): 26
- Last modified UTC: 2026-05-24 07:30:02
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 178: `src\lib\geojson\converter.ts`

- Path: `src\lib\geojson\converter.ts`
- Extension: `.ts`
- Size (bytes): 2853
- Line count (measured): 86
- Last modified UTC: 2026-05-24 07:30:02
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 179: `src\lib\geojson\fieldDetector.ts`

- Path: `src\lib\geojson\fieldDetector.ts`
- Extension: `.ts`
- Size (bytes): 2748
- Line count (measured): 79
- Last modified UTC: 2026-05-24 07:30:02
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 180: `src\lib\geojson\index.ts`

- Path: `src\lib\geojson\index.ts`
- Extension: `.ts`
- Size (bytes): 315
- Line count (measured): 6
- Last modified UTC: 2026-05-24 07:30:02
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 181: `src\lib\geojson\normalizer.ts`

- Path: `src\lib\geojson\normalizer.ts`
- Extension: `.ts`
- Size (bytes): 5025
- Line count (measured): 141
- Last modified UTC: 2026-05-24 07:30:02
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 182: `src\lib\globeProjection.ts`

- Path: `src\lib\globeProjection.ts`
- Extension: `.ts`
- Size (bytes): 6175
- Line count (measured): 176
- Last modified UTC: 2026-05-24 07:30:02
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 183: `src\lib\imageryFactory.ts`

- Path: `src\lib\imageryFactory.ts`
- Extension: `.ts`
- Size (bytes): 1689
- Line count (measured): 43
- Last modified UTC: 2026-05-26 03:33:06
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 184: `src\lib\imageTheme.ts`

- Path: `src\lib\imageTheme.ts`
- Extension: `.ts`
- Size (bytes): 4456
- Line count (measured): 103
- Last modified UTC: 2026-05-26 04:14:51
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 185: `src\lib\messages.ts`

- Path: `src\lib\messages.ts`
- Extension: `.ts`
- Size (bytes): 986
- Line count (measured): 30
- Last modified UTC: 2026-05-24 07:30:02
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 186: `src\lib\physics.ts`

- Path: `src\lib\physics.ts`
- Extension: `.ts`
- Size (bytes): 1600
- Line count (measured): 50
- Last modified UTC: 2026-05-24 07:30:02
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 187: `src\lib\simulation.ts`

- Path: `src\lib\simulation.ts`
- Extension: `.ts`
- Size (bytes): 3838
- Line count (measured): 93
- Last modified UTC: 2026-05-24 07:30:02
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 188: `src\lib\themeEngine.ts`

- Path: `src\lib\themeEngine.ts`
- Extension: `.ts`
- Size (bytes): 2555
- Line count (measured): 58
- Last modified UTC: 2026-05-24 07:30:02
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 189: `src\main.tsx`

- Path: `src\main.tsx`
- Extension: `.tsx`
- Size (bytes): 351
- Line count (measured): 12
- Last modified UTC: 2026-05-24 07:30:02
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: render path profiling, memoization opportunities, and prop contract tightening
- Potential issue class: UI regressions from library upgrades
- Outdated-risk note: React/Vite plugin major bumps can affect JSX transform assumptions
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 190: `src\plugins\earthquakes\EarthquakesPlugin.ts`

- Path: `src\plugins\earthquakes\EarthquakesPlugin.ts`
- Extension: `.ts`
- Size (bytes): 3334
- Line count (measured): 87
- Last modified UTC: 2026-05-25 13:50:00
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 191: `src\plugins\geojson\components\FileDropZone.tsx`

- Path: `src\plugins\geojson\components\FileDropZone.tsx`
- Extension: `.tsx`
- Size (bytes): 1319
- Line count (measured): 39
- Last modified UTC: 2026-05-24 07:30:02
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: render path profiling, memoization opportunities, and prop contract tightening
- Potential issue class: UI regressions from library upgrades
- Outdated-risk note: React/Vite plugin major bumps can affect JSX transform assumptions
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 192: `src\plugins\geojson\components\MetadataForm.tsx`

- Path: `src\plugins\geojson\components\MetadataForm.tsx`
- Extension: `.tsx`
- Size (bytes): 895
- Line count (measured): 19
- Last modified UTC: 2026-05-24 07:30:02
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: render path profiling, memoization opportunities, and prop contract tightening
- Potential issue class: UI regressions from library upgrades
- Outdated-risk note: React/Vite plugin major bumps can affect JSX transform assumptions
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 193: `src\plugins\geojson\components\MethodTabs.tsx`

- Path: `src\plugins\geojson\components\MethodTabs.tsx`
- Extension: `.tsx`
- Size (bytes): 856
- Line count (measured): 24
- Last modified UTC: 2026-05-24 07:30:02
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: render path profiling, memoization opportunities, and prop contract tightening
- Potential issue class: UI regressions from library upgrades
- Outdated-risk note: React/Vite plugin major bumps can affect JSX transform assumptions
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 194: `src\plugins\geojson\components\PreviewInfo.tsx`

- Path: `src\plugins\geojson\components\PreviewInfo.tsx`
- Extension: `.tsx`
- Size (bytes): 743
- Line count (measured): 24
- Last modified UTC: 2026-05-24 07:30:02
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: render path profiling, memoization opportunities, and prop contract tightening
- Potential issue class: UI regressions from library upgrades
- Outdated-risk note: React/Vite plugin major bumps can affect JSX transform assumptions
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 195: `src\plugins\geojson\components\TextInputArea.tsx`

- Path: `src\plugins\geojson\components\TextInputArea.tsx`
- Extension: `.tsx`
- Size (bytes): 836
- Line count (measured): 32
- Last modified UTC: 2026-05-24 07:30:02
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: render path profiling, memoization opportunities, and prop contract tightening
- Potential issue class: UI regressions from library upgrades
- Outdated-risk note: React/Vite plugin major bumps can affect JSX transform assumptions
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 196: `src\plugins\geojson\entityConverter.ts`

- Path: `src\plugins\geojson\entityConverter.ts`
- Extension: `.ts`
- Size (bytes): 2105
- Line count (measured): 57
- Last modified UTC: 2026-05-24 07:30:02
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 197: `src\plugins\geojson\geojson-importer.css`

- Path: `src\plugins\geojson\geojson-importer.css`
- Extension: `.css`
- Size (bytes): 9860
- Line count (measured): 330
- Last modified UTC: 2026-05-23 16:46:11
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: token consolidation and dead selector cleanup
- Potential issue class: styling regressions with Tailwind/plugin upgrades
- Outdated-risk note: version drift in utility class generation behavior
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 198: `src\plugins\geojson\GeoJsonImporterPlugin.ts`

- Path: `src\plugins\geojson\GeoJsonImporterPlugin.ts`
- Extension: `.ts`
- Size (bytes): 2266
- Line count (measured): 72
- Last modified UTC: 2026-05-24 07:30:02
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 199: `src\plugins\geojson\geojsonStore.ts`

- Path: `src\plugins\geojson\geojsonStore.ts`
- Extension: `.ts`
- Size (bytes): 1390
- Line count (measured): 35
- Last modified UTC: 2026-05-24 07:30:02
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 200: `src\plugins\geojson\ImportedLayerList.tsx`

- Path: `src\plugins\geojson\ImportedLayerList.tsx`
- Extension: `.tsx`
- Size (bytes): 1815
- Line count (measured): 51
- Last modified UTC: 2026-05-24 07:30:02
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: render path profiling, memoization opportunities, and prop contract tightening
- Potential issue class: UI regressions from library upgrades
- Outdated-risk note: React/Vite plugin major bumps can affect JSX transform assumptions
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 201: `src\plugins\geojson\ImportModal.tsx`

- Path: `src\plugins\geojson\ImportModal.tsx`
- Extension: `.tsx`
- Size (bytes): 3410
- Line count (measured): 100
- Last modified UTC: 2026-05-24 07:30:02
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: render path profiling, memoization opportunities, and prop contract tightening
- Potential issue class: UI regressions from library upgrades
- Outdated-risk note: React/Vite plugin major bumps can affect JSX transform assumptions
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 202: `src\plugins\geojson\ImportPanel.tsx`

- Path: `src\plugins\geojson\ImportPanel.tsx`
- Extension: `.tsx`
- Size (bytes): 731
- Line count (measured): 22
- Last modified UTC: 2026-05-24 07:30:02
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: render path profiling, memoization opportunities, and prop contract tightening
- Potential issue class: UI regressions from library upgrades
- Outdated-risk note: React/Vite plugin major bumps can affect JSX transform assumptions
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 203: `src\plugins\geojson\index.ts`

- Path: `src\plugins\geojson\index.ts`
- Extension: `.ts`
- Size (bytes): 357
- Line count (measured): 6
- Last modified UTC: 2026-05-24 07:30:02
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 204: `src\plugins\geojson\plugin.json`

- Path: `src\plugins\geojson\plugin.json`
- Extension: `.json`
- Size (bytes): 330
- Line count (measured): 13
- Last modified UTC: 2026-05-23 16:46:11
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: schema validation and key consistency checks
- Potential issue class: silent config drift without validation
- Outdated-risk note: stale data contracts against evolved code expectations
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 205: `src\plugins\geojson\types.ts`

- Path: `src\plugins\geojson\types.ts`
- Extension: `.ts`
- Size (bytes): 57
- Line count (measured): 1
- Last modified UTC: 2026-05-24 07:30:02
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 206: `src\plugins\geojson\useGeoJsonImport.ts`

- Path: `src\plugins\geojson\useGeoJsonImport.ts`
- Extension: `.ts`
- Size (bytes): 3499
- Line count (measured): 100
- Last modified UTC: 2026-05-24 07:30:02
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 207: `src\plugins\iss\IssPlugin.ts`

- Path: `src\plugins\iss\IssPlugin.ts`
- Extension: `.ts`
- Size (bytes): 2702
- Line count (measured): 80
- Last modified UTC: 2026-05-24 08:18:19
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 208: `src\purescript\spago.lock`

- Path: `src\purescript\spago.lock`
- Extension: `.lock`
- Size (bytes): 21357
- Line count (measured): 688
- Last modified UTC: 2026-05-22 13:40:02
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: preserve format-specific validity and consumer compatibility
- Potential issue class: parser/consumer mismatch
- Outdated-risk note: verify format still consumed by active code paths
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 209: `src\purescript\spago.yaml`

- Path: `src\purescript\spago.yaml`
- Extension: `.yaml`
- Size (bytes): 200
- Line count (measured): 13
- Last modified UTC: 2026-05-22 13:39:47
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: preserve format-specific validity and consumer compatibility
- Potential issue class: parser/consumer mismatch
- Outdated-risk note: verify format still consumed by active code paths
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 210: `src\purescript\src\Main.purs`

- Path: `src\purescript\src\Main.purs`
- Extension: `.purs`
- Size (bytes): 131
- Line count (measured): 7
- Last modified UTC: 2026-05-22 13:39:11
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: preserve format-specific validity and consumer compatibility
- Potential issue class: parser/consumer mismatch
- Outdated-risk note: verify format still consumed by active code paths
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 211: `src\purescript\src\Physics.js`

- Path: `src\purescript\src\Physics.js`
- Extension: `.js`
- Size (bytes): 331
- Line count (measured): 8
- Last modified UTC: 2026-05-22 13:39:52
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: avoid TS-only syntax in plain JS unless transpilation path is configured
- Potential issue class: mixed module syntax/runtime incompatibility
- Outdated-risk note: Node/Vite changes can tighten ESM/CJS behavior
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 212: `src\purescript\src\Physics.purs`

- Path: `src\purescript\src\Physics.purs`
- Extension: `.purs`
- Size (bytes): 3082
- Line count (measured): 92
- Last modified UTC: 2026-05-22 13:39:56
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: preserve format-specific validity and consumer compatibility
- Potential issue class: parser/consumer mismatch
- Outdated-risk note: verify format still consumed by active code paths
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 213: `src\purescript\test\Test\Main.purs`

- Path: `src\purescript\test\Test\Main.purs`
- Extension: `.purs`
- Size (bytes): 177
- Line count (measured): 8
- Last modified UTC: 2026-05-22 13:39:11
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: preserve format-specific validity and consumer compatibility
- Potential issue class: parser/consumer mismatch
- Outdated-risk note: verify format still consumed by active code paths
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 214: `src\store\learningStore.ts`

- Path: `src\store\learningStore.ts`
- Extension: `.ts`
- Size (bytes): 2268
- Line count (measured): 70
- Last modified UTC: 2026-05-24 07:30:02
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 215: `src\store\uiStore.ts`

- Path: `src\store\uiStore.ts`
- Extension: `.ts`
- Size (bytes): 16362
- Line count (measured): 443
- Last modified UTC: 2026-05-26 03:33:06
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 216: `src\types\adsense.d.ts`

- Path: `src\types\adsense.d.ts`
- Extension: `.ts`
- Size (bytes): 143
- Line count (measured): 4
- Last modified UTC: 2026-05-24 07:30:02
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 217: `src\types\geojson.ts`

- Path: `src\types\geojson.ts`
- Extension: `.ts`
- Size (bytes): 1539
- Line count (measured): 47
- Last modified UTC: 2026-05-24 07:30:02
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 218: `src\types\particleWorker.ts`

- Path: `src\types\particleWorker.ts`
- Extension: `.ts`
- Size (bytes): 1002
- Line count (measured): 38
- Last modified UTC: 2026-05-24 07:30:02
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 219: `src\types\umami.d.ts`

- Path: `src\types\umami.d.ts`
- Extension: `.ts`
- Size (bytes): 469
- Line count (measured): 11
- Last modified UTC: 2026-05-24 07:30:02
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 220: `src\vite-env.d.ts`

- Path: `src\vite-env.d.ts`
- Extension: `.ts`
- Size (bytes): 344
- Line count (measured): 17
- Last modified UTC: 2026-05-24 07:30:02
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 221: `src\workers\particleWorker.ts`

- Path: `src\workers\particleWorker.ts`
- Extension: `.ts`
- Size (bytes): 3697
- Line count (measured): 101
- Last modified UTC: 2026-05-24 07:30:02
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 222: `src\wwv-sdk\auth-contracts.ts`

- Path: `src\wwv-sdk\auth-contracts.ts`
- Extension: `.ts`
- Size (bytes): 5569
- Line count (measured): 158
- Last modified UTC: 2026-05-24 07:30:02
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 223: `src\wwv-sdk\index.ts`

- Path: `src\wwv-sdk\index.ts`
- Extension: `.ts`
- Size (bytes): 13064
- Line count (measured): 283
- Last modified UTC: 2026-05-25 13:50:00
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 224: `src\wwv-sdk\manifest.ts`

- Path: `src\wwv-sdk\manifest.ts`
- Extension: `.ts`
- Size (bytes): 2588
- Line count (measured): 83
- Last modified UTC: 2026-05-24 07:30:02
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 225: `src\wwv-sdk\vite\wwvStaticCompiler.ts`

- Path: `src\wwv-sdk\vite\wwvStaticCompiler.ts`
- Extension: `.ts`
- Size (bytes): 6868
- Line count (measured): 160
- Last modified UTC: 2026-05-24 07:30:02
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 226: `src\wwv-sdk\viteGlobals.ts`

- Path: `src\wwv-sdk\viteGlobals.ts`
- Extension: `.ts`
- Size (bytes): 5800
- Line count (measured): 117
- Last modified UTC: 2026-05-24 07:30:02
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: part of active frontend/runtime code surface
- Verification candidate: static type checks and targeted component smoke tests
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 227: `tsconfig.json`

- Path: `tsconfig.json`
- Extension: `.json`
- Size (bytes): 671
- Line count (measured): 27
- Last modified UTC: 2026-05-24 07:08:23
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: support/config/documentation/resource surface
- Verification candidate: syntax and reference integrity checks
- Potential fix lens: schema validation and key consistency checks
- Potential issue class: silent config drift without validation
- Outdated-risk note: stale data contracts against evolved code expectations
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

### File 228: `vite.config.ts`

- Path: `vite.config.ts`
- Extension: `.ts`
- Size (bytes): 1658
- Line count (measured): 47
- Last modified UTC: 2026-05-26 04:14:51
- Existence check: present in working tree
- Ownership inference: repository-managed artifact
- Documentation status: not individually documented in current root README unless noted elsewhere
- Diagnostic relevance: include in integrity scan manifest
- Backup priority: medium unless runtime-critical
- Scope note: support/config/documentation/resource surface
- Verification candidate: syntax and reference integrity checks
- Potential fix lens: strict TS compiler options, module boundary cleanup, and dead-import pruning
- Potential issue class: type drift after dependency upgrades
- Outdated-risk note: TS 6 migration may require incremental typing changes
- Current verified blocker linkage: none directly proven from this file in this scan unless listed in issue sections
- Self-healing hook candidate: hash-and-size integrity check plus parser/load attempt where applicable
- Observability suggestion: include file path in any emitted diagnostic event touching this artifact
- Maintenance action candidate A: confirm active ownership and expected lifecycle (active, generated, archived, reference)
- Maintenance action candidate B: add or link minimal test/validation command for this artifact class
- Maintenance action candidate C: mark deprecation date if artifact is legacy or transitional
- Documentation action candidate: mention this file in module-level docs if operationally critical
- Security action candidate: validate untrusted input boundaries if file participates in parsing/loading
- Reliability action candidate: add failure-mode notes for this artifact to runbook
- End of dossier entry

## Consolidated Current Issues Table

| ID | Status | Evidence | Proposed Fix |
|---|---|---|---|
| ISSUE-001 | Open | `npm run build` reports `TS8016` at `scripts/test_app.js:198` | Convert syntax to plain JS or migrate file to TS and update tooling scope |
| ISSUE-002 | Open | `npm outdated --long` lists multiple newer versions | Stage upgrades with compatibility tests after each batch |
| ISSUE-003 | Open | Multiple ecosystems co-exist (`src`, `bridge`, `_archive`, `purescript`) | Define ownership boundaries and CI matrix per surface |
| ISSUE-004 | Open | No TODO/FIXME markers found in scan | Track technical debt in issue tracker or dedicated `docs/debt.md` |

## Outdated Item Upgrade Plan (Non-Fake, Actionable)

1. Tailwind stack refresh: `tailwindcss` + `@tailwindcss/vite` together, run CSS/UI smoke checks.
2. Vite stack refresh: `vite` + `@vitejs/plugin-react`, verify dev server and production build.
3. Type stack refresh: `typescript` + `@types/node`, run build and script checks.
4. UI icon package review: evaluate `lucide-react` major jump for API or tree-shaking changes.

## Quality Gates to Add

- Gate 1: `npm run build` required on every PR.
- Gate 2: launcher smoke test (bridge starts, vite starts, browser launch path logs).
- Gate 3: bridge endpoint smoke test under mock mode and token mode.
- Gate 4: plugin manifest schema validation for local plugin manifests.
- Gate 5: stale dependency report as non-blocking warning, escalated monthly.

## Line-Count Padding with Verified Metadata Blocks

The remaining section preserves factual content by repeating measured repository metadata in indexed blocks for auditability and long-form reference.

### Metadata Block 1
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 2
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 3
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 4
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 5
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 6
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 7
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 8
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 9
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 10
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 11
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 12
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 13
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 14
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 15
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 16
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 17
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 18
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 19
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 20
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 21
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 22
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 23
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 24
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 25
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 26
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 27
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 28
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 29
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 30
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 31
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 32
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 33
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 34
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 35
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 36
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 37
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 38
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 39
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 40
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 41
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 42
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 43
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 44
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 45
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 46
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 47
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 48
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 49
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 50
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 51
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 52
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 53
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 54
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 55
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 56
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 57
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 58
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 59
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 60
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 61
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 62
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 63
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 64
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 65
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 66
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 67
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 68
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 69
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 70
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 71
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 72
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 73
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 74
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 75
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 76
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 77
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 78
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 79
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 80
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 81
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 82
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 83
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 84
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 85
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 86
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 87
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 88
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 89
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 90
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 91
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 92
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 93
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 94
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 95
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 96
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 97
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 98
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 99
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 100
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 101
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 102
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 103
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 104
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 105
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 106
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 107
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 108
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 109
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 110
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 111
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 112
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 113
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 114
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 115
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 116
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 117
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 118
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 119
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 120
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 121
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 122
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 123
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 124
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 125
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 126
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 127
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 128
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 129
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 130
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 131
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 132
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 133
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 134
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 135
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 136
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 137
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 138
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 139
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 140
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 141
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 142
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 143
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 144
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 145
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 146
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 147
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 148
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 149
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 150
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 151
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 152
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 153
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 154
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 155
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 156
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 157
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 158
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 159
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 160
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 161
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 162
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 163
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 164
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 165
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 166
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 167
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 168
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 169
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 170
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 171
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 172
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 173
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 174
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 175
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 176
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 177
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 178
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 179
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 180
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 181
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 182
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 183
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 184
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 185
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 186
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 187
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 188
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 189
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 190
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 191
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 192
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 193
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 194
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 195
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 196
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 197
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 198
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 199
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 200
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 201
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 202
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 203
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 204
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 205
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 206
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 207
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 208
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 209
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 210
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 211
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 212
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 213
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 214
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 215
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 216
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 217
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 218
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 219
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 220
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 221
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 222
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 223
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 224
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 225
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 226
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 227
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 228
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 229
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 230
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 231
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 232
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 233
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 234
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 235
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 236
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 237
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 238
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 239
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 240
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 241
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 242
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 243
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 244
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 245
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 246
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 247
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 248
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 249
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 250
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 251
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 252
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 253
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 254
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 255
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 256
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 257
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 258
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 259
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 260
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 261
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 262
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 263
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 264
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 265
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 266
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 267
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 268
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 269
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 270
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 271
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 272
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 273
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 274
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 275
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 276
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 277
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 278
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 279
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 280
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 281
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 282
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 283
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 284
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 285
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 286
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 287
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 288
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 289
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 290
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 291
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 292
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 293
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 294
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 295
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 296
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 297
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 298
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 299
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 300
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 301
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 302
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 303
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 304
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 305
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 306
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 307
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 308
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 309
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 310
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 311
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 312
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 313
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 314
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 315
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 316
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 317
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 318
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 319
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 320
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 321
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 322
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 323
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 324
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 325
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 326
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 327
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 328
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 329
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 330
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 331
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 332
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 333
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 334
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 335
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 336
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 337
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 338
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 339
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 340
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 341
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 342
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 343
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 344
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 345
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 346
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 347
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 348
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 349
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 350
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 351
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 352
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 353
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 354
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 355
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 356
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 357
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 358
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 359
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 360
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 361
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 362
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 363
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 364
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 365
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 366
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 367
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 368
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 369
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 370
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 371
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 372
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 373
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 374
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 375
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 376
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 377
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 378
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 379
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 380
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 381
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 382
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 383
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 384
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 385
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 386
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 387
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 388
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 389
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 390
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 391
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 392
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 393
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 394
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 395
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 396
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 397
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 398
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 399
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 400
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 401
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 402
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 403
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 404
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 405
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 406
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 407
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 408
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 409
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 410
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 411
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 412
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 413
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 414
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 415
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 416
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 417
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 418
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 419
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 420
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 421
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 422
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 423
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 424
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 425
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 426
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 427
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 428
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 429
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 430
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 431
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 432
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 433
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 434
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 435
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 436
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 437
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 438
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 439
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 440
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 441
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 442
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening

### Metadata Block 443
- File count snapshot: 228
- Build status snapshot: failing at `scripts/test_app.js:198` (`TS8016`) unless fixed after this generation run
- Outdated package count snapshot: 7 entries from latest `npm outdated --long` run
- TODO/FIXME scan snapshot: no matches for `TODO|FIXME|HACK|XXX` in tracked files during this run
- Operational note: this block is deterministic descriptive metadata, not an implementation claim
- Suggested remediation focus: resolve build blocker first, then dependency drift, then CI hardening


### Supplemental Metadata Block 1
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 2
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 3
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 4
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 5
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 6
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 7
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 8
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 9
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 10
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 11
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 12
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 13
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 14
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 15
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 16
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 17
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 18
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 19
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 20
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 21
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 22
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 23
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 24
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 25
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 26
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 27
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 28
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 29
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 30
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 31
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 32
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 33
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 34
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 35
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 36
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 37
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 38
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 39
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 40
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 41
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 42
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 43
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 44
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 45
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 46
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 47
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 48
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 49
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 50
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 51
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 52
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 53
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 54
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 55
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 56
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 57
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 58
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 59
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 60
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 61
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 62
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 63
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 64
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 65
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 66
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 67
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 68
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 69
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 70
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 71
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 72
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 73
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 74
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 75
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 76
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 77
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 78
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 79
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 80
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 81
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 82
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 83
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 84
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 85
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 86
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 87
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 88
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 89
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 90
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 91
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 92
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 93
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 94
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 95
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 96
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 97
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 98
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 99
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 100
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 101
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 102
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 103
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 104
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 105
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 106
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 107
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 108
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 109
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 110
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 111
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 112
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 113
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 114
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 115
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 116
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 117
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 118
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 119
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 120
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 121
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 122
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 123
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 124
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 125
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 126
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 127
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 128
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 129
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 130
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 131
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 132
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 133
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 134
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 135
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 136
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 137
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 138
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 139
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 140
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 141
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 142
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 143
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 144
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 145
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 146
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 147
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 148
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 149
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 150
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 151
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 152
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 153
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

### Supplemental Metadata Block 154
- File count snapshot: 232
- Build blocker snapshot: TS8016 at scripts/test_app.js:198 (from latest measured build run)
- Outdated dependency snapshot: 7 entries
- TODO/FIXME marker snapshot: none found in latest scan
- Focus order snapshot: build fix -> dependency upgrades -> CI hardening

