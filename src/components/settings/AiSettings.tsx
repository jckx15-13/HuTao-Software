import { useEffect, useState } from 'react';
import { useUIStore, type AiModel } from '@/store/uiStore';
import {
  API_CREDENTIAL_PROVIDERS,
  clearCredentialRecord,
  getCredentialRecord,
  getCredentialSummaries,
  saveCredentialRecord,
  validateCredentialRecord,
  type CredentialProviderId,
} from '@/lib/credentials/apiCredentialEngine';
import { getApiConnectorReadiness } from '@/lib/credentials/apiConnectorEngine';
import { SettingsSection } from './SettingsSection';

type CredentialDraft = {
  secret: string;
  endpoint: string;
  projectId: string;
  databaseId: string;
  accountId: string;
};

const emptyDraft: CredentialDraft = {
  secret: '',
  endpoint: '',
  projectId: '',
  databaseId: '',
  accountId: '',
};

const apiCredentialPlaceholders = {
  openai: 'OPENAI_API_KEY for server bridge handoff',
  gemini: 'GEMINI_API_KEY for configured Gemini route',
} as const;

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

function draftFromRecord(providerId: CredentialProviderId): CredentialDraft {
  const record = getCredentialRecord(providerId);
  return {
    secret: record?.secret || '',
    endpoint: record?.endpoint || '',
    projectId: record?.projectId || '',
    databaseId: record?.databaseId || '',
    accountId: record?.accountId || '',
  };
}

function readDrafts(): Record<string, CredentialDraft> {
  return Object.fromEntries(
    API_CREDENTIAL_PROVIDERS.map((provider) => [provider.id, draftFromRecord(provider.id)]),
  );
}
export function AiSettings() {
  const aiModel = useUIStore((state) => state.aiModel);
  const systemInstructions = useUIStore((state) => state.systemInstructions);
  const updateSettings = useUIStore((state) => state.updateSettings);
  const [credentialDrafts, setCredentialDrafts] = useState<Record<string, CredentialDraft>>({});
  const [credentialStatus, setCredentialStatus] = useState('Credential engine idle');
  const [configuredCount, setConfiguredCount] = useState(0);
  const [connectorReadiness, setConnectorReadiness] = useState(getApiConnectorReadiness());

  const refreshCredentialState = () => {
    try {
      setCredentialDrafts(readDrafts());
      setConfiguredCount(getCredentialSummaries().filter((summary) => summary.configured).length);
      setConnectorReadiness(getApiConnectorReadiness());
    } catch {
      setCredentialStatus('Browser credential storage unavailable');
    }
  };

  useEffect(() => {
    refreshCredentialState();
  }, []);

  const updateCredentialDraft = (providerId: CredentialProviderId, field: keyof CredentialDraft, value: string) => {
    setCredentialDrafts((current) => ({
      ...current,
      [providerId]: {
        ...(current[providerId] || emptyDraft),
        [field]: value,
      },
    }));
  };

  const saveCredentials = () => {
    try {
      for (const provider of API_CREDENTIAL_PROVIDERS) {
        const draft = credentialDrafts[provider.id] || emptyDraft;
        saveCredentialRecord(provider.id, draft);
      }
      setConfiguredCount(getCredentialSummaries().filter((summary) => summary.configured).length);
      setConnectorReadiness(getApiConnectorReadiness());
      setCredentialStatus('Saved provider registry locally for this browser profile');
    } catch {
      setCredentialStatus('Save failed: browser credential storage unavailable');
    }
  };

  const clearCredential = (providerId: CredentialProviderId) => {
    try {
      clearCredentialRecord(providerId);
      setCredentialDrafts((current) => ({ ...current, [providerId]: emptyDraft }));
      setConfiguredCount(getCredentialSummaries().filter((summary) => summary.configured).length);
      setConnectorReadiness(getApiConnectorReadiness());
      setCredentialStatus(`Cleared ${providerId} credentials`);
    } catch {
      setCredentialStatus('Clear failed: browser credential storage unavailable');
    }
  };

  const clearAllCredentials = () => {
    try {
      for (const provider of API_CREDENTIAL_PROVIDERS) {
        clearCredentialRecord(provider.id);
      }
      setCredentialDrafts(readDrafts());
      setConnectorReadiness(getApiConnectorReadiness());
      setConfiguredCount(0);
      setCredentialStatus('Cleared all local provider credentials');
    } catch {
      setCredentialStatus('Clear failed: browser credential storage unavailable');
    }
  };

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
            Local Diagnostic always replies without a key. Gemini reads from the credential engine or GEMINI_API_KEY.<br />
            ChatGPT Pro subscription credentials are not valid for this browser UI on their own.<br />
            GPT access requires an OpenAI server-side bridge/service in front of your API key.
          </p>
          <div className="rounded-lg border border-white/5 bg-white/5 px-3 py-2 text-[8px] font-mono leading-relaxed text-white/40">
            <div className="uppercase text-white/50 font-bold mb-1">Provider status</div>
            <ul className="space-y-1 list-disc pl-4">
              <li>Local Diagnostic is the default test path and proves chat state end to end.</li>
              <li>Odysseus Local Bridge uses the credential-engine Bridge URL, defaulting to http://127.0.0.1:8001.</li>
              <li>Server-side-only provider keys are staged for Bridge/backend handoff, not direct production browser calls.</li>
            </ul>
          </div>
        </div>

        <div className="space-y-3 rounded-2xl border border-primary/15 bg-primary/5 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <label className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30">API and connector credential engine</label>
              <p className="mt-1 max-w-3xl text-[8px] font-mono leading-relaxed text-white/40">
                Handles AI providers, Apify, Google Cloud, GitHub, Notion, weather, and the local Bridge endpoint through one local registry.
                Browser storage is for local testing and setup handoff only; production secrets should live behind the Bridge or a provider backend.
              </p>
            </div>
            <div className="rounded-full border border-white/10 bg-black/20 px-3 py-1 font-mono text-[8px] uppercase tracking-wider text-white/45">
              {configuredCount}/{API_CREDENTIAL_PROVIDERS.length} configured
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {API_CREDENTIAL_PROVIDERS.map((provider) => {
              const draft = credentialDrafts[provider.id] || emptyDraft;
              const readiness = connectorReadiness.find((item) => item.providerId === provider.id);
              const warnings = validateCredentialRecord(provider.id, {
                secret: draft.secret,
                endpoint: draft.endpoint,
                projectId: draft.projectId,
                databaseId: draft.databaseId,
                accountId: draft.accountId,
              });
              return (
                <div key={provider.id} className="space-y-2 rounded-2xl border border-white/10 bg-black/20 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-white/75">{provider.label}</div>
                      <div className="mt-1 font-mono text-[8px] uppercase tracking-wider text-primary/70">{provider.category} / {provider.browserUse}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => clearCredential(provider.id)}
                      className="rounded-full border border-white/10 px-3 py-1 font-mono text-[8px] font-bold uppercase tracking-wider text-white/35 transition-colors hover:text-white/70"
                    >
                      Clear
                    </button>
                  </div>

                  {provider.secretLabel && (
                    <input
                      type="password"
                      value={draft.secret}
                      onChange={(event) => updateCredentialDraft(provider.id, 'secret', event.target.value)}
                      placeholder={
                        provider.id === 'openai'
                          ? apiCredentialPlaceholders.openai
                          : provider.id === 'gemini'
                            ? apiCredentialPlaceholders.gemini
                            : provider.secretPlaceholder
                      }
                      autoComplete="off"
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 font-mono text-[10px] text-white outline-none transition-all placeholder:text-white/25 focus:border-primary/50"
                    />
                  )}

                  {provider.endpointLabel && (
                    <input
                      type="text"
                      value={draft.endpoint}
                      onChange={(event) => updateCredentialDraft(provider.id, 'endpoint', event.target.value)}
                      placeholder={provider.endpointPlaceholder}
                      autoComplete="off"
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 font-mono text-[10px] text-white outline-none transition-all placeholder:text-white/25 focus:border-primary/50"
                    />
                  )}

                  {provider.projectLabel && (
                    <input
                      type="text"
                      value={draft.projectId}
                      onChange={(event) => updateCredentialDraft(provider.id, 'projectId', event.target.value)}
                      placeholder={provider.projectPlaceholder}
                      autoComplete="off"
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 font-mono text-[10px] text-white outline-none transition-all placeholder:text-white/25 focus:border-primary/50"
                    />
                  )}

                  {provider.databaseLabel && (
                    <input
                      type="text"
                      value={draft.databaseId}
                      onChange={(event) => updateCredentialDraft(provider.id, 'databaseId', event.target.value)}
                      placeholder={provider.databasePlaceholder}
                      autoComplete="off"
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 font-mono text-[10px] text-white outline-none transition-all placeholder:text-white/25 focus:border-primary/50"
                    />
                  )}

                  {provider.accountLabel && (
                    <input
                      type="text"
                      value={draft.accountId}
                      onChange={(event) => updateCredentialDraft(provider.id, 'accountId', event.target.value)}
                      placeholder={provider.accountPlaceholder}
                      autoComplete="off"
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 font-mono text-[10px] text-white outline-none transition-all placeholder:text-white/25 focus:border-primary/50"
                    />
                  )}

                  <p className="font-mono text-[8px] leading-relaxed text-white/35">{provider.notes}</p>
                  {readiness && (
                    <div className="rounded-xl border border-white/5 bg-white/[0.03] p-2 font-mono text-[8px] leading-relaxed text-white/35">
                      <div className="uppercase tracking-wider text-white/50">
                        Capabilities: {readiness.capabilities.join(', ')}
                      </div>
                      <div className="truncate">Probe: {readiness.probeUrl}</div>
                      <div className={readiness.directBrowserAllowed ? 'text-emerald-300/70' : 'text-amber-300/70'}>
                        {readiness.directBrowserAllowed ? 'Browser-callable for local use' : 'Backend/Bridge route required'}
                      </div>
                    </div>
                  )}
                  {warnings.map((warning) => (
                    <p key={warning} className="font-mono text-[8px] leading-relaxed text-amber-300/75">{warning}</p>
                  ))}
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-mono text-[8px] uppercase tracking-wider text-white/35">{credentialStatus}</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={clearAllCredentials}
                className="min-h-11 rounded-full border border-white/10 px-4 py-2 font-mono text-[9px] font-bold uppercase tracking-wider text-white/45 transition-colors hover:border-white/20 hover:text-white/80"
              >
                Clear all
              </button>
              <button
                type="button"
                onClick={saveCredentials}
                className="min-h-11 rounded-full border border-primary/40 bg-primary/20 px-4 py-2 font-mono text-[9px] font-bold uppercase tracking-wider text-primary transition-colors hover:bg-primary hover:text-primary-text"
              >
                Save registry
              </button>
            </div>
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
