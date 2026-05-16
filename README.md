# Silver Wolf VI

A stunning, cyberpunk-themed AI assistant interface powered by the Gemini API. Designed with a holographic aesthetic, advanced motion physics, and local-first architecture.

![Silver Wolf VI Preview](./public/favicon.svg)

## Features

- **Holographic UI**: A glassmorphic, 2.5D interface inspired by advanced sci-fi terminals.
- **Gemini Powered**: Full multi-turn conversational AI integration with Google's Gemini models (2.5 Flash, 2.5 Pro, 2.0 Flash).
- **Dynamic Theming**: Extract beautiful, complementary color palettes directly from uploaded wallpapers using advanced quantization.
- **Physics Engine**: The settings panel features fluid, mass-spring-damper physics that react to your drag velocity with skew and rotation.
- **System Telemetry**: Simulated (but visually striking) system monitors tracking RAM, CPU, Network, and Battery.
- **Performance Focused**: Built with React 19, Vite, and Tailwind v4. Uses Web Workers for off-main-thread particle simulation.
- **Local First**: All chat history and user settings are persisted locally in your browser.

## Getting Started

### Prerequisites

- Node.js 20+
- A Google Gemini API Key

### Installation

1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```

2. Configure your environment variables:
   Create a `.env.local` file in the root directory and add your Gemini API key:
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```
   *(See `.env.example` for details).*

3. Start the development server:
   ```bash
   npm run dev
   ```

## Architecture

- **State Management**: Zustand handles the centralized `uiStore` for themes, messages, and settings.
- **Styling**: Tailwind CSS v4 handles core utilities, heavily extended by a custom CSS variables system (`src/lib/themeEngine.ts`) for dynamic theming.
- **Animations**: `motion/react` drives the fluid transitions and draggable 2.5D panels.
- **Markdown**: `react-markdown` with `remark-gfm` renders the AI's responses with proper code highlighting and table support.

## Building for Production

To create a production-ready bundle:

```bash
npm run build
```

The output will be placed in the `dist` directory, ready to be deployed to any static hosting service (Vercel, Netlify, GitHub Pages, etc.).

## License

MIT
