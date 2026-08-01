#!/usr/bin/env bash
#
# Configure Ollama for low-memory, sequential model loading.
#
# Motivation: on a machine without dedicated VRAM, the default Ollama settings
# will happily load several models at once, allocate a full-size KV cache per
# parallel request, and keep everything resident for 5 minutes. On a 16 GiB
# laptop that means swapping, which presents as "the machine froze" rather
# than "inference is slow".
#
# This script writes a systemd drop-in that makes loading strictly sequential
# and bounds memory per request. It needs sudo because it touches a system
# service; run it yourself and read it first.
#
# Usage:  ./scripts/setup-local-llm.sh          # apply (asks first)
#         ./scripts/setup-local-llm.sh --show   # print settings, change nothing
#
set -euo pipefail

DROPIN_DIR=/etc/systemd/system/ollama.service.d
DROPIN=$DROPIN_DIR/low-memory.conf

# --- tunables -------------------------------------------------------------
# One model resident at a time. Loading a second evicts the first instead of
# stacking both in RAM.
MAX_LOADED_MODELS=1
# One request in flight. Each parallel slot gets its own KV cache, so this is
# the single biggest lever on peak memory.
NUM_PARALLEL=1
# Context length. KV cache grows linearly with this; 4096 is plenty for chat
# and a fraction of the default's footprint.
CONTEXT_LENGTH=4096
# Quantised KV cache (requires flash attention). Roughly halves cache memory.
KV_CACHE_TYPE=q8_0
FLASH_ATTENTION=1
# Release memory sooner than the 5m default.
KEEP_ALIVE=2m

print_settings() {
    cat <<EOF
Ollama low-memory settings
--------------------------
OLLAMA_MAX_LOADED_MODELS = $MAX_LOADED_MODELS   (sequential loading; no stacking)
OLLAMA_NUM_PARALLEL      = $NUM_PARALLEL   (one KV cache, not N)
OLLAMA_CONTEXT_LENGTH    = $CONTEXT_LENGTH
OLLAMA_KV_CACHE_TYPE     = $KV_CACHE_TYPE
OLLAMA_FLASH_ATTENTION   = $FLASH_ATTENTION
OLLAMA_KEEP_ALIVE        = $KEEP_ALIVE

Target file: $DROPIN
EOF
}

if [[ "${1:-}" == "--show" ]]; then
    print_settings
    exit 0
fi

if ! command -v ollama >/dev/null 2>&1; then
    echo "error: ollama is not installed or not on PATH." >&2
    exit 1
fi

print_settings
echo
read -r -p "Write this drop-in and restart ollama? [y/N] " reply
[[ "$reply" =~ ^[Yy]$ ]] || { echo "Aborted; nothing changed."; exit 0; }

sudo mkdir -p "$DROPIN_DIR"
sudo tee "$DROPIN" >/dev/null <<EOF
# Managed by scripts/setup-local-llm.sh - low-memory / sequential loading.
[Service]
Environment="OLLAMA_MAX_LOADED_MODELS=$MAX_LOADED_MODELS"
Environment="OLLAMA_NUM_PARALLEL=$NUM_PARALLEL"
Environment="OLLAMA_CONTEXT_LENGTH=$CONTEXT_LENGTH"
Environment="OLLAMA_KV_CACHE_TYPE=$KV_CACHE_TYPE"
Environment="OLLAMA_FLASH_ATTENTION=$FLASH_ATTENTION"
Environment="OLLAMA_KEEP_ALIVE=$KEEP_ALIVE"
EOF

sudo systemctl daemon-reload
sudo systemctl restart ollama

echo
echo "Applied. Verify with:"
echo "  systemctl show ollama -p Environment"
echo "  curl -s localhost:8001/api/local/status | python3 -m json.tool"
