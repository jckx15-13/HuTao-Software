import { useState } from 'react';
import FlowchartCanvas from './components/Canvas/FlowchartCanvas';
import TranslateWorkspace from './components/Translate/TranslateWorkspace';
import Header, { type AppMode } from './components/Toolbar/Header';

export default function App() {
  const [mode, setMode] = useState<AppMode>('translate');

  return (
    <div className="flex h-screen flex-col text-slate-200">
      <Header mode={mode} setMode={setMode} />

      {/* Keying on mode replays the entrance animation on each switch, which
          gives the transition somewhere to land instead of snapping. */}
      <main key={mode} className="rise-in flex min-h-0 flex-1 flex-col">
        {mode === 'translate' ? <TranslateWorkspace /> : <FlowchartCanvas />}
      </main>
    </div>
  );
}
