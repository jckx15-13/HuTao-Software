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

# Local-LLM support (Ollama / LM Studio / llama.cpp). Imported defensively:
# a problem in the local layer must not prevent the bridge from starting,
# since cloud providers and the rest of the API stay usable without it.
try:
    import local_llm
    LOCAL_LLM_AVAILABLE = True
    LOCAL_LLM_IMPORT_ERROR = ""
except Exception as exc:  # pragma: no cover - defensive
    local_llm = None
    LOCAL_LLM_AVAILABLE = False
    LOCAL_LLM_IMPORT_ERROR = str(exc)
    print(f"[bridge] local LLM support unavailable: {exc}")

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
CHAT_SESSION_LOCKS: dict[str, Lock] = {}
CHAT_MODEL_CACHE: dict[str, Any] = {}
CHAT_MODEL_CACHE_TTL_SECONDS = float(os.getenv("BRIDGE_CHAT_MODEL_CACHE_TTL_SECONDS", "60"))
CHAT_MODEL_NEGATIVE_CACHE_TTL_SECONDS = float(os.getenv("BRIDGE_CHAT_MODEL_NEGATIVE_CACHE_TTL_SECONDS", "2"))
CHAT_MODEL_CACHE_TTL: dict[str, float] = {}
# Cloud providers answer in seconds; a local model on CPU can take minutes for
# a first token, so this defaults high and is tuned down per-deployment.
CHAT_REQUEST_TIMEOUT = float(os.getenv("BRIDGE_CHAT_TIMEOUT", "300"))
BRIDGE_ODYSSEUS_MODELS_TIMEOUT = float(os.getenv("BRIDGE_ODYSSEUS_MODELS_TIMEOUT", "1.2"))
BRIDGE_MOCK_MODELS_TIMEOUT = float(os.getenv("BRIDGE_MOCK_MODELS_TIMEOUT", "0.5"))
GIT_STATUS_CACHE_MAX_AGE_SECONDS = float(os.getenv("BRIDGE_GIT_STATUS_CACHE_SECONDS", "10"))
GIT_STATUS_CACHE: dict[str, Any] = {
    "data": None,
    "expires_at": 0.0,
}
ODYSSEUS_STATUS_CACHE_MAX_AGE_SECONDS = float(os.getenv("BRIDGE_STATUS_CACHE_SECONDS", "2"))
ODYSSEUS_STATUS_CACHE: dict[str, Any] = {
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

SERVER_CONNECTOR_PROVIDER_CONFIGS = [
    {
        "id": "openai",
        "label": "OpenAI API",
        "category": "ai",
        "key_env": "OPENAI_API_KEY",
        "endpoint_env": "OPENAI_CHAT_COMPLETIONS_URL",
        "default_base_url": "https://api.openai.com/v1",
        "probe_path": "/models",
        "capabilities": ["chat", "models"],
        "requires_backend": True,
    },
    {
        "id": "anthropic",
        "label": "Anthropic Claude",
        "category": "ai",
        "key_env": "ANTHROPIC_API_KEY",
        "endpoint_env": "ANTHROPIC_API_URL",
        "default_base_url": "https://api.anthropic.com/v1",
        "probe_path": "/models",
        "capabilities": ["chat", "models"],
        "requires_backend": True,
    },
    {
        "id": "openrouter",
        "label": "OpenRouter",
        "category": "ai",
        "key_env": "OPENROUTER_API_KEY",
        "endpoint_env": "OPENROUTER_CHAT_COMPLETIONS_URL",
        "default_base_url": "https://openrouter.ai/api/v1",
        "probe_path": "/models",
        "capabilities": ["chat", "models"],
        "requires_backend": True,
    },
    {
        "id": "mistral",
        "label": "Mistral AI",
        "category": "ai",
        "key_env": "MISTRAL_API_KEY",
        "endpoint_env": "MISTRAL_CHAT_COMPLETIONS_URL",
        "default_base_url": "https://api.mistral.ai/v1",
        "probe_path": "/models",
        "capabilities": ["chat", "models"],
        "requires_backend": True,
    },
    {
        "id": "perplexity",
        "label": "Perplexity",
        "category": "ai",
        "key_env": "PERPLEXITY_API_KEY",
        "endpoint_env": "PERPLEXITY_CHAT_COMPLETIONS_URL",
        "default_base_url": "https://api.perplexity.ai",
        "probe_path": "/models",
        "capabilities": ["chat", "models"],
        "requires_backend": True,
    },
    {
        "id": "groq",
        "label": "Groq",
        "category": "ai",
        "key_env": "GROQ_API_KEY",
        "endpoint_env": "GROQ_CHAT_COMPLETIONS_URL",
        "default_base_url": "https://api.groq.com/openai/v1",
        "probe_path": "/models",
        "capabilities": ["chat", "models"],
        "requires_backend": True,
    },
    {
        "id": "apify",
        "label": "Apify",
        "category": "automation",
        "key_env": "APIFY_TOKEN",
        "endpoint_env": "APIFY_API_URL",
        "default_base_url": "https://api.apify.com/v2",
        "probe_path": "/users/me",
        "capabilities": ["actors", "automation"],
        "requires_backend": True,
    },
    {
        "id": "google-cloud",
        "label": "Google Cloud",
        "category": "cloud",
        "key_env": "GOOGLE_MAPS_API_KEY",
        "endpoint_env": "GOOGLE_MAPS_API_URL",
        "default_base_url": "https://maps.googleapis.com",
        "probe_path": "/maps/api/tile/v1/createSession",
        "capabilities": ["cloud", "maps"],
        "requires_backend": False,
    },
    {
        "id": "github",
        "label": "GitHub",
        "category": "developer",
        "key_env": "GITHUB_TOKEN",
        "endpoint_env": "GITHUB_API_URL",
        "default_base_url": "https://api.github.com",
        "probe_path": "/user",
        "capabilities": ["repos", "automation"],
        "requires_backend": True,
    },
    {
        "id": "notion",
        "label": "Notion",
        "category": "connector",
        "key_env": "NOTION_API_KEY",
        "endpoint_env": "NOTION_API_URL",
        "default_base_url": "https://api.notion.com/v1",
        "probe_path": "/users/me",
        "capabilities": ["pages", "automation"],
        "requires_backend": True,
    },
    {
        "id": "openweather",
        "label": "OpenWeather",
        "category": "weather",
        "key_env": "OPENWEATHER_API_KEY",
        "endpoint_env": "OPENWEATHER_API_URL",
        "default_base_url": "https://api.openweathermap.org/data/2.5",
        "probe_path": "/weather",
        "capabilities": ["weather"],
        "requires_backend": False,
    },
]

BRIDGE_CONNECTOR_PROBE_TIMEOUT = float(os.getenv("BRIDGE_CONNECTOR_PROBE_TIMEOUT", "4.0"))
CONNECTOR_SECRET_QUERY_NAMES = {"key", "appid", "api_key", "access_token", "token"}

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
    skip_odysseus_start = os.getenv("BRIDGE_SKIP_ODYSSEUS_START", "").strip().lower() in {"1", "true", "yes"}
    if skip_odysseus_start:
        print("BRIDGE_SKIP_ODYSSEUS_START enabled; skipping Odysseus setup/subprocess start.")
    else:
        # Run setup
        run_odysseus_setup()
        # Start server
        start_odysseus_subprocess()
    # Create shared http client
    app.state.http_client = httpx.AsyncClient(timeout=180.0)
    # Wait for Odysseus to become healthy (up to 30s)
    odysseus_ready = False
    if not skip_odysseus_start:
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
    if not odysseus_ready and not skip_odysseus_start:
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


def _get_session_lock(cache_key: str) -> Lock:
    lock = CHAT_SESSION_LOCKS.get(cache_key)
    if lock is None:
        lock = Lock()
        CHAT_SESSION_LOCKS[cache_key] = lock
    return lock


async def _create_odysseus_session(
    client: httpx.AsyncClient,
    model_name: str,
    endpoint_url: str,
) -> str | None:
    create_data = {
        "name": "Silver Wolf Session",
        "endpoint_url": endpoint_url,
        "model": model_name,
        "rag": "false",
        "skip_validation": "true",
    }
    session_create_resp = await client.post(
        "http://127.0.0.1:7000/api/session",
        data=create_data,
        headers={"X-Odysseus-Internal-Token": INTERNAL_TOOL_TOKEN},
    )
    if session_create_resp.status_code != 200:
        return None

    session_id = session_create_resp.json().get("id")
    if not session_id:
        return None
    return str(session_id)
def _get_cached_chat_model() -> tuple[str | None, str | None, str, dict] | None:
    cache_entry = CHAT_MODEL_CACHE.get("entry")
    if not isinstance(cache_entry, dict):
        return None

    expires_at = float(CHAT_MODEL_CACHE_TTL.get("expires_at", 0.0))
    if datetime.datetime.now().timestamp() > expires_at:
        CHAT_MODEL_CACHE.pop("entry", None)
        CHAT_MODEL_CACHE_TTL.pop("expires_at", None)
        return None

    status = str(cache_entry.get("status") or "").strip()
    headers = cache_entry.get("headers") if isinstance(cache_entry.get("headers"), dict) else {}
    if cache_entry.get("negative"):
        return (None, None, status or "no configured Odysseus or server-side AI provider model endpoint", headers)

    model_name = str(cache_entry.get("model") or "").strip()
    endpoint_url = str(cache_entry.get("endpoint") or "").strip()
    if not model_name or not endpoint_url:
        return None

    return (
        model_name,
        endpoint_url,
        status or "configured Odysseus model endpoint (cache)",
        headers,
    )

def _set_cached_chat_model(
    model_name: str,
    endpoint_url: str,
    status: str,
    headers: Optional[dict] = None,
    ttl_seconds: Optional[float] = None,
) -> None:
    CHAT_MODEL_CACHE["entry"] = {
        "model": model_name,
        "endpoint": endpoint_url,
        "status": status,
        "headers": headers or {},
        "negative": False,
    }
    CHAT_MODEL_CACHE_TTL["expires_at"] = datetime.datetime.now().timestamp() + (
        ttl_seconds if ttl_seconds is not None else CHAT_MODEL_CACHE_TTL_SECONDS
    )

def _set_cached_chat_endpoint_miss(status: str) -> None:
    CHAT_MODEL_CACHE["entry"] = {
        "model": "",
        "endpoint": "",
        "status": status,
        "headers": {},
        "negative": True,
    }
    CHAT_MODEL_CACHE_TTL["expires_at"] = datetime.datetime.now().timestamp() + CHAT_MODEL_NEGATIVE_CACHE_TTL_SECONDS

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

def get_cached_odysseus_status() -> dict | None:
    now = datetime.datetime.now().timestamp()
    data = ODYSSEUS_STATUS_CACHE.get("data")
    expires_at = float(ODYSSEUS_STATUS_CACHE.get("expires_at", 0.0))
    if data is not None and now < expires_at:
        return data
    return None

def set_cached_odysseus_status(payload: dict) -> None:
    ODYSSEUS_STATUS_CACHE["data"] = payload
    ODYSSEUS_STATUS_CACHE["expires_at"] = datetime.datetime.now().timestamp() + ODYSSEUS_STATUS_CACHE_MAX_AGE_SECONDS

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

def _join_url(base_url: str, path: str) -> str:
    return f"{base_url.rstrip('/')}/{path.lstrip('/')}" if path else base_url.rstrip("/")

def get_server_connector_provider_status() -> list[dict]:
    providers = []
    for provider in SERVER_CONNECTOR_PROVIDER_CONFIGS:
        key_env = provider["key_env"]
        endpoint_env = provider["endpoint_env"]
        has_key = bool(os.getenv(key_env, "").strip())
        endpoint = os.getenv(endpoint_env, provider["default_base_url"]).strip() or provider["default_base_url"]
        providers.append({
            "id": provider["id"],
            "label": provider["label"],
            "category": provider["category"],
            "configured": has_key,
            "has_key": has_key,
            "key_env": key_env,
            "endpoint_env": endpoint_env,
            "endpoint_configured": bool(os.getenv(endpoint_env, "").strip()),
            "probe_url": _join_url(endpoint, provider["probe_path"]),
            "capabilities": provider["capabilities"],
            "requires_backend": provider["requires_backend"],
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
    timeout: Optional[float] = None,
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
        timeout=timeout if timeout is not None else CHAT_REQUEST_TIMEOUT,
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
        return cached

    # Local-first: a reachable Ollama/LM Studio/llama.cpp beats a cloud key,
    # unless BRIDGE_PREFER_LOCAL is explicitly disabled.
    if LOCAL_LLM_AVAILABLE and local_llm.prefer_local():
        local_model, local_endpoint, local_status_msg, local_headers = (
            await local_llm.resolve_local_endpoint(client)
        )
        if local_model and local_endpoint:
            _set_cached_chat_model(
                local_model, local_endpoint, local_status_msg, local_headers
            )
            return local_model, local_endpoint, local_status_msg, local_headers

    server_model, server_endpoint, server_status, server_headers = resolve_server_provider_endpoint()
    if server_model and server_endpoint:
        _set_cached_chat_model(
            server_model,
            server_endpoint,
            server_status,
            server_headers,
        )
        return server_model, server_endpoint, server_status, server_headers

    # Cloud unavailable (or deprioritised and then unconfigured): try local as
    # a fallback before falling through to Odysseus discovery.
    if LOCAL_LLM_AVAILABLE and not local_llm.prefer_local():
        local_model, local_endpoint, local_status_msg, local_headers = (
            await local_llm.resolve_local_endpoint(client)
        )
        if local_model and local_endpoint:
            _set_cached_chat_model(
                local_model, local_endpoint, local_status_msg, local_headers
            )
            return local_model, local_endpoint, local_status_msg, local_headers

    try:
        models_resp = await client.get(
            "http://127.0.0.1:7000/api/models",
            headers=headers,
            timeout=BRIDGE_ODYSSEUS_MODELS_TIMEOUT,
        )
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
        if model_name and endpoint_url and endpoint_points_to_verification_mock(endpoint_url):
            return model_name, BRIDGE_TEST_LLM_CHAT_URL, "verification mock LLM endpoint", {}
        if model_name and endpoint_url and not endpoint_points_to_odysseus_loopback(endpoint_url):
            model_status = "configured Odysseus model endpoint"
            _set_cached_chat_model(model_name, endpoint_url, model_status, {})
            return model_name, endpoint_url, model_status, {}

    mock_models_url = BRIDGE_TEST_LLM_CHAT_URL.replace("/chat/completions", "/models")
    try:
        mock_resp = await client.get(mock_models_url, timeout=BRIDGE_MOCK_MODELS_TIMEOUT)
        if mock_resp.status_code == 200:
            mock_data = mock_resp.json()
            mock_models = mock_data.get("data") if isinstance(mock_data, dict) else []
            mock_model = "mock-model"
            if isinstance(mock_models, list) and mock_models:
                mock_model = str(mock_models[0].get("id") or mock_model)
            return mock_model, BRIDGE_TEST_LLM_CHAT_URL, "verification mock LLM endpoint", {}
    except Exception:
        pass

    no_endpoint_status = "no configured Odysseus or server-side AI provider model endpoint"
    _set_cached_chat_endpoint_miss(no_endpoint_status)
    return None, None, no_endpoint_status, {}

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
    cached = get_cached_odysseus_status()
    if cached is not None:
        return cached

    odysseus_healthy = False
    try:
        client = request.app.state.http_client
        resp = await client.get("http://127.0.0.1:7000/api/health", timeout=0.75)
        if resp.status_code == 200:
            odysseus_healthy = True
    except Exception:
        pass

    payload = {
        "status": "Ready" if odysseus_healthy else "Starting Odysseus...",
        "ready": odysseus_healthy,
        "sync_file": SYNC_FILE.exists(),
        "host": HOST,
        "odysseus_health": "healthy" if odysseus_healthy else "offline"
    }
    set_cached_odysseus_status(payload)
    return payload


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
        model_name, endpoint_url, model_status, provider_headers = await resolve_chat_endpoint(client, headers)
        if not model_name or not endpoint_url:
            return create_local_bridge_response(req, model_status)

        # Endpoints that speak OpenAI's /chat/completions directly, i.e.
        # everything except the Odysseus session flow below. Keyed off the
        # status string that resolve_chat_endpoint() produced.
        OPENAI_COMPATIBLE_MODES = (
            ("verification mock LLM endpoint", "verification-mock"),
            ("server-side ", "server-provider"),
            ("local ", "local-runtime"),
        )
        for prefix, mode in OPENAI_COMPATIBLE_MODES:
            if model_status.startswith(prefix):
                response_text = await call_openai_compatible_chat(
                    client, endpoint_url, model_name, req, provider_headers
                )
                return {
                    "response": response_text,
                    "mode": mode,
                    "model": model_name,
                    "reason": model_status,
                }

        # Reuse an active Odysseus session when possible to reduce chat latency.
        cache_key = _chat_cache_key(model_name, endpoint_url)
        session_id = _get_cached_session(cache_key)
        if not session_id:
            async with _get_session_lock(cache_key):
                session_id = _get_cached_session(cache_key)
                if not session_id:
                    session_id = await _create_odysseus_session(client, model_name, endpoint_url)
                    if not session_id:
                        return create_local_bridge_response(
                            req,
                            "failed to create Odysseus session",
                        )
                    _set_cached_session(cache_key, session_id)


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

@app.get("/api/credentials/providers")
async def api_credential_provider_status():
    providers = get_server_provider_status()
    configured = [provider for provider in providers if provider["configured"]]
    connector_providers = get_server_connector_provider_status()
    configured_connectors = [provider for provider in connector_providers if provider["configured"]]
    return {
        "providers": providers,
        "configured_count": len(configured),
        "connector_providers": connector_providers,
        "connector_configured_count": len(configured_connectors),
        "supported_connector_count": len(connector_providers),
        "server_side_only": True,
        "message": "Secrets are read from Bridge environment variables and are never returned by this status endpoint.",
    }

def get_connector_provider_config(provider_id: str) -> Optional[dict]:
    normalized = (provider_id or "").strip().lower()
    for provider in SERVER_CONNECTOR_PROVIDER_CONFIGS:
        if provider["id"] == normalized:
            return provider
    return None

def connector_base_url(provider: dict) -> str:
    configured = os.getenv(provider["endpoint_env"], "").strip()
    base_url = configured or provider["default_base_url"]
    parsed = urllib.parse.urlparse(base_url)
    if parsed.path.endswith("/chat/completions"):
        trimmed_path = parsed.path[: -len("/chat/completions")]
        return urllib.parse.urlunparse(parsed._replace(path=trimmed_path, query="", params="", fragment=""))
    return base_url.rstrip("/")

def connector_probe_url(provider: dict) -> str:
    base_url = connector_base_url(provider).rstrip("/")
    probe_path = str(provider.get("probe_path") or "").strip()
    if not probe_path:
        return base_url
    return f"{base_url}/{probe_path.lstrip('/')}"

def redact_probe_url(url: str) -> str:
    try:
        parsed = urllib.parse.urlparse(url)
        query = urllib.parse.parse_qsl(parsed.query, keep_blank_values=True)
        redacted_query = [
            (key, "[redacted]" if key.lower() in CONNECTOR_SECRET_QUERY_NAMES else value)
            for key, value in query
        ]
        return urllib.parse.urlunparse(parsed._replace(query=urllib.parse.urlencode(redacted_query)))
    except Exception:
        return url

def connector_probe_headers(provider: dict, api_key: str) -> dict:
    headers = {
        "Accept": "application/json",
        "User-Agent": "SilverWolfVI-Bridge/1.0",
    }
    provider_id = provider["id"]
    if provider_id == "anthropic":
        headers["x-api-key"] = api_key
        headers["anthropic-version"] = "2023-06-01"
    elif provider_id == "notion":
        headers["Authorization"] = f"Bearer {api_key}"
        headers["Notion-Version"] = "2022-06-28"
    elif provider_id not in {"google-cloud", "openweather"}:
        headers["Authorization"] = f"Bearer {api_key}"
    return headers

def connector_probe_request_options(provider: dict, api_key: str) -> tuple[str, str, dict, Optional[dict]]:
    provider_id = provider["id"]
    method = "GET"
    url = connector_probe_url(provider)
    params: dict[str, str] = {}
    json_body: Optional[dict] = None

    if provider_id == "openweather":
        params = {
            "lat": "0",
            "lon": "0",
            "appid": api_key,
        }
    elif provider_id == "google-cloud":
        params = {"key": api_key}
        if "createSession" in url:
            method = "POST"
            json_body = {
                "mapType": "satellite",
                "language": "en-US",
                "region": "US",
            }

    return method, url, params, json_body

async def probe_connector_provider_config(provider: dict, client: httpx.AsyncClient) -> dict:
    api_key = os.getenv(provider["key_env"], "").strip()
    endpoint_configured = bool(os.getenv(provider["endpoint_env"], "").strip())
    probe_url = connector_probe_url(provider)
    checked_at = datetime.datetime.now(datetime.timezone.utc).isoformat()
    base = {
        "id": provider["id"],
        "label": provider["label"],
        "configured": bool(api_key),
        "endpoint_configured": endpoint_configured,
        "probe_url": redact_probe_url(probe_url),
        "probe_checked_at": checked_at,
        "secret_returned": False,
    }

    if not api_key:
        return {
            **base,
            "probe_ok": False,
            "probe_status": "missing_credentials",
            "probe_message": f"{provider['key_env']} is not configured in the Bridge environment.",
        }

    method, request_url, params, json_body = connector_probe_request_options(provider, api_key)
    safe_url_for_probe = request_url
    if not is_safe_url(safe_url_for_probe):
        return {
            **base,
            "probe_ok": False,
            "probe_status": "blocked_unsafe_endpoint",
            "probe_message": "Probe endpoint is not a safe public http(s) URL.",
        }

    try:
        response = await client.request(
            method,
            request_url,
            params=params or None,
            json=json_body,
            headers=connector_probe_headers(provider, api_key),
            timeout=BRIDGE_CONNECTOR_PROBE_TIMEOUT,
        )
        status_code = response.status_code
        if 200 <= status_code < 300:
            probe_status = "online"
            message = "Connector credential accepted by provider probe endpoint."
        elif status_code in {401, 403}:
            probe_status = "auth_failed"
            message = "Provider rejected the configured credential."
        else:
            probe_status = "probe_failed"
            message = f"Provider probe returned HTTP {status_code}."

        return {
            **base,
            "probe_ok": 200 <= status_code < 300,
            "probe_status": probe_status,
            "probe_http_status": status_code,
            "probe_message": message,
        }
    except httpx.TimeoutException:
        return {
            **base,
            "probe_ok": False,
            "probe_status": "timeout",
            "probe_message": "Provider probe timed out.",
        }
    except Exception as exc:
        return {
            **base,
            "probe_ok": False,
            "probe_status": "network_error",
            "probe_message": f"Provider probe failed without exposing credentials ({exc.__class__.__name__}).",
        }

@app.get("/api/connectors/providers")
async def api_connector_provider_status(request: Request, probe: bool = False):
    providers = get_server_connector_provider_status()
    configured = [provider for provider in providers if provider["configured"]]
    probe_results: dict[str, dict] = {}

    if probe:
        client = request.app.state.http_client
        results = await asyncio.gather(
            *[probe_connector_provider_config(provider, client) for provider in SERVER_CONNECTOR_PROVIDER_CONFIGS],
            return_exceptions=True,
        )
        for provider, result in zip(SERVER_CONNECTOR_PROVIDER_CONFIGS, results):
            if isinstance(result, Exception):
                probe_results[provider["id"]] = {
                    "probe_ok": False,
                    "probe_status": "probe_error",
                    "probe_message": str(result),
                    "probe_checked_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                }
            else:
                probe_results[provider["id"]] = result

        safe_probe_fields = {
            "probe_ok",
            "probe_status",
            "probe_http_status",
            "probe_message",
            "probe_checked_at",
            "secret_returned",
        }
        providers = [
            {
                **provider,
                **{key: value for key, value in probe_results.get(provider["id"], {}).items() if key in safe_probe_fields},
            }
            for provider in providers
        ]

    return {
        "providers": providers,
        "configured_count": len(configured),
        "supported_count": len(providers),
        "probe_checked_count": len(probe_results),
        "server_side_only": True,
        "message": "Connector secrets are read from Bridge environment variables and are never returned by this status endpoint.",
    }

@app.get("/api/connectors/probe/{provider_id}")
async def api_connector_provider_probe(provider_id: str, request: Request):
    provider = get_connector_provider_config(provider_id)
    if not provider:
        raise HTTPException(status_code=404, detail="Unknown connector provider")
    return await probe_connector_provider_config(provider, request.app.state.http_client)

def root_path(relative_path: str) -> Path:
    return BASE_DIR.parent / relative_path

def path_exists(relative_path: str) -> bool:
    return root_path(relative_path).exists()

def read_latest_verification_report() -> dict:
    report_path = root_path("scripts/verification_harness/verification_report.json")
    try:
        return json.loads(report_path.read_text(encoding="utf-8")) if report_path.exists() else {}
    except Exception:
        return {}

def feature_status(
    feature_id: str,
    label: str,
    status: str,
    evidence: list[str],
    limitation: str = "",
) -> dict:
    return {
        "id": feature_id,
        "label": label,
        "status": status,
        "evidence": evidence,
        "limitation": limitation,
    }

def repository_status(repo_id: str, label: str, relative_path: str, required_files: list[str]) -> dict:
    present_files = [item for item in required_files if path_exists(str(Path(relative_path) / item))]
    status = "verified" if len(present_files) == len(required_files) else "partial" if path_exists(relative_path) else "missing"
    return {
        "id": repo_id,
        "label": label,
        "path": str(root_path(relative_path)),
        "status": status,
        "required_files": required_files,
        "present_files": present_files,
        "missing_files": [item for item in required_files if item not in present_files],
    }

VERIFICATION_REPORT_STALE_AFTER_SECONDS = 24 * 60 * 60

def build_feature_reality_ledger() -> dict:
    report = read_latest_verification_report()
    services = report.get("services") if isinstance(report.get("services"), dict) else {}
    ui = report.get("ui_verification") if isinstance(report.get("ui_verification"), dict) else {}
    connector_statuses = get_server_connector_provider_status()
    configured_connectors = [provider for provider in connector_statuses if provider.get("configured")]
    configured_models = int((report.get("ai_model_endpoint") or {}).get("configured_count") or 0)
    server_provider_count = int((report.get("ai_model_endpoint") or {}).get("server_provider_count") or 0)
    runtime_partial = report.get("overall_status") == "PARTIAL"

    report_age_seconds = None
    report_timestamp = report.get("timestamp")
    if isinstance(report_timestamp, str):
        try:
            parsed_timestamp = datetime.datetime.fromisoformat(report_timestamp.replace("Z", "+00:00"))
            report_age_seconds = (datetime.datetime.now(datetime.timezone.utc) - parsed_timestamp).total_seconds()
        except ValueError:
            report_age_seconds = None
    report_is_stale = report_age_seconds is None or report_age_seconds > VERIFICATION_REPORT_STALE_AFTER_SECONDS

    def live_checked(status: str) -> str:
        # Downgrade report-derived "verified" claims once the underlying
        # verification_report.json is missing or older than the stale
        # threshold, since verify_system.cjs is a manual, not auto-rerun,
        # script and this ledger must not imply a live re-check happened.
        return "partial" if report_is_stale and status == "verified" else status

    repositories = [
        repository_status("silver-wolf-vi", "Silver Wolf VI root app", ".", [
            "package.json",
            "src/App.tsx",
            "bridge/server.py",
            "scripts/test_integration_contracts.cjs",
        ]),
        repository_status("worldwideview", "WorldWideView source integration", "worldwideview", [
            "package.json",
            "public/logo/logo-icon.svg",
            "public/airplane/scene.gltf",
        ]),
        repository_status("odysseus", "Odysseus companion backend", "odysseus", [
            "pyproject.toml",
            "package.json",
            "docs",
        ]),
    ]

    features = [
        feature_status(
            "chat-loop",
            "Chat input and assistant response loop",
            live_checked("verified" if (report.get("proxy_chat_flow") or {}).get("status") == "success" else "partial"),
            [
                "verification_report.proxy_chat_flow",
                "bridge /chat route",
                "src/hooks/useAIChat.ts",
            ],
            "" if (report.get("proxy_chat_flow") or {}).get("status") == "success" and not report_is_stale else "Latest runtime report has not proven chat flow, or the report is stale (run scripts/verification_harness/verify_system.cjs to re-check).",
        ),
        feature_status(
            "ui-overlap-budget",
            "Workspace foreground overlap budget",
            live_checked("verified" if (ui.get("layout_overlap_check") or {}).get("status") == "success" else "partial"),
            [
                "verification_report.ui_verification.layout_overlap_check",
                "scripts/verification_harness/verify_system.cjs",
            ],
            "" if (ui.get("layout_overlap_check") or {}).get("status") == "success" and not report_is_stale else "Latest runtime report has not proven overlap budget, or the report is stale (run scripts/verification_harness/verify_system.cjs to re-check).",
        ),
        feature_status(
            "globe-imagery",
            "Cesium imagery source ownership",
            "source-backed" if path_exists("src/core/globe/ImageryProviderFactory.ts") and path_exists("src/core/globe/useImageryManager.ts") else "missing",
            [
                "src/core/globe/ImageryProviderFactory.ts",
                "src/core/globe/useImageryManager.ts",
                "scripts/test_integration_contracts.cjs",
            ],
            "Runtime ledger confirms source/contracts; run visual globe QA for live imagery-provider tile health.",
        ),
        feature_status(
            "astronomy-physics",
            "Astronomy math, precession, and orbital runtime contracts",
            "source-backed" if path_exists("src/lib/coordinateTransforms.ts") and path_exists("scripts/test_physics_and_runtime.cjs") else "missing",
            [
                "src/lib/coordinateTransforms.ts",
                "src/hooks/cesium/useConstellations.ts",
                "scripts/test_physics_and_runtime.cjs",
            ],
            "The ledger marks this source-backed because exact apparent sky positions still require external ephemeris validation.",
        ),
        feature_status(
            "cursor-fallback",
            "Native cursor fallback for high-load states",
            "source-backed" if path_exists("src/core/cursor/nativeFallback.ts") and path_exists("src/components/layout/CustomCursor.tsx") else "missing",
            [
                "src/core/cursor/nativeFallback.ts",
                "src/components/layout/CustomCursor.tsx",
                "scripts/test_cursor_engine.cjs",
            ],
            "Runtime responsiveness still depends on device/GPU load.",
        ),
        feature_status(
            "credential-engine",
            "Local credential registry and auth descriptor engine",
            "source-backed" if path_exists("src/lib/credentials/apiCredentialEngine.ts") and path_exists("src/lib/credentials/apiConnectorEngine.ts") else "missing",
            [
                "src/lib/credentials/apiCredentialEngine.ts",
                "src/lib/credentials/apiConnectorEngine.ts",
                "src/components/settings/AiSettings.tsx",
            ],
            "Browser-stored values are local setup handoff only; production secrets belong in the Bridge environment.",
        ),
        feature_status(
            "connector-probes",
            "Redacted server-side connector probes",
            "unconfigured" if len(configured_connectors) == 0 else "partial",
            [
                "/api/connectors/providers?probe=true",
                "/api/connectors/probe/{provider_id}",
                f"{len(connector_statuses)} providers supported",
            ],
            "No live external connector credentials are configured." if len(configured_connectors) == 0 else "Some connectors are configured; probe each provider before claiming live integration.",
        ),
        feature_status(
            "server-ai-provider",
            "Server-side AI provider route",
            "unconfigured" if configured_models == 0 and server_provider_count == 0 else "partial",
            [
                "OPENAI_API_KEY + OPENAI_MODEL",
                "OPENROUTER_API_KEY + OPENROUTER_MODEL",
                "verification mock server-provider route",
            ],
            "No real Odysseus or server-side provider model endpoint is configured." if configured_models == 0 and server_provider_count == 0 else "Provider route exists; verify with real credentials before treating it as live AI.",
        ),
        feature_status(
            "runtime-services",
            "Local Vite, Bridge, Odysseus, and ChromaDB services",
            live_checked("verified" if all((services.get(name) or {}).get("status") == "online" for name in ["vite", "bridge", "odysseus", "chromadb"]) else "partial"),
            [
                "verification_report.services.vite",
                "verification_report.services.bridge",
                "verification_report.services.odysseus",
                "verification_report.services.chromadb",
            ],
            "Service health is local-runtime evidence, not proof of remote deployment readiness." if not report_is_stale else "Service health comes from a stale verification report; run scripts/verification_harness/verify_system.cjs to re-check.",
        ),
    ]

    feature_penalties = {
        "missing": 12,
        "partial": 6,
        "unconfigured": 4,
        "source-backed": 2,
        "verified": 0,
    }
    integration_score = max(0, 100 - sum(feature_penalties.get(item["status"], 6) for item in features))
    if integration_score >= 100:
        integration_score = 99

    return {
        "status": "partial" if runtime_partial or integration_score < 100 else "verified",
        "integration_score": integration_score,
        "generated_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "repositories": repositories,
        "features": features,
        "runtime_report_status": report.get("overall_status") or "missing",
        "partial_reasons": report.get("partial_reasons") or [],
        "not_100_reason": "External model/provider credentials and some live visual/provider checks remain unconfigured or source-backed.",
        "verification_report_timestamp": report_timestamp,
        "verification_report_age_seconds": report_age_seconds,
        "verification_report_stale": report_is_stale,
    }

@app.get("/api/integration/status")
async def api_integration_status():
    return build_feature_reality_ledger()

# --- Local LLM ------------------------------------------------------------
# Registered before the /api/{path:path} catch-all so these are not proxied
# to Odysseus.

@app.get("/api/local/status")
async def api_local_status():
    """Local runtimes, hardware tier, active model, and suggested pulls."""
    if not LOCAL_LLM_AVAILABLE:
        return JSONResponse(
            status_code=503,
            content={
                "available": False,
                "error": LOCAL_LLM_IMPORT_ERROR or "local LLM support not loaded",
            },
        )
    async with httpx.AsyncClient() as client:
        payload = await local_llm.local_status(client)
    payload["available"] = True
    return payload


@app.get("/api/local/recommend")
async def api_local_recommend(require_tools: bool = True):
    """Hardware-tiered model recommendations, independent of what is installed."""
    if not LOCAL_LLM_AVAILABLE:
        return JSONResponse(
            status_code=503,
            content={"error": LOCAL_LLM_IMPORT_ERROR or "local LLM support not loaded"},
        )
    import hardware
    return hardware.recommend_models(require_tools=require_tools)


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
