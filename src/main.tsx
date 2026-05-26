import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { WWVInitializer } from './core/WWVInitializer.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WWVInitializer>
      <App />
    </WWVInitializer>
  </StrictMode>,
);
