import { Link2, Shield, Database } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import { SettingsSection } from './SettingsSection';

export function NotionSettings() {
  const s = useUIStore();

  return (
    <SettingsSection title="Antigravity Connector (Notion)">
      <div className="space-y-3">
        <div className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/5">
          <div className="flex items-center gap-2">
            <Link2 size={14} className={s.notionEnabled ? "text-primary" : "text-white/40"} />
            <span className="text-[10px] uppercase">Enable Sync</span>
          </div>
          <input 
            type="checkbox" 
            checked={s.notionEnabled} 
            onChange={e => s.setNotionEnabled(e.target.checked)} 
            className="accent-primary h-3 w-3" 
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-white/40 mb-1">
            <Shield size={10} />
            <span className="text-[8px] uppercase font-bold">API Key</span>
          </div>
          <input 
            type="password"
            value={s.notionApiKey}
            onChange={e => s.setNotionApiKey(e.target.value)}
            className="w-full p-2 rounded bg-white/5 border border-white/5 text-[10px] outline-none focus:border-primary"
            placeholder="secret_..."
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-white/40 mb-1">
            <Database size={10} />
            <span className="text-[8px] uppercase font-bold">Database ID</span>
          </div>
          <input 
            type="text"
            value={s.notionDatabaseId}
            onChange={e => s.setNotionDatabaseId(e.target.value)}
            className="w-full p-2 rounded bg-white/5 border border-white/5 text-[10px] outline-none focus:border-primary"
            placeholder="32 chars..."
          />
        </div>

        <p className="text-[8px] text-white/30 uppercase leading-relaxed">
          Syncs your messages to Notion. Antigravity can then read your input via the Notion MCP server.
        </p>
      </div>
    </SettingsSection>
  );
}
