import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import cesium from 'vite-plugin-cesium';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), cesium()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@worldwideview/wwv-plugin-sdk': path.resolve(__dirname, 'src/wwv-sdk/index.ts'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // File watching can be disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:8001',
          changeOrigin: true,
          secure: false,
        },
      },
      watch: {
        ignored: [
          '**/bridge/**',
          '**/launcher.log',
          '**/dist/**',
          '**/scripts/**',
          '**/development_logs/**',
          '**/test_screenshots/**',
          '**/automated_test_report.json'
        ],
      },
    },
    build: {
      chunkSizeWarningLimit: 800, // Suppress Cesium chunk size warnings
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined;
            if (id.includes('/node_modules/cesium/')) return 'cesium'; // Isolate Cesium for caching
            if (id.includes('/node_modules/react/') || id.includes('/node_modules/react-dom/')) return 'react';
            if (id.includes('/node_modules/lucide-react/')) return 'icons';
            if (id.includes('/node_modules/zustand/')) return 'state';
            return 'vendor';
          },
        },
      },
    },
  };
});
