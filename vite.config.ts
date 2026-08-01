import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import cesium from 'vite-plugin-cesium';

// Defers the Cesium global bundle until after first paint.
// Matches whatever src vite-plugin-cesium emitted so this keeps working when
// `base` is not '/' (e.g. the GitHub Pages build injects `/HuTao-Software/cesium/Cesium.js`).
function asyncCesiumGlobalScript() {
  return {
    name: 'silver-wolf-async-cesium-global-script',
    enforce: 'post' as const,
    transformIndexHtml(html: string) {
      return html.replace(
        /<script src="([^"]*\/cesium\/Cesium\.js)"><\/script>/,
        (_match: string, src: string) => `<script>
window.addEventListener('load', function loadCesiumGlobalAfterFirstPaint() {
  var script = document.createElement('script');
  script.async = true;
  script.src = ${JSON.stringify(src)};
  document.head.appendChild(script);
}, { once: true });
</script>`
      );
    }
  };
}

// vite-plugin-cesium copies its runtime assets to `path.join(outDir, CESIUM_BASE_URL)`,
// and CESIUM_BASE_URL already has `base` baked in. With base '/HuTao-Software/' that
// lands the files in dist/HuTao-Software/cesium/, but GitHub Pages serves dist/ *as*
// /HuTao-Software/, so the app would request /HuTao-Software/cesium/* and 404.
// Relocate the tree back to dist/cesium/ so the emitted URLs resolve.
function flattenCesiumAssetDir(base: string) {
  let outDir = 'dist';
  return {
    name: 'silver-wolf-flatten-cesium-asset-dir',
    enforce: 'post' as const,
    configResolved(resolved: { build: { outDir: string } }) {
      outDir = resolved.build.outDir;
    },
    closeBundle: {
      sequential: true,
      order: 'post' as const,
      async handler() {
        if (base === '/' || base === './') return;

        const nested = path.resolve(outDir, `.${base}`, 'cesium');
        const target = path.resolve(outDir, 'cesium');
        if (nested === target || !fs.existsSync(nested)) return;

        await fs.promises.cp(nested, target, { recursive: true, force: true });
        await fs.promises.rm(nested, { recursive: true, force: true });

        // Drop the now-empty base directory shell (e.g. dist/HuTao-Software/).
        const baseDir = path.resolve(outDir, `.${base}`);
        if (baseDir !== path.resolve(outDir) && fs.existsSync(baseDir)) {
          if ((await fs.promises.readdir(baseDir)).length === 0) {
            await fs.promises.rm(baseDir, { recursive: true, force: true });
          }
        }
      }
    }
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  // GitHub Pages serves this repo from https://jckx15-13.github.io/HuTao-Software/,
  // so assets must be requested under that sub-path. Local dev (port 3005) is
  // untouched because GITHUB_PAGES is only set by the deploy workflow.
  const isGithubPages = process.env.GITHUB_PAGES === 'true';
  const base = isGithubPages ? '/HuTao-Software/' : '/';

  // The 127.0.0.1:8001 FastAPI bridge cannot exist on a static host. Default the
  // Pages build to the "off" sentinel so the app boots straight into static/demo
  // mode instead of retrying a bridge that is never coming up. An explicit
  // VITE_BRIDGE_URL still wins if someone wants to point Pages at a real bridge.
  const bridgeUrl = env.VITE_BRIDGE_URL || (isGithubPages ? 'off' : '');

  return {
    base,
    plugins: [react(), tailwindcss(), cesium(), asyncCesiumGlobalScript(), flattenCesiumAssetDir(base)],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      __SILVER_WOLF_BRIDGE_URL__: JSON.stringify(bridgeUrl),
      __SILVER_WOLF_ODYSSEUS_CORE_URL__: JSON.stringify(env.VITE_ODYSSEUS_CORE_URL || ''),
      // src/core/edition.ts reads this, but Vite only exposes VITE_-prefixed vars
      // on import.meta.env, so it must be inlined explicitly. The Pages build runs
      // as the "demo" edition, which routes favorites to cookies instead of the
      // /api/user/favorites endpoint that only exists in a hosted deployment.
      'import.meta.env.NEXT_PUBLIC_WWV_EDITION': JSON.stringify(
        env.NEXT_PUBLIC_WWV_EDITION || (isGithubPages ? 'demo' : '')
      )
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // File watching can be disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch:
        process.env.DISABLE_HMR === 'true'
          ? null
          : {
              ignored: [
                '**/bridge/**',
                '**/dist/**',
                '**/logs/**',
                '**/scripts/**',
                '**/.gemini/**',
                '**/launcher.log',
                '**/*.log',
                '**/automated_test_report.json'
              ]
            }
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'react-core': ['react', 'react-dom', 'zustand', 'react-textarea-autosize'],
            ai: ['@google/genai'],
            markdown: ['react-markdown', 'remark-gfm'],
            motion: ['motion'],
            lucide: ['lucide-react'],
            virtualization: ['react-virtuoso'],
            satellite: ['satellite.js']
          }
        }
      }
    }
  };
});
