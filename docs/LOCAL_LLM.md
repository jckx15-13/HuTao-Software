# Running local LLMs

Silver Wolf VI can run entirely on local hardware. The bridge speaks to
Ollama, LM Studio and llama.cpp through their OpenAI-compatible
`/v1/chat/completions` endpoints, so no API key and no cloud account are
required.

## Quick start

```bash
# 1. Install and start a runtime (Ollama shown)
ollama serve            # usually already running as a systemd service

# 2. Pull a model sized for your machine (see "Picking a model")
ollama pull qwen3:1.7b

# 3. Start the bridge
cd bridge && ./venv/bin/python3 server.py

# 4. Confirm it resolved a local model
curl -s localhost:8001/api/local/status | python3 -m json.tool
```

A successful chat returns `"mode": "local-runtime"`:

```bash
curl -s -X POST localhost:8001/chat -H 'Content-Type: application/json' -d '{"message":"hello"}'
```

## How selection works

`bridge/local_llm.py` resolves a model in this order:

1. **Explicit override** — `OLLAMA_MODEL` (or `LMSTUDIO_MODEL`,
   `LLAMACPP_MODEL`). Trusted even if absent from the runtime's listing.
2. **Best installed model that fits** — prefers tool-capable models, then the
   largest one inside the hardware budget.
3. **Any installed model** — degraded chat beats no chat, but the status
   string says so (e.g. `[no tool calling]`, `[exceeds 6.4 GiB budget]`).

It never selects a model that is not actually pulled. A 404 from the runtime
is a worse failure than a smaller model.

Local runtimes are preferred over cloud providers by default. Set
`BRIDGE_PREFER_LOCAL=0` to put configured cloud keys first and use local only
as a fallback.

## Picking a model

`bridge/hardware.py` probes RAM and VRAM and computes a **budget** — the
memory that can realistically hold weights:

| Situation | Budget |
|---|---|
| Dedicated GPU | full VRAM |
| Unified memory (Apple Silicon) | 65% of RAM |
| CPU only | 55% of RAM, minus 2 GiB for OS/browser |

The globe and browser are not free — the CPU-only formula deliberately
reserves headroom rather than assuming the machine is idle.

Ask the bridge what fits:

```bash
curl -s localhost:8001/api/local/recommend | python3 -m json.tool
```

Rough tiers (Q4 quantisation; tool-capable picks in **bold**):

| Budget | Tier | Good choices |
|---|---|---|
| < 2 GiB | minimal | **qwen3:0.6b**, **llama3.2:1b** |
| 2–4 GiB | low | **qwen3:1.7b**, **llama3.2:3b** |
| 4–6 GiB | mid | **qwen3:4b**, **phi4-mini:3.8b** |
| 6–11 GiB | comfortable | **qwen3:8b**, **llama3.1:8b** |
| 11–22 GiB | high | **qwen3:14b**, **qwen2.5-coder:14b** |
| 22–48 GiB | workstation | **qwen3:30b-a3b** (MoE), **mistral-small3.2:24b** |
| 48 GiB+ | server | **llama3.3:70b**, **deepseek-r1:70b** |

Notes:

- **Agentic features need tool calling.** Every `qwen3` tag supports it at
  every size; `gemma3` tags do not.
- **MoE models are the value pick on slow hardware.** `qwen3:30b-a3b` has
  30B-class quality at roughly 3B active compute cost.
- The catalog is a curated seed list, not an authority. `ollama pull` is.

## Low memory / avoiding a frozen machine

Default Ollama settings will load several models at once and allocate a full
KV cache per parallel request. On a laptop without dedicated VRAM this causes
swapping, which feels like a hang rather than slowness.

```bash
./scripts/setup-local-llm.sh --show   # review
./scripts/setup-local-llm.sh          # apply (asks before writing, uses sudo)
```

It sets:

| Setting | Value | Why |
|---|---|---|
| `OLLAMA_MAX_LOADED_MODELS` | 1 | Sequential loading — a second model evicts the first instead of stacking |
| `OLLAMA_NUM_PARALLEL` | 1 | One KV cache instead of N; the biggest lever on peak memory |
| `OLLAMA_CONTEXT_LENGTH` | 4096 | KV cache grows linearly with context |
| `OLLAMA_KV_CACHE_TYPE` | q8_0 | Roughly halves cache memory |
| `OLLAMA_FLASH_ATTENTION` | 1 | Required for a quantised KV cache |
| `OLLAMA_KEEP_ALIVE` | 2m | Frees memory sooner than the 5m default |

If a model still thrashes, drop a tier. The status string warns when the
selected model exceeds the budget.

## Environment variables

| Variable | Default | Purpose |
|---|---|---|
| `BRIDGE_PREFER_LOCAL` | `1` | Local runtimes before cloud providers |
| `BRIDGE_CHAT_TIMEOUT` | `300` | Chat timeout, seconds. CPU inference is slow |
| `BRIDGE_LOCAL_PROBE_TIMEOUT` | `1.5` | Runtime discovery timeout |
| `OLLAMA_BASE_URL` | `http://127.0.0.1:11434` | |
| `OLLAMA_MODEL` | *(auto)* | Pin a specific model |
| `LMSTUDIO_BASE_URL` | `http://127.0.0.1:1234` | |
| `LLAMACPP_BASE_URL` | `http://127.0.0.1:8080` | |

## Endpoints

| Endpoint | Returns |
|---|---|
| `GET /api/local/status` | Runtimes, installed models, hardware, active selection, suggested pulls |
| `GET /api/local/recommend` | Hardware-tiered recommendations, independent of what is installed |
| `POST /chat` | Chat completion; `mode: "local-runtime"` when served locally |

## Troubleshooting

**`mode` is `local-fallback` instead of `local-runtime`** — no runtime was
reachable. Check `curl localhost:11434/api/tags`.

**Chat times out** — the model likely exceeds the budget and is swapping.
Look for an `exceeds N GiB budget` warning in `active.status` from
`/api/local/status`, and drop a tier.

**Tools/agentic features do nothing** — the selected model has no native tool
calling. Check the `tools` flag in `/api/local/status`; switch to a `qwen3`
tag.
