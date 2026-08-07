import { Link2, Shield, Database } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { SettingsSection } from './SettingsSection';
import { useEffect, useState } from 'react';
import { clearCredentialRecord, getCredentialRecord, saveCredentialRecord } from '@/lib/credentials/apiCredentialEngine';

export function NotionSettings() {
  const s = useUIStore();
  const [notionSecret, setNotionSecret] = useState('');
  const [status, setStatus] = useState('Managed by credential engine');

  useEffect(() => {
    const record = getCredentialRecord('notion');
    queueMicrotask(() => {
      if (record?.secret) {
        setNotionSecret(record.secret);
        s.setNotionApiKey(record.secret);
      }
      if (record?.databaseId && !s.notionDatabaseId) {
        s.setNotionDatabaseId(record.databaseId);
      }
    });
  }, []);

  const saveNotionCredential = () => {
    saveCredentialRecord('notion', {
      secret: notionSecret,
      databaseId: s.notionDatabaseId,
    });
    s.setNotionApiKey(notionSecret);
    setStatus('Saved Notion connector credential locally');
  };

  const clearNotionCredential = () => {
    clearCredentialRecord('notion');
    setNotionSecret('');
    s.setNotionApiKey('');
    setStatus('Cleared Notion connector credential');
  };

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
            value={notionSecret}
            onChange={e => {
              setNotionSecret(e.target.value);
              s.setNotionApiKey(e.target.value);
            }}
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
          Notion credentials are managed by the centralized credential engine. Browser storage is for local setup only.
        </p>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-mono text-[8px] uppercase tracking-wider text-white/35">{status}</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={clearNotionCredential}
              className="min-h-11 rounded-full border border-white/10 px-4 py-2 font-mono text-[9px] font-bold uppercase tracking-wider text-white/45 transition-colors hover:border-white/20 hover:text-white/80"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={saveNotionCredential}
              className="min-h-11 rounded-full border border-primary/40 bg-primary/20 px-4 py-2 font-mono text-[9px] font-bold uppercase tracking-wider text-primary transition-colors hover:bg-primary hover:text-primary-text"
            >
              Save connector
            </button>
          </div>
        </div>
      </div>
    </SettingsSection>
  );
}
