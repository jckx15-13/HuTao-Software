# Silver Wolf VI — Qt Quick client

A Qt Quick + C++ clone of the Silver Wolf VI assistant shell.

The React SPA talks to the Python FastAPI bridge on `127.0.0.1:8001`, which in
turn routes to a local runtime. **This client skips the bridge** and speaks the
OpenAI-compatible `/v1/chat/completions` API directly, matching the contract in
[`docs/LOCAL_LLM.md`](../docs/LOCAL_LLM.md) and
[`bridge/local_llm.py`](../bridge/local_llm.py):

- keyless — local runtimes need no `Authorization` header
- `OLLAMA_BASE_URL` defaults to `http://127.0.0.1:11434`
- `OLLAMA_MODEL`, when set, is trusted even if absent from `/api/tags`
- otherwise the model is chosen from what is actually installed, preferring
  tool-capable models that fit the hardware budget

This is a **compiling skeleton**, not a finished app: chat streaming, the
hardware readout, and the guarded process runner all work, but there is no
tool-call loop, no persistence, and no settings UI.

## Requirements

Qt 6.5+ (developed and verified against **Qt 6.11.1**) with the `Core`, `Gui`,
`Qml`, `Quick`, `QuickControls2` and `Network` modules, CMake 3.21+, and a
C++17 compiler.

On Arch: `pacman -S qt6-base qt6-declarative cmake`.

## Build and run

```bash
cd qt-client
cmake -B build -S .
cmake --build build
./build/silverwolf-qt
```

Point it at a different runtime or pin a model with the same environment
variables the bridge uses:

```bash
OLLAMA_BASE_URL=http://127.0.0.1:11434 OLLAMA_MODEL=qwen3:1.7b ./build/silverwolf-qt
```

LM Studio (`:1234`) and llama.cpp (`:8080`) expose the same endpoint, so
setting `OLLAMA_BASE_URL` to their address works — only the `/api/tags` model
discovery is Ollama-specific, and it degrades to "no runtime reachable"
rather than failing.

Headless smoke test:

```bash
QT_QPA_PLATFORM=offscreen ./build/silverwolf-qt
```

## Layout

| Path | Role |
|---|---|
| `src/OllamaClient.{h,cpp}` | Streaming chat client (SSE over `QNetworkReply`) |
| `src/HardwareMonitor.{h,cpp}` | RAM/CPU probe and model memory budget |
| `src/ProcessRunner.{h,cpp}` | Allowlisted `QProcess` wrapper for tool-calls |
| `src/main.cpp` | `QGuiApplication` + `QQmlApplicationEngine` bootstrap |
| `qml/Main.qml` | Chat `ListView`, input field, hardware readout |

All three C++ types are exposed to QML via `QML_ELEMENT` under the `SilverWolf`
module and are instantiated declaratively in `Main.qml`.

### OllamaClient

`sendMessage(text)` POSTs with `"stream": true` and parses the SSE `data:`
frames incrementally in `readyRead`, emitting:

- `tokenReceived(QString)` — a `choices[0].delta.content` fragment
- `reasoningReceived(QString)` — a `delta.reasoning` fragment. Thinking models
  (**every `qwen3` tag**, `deepseek-r1`) stream their chain of thought here with
  `content` empty, so a content-only UI sits silent for the whole thinking
  phase. It is shown as a transient status line and is *not* added to history.
- `responseFinished()` / `errorOccurred(QString)`

A response chunk can end mid-line, so the tail after the last `\n` is buffered
across `readyRead` calls. Malformed frames are skipped rather than aborting a
live stream, and in-band `{"error": ...}` bodies (which some runtimes send with
HTTP 200) are surfaced through `errorOccurred`.

The transfer timeout is disabled for completions on purpose: CPU inference is
slow, and `BRIDGE_CHAT_TIMEOUT` defaults to 300 s in the Python bridge for the
same reason.

### HardwareMonitor

Reads `/proc/meminfo` (`MemTotal`, `MemAvailable`) and mirrors
`detect_hardware()` in `bridge/hardware.py`:

| Situation | Budget |
|---|---|
| Dedicated GPU | full VRAM |
| Unified memory (Apple Silicon) | 65% of RAM |
| CPU only | **55% of RAM − 2 GiB** |

The CPU-only reservation is deliberate — it assumes the machine is not idle.
`tierLabel` uses the same thresholds as `budget_to_tier()`. Discrete AMD VRAM
comes from `/sys/class/drm/card*/device/mem_info_vram_total`; NVIDIA detection
would need an `nvidia-smi` subprocess and is left out so the probe stays
non-blocking.

### ProcessRunner — security note

**The allowlist in `ProcessRunner.cpp` is the security boundary.** A local model
can be prompt-injected by anything it reads, so every `(program, arguments)`
pair reaching `run()` is treated as attacker-controlled, and the check is
enforced in C++ — never in the prompt and never in QML.

What makes the allowlist meaningful:

1. **No shell.** Arguments go to `execve(2)` as a `QStringList`. There is never
   a single command string, so `;`, `|`, `&&`, backticks, `$(...)` and globs are
   inert literal characters. Do not add a one-string `QProcess::start()`
   overload and do not run `sh -c`.
2. **Basenames only.** A program containing `/` or `\` is rejected, so
   `./ls` and `/tmp/ls` cannot masquerade as `ls`; the real binary is resolved
   through `QStandardPaths::findExecutable()`.
3. **One at a time, with a timeout.** A single in-flight process, killed after
   `timeoutMs` (default 15 s).
4. **No inherited shell state.** stdin is closed; stdout/stderr are captured
   separately and capped at 1 MiB each.

Adding an entry grants the model everything that binary can do, *including
anything it can be argued into doing*. `find -exec`, `git -c core.pager=…`,
`awk 'BEGIN{system(…)}'` and any interpreter (`sh`, `python`, `node`, `perl`)
are shell escapes wearing a different name. The default list is intentionally
read-only and boring: `ls cat head tail wc grep rg date uname uptime df free
nproc`. Never wire `allowProgram()` to model output.

## Not implemented

- The agentic tool-call loop (parsing `tool_calls` from the stream and feeding
  `ProcessRunner` results back as `role: "tool"` messages). `ProcessRunner` is
  ready; nothing calls it from `OllamaClient` yet.
- The `/api/local/status` and `/api/local/recommend` equivalents, and the model
  catalog from `bridge/hardware.py`.
- Conversation persistence, cloud provider fallback, and the Cesium globe.
