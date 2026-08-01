"""Hardware probing and local-model recommendation ("cookbook").

Stdlib-only by design: this must import cleanly in the bridge venv without
adding dependencies. Everything degrades to a conservative answer rather than
raising, because a wrong-but-safe recommendation beats a crashed bridge.

The catalog is a curated seed list of Ollama tags. It is not authoritative --
`ollama pull` is. `bridge/local_llm.py` cross-references it against what the
local runtime actually has installed.
"""

from __future__ import annotations

import glob
import os
import platform
import shutil
import subprocess
from typing import Any, Optional

GIB = 1024 ** 3

# --------------------------------------------------------------------------
# Hardware probing
# --------------------------------------------------------------------------


def _run(cmd: list[str], timeout: float = 2.0) -> Optional[str]:
    """Run a probe command, returning stdout or None. Never raises."""
    if not shutil.which(cmd[0]):
        return None
    try:
        out = subprocess.run(
            cmd, capture_output=True, text=True, timeout=timeout, check=False
        )
    except Exception:
        return None
    return out.stdout.strip() if out.returncode == 0 else None


def detect_system_ram_bytes() -> int:
    """Total physical RAM in bytes. 0 when undeterminable."""
    # Linux
    try:
        with open("/proc/meminfo", "r", encoding="utf-8") as fh:
            for line in fh:
                if line.startswith("MemTotal:"):
                    return int(line.split()[1]) * 1024
    except Exception:
        pass

    # macOS / BSD
    raw = _run(["sysctl", "-n", "hw.memsize"])
    if raw and raw.isdigit():
        return int(raw)

    # Windows
    if platform.system() == "Windows":
        try:
            import ctypes

            class _MemStatus(ctypes.Structure):
                _fields_ = [
                    ("dwLength", ctypes.c_ulong),
                    ("dwMemoryLoad", ctypes.c_ulong),
                    ("ullTotalPhys", ctypes.c_ulonglong),
                    ("ullAvailPhys", ctypes.c_ulonglong),
                    ("ullTotalPageFile", ctypes.c_ulonglong),
                    ("ullAvailPageFile", ctypes.c_ulonglong),
                    ("ullTotalVirtual", ctypes.c_ulonglong),
                    ("ullAvailVirtual", ctypes.c_ulonglong),
                    ("ullAvailExtendedVirtual", ctypes.c_ulonglong),
                ]

            status = _MemStatus()
            status.dwLength = ctypes.sizeof(_MemStatus)
            ctypes.windll.kernel32.GlobalMemoryStatusEx(ctypes.byref(status))
            return int(status.ullTotalPhys)
        except Exception:
            pass

    # Last resort: POSIX sysconf
    try:
        return os.sysconf("SC_PAGE_SIZE") * os.sysconf("SC_PHYS_PAGES")
    except Exception:
        return 0


def detect_gpus() -> list[dict[str, Any]]:
    """Discovered accelerators, each with name/vram_bytes/vendor.

    Integrated GPUs report vram_bytes 0 -- they share system RAM, so counting
    their "VRAM" as dedicated budget would double-count and over-recommend.
    """
    gpus: list[dict[str, Any]] = []

    # NVIDIA
    raw = _run(
        ["nvidia-smi", "--query-gpu=name,memory.total", "--format=csv,noheader,nounits"]
    )
    if raw:
        for line in raw.splitlines():
            parts = [p.strip() for p in line.split(",")]
            if len(parts) >= 2 and parts[1].isdigit():
                gpus.append(
                    {
                        "name": parts[0],
                        "vendor": "nvidia",
                        "vram_bytes": int(parts[1]) * 1024 * 1024,
                        "integrated": False,
                    }
                )

    # AMD discrete, via sysfs (works without rocm-smi installed)
    try:
        for path in sorted(glob.glob("/sys/class/drm/card*/device/mem_info_vram_total")):
            with open(path, "r", encoding="utf-8") as fh:
                total = int(fh.read().strip())
            if total > 0:
                gpus.append(
                    {
                        "name": "AMD GPU",
                        "vendor": "amd",
                        "vram_bytes": total,
                        "integrated": False,
                    }
                )
    except Exception:
        pass

    # Apple Silicon: unified memory, so no separate VRAM pool.
    if platform.system() == "Darwin" and platform.machine() == "arm64":
        brand = _run(["sysctl", "-n", "machdep.cpu.brand_string"]) or "Apple Silicon"
        gpus.append(
            {
                "name": brand,
                "vendor": "apple",
                "vram_bytes": 0,
                "integrated": True,
                "unified_memory": True,
            }
        )

    # Integrated fallback (Intel iGPU etc.) so the UI can say *something*.
    if not gpus:
        raw = _run(["lspci"])
        if raw:
            for line in raw.splitlines():
                low = line.lower()
                if "vga compatible controller" in low or " 3d controller" in low:
                    # "0000:00:02.0 VGA compatible controller: Intel Corp ..."
                    # PCI-address colons carry no space, so the first ": "
                    # is always the one separating class from device name.
                    name = line.split(": ", 1)[-1].strip()
                    gpus.append(
                        {
                            "name": name,
                            "vendor": "intel" if "intel" in low else "unknown",
                            "vram_bytes": 0,
                            "integrated": True,
                        }
                    )
                    break

    return gpus


def detect_hardware() -> dict[str, Any]:
    """Full hardware snapshot used for tiering."""
    ram = detect_system_ram_bytes()
    gpus = detect_gpus()
    dedicated_vram = max((g.get("vram_bytes", 0) for g in gpus), default=0)
    unified = any(g.get("unified_memory") for g in gpus)

    # Budget = memory we can realistically give to weights.
    # Dedicated VRAM is the fast path. Without it we fall back to system RAM,
    # reserving headroom for the OS, the browser, and the Cesium globe itself
    # (this app is not the only thing on the machine).
    if dedicated_vram > 0:
        budget = dedicated_vram
        mode = "gpu"
    elif unified:
        budget = int(ram * 0.65)
        mode = "unified"
    else:
        budget = max(0, int(ram * 0.55) - 2 * GIB)
        mode = "cpu"

    return {
        "platform": platform.system(),
        "arch": platform.machine(),
        "cpu_count": os.cpu_count() or 1,
        "ram_bytes": ram,
        "ram_gib": round(ram / GIB, 1),
        "gpus": gpus,
        "dedicated_vram_bytes": dedicated_vram,
        "dedicated_vram_gib": round(dedicated_vram / GIB, 1),
        "inference_mode": mode,
        "model_budget_bytes": budget,
        "model_budget_gib": round(budget / GIB, 1),
    }


# --------------------------------------------------------------------------
# Model catalog
# --------------------------------------------------------------------------

# size_gib is the approximate in-memory footprint of the default quantization
# Ollama ships for that tag (Q4_K_M for most). `tools` marks native
# function-calling support, which the agentic console requires.
MODEL_CATALOG: list[dict[str, Any]] = [
    # --- tier 0: minimal / "worst hardware" -------------------------------
    {"tag": "qwen3:0.6b", "size_gib": 0.5, "tools": True, "tier": 0,
     "note": "Smallest tool-capable model. Runs on almost anything."},
    {"tag": "llama3.2:1b", "size_gib": 1.3, "tools": True, "tier": 0,
     "note": "Very fast, weak reasoning. Good for routing/classification."},
    {"tag": "gemma3:1b", "size_gib": 0.8, "tools": False, "tier": 0,
     "note": "Chat only - no native tool calling."},

    # --- tier 1: low ------------------------------------------------------
    {"tag": "qwen3:1.7b", "size_gib": 1.4, "tools": True, "tier": 1,
     "note": "Best tiny agentic option."},
    {"tag": "llama3.2:3b", "size_gib": 2.0, "tools": True, "tier": 1,
     "note": "Solid general chat at low cost."},
    {"tag": "qwen2.5-coder:1.5b", "size_gib": 1.0, "tools": True, "tier": 1,
     "note": "Code-focused, tiny."},

    # --- tier 2: mid ------------------------------------------------------
    {"tag": "qwen3:4b", "size_gib": 2.6, "tools": True, "tier": 2,
     "note": "Strong reasoning-per-byte. Good default on 8GB."},
    {"tag": "phi4-mini:3.8b", "size_gib": 2.5, "tools": True, "tier": 2,
     "note": "Strong at structured output."},
    {"tag": "gemma3:4b", "size_gib": 3.3, "tools": False, "tier": 2,
     "note": "Multimodal (vision), no tool calling."},

    # --- tier 3: comfortable ---------------------------------------------
    {"tag": "qwen3:8b", "size_gib": 5.2, "tools": True, "tier": 3,
     "note": "Recommended agentic baseline. Tools + thinking."},
    {"tag": "llama3.1:8b", "size_gib": 4.9, "tools": True, "tier": 3,
     "note": "Well-supported, reliable tool calling."},
    {"tag": "qwen2.5-coder:7b", "size_gib": 4.7, "tools": True, "tier": 3,
     "note": "Best small coding model."},

    # --- tier 4: high -----------------------------------------------------
    {"tag": "qwen3:14b", "size_gib": 9.3, "tools": True, "tier": 4,
     "note": "Noticeably better multi-step agentic work."},
    {"tag": "gemma3:12b", "size_gib": 8.1, "tools": False, "tier": 4,
     "note": "Strong chat + vision, no tool calling."},
    {"tag": "qwen2.5-coder:14b", "size_gib": 9.0, "tools": True, "tier": 4,
     "note": "Serious local coding assistant."},

    # --- tier 5: workstation ---------------------------------------------
    {"tag": "qwen3:30b-a3b", "size_gib": 18.6, "tools": True, "tier": 5,
     "note": "MoE - 30B quality at ~3B active cost. Excellent value."},
    {"tag": "mistral-small3.2:24b", "size_gib": 15.0, "tools": True, "tier": 5,
     "note": "Great instruction following."},
    {"tag": "qwen3:32b", "size_gib": 20.0, "tools": True, "tier": 5,
     "note": "Dense 32B. Slower than the MoE, slightly sharper."},

    # --- tier 6: server / "best hardware" --------------------------------
    {"tag": "llama3.3:70b", "size_gib": 43.0, "tools": True, "tier": 6,
     "note": "Frontier-adjacent local quality."},
    {"tag": "deepseek-r1:70b", "size_gib": 43.0, "tools": True, "tier": 6,
     "note": "Reasoning-heavy. Slow but strong."},
    {"tag": "qwen3:235b-a22b", "size_gib": 142.0, "tools": True, "tier": 6,
     "note": "Multi-GPU / large-server only."},
]

TIER_LABELS = {
    0: "minimal",
    1: "low",
    2: "mid",
    3: "comfortable",
    4: "high",
    5: "workstation",
    6: "server",
}


def budget_to_tier(budget_bytes: int) -> int:
    """Map a memory budget to the highest tier that comfortably fits."""
    gib = budget_bytes / GIB
    if gib < 2:
        return 0
    if gib < 4:
        return 1
    if gib < 6:
        return 2
    if gib < 11:
        return 3
    if gib < 22:
        return 4
    if gib < 48:
        return 5
    return 6


def recommend_models(
    hardware: Optional[dict[str, Any]] = None,
    require_tools: bool = True,
) -> dict[str, Any]:
    """Recommend models that actually fit this machine.

    A model "fits" when its footprint leaves ~15% headroom inside the budget;
    running right at the limit means swapping, which is worse than a smaller
    model.
    """
    hw = hardware or detect_hardware()
    budget = hw["model_budget_bytes"]
    tier = budget_to_tier(budget)
    usable = budget * 0.85

    fitting = [
        m for m in MODEL_CATALOG
        if m["size_gib"] * GIB <= usable and (m["tools"] or not require_tools)
    ]
    fitting.sort(key=lambda m: m["size_gib"], reverse=True)

    # Primary = the largest that fits. Fallback = a comfortably smaller one
    # for when the primary is too slow in practice.
    primary = fitting[0] if fitting else None
    fallback = next(
        (m for m in fitting if m["size_gib"] <= (primary["size_gib"] / 2)),
        None,
    ) if primary else None

    return {
        "hardware": hw,
        "tier": tier,
        "tier_label": TIER_LABELS[tier],
        "require_tools": require_tools,
        "primary": primary,
        "fallback": fallback,
        "all_fitting": fitting,
        "too_large": [m for m in MODEL_CATALOG if m["size_gib"] * GIB > usable],
        "advice": _advice(hw, tier, primary),
    }


def _advice(hw: dict[str, Any], tier: int, primary: Optional[dict]) -> list[str]:
    tips: list[str] = []
    mode = hw["inference_mode"]

    if mode == "cpu":
        tips.append(
            "No dedicated GPU detected - inference runs on CPU and will be "
            "token-limited. Prefer models at or below the recommendation; "
            "MoE models (qwen3:30b-a3b) punch far above their speed class."
        )
    elif mode == "unified":
        tips.append(
            "Unified memory detected. Weights share bandwidth with the OS; "
            "close heavy apps before loading large models."
        )
    else:
        tips.append(
            f"Dedicated GPU with {hw['dedicated_vram_gib']} GiB VRAM. Keep the "
            "model fully resident in VRAM - spilling to system RAM costs far "
            "more than dropping a size tier."
        )

    if primary is None:
        tips.append(
            "No catalog model fits the detected budget. Set OLLAMA_MODEL "
            "manually, or pull qwen3:0.6b and accept reduced quality."
        )
    elif not primary["tools"]:
        tips.append(
            "The best-fitting model lacks native tool calling; agentic "
            "features will be degraded. qwen3 tags support tools at every size."
        )

    if tier <= 1:
        tips.append(
            "At this tier, keep the agent loop shallow: single-tool calls and "
            "short context beat multi-step plans."
        )

    return tips
