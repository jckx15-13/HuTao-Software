import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { WWVInitializer } from './core/WWVInitializer.tsx';
import './index.css';
import { useUIStore } from './store/uiStore';
import { useDiagnosticsStore } from './store/diagnosticsStore';

// Expose store on window for E2E/Puppeteer testing (only in dev or fallback mode)
if (typeof window !== 'undefined') {
  (window as any).useUIStore = useUIStore;
  (window as any).useDiagnosticsStore = useDiagnosticsStore;
  // Global runtime error hooks: capture unhandled exceptions and rejections for diagnostics
  window.addEventListener('error', (ev) => {
    try {
      useDiagnosticsStore.getState().add({
        level: 'error',
        message: ev.error?.message || ev.message || 'Global error',
        stack: ev.error?.stack || null,
        metadata: { filename: (ev as ErrorEvent).filename, lineno: (ev as ErrorEvent).lineno, colno: (ev as ErrorEvent).colno },
        suggestion: 'Check stacktrace and recent UI interactions leading to the error',
      });
    } catch (e) { /* ignore */ }
  });

  window.addEventListener('unhandledrejection', (ev) => {
    try {
      const reason = (ev as PromiseRejectionEvent).reason;
      useDiagnosticsStore.getState().add({
        level: 'error',
        message: reason?.message || String(reason) || 'Unhandled promise rejection',
        stack: reason?.stack || null,
        metadata: { reason },
        suggestion: 'Inspect promise chain; add catch handlers for expected failures',
      });
    } catch (e) { /* ignore */ }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WWVInitializer>
      <App />
    </WWVInitializer>
  </StrictMode>,
);
