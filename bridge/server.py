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
from typing import Optional
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

# Generate internal tool token to authenticate with Odysseus
INTERNAL_TOOL_TOKEN = os.getenv("ODYSSEUS_INTERNAL_TOKEN") or secrets.token_hex(32)
odysseus_proc = None

raw_origins = os.getenv("BRIDGE_CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3005,http://127.0.0.1:3005")
allowed_origins = [origin.strip() for origin in raw_origins.split(",") if origin.strip()]

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
        env["ODYSSEUS_ADMIN_PASSWORD"] = "admin_pass_123!"
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
            [py_exec, "-m", "uvicorn", "app:app", "--host", "127.0.0.1", "--port", "7000"],
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
    yield
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

@app.get("/")
@app.get("/status")
async def get_status():
    odysseus_healthy = False
    try:
        async with httpx.AsyncClient(timeout=1.0) as client:
            resp = await client.get("http://127.0.0.1:7000/api/health")
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
async def chat(req: ChatRequest):
    """Proxies the chat call from the frontend to the Odysseus backend chat endpoint."""
    headers = {
        "X-Odysseus-Internal-Token": INTERNAL_TOOL_TOKEN,
        "Content-Type": "application/json"
    }

    async with httpx.AsyncClient(timeout=180.0) as client:
        try:
            # 1. Fetch sessions to find or create one
            sessions_resp = await client.get("http://127.0.0.1:7000/api/sessions", headers=headers)
            sessions = sessions_resp.json() if sessions_resp.status_code == 200 else []

            session_id = None
            if isinstance(sessions, list) and len(sessions) > 0:
                session_id = sessions[0]["id"]
            else:
                # Need to resolve a default model first
                models_resp = await client.get("http://127.0.0.1:7000/api/models", headers=headers)
                models_data = models_resp.json() if models_resp.status_code == 200 else {}

                # Try to extract the first model ID
                model_name = "mock-model"
                endpoint_url = "http://127.0.0.1:7000/api"
                if isinstance(models_data, dict) and "endpoints" in models_data:
                    for ep in models_data["endpoints"]:
                        if ep.get("models"):
                            model_name = ep["models"][0]
                            endpoint_url = ep.get("base_url", endpoint_url)
                            break
                elif isinstance(models_data, list) and len(models_data) > 0:
                    model_name = models_data[0].get("id", model_name)
                    endpoint_url = models_data[0].get("endpoint", endpoint_url)

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
                    raise Exception(f"Failed to create session in Odysseus: {session_create_resp.text}")

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
                return {"response": resp_json.get("response", "No response generated.")}
            else:
                return {"response": f"[Odysseus Error {chat_resp.status_code}] {chat_resp.text}"}

        except Exception as exc:
            print(f"Proxy Chat Error: {exc}")
            return {"response": f"Connection to Odysseus engine failed: {exc}"}

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
async def fetch_url_async(url: str) -> dict:
    if not is_safe_url(url):
        return {"status": 400, "error": "SSRF threat detected: URL accesses disallowed location.", "response": ""}
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url, headers=headers)
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
        def run_git():
            return subprocess.run(
                ["git", "status", "--porcelain"],
                capture_output=True,
                text=True,
                cwd=BASE_DIR.parent
            )

        result = await anyio.to_thread.run_sync(run_git)
        changes = result.stdout.strip().split('\n') if result.stdout.strip() else []
        return {
            "has_changes": len(changes) > 0,
            "change_count": len(changes),
            "changes": changes
        }
    except Exception as e:
        return {"has_changes": False, "error": str(e)}

# Secure Generic Proxy to Odysseus Endpoints
@app.api_route("/api/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def proxy_to_odysseus(path: str, request: Request):
    # Exclude our custom camera proxy
    if path == "camera/proxy":
        url = request.query_params.get("url")
        return await fetch_url_async(url)

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
        client = httpx.AsyncClient(timeout=180.0)
        req_headers = {k: v for k, v in headers.items() if k.lower() != 'content-length'}

        if "chat_stream" in path or "stream" in path:
            async def stream_generator():
                async with client.stream(method, target_url, headers=req_headers, content=body) as response:
                    async for chunk in response.aiter_bytes():
                        yield chunk
                await client.aclose()
            return StreamingResponse(stream_generator(), media_type="text/event-stream")
        else:
            response = await client.request(method, target_url, headers=req_headers, content=body)
            resp = Response(
                content=response.content,
                status_code=response.status_code,
                headers=dict(response.headers)
            )
            await client.aclose()
            return resp
    except Exception as e:
        return JSONResponse(status_code=502, content={"error": f"Odysseus backend unreachable: {e}"})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=HOST, port=PORT)
