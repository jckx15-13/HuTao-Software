# Context — Silver Wolf VI Verification

## Ports & Services
- **Vite Preview Server**: `http://127.0.0.1:3000`
- **FastAPI Bridge**: `http://127.0.0.1:8001`
- **Odysseus Backend**: `http://127.0.0.1:7000`

## Workspace Paths
- **Verification script directory**: `scripts/verification_harness/`
- **Existing E2E test file (for reference)**: `scripts/test_robust_verification.cjs`
- **FastAPI Bridge server codebase**: `bridge/server.py`
- **Odysseus codebase**: `odysseus/app.py`

## Credentials / Environment
- **Odysseus internal token**: Determined dynamically by the bridge (`INTERNAL_TOOL_TOKEN` on startup) or passed via headers `X-Odysseus-Internal-Token`.
- **FastAPI Bridge endpoints**:
  - `GET /status` (returns status, ready, odysseus_health)
  - `POST /chat` (takes `message`, proxy-forwards to Odysseus `/api/chat`)
  - `POST /log` (logs diagnostic lines)
  - `POST /sync` (saves role/message history to sync file)
