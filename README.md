# Silver Wolf VI

A lightweight cyberpunk AI assistant interface with a Google-Earth-style explorer, local bridge support, and local-first settings. The app is optimized for smaller production bundles and avoids persisting secrets in browser storage.

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

## Architecture

- **State Management**: Zustand handles the centralized `uiStore` for themes, messages, and settings.
- **Styling**: Tailwind CSS v4 handles core utilities, heavily extended by a custom CSS variables system (`src/lib/themeEngine.ts`) for dynamic theming.
- **Animations**: CSS transitions keep the interface responsive without shipping a separate animation runtime.
- **Markdown**: A small safe renderer handles common chat formatting without evaluating raw HTML.
- **Bridge Security**: `bridge/server.py` reads `HF_TOKEN`, `BRIDGE_HOST`, `BRIDGE_PORT`, and `BRIDGE_CORS_ORIGINS` from the environment. It defaults to localhost and mock mode when no token is present.

## Building for Production

To create a production-ready bundle:

```bash
node ./node_modules/typescript/bin/tsc --noEmit
node ./node_modules/vite/bin/vite.js build
```

The output will be placed in the `dist` directory, ready to be deployed to any static hosting service (Vercel, Netlify, GitHub Pages, etc.).

## License

MIT
