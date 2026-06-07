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
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WWVInitializer>
      <App />
    </WWVInitializer>
  </StrictMode>,
);
