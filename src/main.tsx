import {StrictMode, Suspense, lazy} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { useUIStore } from './store/uiStore';
import { useDiagnosticsStore } from './store/diagnosticsStore';

const WWVInitializer = lazy(() =>
  import('./core/WWVInitializer').then((m) => ({ default: m.WWVInitializer }))
);

function BootFallback() {
  return (
    <div className="flex h-[100dvh] w-full items-center justify-center bg-black text-center font-mono text-[10px] uppercase tracking-[0.3em] text-primary">
      Initializing Core Data Engine...
    </div>
  );
}

// Expose store on window for E2E/Puppeteer testing (only in dev or fallback mode)
if (typeof window !== 'undefined') {
  (window as any).useUIStore = useUIStore;
  (window as any).useDiagnosticsStore = useDiagnosticsStore;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={<BootFallback />}>
      <WWVInitializer>
        <App />
      </WWVInitializer>
    </Suspense>
  </StrictMode>,
);
