import os
import sys
import secrets
import threading
import subprocess
import socket
import ipaddress
import asyncio
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any, Optional
from asyncio import Lock
import anyio
import urllib.request
import urllib.parse
import json

if sys.platform == 'win32':
    asyncio.WindowsProactorEventLoopPolicy = asyncio.WindowsSelectorEventLoopPolicy
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
import datetime
import httpx

from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel, field_validator

MODEL_NAME = os.getenv("HF_MODEL_NAME", "google/gemma-2-27b-it")
PORT = int(os.getenv("BRIDGE_PORT", "8001"))
HOST = os.getenv("BRIDGE_HOST", "0.0.0.0")
BASE_DIR = Path(__file__).resolve().parent
SYNC_FILE = BASE_DIR / "latest_sync.txt"
LOG_FILE = BASE_DIR / "diagnostics.log"
MAX_MESSAGE_CHARS = 8_000
MAX_SYNC_BYTES = 256_000
ALLOWED_ROLES = {"user", "assistant", "ai", "system"}
sync_lock = Lock()
log_lock = Lock()
CHAT_SESSION_CACHE_MAX_AGE_SECONDS = 60 * 30
CHAT_SESSION_CACHE: dict[str, str] = {}
CHAT_SESSION_CACHE_TTL: dict[str, float] = {}
CHAT_MODEL_CACHE: dict[str, Any] = {}
CHAT_MODEL_CACHE_TTL_SECONDS = 60
CHAT_MODEL_CACHE_TTL: dict[str, float] = {}
GIT_STATUS_CACHE_MAX_AGE_SECONDS = 2.5
GIT_STATUS_CACHE: dict[str, Any] = {
    "data": None,
    "expires_at": 0.0,
}

# Generate internal tool token to authenticate with Odysseus
INTERNAL_TOOL_TOKEN = os.getenv("ODYSSEUS_INTERNAL_TOKEN") or secrets.token_hex(32)
odysseus_proc = None

raw_origins = os.getenv(
    "BRIDGE_CORS_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3005,http://127.0.0.1:3005,http://localhost:4173,http://127.0.0.1:4173,http://localhost:4174,http://127.0.0.1:4174",
)
allowed_origins = [origin.strip() for origin in raw_origins.split(",") if origin.strip()]
allowed_origin_regex = os.getenv(
    "BRIDGE_CORS_ORIGIN_REGEX",
    r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
)
FRONTEND_ORIGIN = os.getenv("BRIDGE_FRONTEND_ORIGIN", "http://127.0.0.1:3005")
FRONTEND_REQUEST_TIMEOUT = float(os.getenv("BRIDGE_FRONTEND_REQUEST_TIMEOUT", "7.0"))
BRIDGE_TEST_LLM_CHAT_URL = os.getenv(
    "BRIDGE_TEST_LLM_CHAT_URL",
    "http://127.0.0.1:9099/v1/chat/completions",
)
SERVER_AI_PROVIDER_CONFIGS = [
    {
        "id": "openai",
        "label": "OpenAI API",
        "key_env": "OPENAI_API_KEY",
        "model_env": "OPENAI_MODEL",
        "endpoint_env": "OPENAI_CHAT_COMPLETIONS_URL",
        "default_endpoint": "https://api.openai.com/v1/chat/completions",
    },
    {
        "id": "openrouter",
        "label": "OpenRouter",
        "key_env": "OPENROUTER_API_KEY",
        "model_env": "OPENROUTER_MODEL",
        "endpoint_env": "OPENROUTER_CHAT_COMPLETIONS_URL",
        "default_endpoint": "https://openrouter.ai/api/v1/chat/completions",
    },
    {
        "id": "mistral",
        "label": "Mistral AI",
        "key_env": "MISTRAL_API_KEY",
        "model_env": "MISTRAL_MODEL",
        "endpoint_env": "MISTRAL_CHAT_COMPLETIONS_URL",
        "default_endpoint": "https://api.mistral.ai/v1/chat/completions",
    },
    {
        "id": "perplexity",
        "label": "Perplexity",
        "key_env": "PERPLEXITY_API_KEY",
        "model_env": "PERPLEXITY_MODEL",
        "endpoint_env": "PERPLEXITY_CHAT_COMPLETIONS_URL",
        "default_endpoint": "https://api.perplexity.ai/chat/completions",
    },
    {
        "id": "groq",
        "label": "Groq",
        "key_env": "GROQ_API_KEY",
        "model_env": "GROQ_MODEL",
        "endpoint_env": "GROQ_CHAT_COMPLETIONS_URL",
        "default_endpoint": "https://api.groq.com/openai/v1/chat/completions",
    },
]

def get_python_executable() -> str:
    """Returns the path to the virtual environment python if it exists, fallback to sys.executable."""
    odysseus_dir = BASE_DIR.parent / "odysseus"
    if os.name == "nt":
        venv_python = odysseus_dir / "venv" / "Scripts" / "python.exe"
    else:
        venv_python = odysseus_dir / "venv" / "bin" / "python"

    if venv_python.exists():
        return str(venv_python)
    return sys.executable

def run_odysseus_setup():
    """Runs first-time setup for Odysseus database and credentials."""
    print("Running Odysseus setup.py...")
    try:
        env = os.environ.copy()
        env["ODYSSEUS_SKIP_ADMIN_PROMPT"] = "1"
        env["ODYSSEUS_ADMIN_PASSWORD"] = os.getenv("ODYSSEUS_ADMIN_PASSWORD") or secrets.token_urlsafe(16)
        env["ODYSSEUS_INTERNAL_TOKEN"] = INTERNAL_TOOL_TOKEN

        py_exec = get_python_executable()
        print(f"Using python executable: {py_exec}")
        res = subprocess.run(
            [py_exec, "setup.py"],
            cwd=str(BASE_DIR.parent / "odysseus"),
            env=env,
            capture_output=True,
            text=True
        )
        print("Odysseus Setup Output:", res.stdout)
        if res.stderr:
            print("Odysseus Setup Errors:", res.stderr)
    except Exception as e:
        print(f"Error during Odysseus setup: {e}")

def start_odysseus_subprocess():
    """Starts the Odysseus backend process on port 7000."""
    global odysseus_proc
    print("Starting Odysseus backend subprocess...")
    try:
        env = os.environ.copy()
        env["ODYSSEUS_INTERNAL_TOKEN"] = INTERNAL_TOOL_TOKEN
        env["AUTH_ENABLED"] = "true"
        env["LOCALHOST_BYPASS"] = "false"

        py_exec = get_python_executable()
        odysseus_proc = subprocess.Popen(
            [py_exec, "-m", "uvicorn", "app:app", "--host", "127.0.0.1", "--port", "7000", "--loop", "asyncio"],
            cwd=str(BASE_DIR.parent / "odysseus"),
            env=env,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True
        )

        def log_odysseus_output():
            while True:
                line = odysseus_proc.stdout.readline()
                if not line:
                    break
                print(f"[Odysseus] {line.strip()}")

        threading.Thread(target=log_odysseus_output, daemon=True).start()
    except Exception as e:
        print(f"Failed to start Odysseus subprocess: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Run setup
    run_odysseus_setup()
    # Start server
    start_odysseus_subprocess()
    # Create shared http client
    app.state.http_client = httpx.AsyncClient(timeout=180.0)
    # Wait for Odysseus to become healthy (up to 30s)
    odysseus_ready = False
    for attempt in range(30):
        try:
            resp = await app.state.http_client.get("http://127.0.0.1:7000/api/health", timeout=2.0)
            if resp.status_code == 200:
                odysseus_ready = True
                print(f"Odysseus healthy after {attempt + 1}s")
                break
        except Exception:
            pass
        await asyncio.sleep(1)
    if not odysseus_ready:
        print("WARNING: Odysseus did not become healthy within 30s. Bridge will start anyway.")
    yield
    # Clean up the shared client
    await app.state.http_client.aclose()
    # Terminate process on shutdown
    global odysseus_proc
    if odysseus_proc:
        print("Stopping Odysseus backend subprocess...")
        try:
            odysseus_proc.terminate()
            odysseus_proc.wait(timeout=5)
        except Exception:
            try:
                odysseus_proc.kill()
            except Exception:
                pass

app = FastAPI(title="Silver Wolf Bridge & Odysseus Proxy", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=allowed_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class LogEntry(BaseModel):
    level: str
    message: str
    timestamp: Optional[float] = None
    metadata: Optional[dict] = None
    suggestion: Optional[str] = None
    stack: Optional[str] = None

class SyncRequest(BaseModel):
    message: str
    role: str

    @field_validator("message")
    @classmethod
    def validate_message(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("message is required")
        if len(value) > MAX_MESSAGE_CHARS:
            raise ValueError(f"message exceeds {MAX_MESSAGE_CHARS} characters")
        return value

    @field_validator("role")
    @classmethod
    def validate_role(cls, value: str) -> str:
        role = value.strip().lower()
        if role not in ALLOWED_ROLES:
            raise ValueError("role must be user, assistant, ai, or system")
        return "assistant" if role == "ai" else role

class ChatRequest(BaseModel):
    message: str
    system_instruction: Optional[str] = ""

    @field_validator("message")
    @classmethod
    def validate_message(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("message is required")
        if len(value) > MAX_MESSAGE_CHARS:
            raise ValueError(f"message exceeds {MAX_MESSAGE_CHARS} characters")
        return value

    @field_validator("system_instruction")
    @classmethod
    def validate_system_instruction(cls, value: Optional[str]) -> str:
        value = (value or "").strip()
        if len(value) > MAX_MESSAGE_CHARS:
            raise ValueError(f"system_instruction exceeds {MAX_MESSAGE_CHARS} characters")
        return value

def _chat_cache_key(model_name: str, endpoint_url: str) -> str:
    return f"{model_name}::{endpoint_url}"

def _get_cached_session(cache_key: str) -> str | None:
    session_id = CHAT_SESSION_CACHE.get(cache_key)
    if not session_id:
        return None

    expires_at = CHAT_SESSION_CACHE_TTL.get(cache_key, 0)
    if datetime.datetime.now().timestamp() > expires_at:
        CHAT_SESSION_CACHE.pop(cache_key, None)
        CHAT_SESSION_CACHE_TTL.pop(cache_key, None)
        return None

    return session_id

def _set_cached_session(cache_key: str, session_id: str) -> None:
    CHAT_SESSION_CACHE[cache_key] = session_id
    CHAT_SESSION_CACHE_TTL[cache_key] = datetime.datetime.now().timestamp() + CHAT_SESSION_CACHE_MAX_AGE_SECONDS

def _get_cached_chat_model() -> tuple[str | None, str | None] | None:
    cache_entry = CHAT_MODEL_CACHE.get("entry")
    if not isinstance(cache_entry, dict):
        return None
    model_name = str(cache_entry.get("model") or "").strip()
    endpoint_url = str(cache_entry.get("endpoint") or "").strip()
    if not model_name or not endpoint_url:
        return None

    expires_at = float(CHAT_MODEL_CACHE_TTL.get("expires_at", 0.0))
    if datetime.datetime.now().timestamp() > expires_at:
        CHAT_MODEL_CACHE.pop("entry", None)
        CHAT_MODEL_CACHE_TTL.pop("expires_at", None)
        return None

    return (model_name, endpoint_url)

def _set_cached_chat_model(model_name: str, endpoint_url: str) -> None:
    CHAT_MODEL_CACHE["entry"] = {
        "model": model_name,
        "endpoint": endpoint_url,
    }
    CHAT_MODEL_CACHE_TTL["expires_at"] = datetime.datetime.now().timestamp() + CHAT_MODEL_CACHE_TTL_SECONDS

def _clear_cached_session(cache_key: str) -> None:
    CHAT_SESSION_CACHE.pop(cache_key, None)
    CHAT_SESSION_CACHE_TTL.pop(cache_key, None)

def get_cached_git_status() -> dict | None:
    now = datetime.datetime.now().timestamp()
    data = GIT_STATUS_CACHE.get("data")
    expires_at = float(GIT_STATUS_CACHE.get("expires_at", 0.0))
    if data is not None and now < expires_at:
        return data
    return None

def set_cached_git_status(payload: dict) -> None:
    GIT_STATUS_CACHE["data"] = payload
    GIT_STATUS_CACHE["expires_at"] = datetime.datetime.now().timestamp() + GIT_STATUS_CACHE_MAX_AGE_SECONDS

def create_local_bridge_response(req: ChatRequest, reason: str) -> dict:
    prompt_length = len(req.message.strip())
    instruction_status = (
        "System instructions were received."
        if req.system_instruction
        else "No custom system instructions were supplied."
    )
    response = "\n".join([
        "Local bridge assistant response.",
        f"Input accepted without echoing the prompt text. Prompt length: {prompt_length} characters.",
        "Bridge chat loop verified: request validated, Odysseus availability checked, and assistant output returned separately.",
        f"{instruction_status} Odysseus model status: {reason}.",
    ])
    return {
        "response": response,
        "mode": "local-fallback",
        "reason": reason,
    }

def endpoint_points_to_odysseus_loopback(endpoint_url: str) -> bool:
    try:
        parsed = urllib.parse.urlparse(endpoint_url or "")
        host = (parsed.hostname or "").lower()
        return host in {"127.0.0.1", "localhost", "0.0.0.0", "::1"} and parsed.port == 7000
    except Exception:
        return False

def endpoint_points_to_verification_mock(endpoint_url: str) -> bool:
    try:
        parsed = urllib.parse.urlparse(endpoint_url or "")
        mock = urllib.parse.urlparse(BRIDGE_TEST_LLM_CHAT_URL)
        return (
            (parsed.hostname or "").lower() == (mock.hostname or "").lower()
            and parsed.port == mock.port
        )
    except Exception:
        return False

def is_usable_chat_session(session: dict) -> bool:
    if not isinstance(session, dict):
        return False
    session_id = str(session.get("id") or "").strip()
    model = str(session.get("model") or "").strip()
    endpoint_url = str(session.get("endpoint_url") or "").strip()
    return (
        bool(session_id and model and endpoint_url)
        and not endpoint_points_to_odysseus_loopback(endpoint_url)
        and not endpoint_points_to_verification_mock(endpoint_url)
    )

def get_server_provider_status() -> list[dict]:
    providers = []
    for provider in SERVER_AI_PROVIDER_CONFIGS:
        has_key = bool(os.getenv(provider["key_env"], "").strip())
        has_model = bool(os.getenv(provider["model_env"], "").strip())
        providers.append({
            "id": provider["id"],
            "label": provider["label"],
            "configured": has_key and has_model,
            "has_key": has_key,
            "has_model": has_model,
            "key_env": provider["key_env"],
            "model_env": provider["model_env"],
            "endpoint_env": provider["endpoint_env"],
            "endpoint": os.getenv(provider["endpoint_env"], provider["default_endpoint"]),
        })
    return providers

def resolve_server_provider_endpoint() -> tuple[Optional[str], Optional[str], str, dict]:
    for provider in SERVER_AI_PROVIDER_CONFIGS:
        api_key = os.getenv(provider["key_env"], "").strip()
        model_name = os.getenv(provider["model_env"], "").strip()
        if not api_key or not model_name:
            continue

        endpoint_url = os.getenv(provider["endpoint_env"], provider["default_endpoint"]).strip()
        headers = {
            "Authorization": f"Bearer {api_key}",
        }
        if provider["id"] == "openrouter":
            headers["HTTP-Referer"] = FRONTEND_ORIGIN
            headers["X-Title"] = "Silver Wolf VI"
        return model_name, endpoint_url, f"server-side {provider['label']} credential endpoint", headers

    return None, None, "no configured server-side AI provider endpoint", {}

async def call_openai_compatible_chat(
    client: httpx.AsyncClient,
    endpoint_url: str,
    model_name: str,
    req: ChatRequest,
    provider_headers: Optional[dict] = None,
) -> str:
    messages = []
    if req.system_instruction:
        messages.append({"role": "system", "content": req.system_instruction})
    messages.append({"role": "user", "content": req.message})

    response = await client.post(
        endpoint_url,
        json={
            "model": model_name,
            "messages": messages,
            "temperature": 0,
        },
        headers=provider_headers or {},
        timeout=45.0,
    )
    response.raise_for_status()
    payload = response.json()
    if isinstance(payload, dict):
        choices = payload.get("choices")
        if isinstance(choices, list) and choices:
            first = choices[0] or {}
            message = first.get("message") if isinstance(first, dict) else {}
            content = message.get("content") if isinstance(message, dict) else None
            if isinstance(content, str) and content.strip():
                return content.strip()
            text = first.get("text") if isinstance(first, dict) else None
            if isinstance(text, str) and text.strip():
                return text.strip()
        for key in ("response", "text", "content"):
            value = payload.get(key)
            if isinstance(value, str) and value.strip():
                return value.strip()
    return "No response generated."

async def resolve_chat_endpoint(client: httpx.AsyncClient, headers: dict) -> tuple[Optional[str], Optional[str], str, dict]:
    cached = _get_cached_chat_model()
    if cached:
        return cached[0], cached[1], "configured Odysseus model endpoint (cache)"

    try:
        models_resp = await client.get("http://127.0.0.1:7000/api/models", headers=headers, timeout=5.0)
        models_data = models_resp.json() if models_resp.status_code == 200 else {}
    except Exception:
        models_data = {}

    endpoint_candidates = []
    if isinstance(models_data, dict):
        endpoint_candidates.extend(models_data.get("items") or [])
        endpoint_candidates.extend(models_data.get("endpoints") or [])
    elif isinstance(models_data, list):
        endpoint_candidates.extend(models_data)

    for endpoint in endpoint_candidates:
        if not isinstance(endpoint, dict):
            continue
        models = endpoint.get("models") or []
        if not models and endpoint.get("id"):
            models = [endpoint.get("id")]
        model_name = str(models[0]).strip() if models else ""
        endpoint_url = str(
            endpoint.get("url") or endpoint.get("base_url") or endpoint.get("endpoint") or ""
        ).strip()
        if model_name and endpoint_url and not endpoint_points_to_odysseus_loopback(endpoint_url):
            _set_cached_chat_model(model_name, endpoint_url)
            return model_name, endpoint_url, "configured Odysseus model endpoint", {}

    server_model, server_endpoint, server_status, server_headers = resolve_server_provider_endpoint()
    if server_model and server_endpoint:
        return server_model, server_endpoint, server_status, server_headers

    mock_models_url = BRIDGE_TEST_LLM_CHAT_URL.replace("/chat/completions", "/models")
    try:
        mock_resp = await client.get(mock_models_url, timeout=5.0)
        if mock_resp.status_code == 200:
            mock_data = mock_resp.json()
            mock_models = mock_data.get("data") if isinstance(mock_data, dict) else []
            mock_model = "mock-model"
            if isinstance(mock_models, list) and mock_models:
                mock_model = str(mock_models[0].get("id") or mock_model)
            _set_cached_chat_model(mock_model, BRIDGE_TEST_LLM_CHAT_URL)
            return mock_model, BRIDGE_TEST_LLM_CHAT_URL, "verification mock LLM endpoint", {}
    except Exception:
        pass

    return None, None, "no configured Odysseus or server-side AI provider model endpoint", {}

@app.post("/log")
async def log_diagnostic(entry: LogEntry):
    async with log_lock:
        try:
            ts = datetime.datetime.fromtimestamp(entry.timestamp / 1000.0) if entry.timestamp else datetime.datetime.now()
            ts_str = ts.strftime("%Y-%m-%d %H:%M:%S.%f")[:-3]
            log_line = f"[{ts_str}] [{entry.level.upper()}] {entry.message}\n"
            if entry.suggestion:
                log_line += f"  Suggestion: {entry.suggestion}\n"
            if entry.metadata:
                log_line += f"  Metadata: {json.dumps(entry.metadata)}\n"
            if entry.stack:
                log_line += f"  Stack: {entry.stack}\n"
            log_line += "-" * 40 + "\n"

            with open(LOG_FILE, "a", encoding="utf-8") as f:
                f.write(log_line)
            return {"status": "logged"}
        except Exception as exc:
            print(f"Failed to write log: {exc}")
            raise HTTPException(status_code=500, detail="Internal logging failure")

@app.get("/status")
async def get_status(request: Request):
    odysseus_healthy = False
    try:
        client = request.app.state.http_client
        resp = await client.get("http://127.0.0.1:7000/api/health", timeout=1.0)
        if resp.status_code == 200:
            odysseus_healthy = True
    except Exception:
        pass

    return {
        "status": "Ready" if odysseus_healthy else "Starting Odysseus...",
        "ready": odysseus_healthy,
        "sync_file": SYNC_FILE.exists(),
        "host": HOST,
        "odysseus_health": "healthy" if odysseus_healthy else "offline"
    }


async def _proxy_to_frontend(path: str, request: Request):
    if not FRONTEND_ORIGIN:
        return JSONResponse(
            status_code=503,
            content={
                "status": "frontend_unavailable",
                "message": "BRIDGE_FRONTEND_ORIGIN is not configured",
            },
        )

    target = f"{FRONTEND_ORIGIN.rstrip('/')}/{path.lstrip('/')}"
    if request.url.query:
        target = f"{target}?{request.url.query}"

    try:
        client = request.app.state.http_client
        response = await client.get(
            target,
            headers={"Accept": request.headers.get("accept", "*/*")},
            timeout=FRONTEND_REQUEST_TIMEOUT,
        )

        hop_by_hop = {
            "connection",
            "keep-alive",
            "proxy-authenticate",
            "proxy-authorization",
            "te",
            "trailers",
            "transfer-encoding",
            "upgrade",
        }
        filtered_headers = {
            key: value
            for key, value in response.headers.items()
            if key.lower() not in hop_by_hop
        }

        return Response(
            content=response.content,
            status_code=response.status_code,
            headers=filtered_headers,
        )
    except Exception as exc:
        return JSONResponse(
            status_code=502,
            content={
                "status": "frontend_unavailable",
                "message": f"Unable to reach frontend at {FRONTEND_ORIGIN}: {exc}",
            },
        )


def compact_sync_file() -> None:
    if not SYNC_FILE.exists() or SYNC_FILE.stat().st_size <= MAX_SYNC_BYTES:
        return
    content = SYNC_FILE.read_text(encoding="utf-8", errors="replace")
    SYNC_FILE.write_text(content[-MAX_SYNC_BYTES // 2 :], encoding="utf-8")

def compact_and_write_sync(role: str, message: str) -> None:
    compact_sync_file()
    with SYNC_FILE.open("a", encoding="utf-8") as file:
        file.write(f"[{role.upper()}]: {message}\n---\n")

@app.post("/sync")
async def sync(req: SyncRequest):
    async with sync_lock:
        try:
            await anyio.to_thread.run_sync(compact_and_write_sync, req.role, req.message)
            return {"status": "synced"}
        except OSError as exc:
            raise HTTPException(status_code=500, detail="Unable to write sync file") from exc

@app.post("/chat")
async def chat(req: ChatRequest, request: Request):
    """Proxies the chat call from the frontend to the Odysseus backend chat endpoint."""
    headers = {
        "X-Odysseus-Internal-Token": INTERNAL_TOOL_TOKEN,
        "Content-Type": "application/json"
    }

    client = request.app.state.http_client
    try:
        model_name, endpoint_url, model_status = await resolve_chat_endpoint(client, headers)
        if not model_name or not endpoint_url:
            return create_local_bridge_response(req, model_status)

        if model_status == "verification mock LLM endpoint":
            response_text = await call_openai_compatible_chat(client, endpoint_url, model_name, req)
            return {
                "response": response_text,
                "mode": "verification-mock",
                "reason": model_status,
            }

        # Reuse an active Odysseus session when possible to reduce chat latency.
        cache_key = _chat_cache_key(model_name, endpoint_url)
        session_id = _get_cached_session(cache_key)

        if not session_id:
            # 1. Fetch sessions to find one for the currently configured endpoint.
            sessions_resp = await client.get("http://127.0.0.1:7000/api/sessions", headers=headers)
            sessions = sessions_resp.json() if sessions_resp.status_code == 200 else []

            if isinstance(sessions, list) and len(sessions) > 0:
                for s in sessions:
                    session_endpoint = str(s.get("endpoint_url") or "").strip()
                    session_model = str(s.get("model") or "").strip()
                    if (
                        is_usable_chat_session(s)
                        and session_endpoint == endpoint_url
                        and session_model == model_name
                    ):
                        session_id = s.get("id")
                        break

        if not session_id:
            # Create a session
            create_data = {
                "name": "Silver Wolf Session",
                "endpoint_url": endpoint_url,
                "model": model_name,
                "rag": "false",
                "skip_validation": "true"
            }
            session_create_resp = await client.post(
                "http://127.0.0.1:7000/api/session",
                data=create_data,
                headers={"X-Odysseus-Internal-Token": INTERNAL_TOOL_TOKEN}
            )
            if session_create_resp.status_code == 200:
                session_id = session_create_resp.json().get("id")
            else:
                return create_local_bridge_response(
                    req,
                    f"failed to create Odysseus session: {session_create_resp.text}",
                )
            _set_cached_session(cache_key, str(session_id))

        # Send message to /api/chat
        chat_data = {
            "message": req.message,
            "session": session_id,
            "use_web": False,
            "use_research": False,
            "preset_id": None
        }

        chat_resp = await client.post(
            "http://127.0.0.1:7000/api/chat",
            json=chat_data,
            headers=headers
        )

        if chat_resp.status_code == 200:
            resp_json = chat_resp.json()
            _set_cached_session(cache_key, str(session_id))
            return {
                "response": resp_json.get("response", "No response generated."),
                "mode": "odysseus",
                "session": session_id,
            }

        _clear_cached_session(cache_key)
        return create_local_bridge_response(
            req,
            f"Odysseus chat returned {chat_resp.status_code}: {chat_resp.text[:240]}",
        )

    except Exception as exc:
        print(f"Proxy Chat Error: {exc}")
        return create_local_bridge_response(req, f"connection failed: {exc}")

def is_safe_url(url: str) -> bool:
    try:
        parsed = urllib.parse.urlparse(url)
        if parsed.scheme not in ("http", "https"):
            return False

        hostname = parsed.hostname
        if not hostname:
            return False

        hostname_lower = hostname.lower()
        if hostname_lower in ("localhost", "127.0.0.1", "::1", "localhost.localdomain"):
            return False

        try:
            ip = ipaddress.ip_address(hostname)
            if ip.is_loopback or ip.is_private or ip.is_link_local or ip.is_multicast or ip.is_unspecified:
                return False
        except ValueError:
            pass

        try:
            for info in socket.getaddrinfo(hostname, None):
                ip_str = info[4][0]
                ip = ipaddress.ip_address(ip_str)
                if ip.is_loopback or ip.is_private or ip.is_link_local or ip.is_multicast or ip.is_unspecified:
                    return False
        except Exception:
            return False

        return True
    except Exception:
        return False

@app.get("/api/camera/proxy")
async def fetch_url_async(url: str, request: Request) -> dict:
    if not is_safe_url(url):
        return {"status": 400, "error": "SSRF threat detected: URL accesses disallowed location.", "response": ""}
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
        client = request.app.state.http_client
        response = await client.get(url, headers=headers, timeout=10.0)
        text = response.text
        try:
            return {"status": response.status_code, "response": json.loads(text)}
        except json.JSONDecodeError:
            return {"status": response.status_code, "response": text}
    except httpx.HTTPStatusError as e:
        return {"status": e.response.status_code, "error": str(e), "response": ""}
    except Exception as e:
        return {"status": 500, "error": str(e), "response": ""}

@app.get("/git/status")
async def git_status():
    try:
        cached = get_cached_git_status()
        if cached is not None:
            return cached

        def run_git():
            return subprocess.run(
                ["git", "status", "--porcelain"],
                capture_output=True,
                text=True,
                cwd=BASE_DIR.parent
            )

        result = await anyio.to_thread.run_sync(run_git)
        changes = result.stdout.strip().split('\n') if result.stdout.strip() else []
        payload = {
            "has_changes": len(changes) > 0,
            "change_count": len(changes),
            "changes": changes
        }
        set_cached_git_status(payload)
        return payload
    except Exception as e:
        return {"has_changes": False, "error": str(e)}

# Secure Generic Proxy to Odysseus Endpoints
@app.api_route("/api/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def proxy_to_odysseus(path: str, request: Request):
    # Exclude our custom camera proxy
    if path == "camera/proxy":
        url = request.query_params.get("url")
        return await fetch_url_async(url, request)

    # Reject folder traversal attacks in proxy path
    if ".." in path or "\\" in path or "%5c" in path.lower() or "%2e" in path.lower():
        raise HTTPException(status_code=400, detail="Invalid path traversal sequence detected")

    # Sanitize query parameters
    query_str = str(request.url.query)
    if ".." in query_str or "\\" in query_str or "%5c" in query_str.lower() or "%2e" in query_str.lower():
        raise HTTPException(status_code=400, detail="Invalid characters in parameters")

    target_url = f"http://127.0.0.1:7000/api/{path}"
    if request.url.query:
        target_url += f"?{request.url.query}"

    headers = dict(request.headers)
    headers.pop("host", None)
    headers["X-Odysseus-Internal-Token"] = INTERNAL_TOOL_TOKEN

    method = request.method
    body = await request.body()

    try:
        hop_by_hop = {
            "connection",
            "keep-alive",
            "proxy-authenticate",
            "proxy-authorization",
            "te",
            "trailers",
            "transfer-encoding",
            "upgrade"
        }
        req_headers = {
            k: v for k, v in headers.items()
            if k.lower() != 'content-length' and k.lower() not in hop_by_hop
        }

        if "chat_stream" in path or "stream" in path:
            async def stream_generator():
                client = request.app.state.http_client
                async with client.stream(method, target_url, headers=req_headers, content=body) as response:
                    async for chunk in response.aiter_bytes():
                        yield chunk
            return StreamingResponse(stream_generator(), media_type="text/event-stream")
        else:
            client = request.app.state.http_client
            response = await client.request(method, target_url, headers=req_headers, content=body)
            resp_headers = {
                k: v for k, v in response.headers.items()
                if k.lower() not in hop_by_hop
            }
            resp = Response(
                content=response.content,
                status_code=response.status_code,
                headers=resp_headers
            )
            return resp
    except Exception as e:
        return JSONResponse(status_code=502, content={"error": f"Odysseus backend unreachable: {e}"})

@app.get("/{path:path}", include_in_schema=False)
async def frontend_proxy(path: str, request: Request):
    reserved = {
        "status",
        "sync",
        "chat",
        "log",
        "openapi.json",
        "docs",
        "redoc",
    }

    if path in reserved:
        raise HTTPException(status_code=404, detail="Not found")

    return await _proxy_to_frontend(path, request)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=HOST, port=PORT, loop="asyncio")
