import { useUIStore, type AiModel } from '../../store/uiStore';
import { SettingsSection } from './SettingsSection';

const ModelOptions: { label: string; value: AiModel }[] = [
  { label: 'Gemini 2.5 Flash', value: 'gemini-2.5-flash' },
  { label: 'Gemini 2.5 Pro', value: 'gemini-2.5-pro' },
  { label: 'Gemini 2.0 Flash', value: 'gemini-2.0-flash' },
  { label: 'Local Assistant', value: 'local-assistant' },
];

export function AiSettings() {
  const aiModel = useUIStore((state) => state.aiModel);
  const systemInstructions = useUIStore((state) => state.systemInstructions);
  const updateSettings = useUIStore((state) => state.updateSettings);

  return (
    <SettingsSection title="Intelligence">
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30 ml-1">Brain Core</label>
          <select 
            value={aiModel} 
            onChange={e => updateSettings({ aiModel: e.target.value as AiModel })} 
            className="w-full p-4 rounded-xl bg-white/5 border border-white/5 text-[10px] font-bold uppercase tracking-wider outline-none focus:border-primary/50 transition-all appearance-none cursor-pointer"
          >
            {ModelOptions.map(o => <option key={o.value} value={o.value} className="bg-neutral-900">{o.label}</option>)}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30 ml-1">Behavior Protocol</label>
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
