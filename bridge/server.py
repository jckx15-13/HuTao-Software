import os
import threading
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator

MODEL_NAME = os.getenv("HF_MODEL_NAME", "google/gemma-2-27b-it")
HF_TOKEN = os.getenv("HF_TOKEN", "").strip()
PORT = int(os.getenv("BRIDGE_PORT", "8001"))
HOST = os.getenv("BRIDGE_HOST", "127.0.0.1")
BASE_DIR = Path(__file__).resolve().parent
SYNC_FILE = BASE_DIR / "latest_sync.txt"
MAX_MESSAGE_CHARS = 8_000
MAX_SYNC_BYTES = 256_000
ALLOWED_ROLES = {"user", "assistant", "ai", "system"}

raw_origins = os.getenv("BRIDGE_CORS_ORIGINS", "*")
allowed_origins = [origin.strip() for origin in raw_origins.split(",") if origin.strip()]

@asynccontextmanager
async def lifespan(app: FastAPI):
    threading.Thread(target=load_model_worker, daemon=True).start()
    yield

app = FastAPI(title="Silver Wolf Bridge", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

chatbot_pipeline = None
loading_status = "Not Started"


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


# Model loading is initialized via the FastAPI lifespan context manager


@app.get("/")
@app.get("/status")
async def get_status():
    return {
        "status": loading_status,
        "ready": chatbot_pipeline is not None,
        "sync_file": SYNC_FILE.exists(),
        "host": HOST,
    }


@app.post("/sync")
async def sync(req: SyncRequest):
    try:
        compact_sync_file()
        with SYNC_FILE.open("a", encoding="utf-8") as file:
            file.write(f"[{req.role.upper()}]: {req.message}\n---\n")
        return {"status": "synced"}
    except OSError as exc:
        raise HTTPException(status_code=500, detail="Unable to write sync file") from exc


@app.post("/chat")
async def chat(req: ChatRequest):
    if not chatbot_pipeline:
        return {"response": f"[Local Sync Mode] Received: {req.message[:80]}..."}

    try:
        prompt = f"{req.system_instruction}\n\nUser: {req.message}\nAssistant:" if req.system_instruction else req.message
        response = chatbot_pipeline(prompt, max_new_tokens=500, do_sample=True, temperature=0.7)
        generated_text = response[0]["generated_text"]
        if generated_text.startswith(prompt):
            generated_text = generated_text[len(prompt) :].strip()
        return {"response": generated_text}
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Local model failed to respond") from exc


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host=HOST, port=PORT)
