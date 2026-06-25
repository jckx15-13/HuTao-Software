import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import cesium from 'vite-plugin-cesium';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss(), cesium()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      __SILVER_WOLF_BRIDGE_URL__: JSON.stringify(env.VITE_BRIDGE_URL || ''),
      __SILVER_WOLF_ODYSSEUS_CORE_URL__: JSON.stringify(env.VITE_ODYSSEUS_CORE_URL || ''),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // File watching can be disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {
        ignored: [
          '**/bridge/**',
          '**/dist/**',
          '**/logs/**',
          '**/.gemini/**',
          '**/launcher.log',
          '**/*.log',
          '**/automated_test_report.json',
        ],
      },
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
            satellite: ['satellite.js'],
          },
        },
      },
    },
  };
});
