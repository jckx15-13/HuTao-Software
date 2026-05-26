# Silver Wolf VI

Silver Wolf VI is a local-first cyberpunk AI workspace with a React/Vite frontend, a Python bridge, globe and telescope views, plugin surfaces, and operational launch scripts.

## Quick Start

1. Install dependencies with `npm install`.
2. Start the local stack with `node launch.js` or `npm run dev`.
3. Open the app at `http://127.0.0.1:3000`.
4. Use the bridge only if you need the local Python-backed workflow.

## What This Repo Is

- `src/` contains the active frontend, state, hooks, components, and plugin surfaces.
- `bridge/` contains the local Python bridge used by the launcher.
- `scripts/` contains build, test, and maintenance helpers.
- `docs/manual/` contains the deep operator and developer manual.
- `development_logs/` and `_archive/` contain historical or supporting material.

## What To Read Next

- [Operator and developer manual](docs/manual/Operator-Manual.md)
- `docs/progress.md` for a compact development log
- `bridge/server.py` if you need to understand the local bridge process
- `launch.js` if you need to inspect startup, port cleanup, or browser launch behavior

## Known Current Issues

- `npm run build` currently fails on `scripts/test_app.js:198` with `TS8016`.
- `npm outdated --long` shows the dependency stack is behind current releases.
- The repository still contains a mix of active code, archived code, and experimental surfaces.

## User Guide

- Start from the root README when you want orientation.
- Use the manual when you want operational detail, repair playbooks, and architecture depth.
- Treat the launcher as the fastest way to bring up the local stack on this machine.

## Maintenance Note

This file is intentionally short. The long-form documentation has been moved into `docs/manual/Operator-Manual.md`.
