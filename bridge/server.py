import os
import threading
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Optional
from asyncio import Lock
import anyio
import urllib.request
import urllib.parse
import json
import datetime
import subprocess

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator

MODEL_NAME = os.getenv("HF_MODEL_NAME", "google/gemma-2-27b-it")
HF_TOKEN = os.getenv("HF_TOKEN", "").strip()
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

raw_origins = os.getenv("BRIDGE_CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3005,http://127.0.0.1:3005")
allowed_origins = [origin.strip() for origin in raw_origins.split(",") if origin.strip()]

@asynccontextmanager
async def lifespan(app: FastAPI):
    threading.Thread(target=load_model_worker, daemon=True).start()
    yield

app = FastAPI(title="Silver Wolf Bridge", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

chatbot_pipeline = None
loading_status = "Not Started"

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
    return {
        "status": loading_status,
        "ready": chatbot_pipeline is not None,
        "sync_file": SYNC_FILE.exists(),
        "host": HOST,
    }

def compact_sync_file() -> None:
    if not SYNC_FILE.exists() or SYNC_FILE.stat().st_size <= MAX_SYNC_BYTES:
        return
    content = SYNC_FILE.read_text(encoding="utf-8", errors="replace")
    SYNC_FILE.write_text(content[-MAX_SYNC_BYTES // 2 :], encoding="utf-8")

def load_model_worker() -> None:
    global chatbot_pipeline, loading_status

    if not HF_TOKEN:
        loading_status = "Mock Mode (HF_TOKEN missing)"
        print("HF_TOKEN is not set. Bridge is running in mock mode.")
        return

    try:
        loading_status = "Authenticating..."
        try:
            import torch
            from huggingface_hub import login
            from transformers import AutoModelForCausalLM, AutoTokenizer, pipeline
        except ImportError as exc:
            loading_status = f"Mock Mode (Libraries missing: {exc})"
            print(f"Running in mock mode. Optional model libraries are unavailable: {exc}")
            return

        login(token=HF_TOKEN)
        loading_status = f"Loading {MODEL_NAME}..."
        tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
        if tokenizer.pad_token is None:
            tokenizer.pad_token = tokenizer.eos_token
        model = AutoModelForCausalLM.from_pretrained(
            MODEL_NAME,
            device_map="auto",
            torch_dtype=torch.bfloat16 if torch.cuda.is_available() else torch.float32,
        )
        chatbot_pipeline = pipeline("text-generation", model=model, tokenizer=tokenizer)
        loading_status = "Ready"
        print("Assistant model loaded successfully.")
    except Exception as exc:
        loading_status = f"Error: {exc}"
        print(f"Failed to load model: {exc}")

def compact_and_write_sync(role: str, message: str) -> None:
    compact_sync_file()
    with SYNC_FILE.open("a", encoding="utf-8") as file:
        file.write(f"[{role.upper()}]: {message}\n---\n")

def generate_local_response(prompt: str) -> str:
    response = chatbot_pipeline(prompt, max_new_tokens=500, do_sample=True, temperature=0.7)
    generated_text = response[0]["generated_text"]
    if generated_text.startswith(prompt):
        generated_text = generated_text[len(prompt) :].strip()
    return generated_text

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
    if not chatbot_pipeline:
        return {"response": f"[Local Sync Mode] Received: {req.message[:80]}..."}

    try:
        prompt = f"{req.system_instruction}\n\nUser: {req.message}\nAssistant:" if req.system_instruction else req.message
        generated_text = await anyio.to_thread.run_sync(generate_local_response, prompt)
        return {"response": generated_text}
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Local model failed to respond") from exc

def fetch_url_sync(url: str) -> dict:
    try:
        req = urllib.request.Request(
            url,
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'}
        )
        with urllib.request.urlopen(req, timeout=10) as response:
            raw_data = response.read()
            text = raw_data.decode('utf-8', errors='replace')
            try:
                return {"status": response.status, "response": json.loads(text)}
            except json.JSONDecodeError:
                return {"status": response.status, "response": text}
    except urllib.error.HTTPError as e:
        return {"status": e.code, "error": str(e), "response": ""}
    except Exception as e:
        return {"status": 500, "error": str(e), "response": ""}

@app.get("/api/camera/proxy")
async def proxy_url(url: str):
    result = await anyio.to_thread.run_sync(fetch_url_sync, url)
    if result.get("status") != 200:
        # We still return 200 to the frontend so it can read the internal 'status'
        return result
    return result

@app.get("/git/status")
async def git_status():
    try:
        # Run git status --porcelain to get a machine-readable list of changes
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=HOST, port=PORT)
