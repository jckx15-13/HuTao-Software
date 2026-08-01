"""Local LLM runtime discovery and selection.

Ollama, LM Studio and llama.cpp all expose an OpenAI-compatible
`/v1/chat/completions`, so the bridge can treat them exactly like the cloud
providers in `server.py` -- the only differences are that they need no API key
and that we can enumerate installed models before picking one.

Design notes:
  * Keyless. `resolve_local_endpoint()` returns headers={} deliberately.
  * Preferred over cloud providers by default (BRIDGE_PREFER_LOCAL=0 to flip),
    because the point of this integration is local-first operation.
  * Model choice is: explicit env override > largest installed model that fits
    the hardware budget > whatever is installed. Never picks a model that is
    not actually pulled -- a 404 from the runtime is a worse failure than a
    smaller model.
"""

from __future__ import annotations

import os
from typing import Any, Optional

import httpx

from hardware import GIB, MODEL_CATALOG, detect_hardware, recommend_models

# Runtimes we know how to talk to. `native_models_path` is a richer listing
# endpoint where one exists, otherwise we fall back to /v1/models.
LOCAL_RUNTIMES: list[dict[str, Any]] = [
    {
        "id": "ollama",
        "label": "Ollama",
        "base_env": "OLLAMA_BASE_URL",
        "model_env": "OLLAMA_MODEL",
        "default_base": "http://127.0.0.1:11434",
        "native_models_path": "/api/tags",
        "openai_path": "/v1/chat/completions",
    },
    {
        "id": "lmstudio",
        "label": "LM Studio",
        "base_env": "LMSTUDIO_BASE_URL",
        "model_env": "LMSTUDIO_MODEL",
        "default_base": "http://127.0.0.1:1234",
        "native_models_path": None,
        "openai_path": "/v1/chat/completions",
    },
    {
        "id": "llamacpp",
        "label": "llama.cpp server",
        "base_env": "LLAMACPP_BASE_URL",
        "model_env": "LLAMACPP_MODEL",
        "default_base": "http://127.0.0.1:8080",
        "native_models_path": None,
        "openai_path": "/v1/chat/completions",
    },
]

PROBE_TIMEOUT = float(os.getenv("BRIDGE_LOCAL_PROBE_TIMEOUT", "1.5"))


def prefer_local() -> bool:
    return os.getenv("BRIDGE_PREFER_LOCAL", "1").strip().lower() not in {
        "0", "false", "no", "off",
    }


def runtime_base_url(runtime: dict[str, Any]) -> str:
    configured = os.getenv(runtime["base_env"], "").strip().rstrip("/")
    return configured or runtime["default_base"]


def _catalog_entry(tag: str) -> Optional[dict[str, Any]]:
    """Catalog metadata for an installed tag, tolerating the ':latest' suffix."""
    base = tag.split(":")[0]
    for entry in MODEL_CATALOG:
        if entry["tag"] == tag or entry["tag"].split(":")[0] == base:
            return entry
    return None


async def list_runtime_models(
    client: httpx.AsyncClient, runtime: dict[str, Any]
) -> list[dict[str, Any]]:
    """Models installed in one runtime. Empty list when it is not running."""
    base = runtime_base_url(runtime)
    models: list[dict[str, Any]] = []

    if runtime["native_models_path"]:
        try:
            resp = await client.get(
                f"{base}{runtime['native_models_path']}", timeout=PROBE_TIMEOUT
            )
            if resp.status_code == 200:
                for item in (resp.json() or {}).get("models") or []:
                    if not isinstance(item, dict):
                        continue
                    name = str(item.get("name") or item.get("model") or "").strip()
                    if not name:
                        continue
                    caps = item.get("capabilities") or []
                    details = item.get("details") or {}
                    size = int(item.get("size") or 0)
                    models.append(
                        {
                            "id": name,
                            "size_bytes": size,
                            "size_gib": round(size / GIB, 2),
                            "quantization": details.get("quantization_level"),
                            "parameter_size": details.get("parameter_size"),
                            # Ollama reports capabilities directly; trust it over
                            # our catalog, and only fall back when absent.
                            "tools": (
                                "tools" in caps
                                if caps
                                else bool((_catalog_entry(name) or {}).get("tools"))
                            ),
                            "thinking": "thinking" in caps,
                            "vision": "vision" in caps,
                        }
                    )
                return models
        except Exception:
            return []

    # Generic OpenAI-compatible listing.
    try:
        resp = await client.get(f"{base}/v1/models", timeout=PROBE_TIMEOUT)
        if resp.status_code == 200:
            for item in (resp.json() or {}).get("data") or []:
                if not isinstance(item, dict):
                    continue
                name = str(item.get("id") or "").strip()
                if name:
                    models.append(
                        {
                            "id": name,
                            "size_bytes": 0,
                            "size_gib": 0.0,
                            "quantization": None,
                            "parameter_size": None,
                            "tools": bool((_catalog_entry(name) or {}).get("tools")),
                            "thinking": False,
                            "vision": False,
                        }
                    )
    except Exception:
        return []

    return models


async def discover_local_runtimes(client: httpx.AsyncClient) -> list[dict[str, Any]]:
    """Status of every known local runtime, running or not."""
    found: list[dict[str, Any]] = []
    for runtime in LOCAL_RUNTIMES:
        base = runtime_base_url(runtime)
        models = await list_runtime_models(client, runtime)
        found.append(
            {
                "id": runtime["id"],
                "label": runtime["label"],
                "base_url": base,
                "chat_url": f"{base}{runtime['openai_path']}",
                "available": bool(models),
                "model_count": len(models),
                "models": models,
                "model_env": runtime["model_env"],
                "base_env": runtime["base_env"],
            }
        )
    return found


def select_model(
    models: list[dict[str, Any]],
    require_tools: bool = True,
    budget_bytes: Optional[int] = None,
) -> Optional[dict[str, Any]]:
    """Pick the best installed model for this hardware.

    Prefers tool-capable models (agentic features need them), then the largest
    that still fits the memory budget. Falls back to any installed model rather
    than returning nothing -- degraded chat beats no chat.
    """
    if not models:
        return None

    budget = (
        budget_bytes
        if budget_bytes is not None
        else detect_hardware()["model_budget_bytes"]
    )
    usable = budget * 0.85

    def fits(m: dict[str, Any]) -> bool:
        # size 0 means "unknown" (generic OpenAI listing) - don't exclude it.
        return m["size_bytes"] == 0 or m["size_bytes"] <= usable

    pools: list[list[dict[str, Any]]] = []
    if require_tools:
        pools.append([m for m in models if m["tools"] and fits(m)])
    pools.append([m for m in models if fits(m)])
    if require_tools:
        pools.append([m for m in models if m["tools"]])
    pools.append(list(models))

    for pool in pools:
        if pool:
            return max(pool, key=lambda m: m["size_bytes"])
    return None


async def resolve_local_endpoint(
    client: httpx.AsyncClient,
) -> tuple[Optional[str], Optional[str], str, dict]:
    """Resolve (model, chat_url, status, headers) for a local runtime.

    Mirrors the signature of `resolve_server_provider_endpoint()` in server.py
    so the two are interchangeable in the chat resolution chain.
    """
    budget = detect_hardware()["model_budget_bytes"]

    for runtime in LOCAL_RUNTIMES:
        base = runtime_base_url(runtime)
        chat_url = f"{base}{runtime['openai_path']}"
        override = os.getenv(runtime["model_env"], "").strip()

        models = await list_runtime_models(client, runtime)
        if not models:
            continue

        if override:
            # Trust an explicit override even if absent from the listing: the
            # user may have pulled it out-of-band.
            return (
                override,
                chat_url,
                f"local {runtime['label']} endpoint "
                f"(model pinned via {runtime['model_env']})",
                {},
            )

        chosen = select_model(models, require_tools=True, budget_bytes=budget)
        if chosen:
            notes = []
            if not chosen["tools"]:
                notes.append("no tool calling")
            # select_model falls back past the budget when nothing fits, so say
            # so plainly -- an over-budget model swaps and feels broken.
            if chosen["size_bytes"] > budget * 0.85:
                notes.append(
                    f"exceeds {round(budget / GIB, 1)} GiB budget - expect swapping"
                )
            suffix = f" [{'; '.join(notes)}]" if notes else ""
            return (
                chosen["id"],
                chat_url,
                f"local {runtime['label']} endpoint{suffix}",
                {},
            )

    return None, None, "no local LLM runtime reachable", {}


async def local_status(client: httpx.AsyncClient) -> dict[str, Any]:
    """Everything the UI needs: runtimes, hardware, and recommendations."""
    runtimes = await discover_local_runtimes(client)
    rec = recommend_models()
    installed = {m["id"] for rt in runtimes for m in rt["models"]}
    installed_bases = {i.split(":")[0] for i in installed}

    # Which recommended models are not yet pulled -> actionable `ollama pull`.
    missing = [
        m for m in rec["all_fitting"]
        if m["tag"] not in installed and m["tag"].split(":")[0] not in installed_bases
    ]

    active_model, active_url, active_status, _ = await resolve_local_endpoint(client)

    return {
        "prefer_local": prefer_local(),
        "runtimes": runtimes,
        "any_available": any(rt["available"] for rt in runtimes),
        "hardware": rec["hardware"],
        "tier": rec["tier"],
        "tier_label": rec["tier_label"],
        "recommended": rec["primary"],
        "recommended_fallback": rec["fallback"],
        "advice": rec["advice"],
        "installed_models": sorted(installed),
        "suggested_pulls": [
            {
                "tag": m["tag"],
                "size_gib": m["size_gib"],
                "note": m["note"],
                "command": f"ollama pull {m['tag']}",
            }
            for m in missing[:5]
        ],
        "active": {
            "model": active_model,
            "endpoint": active_url,
            "status": active_status,
        },
    }
