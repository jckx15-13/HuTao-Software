import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

import { WWVInitializer } from './core/WWVInitializer';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WWVInitializer>
      <App />
    </WWVInitializer>
  </StrictMode>,
);
