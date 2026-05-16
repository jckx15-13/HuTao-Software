import os
import torch
import threading
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from transformers import pipeline, AutoModelForCausalLM, AutoTokenizer
from huggingface_hub import login

# Configuration
HF_TOKEN = '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'
MODEL_NAME = "google/gemma-2-27b-it"
SYNC_FILE = "latest_sync.txt"
PORT = 8001

app = FastAPI(title="Silver Wolf Unified Bridge")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

# Global state
chatbot_pipeline = None
loading_status = "Not Started"

class SyncRequest(BaseModel):
    message: str
    role: str

class ChatRequest(BaseModel):
    message: str
    system_instruction: str = ""

def load_model_worker():
    global chatbot_pipeline, loading_status
    try:
        loading_status = "Authenticating..."
        login(token=HF_TOKEN)
        loading_status = f"Loading {MODEL_NAME}..."
        tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
        if tokenizer.pad_token is None: tokenizer.pad_token = tokenizer.eos_token
        model = AutoModelForCausalLM.from_pretrained(
            MODEL_NAME, 
            device_map="auto", 
            torch_dtype=torch.bfloat16 if torch.cuda.is_available() else torch.float32
        )
        chatbot_pipeline = pipeline("text-generation", model=model, tokenizer=tokenizer)
        loading_status = "Ready"
        print("Assistant Model Loaded Successfully!")
    except Exception as e:
        loading_status = f"Error: {str(e)}"
        print(f"Failed to load model: {e}")

@app.on_event("startup")
async def startup_event():
    threading.Thread(target=load_model_worker, daemon=True).start()

@app.get("/")
@app.get("/status")
async def get_status():
    return {"status": loading_status, "ready": chatbot_pipeline is not None, "sync_file": os.path.exists(SYNC_FILE)}

@app.post("/sync")
async def sync(req: SyncRequest):
    try:
        with open(SYNC_FILE, "a", encoding="utf-8") as f:
            f.write(f"[{req.role.upper()}]: {req.message}\n---\n")
        return {"status": "synced"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat")
async def chat(req: ChatRequest):
    if not chatbot_pipeline:
        # Fallback for sync testing if model isn't ready
        return {"response": f"[Local Sync Mode] Received: {req.message[:50]}..."}
    
    try:
        prompt = f"{req.system_instruction}\n\nUser: {req.message}\nAssistant:" if req.system_instruction else req.message
        response = chatbot_pipeline(prompt, max_new_tokens=500, do_sample=True, temperature=0.7)
        generated_text = response[0]['generated_text']
        if generated_text.startswith(prompt): generated_text = generated_text[len(prompt):].strip()
        return {"response": generated_text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=PORT)
