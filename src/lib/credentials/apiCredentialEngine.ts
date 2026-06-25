export type ApiCredentialCategory =
  | "ai"
  | "automation"
  | "cloud"
  | "developer"
  | "connector"
  | "runtime"
  | "weather";

export type CredentialProviderId =
  | "openai"
  | "gemini"
  | "anthropic"
  | "openrouter"
  | "mistral"
  | "perplexity"
  | "groq"
  | "apify"
  | "google-cloud"
  | "github"
  | "notion"
  | "openweather"
  | "bridge";

export type ApiAuthMode = "bearer" | "x-api-key" | "google-api-key" | "custom" | "none";

export type ApiCredentialProvider = {
  id: CredentialProviderId;
  label: string;
  category: ApiCredentialCategory;
  envName?: string;
  secretLabel?: string;
  secretPlaceholder?: string;
  endpointLabel?: string;
  endpointPlaceholder?: string;
  projectLabel?: string;
  projectPlaceholder?: string;
  databaseLabel?: string;
  databasePlaceholder?: string;
  accountLabel?: string;
  accountPlaceholder?: string;
  authMode: ApiAuthMode;
  browserUse: "direct-ok" | "server-side-only" | "connector-handoff" | "runtime-endpoint";
  defaultHeaders?: Record<string, string>;
  notes: string;
};

export type ApiCredentialRecord = {
  providerId: CredentialProviderId;
  secret?: string;
  endpoint?: string;
  projectId?: string;
  databaseId?: string;
  accountId?: string;
  updatedAt: string;
};

export type ApiCredentialSummary = {
  provider: ApiCredentialProvider;
  configured: boolean;
  secretMasked: string;
  endpointConfigured: boolean;
  projectConfigured: boolean;
  databaseConfigured: boolean;
  accountConfigured: boolean;
  updatedAt?: string;
};

const VAULT_STORAGE_KEY = "silverWolf.apiCredentialVault.v1";

const legacySecretKeys: Partial<Record<CredentialProviderId, string>> = {
  openai: "silverWolf.credentials.openaiApiKey",
  gemini: "silverWolf.credentials.geminiApiKey",
};

const legacyEndpointKeys: Partial<Record<CredentialProviderId, string>> = {
  bridge: "silverWolf.credentials.bridgeUrl",
};

export const API_CREDENTIAL_PROVIDERS: ApiCredentialProvider[] = [
  {
    id: "openai",
    label: "OpenAI API",
    category: "ai",
    envName: "OPENAI_API_KEY",
    secretLabel: "OpenAI API key",
    secretPlaceholder: "OPENAI_API_KEY for server bridge handoff",
    authMode: "bearer",
    browserUse: "server-side-only",
    notes: "Use through the Bridge or another backend. Do not send OpenAI API keys directly from the browser in production.",
  },
  {
    id: "gemini",
    label: "Google Gemini",
    category: "ai",
    envName: "GEMINI_API_KEY",
    secretLabel: "Gemini API key",
    secretPlaceholder: "GEMINI_API_KEY for configured Gemini route",
    authMode: "google-api-key",
    browserUse: "direct-ok",
    notes: "Used by the current browser Gemini route for local testing. Prefer a backend proxy for shared deployments.",
  },
  {
    id: "anthropic",
    label: "Anthropic Claude",
    category: "ai",
    envName: "ANTHROPIC_API_KEY",
    secretLabel: "Anthropic API key",
    secretPlaceholder: "ANTHROPIC_API_KEY",
    authMode: "x-api-key",
    browserUse: "server-side-only",
    defaultHeaders: { "anthropic-version": "2023-06-01" },
    notes: "Registered for Bridge/server-side routing.",
  },
  {
    id: "openrouter",
    label: "OpenRouter",
    category: "ai",
    envName: "OPENROUTER_API_KEY",
    secretLabel: "OpenRouter API key",
    secretPlaceholder: "OPENROUTER_API_KEY",
    endpointLabel: "OpenRouter endpoint",
    endpointPlaceholder: "https://openrouter.ai/api/v1",
    authMode: "bearer",
    browserUse: "server-side-only",
    notes: "Registered for multi-model Bridge/server-side routing.",
  },
  {
    id: "mistral",
    label: "Mistral AI",
    category: "ai",
    envName: "MISTRAL_API_KEY",
    secretLabel: "Mistral API key",
    secretPlaceholder: "MISTRAL_API_KEY",
    authMode: "bearer",
    browserUse: "server-side-only",
    notes: "Registered for Bridge/server-side routing.",
  },
  {
    id: "perplexity",
    label: "Perplexity",
    category: "ai",
    envName: "PERPLEXITY_API_KEY",
    secretLabel: "Perplexity API key",
    secretPlaceholder: "PERPLEXITY_API_KEY",
    authMode: "bearer",
    browserUse: "server-side-only",
    notes: "Registered for search/research model routing through a backend.",
  },
  {
    id: "groq",
    label: "Groq",
    category: "ai",
    envName: "GROQ_API_KEY",
    secretLabel: "Groq API key",
    secretPlaceholder: "GROQ_API_KEY",
    authMode: "bearer",
    browserUse: "server-side-only",
    notes: "Registered for low-latency model routing through a backend.",
  },
  {
    id: "apify",
    label: "Apify",
    category: "automation",
    envName: "APIFY_TOKEN",
    secretLabel: "Apify token",
    secretPlaceholder: "APIFY_TOKEN",
    accountLabel: "Default actor or task",
    accountPlaceholder: "actor-id or task-id",
    authMode: "bearer",
    browserUse: "connector-handoff",
    notes: "Connector credential for actors, scraping, and automation jobs.",
  },
  {
    id: "google-cloud",
    label: "Google Cloud",
    category: "cloud",
    envName: "GOOGLE_MAPS_API_KEY",
    secretLabel: "Google API key",
    secretPlaceholder: "GOOGLE_MAPS_API_KEY / Google Cloud API key",
    projectLabel: "Google Cloud project",
    projectPlaceholder: "project-id",
    authMode: "google-api-key",
    browserUse: "direct-ok",
    notes: "Used by Google Maps/Photorealistic 3D Tiles locally. Restrict the key in Google Cloud before using it outside local development.",
  },
  {
    id: "github",
    label: "GitHub",
    category: "developer",
    envName: "GITHUB_TOKEN",
    secretLabel: "GitHub token",
    secretPlaceholder: "GITHUB_TOKEN / ghp_...",
    accountLabel: "Owner/repository",
    accountPlaceholder: "owner/repo",
    authMode: "bearer",
    browserUse: "connector-handoff",
    notes: "Connector credential for repository automation. Prefer GitHub App or fine-grained PAT scopes.",
  },
  {
    id: "notion",
    label: "Notion",
    category: "connector",
    envName: "NOTION_API_KEY",
    secretLabel: "Notion integration token",
    secretPlaceholder: "secret_...",
    databaseLabel: "Database ID",
    databasePlaceholder: "32 character database id",
    authMode: "bearer",
    browserUse: "connector-handoff",
    defaultHeaders: { "Notion-Version": "2022-06-28" },
    notes: "Connector credential for Notion sync.",
  },
  {
    id: "openweather",
    label: "OpenWeather",
    category: "weather",
    envName: "VITE_OPENWEATHER_API_KEY",
    secretLabel: "OpenWeather API key",
    secretPlaceholder: "OpenWeather API key",
    authMode: "custom",
    browserUse: "direct-ok",
    notes: "Registered for weather overlays and should replace hardcoded/demo keys.",
  },
  {
    id: "bridge",
    label: "Silver Wolf Bridge",
    category: "runtime",
    endpointLabel: "Bridge URL",
    endpointPlaceholder: "Bridge URL, e.g. http://127.0.0.1:8001",
    authMode: "none",
    browserUse: "runtime-endpoint",
    notes: "Runtime endpoint for local Odysseus, proxy, memory, and server-side provider routing.",
  },
];

function storage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage || null;
  } catch {
    return null;
  }
}

function nowIso(): string {
  return new Date().toISOString();
}

function normalizeValue(value?: string): string {
  return (value || "").trim();
}

function providerById(providerId: CredentialProviderId): ApiCredentialProvider {
  const provider = API_CREDENTIAL_PROVIDERS.find((item) => item.id === providerId);
  if (!provider) {
    throw new Error(`Unknown credential provider: ${providerId}`);
  }
  return provider;
}

function readRawVault(): Record<string, ApiCredentialRecord> {
  const local = storage();
  if (!local) return {};

  try {
    const parsed = JSON.parse(local.getItem(VAULT_STORAGE_KEY) || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeRawVault(vault: Record<string, ApiCredentialRecord>): void {
  const local = storage();
  if (!local) return;
  local.setItem(VAULT_STORAGE_KEY, JSON.stringify(vault));
}

function migrateLegacyRecords(vault: Record<string, ApiCredentialRecord>): Record<string, ApiCredentialRecord> {
  const local = storage();
  if (!local) return vault;

  let changed = false;
  const next = { ...vault };

  for (const [providerId, key] of Object.entries(legacySecretKeys) as Array<[CredentialProviderId, string]>) {
    const secret = normalizeValue(local.getItem(key) || "");
    if (secret && !next[providerId]?.secret) {
      next[providerId] = {
        ...(next[providerId] || { providerId, updatedAt: nowIso() }),
        providerId,
        secret,
        updatedAt: nowIso(),
      };
      changed = true;
    }
  }

  for (const [providerId, key] of Object.entries(legacyEndpointKeys) as Array<[CredentialProviderId, string]>) {
    const endpoint = normalizeValue(local.getItem(key) || "");
    if (endpoint && !next[providerId]?.endpoint) {
      next[providerId] = {
        ...(next[providerId] || { providerId, updatedAt: nowIso() }),
        providerId,
        endpoint,
        updatedAt: nowIso(),
      };
      changed = true;
    }
  }

  if (changed) writeRawVault(next);
  return next;
}

function readVault(): Record<string, ApiCredentialRecord> {
  return migrateLegacyRecords(readRawVault());
}

function syncLegacyRecord(record: ApiCredentialRecord | null, providerId: CredentialProviderId): void {
  const local = storage();
  if (!local) return;

  const secretKey = legacySecretKeys[providerId];
  if (secretKey) {
    const secret = normalizeValue(record?.secret);
    if (secret) local.setItem(secretKey, secret);
    else local.removeItem(secretKey);
  }

  const endpointKey = legacyEndpointKeys[providerId];
  if (endpointKey) {
    const endpoint = normalizeValue(record?.endpoint);
    if (endpoint) local.setItem(endpointKey, endpoint);
    else local.removeItem(endpointKey);
  }
}

export function getCredentialProvider(providerId: CredentialProviderId): ApiCredentialProvider {
  return providerById(providerId);
}

export function getCredentialRecord(providerId: CredentialProviderId): ApiCredentialRecord | null {
  const record = readVault()[providerId];
  return record ? { ...record, providerId } : null;
}

export function getCredentialSecret(providerId: CredentialProviderId): string {
  return normalizeValue(getCredentialRecord(providerId)?.secret);
}

export function getCredentialEndpoint(providerId: CredentialProviderId): string {
  return normalizeValue(getCredentialRecord(providerId)?.endpoint);
}

export function saveCredentialRecord(
  providerId: CredentialProviderId,
  patch: Partial<Omit<ApiCredentialRecord, "providerId" | "updatedAt">>,
): ApiCredentialRecord | null {
  providerById(providerId);
  const vault = readVault();
  const existing = vault[providerId] || { providerId, updatedAt: nowIso() };
  const next: ApiCredentialRecord = {
    ...existing,
    providerId,
    secret: normalizeValue(patch.secret ?? existing.secret),
    endpoint: normalizeValue(patch.endpoint ?? existing.endpoint),
    projectId: normalizeValue(patch.projectId ?? existing.projectId),
    databaseId: normalizeValue(patch.databaseId ?? existing.databaseId),
    accountId: normalizeValue(patch.accountId ?? existing.accountId),
    updatedAt: nowIso(),
  };

  if (!next.secret && !next.endpoint && !next.projectId && !next.databaseId && !next.accountId) {
    delete vault[providerId];
    writeRawVault(vault);
    syncLegacyRecord(null, providerId);
    return null;
  }

  vault[providerId] = next;
  writeRawVault(vault);
  syncLegacyRecord(next, providerId);
  return next;
}

export function clearCredentialRecord(providerId: CredentialProviderId): void {
  const vault = readVault();
  delete vault[providerId];
  writeRawVault(vault);
  syncLegacyRecord(null, providerId);
}

export function maskSecret(value?: string): string {
  const secret = normalizeValue(value);
  if (!secret) return "not set";
  if (secret.length <= 8) return "set";
  return `${secret.slice(0, 4)}...${secret.slice(-4)}`;
}

export function getCredentialSummaries(): ApiCredentialSummary[] {
  const vault = readVault();
  return API_CREDENTIAL_PROVIDERS.map((provider) => {
    const record = vault[provider.id];
    const secret = normalizeValue(record?.secret);
    return {
      provider,
      configured: Boolean(secret || record?.endpoint || record?.projectId || record?.databaseId || record?.accountId),
      secretMasked: maskSecret(secret),
      endpointConfigured: Boolean(normalizeValue(record?.endpoint)),
      projectConfigured: Boolean(normalizeValue(record?.projectId)),
      databaseConfigured: Boolean(normalizeValue(record?.databaseId)),
      accountConfigured: Boolean(normalizeValue(record?.accountId)),
      updatedAt: record?.updatedAt,
    };
  });
}

export function buildCredentialAuthHeaders(providerId: CredentialProviderId): Record<string, string> {
  const provider = providerById(providerId);
  const secret = getCredentialSecret(providerId);
  const headers = { ...(provider.defaultHeaders || {}) };

  if (!secret) return headers;

  if (provider.authMode === "bearer") {
    headers.Authorization = `Bearer ${secret}`;
  } else if (provider.authMode === "x-api-key") {
    headers["x-api-key"] = secret;
  } else if (provider.authMode === "google-api-key") {
    headers["X-Goog-Api-Key"] = secret;
  }

  return headers;
}

export function validateCredentialRecord(providerId: CredentialProviderId, record: Partial<ApiCredentialRecord>): string[] {
  const provider = providerById(providerId);
  const warnings: string[] = [];
  const secret = normalizeValue(record.secret);
  const endpoint = normalizeValue(record.endpoint);

  if (provider.browserUse === "server-side-only" && secret) {
    warnings.push("Use this key through the Bridge/backend; do not expose it in production browser builds.");
  }

  if (endpoint) {
    try {
      const parsed = new URL(endpoint);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        warnings.push("Endpoint must use http or https.");
      }
    } catch {
      warnings.push("Endpoint is not a valid URL.");
    }
  }

  return warnings;
}

