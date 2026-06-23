import { useUIStore, type AiModel } from '@/store/uiStore';
import { SettingsSection } from './SettingsSection';

const ModelOptions: { label: string; value: AiModel }[] = [
  { label: 'Local Diagnostic Assistant', value: 'local-assistant' },
  { label: 'Odysseus Local Bridge', value: 'odysseus-local' },
  { label: 'Gemini 3.5 Flash', value: 'gemini-3.5-flash' },
  { label: 'Gemini 3.1 Pro Preview', value: 'gemini-3.1-pro-preview' },
  { label: 'Gemini 3.1 Flash-Lite', value: 'gemini-3.1-flash-lite' },
  { label: 'Gemini 3 Flash Preview', value: 'gemini-3-flash-preview' },
  { label: 'Gemini 2.5 Flash', value: 'gemini-2.5-flash' },
  { label: 'Gemini 2.5 Pro', value: 'gemini-2.5-pro' },
];

export function AiSettings() {
  const aiModel = useUIStore((state) => state.aiModel);
  const systemInstructions = useUIStore((state) => state.systemInstructions);
  const updateSettings = useUIStore((state) => state.updateSettings);

  return (
    <SettingsSection title="Intelligence">
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30 ml-1">Model Route</label>
          <select 
            value={aiModel} 
            onChange={e => updateSettings({ aiModel: e.target.value as AiModel })} 
            className="w-full p-4 rounded-xl bg-white/5 border border-white/5 text-[10px] font-bold uppercase tracking-wider outline-none focus:border-primary/50 transition-all appearance-none cursor-pointer"
          >
            {ModelOptions.map(o => <option key={o.value} value={o.value} className="bg-neutral-900">{o.label}</option>)}
          </select>
          <p className="mt-2 text-[8px] text-white/35 font-mono leading-relaxed">
            Local Diagnostic always replies without a key. Gemini requires GEMINI_API_KEY.<br />
            ChatGPT Pro subscription credentials are not valid for this browser UI on their own.<br />
            GPT access requires an OpenAI server-side bridge/service in front of your API key.
          </p>
          <div className="rounded-lg border border-white/5 bg-white/5 px-3 py-2 text-[8px] font-mono leading-relaxed text-white/40">
            <div className="uppercase text-white/50 font-bold mb-1">Provider status</div>
            <ul className="space-y-1 list-disc pl-4">
              <li>Local Diagnostic is the default test path and proves chat state end to end.</li>
              <li>Odysseus Local Bridge uses the configured bridge URL, defaulting to http://127.0.0.1:8001.</li>
              <li>Gemini options call @google/genai only when GEMINI_API_KEY is configured.</li>
            </ul>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30 ml-1">System Instructions</label>
          <textarea 
            value={systemInstructions} 
            onChange={e => updateSettings({ systemInstructions: e.target.value })}
            className="w-full min-h-[120px] p-4 rounded-xl bg-white/5 border border-white/5 text-[10px] font-mono leading-relaxed outline-none focus:border-primary/50 transition-all resize-none scroller"
            placeholder="DEFINE SYSTEM BEHAVIOR..." 
          />
        </div>
      </div>
    </SettingsSection>
  );
}
