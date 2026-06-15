# Verification Plan — Silver Wolf VI Cyberpunk Spatial Dashboard

## Architecture & Integration
The Silver Wolf VI dashboard consists of:
1. **Frontend (Vite Preview)**: Runs on port `3000`. Serves the web UI.
2. **FastAPI Bridge**: Runs on port `8001`. Handles telemetry sync, logs diagnostic entries, and proxies chat requests to the Odysseus backend.
3. **Odysseus Backend**: Runs on port `7000`. Handles the LLM chat engine, database sessions, and models.

## Scope & Verification Milestones

| # | Milestone Name | Scope | Dependencies | Status |
|---|----------------|-------|--------------|--------|
| 1 | Microservices Health & Connectivity (R1) | Create new verification script in `scripts/verification_harness/` that tests HTTP status and reachability of Vite (3000), FastAPI Bridge (8001), and Odysseus backend (7000). | None | PLANNED |
| 2 | AI Chat & Proxy Verification (R2) | Test endpoint communication through the FastAPI bridge `/chat` proxy. Verify it creates a session in Odysseus backend, forwards messages, and gets a response. | Milestone 1 | PLANNED |
| 3 | Responsive UI and Telemetry (R3) | Verify UI elements (Space tab, settings panel, telemetry view) load in the DOM using Puppeteer. Assert proper viewport responsiveness and layout structure. | Milestone 1 | PLANNED |
| 4 | Verification Suite Acceptance (R4) | Produce a consolidated execution that runs the verification harness, generates a JSON report without headless browser crashes, and ensures all tests pass. | Milestones 1, 2, 3 | PLANNED |

## Verification Strategy & Code Layout
- **Harness Path**: `scripts/verification_harness/index.js` or `scripts/verification_harness/verify.cjs`.
- **Methodology**:
  - Phase 1: Opaque-box connectivity check (HTTP client pinging ports 3000, 8001, 7000).
  - Phase 2: Programmatic chat request via bridge proxy `/chat`.
  - Phase 3: Headless Chrome / Puppeteer validation with mock WebGL contexts and disabled transitions (like in `test_robust_verification.cjs`) to assert DOM layout elements.
  - Report: Detailed JSON output file including timestamps, checks, pass/fail status, and errors.
