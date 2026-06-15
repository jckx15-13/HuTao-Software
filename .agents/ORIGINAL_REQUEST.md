# Original User Request

## Initial Request — 2026-06-15T12:02:35Z

Verify that all advertised features of the Silver Wolf VI cyberpunk spatial dashboard are ported correctly and fully functional, including microservices connectivity, interactive UI responsiveness, and AI chat capability.

Working directory: c:\Users\jaron\OneDrive - Ministry of Education (M365 T&L)\Documents\silver-wolf-vi
Integrity mode: benchmark

## Requirements

### R1. Microservices Verification
Design a brand-new test script/harness from scratch to verify the health and connectivity of the three microservices:
1. Vite Preview server running on port `3000`.
2. FastAPI Bridge running on port `8001`.
3. Odysseus backend running on port `7000`.

### R2. AI Chat & Proxy Verification
Programmatically verify that chat prompts sent via the FastAPI bridge proxy are successfully routed to the Odysseus model backend, returning a valid response.

### R3. Responsive UI and Telemetry Verification
Establish page-load assertions to ensure the UI is responsive, the workspace layout is complete, and components (Space tab, settings panel, telemetry view) exist in the DOM.

## Acceptance Criteria

### Verification Suite
- [ ] Brand-new verification script created under `scripts/verification_harness/`.
- [ ] Test harness runs and generates a detailed JSON report outlining the status of each service and UI component.
- [ ] Verification suite runs successfully without WebGL/headless browser crashes.
- [ ] Verify Odysseus and bridge proxy communication flows.
