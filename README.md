# Silver Wolf VI

A lightweight cyberpunk AI assistant interface with a Google-Earth-style explorer, local bridge support, and local-first settings. The app is optimized for smaller production bundles and avoids persisting secrets in browser storage.

`launch.js` is the local operator entrypoint. It clears the bridge/frontend ports, starts `bridge/server.py`, starts Vite on `127.0.0.1:3000`, writes `launcher.log`, and opens the app in the default browser. Use it for local development startup; production builds are static Vite output plus the optional bridge.

![Silver Wolf VI Preview](./public/favicon.svg)

## Features

- **Holographic UI**: A glassmorphic, 2.5D interface inspired by advanced sci-fi terminals.
- **AI Workspace**: Chat UI with model selection and optional localhost bridge integration.
- **Earth Explorer**: A lazy-loaded, Google-Earth-style educational globe interface without a heavyweight 3D runtime.
- **Dynamic Theming**: Extract beautiful, complementary color palettes directly from uploaded wallpapers using advanced quantization.
- **System Telemetry**: Simulated (but visually striking) system monitors tracking RAM, CPU, Network, and Battery.
- **Performance Focused**: Built with React 19, Vite, and Tailwind v4. Expensive views are lazy-loaded and optional particles run off the main thread.
- **Local First**: Chat history and non-secret preferences are persisted locally in your browser.

## Getting Started

### Prerequisites

- Node.js 20+
- Python 3.10+ if you want to run the optional local bridge

### Installation

1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```

2. Configure optional bridge environment variables:
   ```env
   HF_TOKEN=your_hugging_face_token
   BRIDGE_CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
   ```
   *(See `.env.example` for details).*

3. Start the development server:
   ```bash
   npm run dev
   ```

   Or start the full local stack:
   ```bash
   node launch.js
   ```

## Architecture

- **State Management**: Zustand handles the centralized `uiStore` for themes, messages, and settings.
- **Styling**: Tailwind CSS v4 handles core utilities, heavily extended by a custom CSS variables system (`src/lib/themeEngine.ts`) for dynamic theming.
- **Animations**: CSS transitions keep the interface responsive without shipping a separate animation runtime.
- **Markdown**: A small safe renderer handles common chat formatting without evaluating raw HTML.
- **Bridge Security**: `bridge/server.py` reads `HF_TOKEN`, `BRIDGE_HOST`, `BRIDGE_PORT`, and `BRIDGE_CORS_ORIGINS` from the environment. It defaults to localhost and mock mode when no token is present.

## Self-Diagnostic Healing System Notes

Useful seams for a separate diagnostic/healing service:

- **Launcher health**: watch `launcher.log`, port `3000`, port `8001`, child process exits, and browser-open failures.
- **Frontend health**: check Vite build/typecheck, root app render, local storage availability, worker startup, Cesium/globe initialization, and console errors.
- **Bridge health**: call bridge status/chat endpoints, verify CORS origins, detect missing `HF_TOKEN`, and distinguish mock mode from provider failures.
- **Data health**: validate plugin manifests, GeoJSON imports, `public/borders.geojson`, cache reads/writes, and fetch fallbacks.
- **Recovery actions**: restart only the failed process, clear occupied ports, rebuild static assets, reset corrupt local cache keys, disable a bad plugin, and preserve logs before repair.
- **Report shape**: emit `component`, `symptom`, `evidence`, `severity`, `attempted_fix`, `result`, and `next_manual_step`.

## Building for Production

To create a production-ready bundle:

```bash
node ./node_modules/typescript/bin/tsc --noEmit
node ./node_modules/vite/bin/vite.js build
```

The output will be placed in the `dist` directory, ready to be deployed to any static hosting service (Vercel, Netlify, GitHub Pages, etc.).

## License

MIT
