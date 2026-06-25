import {
  API_CREDENTIAL_PROVIDERS,
  buildCredentialAuthHeaders,
  getCredentialEndpoint,
  getCredentialProvider,
  getCredentialRecord,
  type CredentialProviderId,
} from "./apiCredentialEngine";

export type ApiConnectorCapability =
  | "chat"
  | "models"
  | "actors"
  | "automation"
  | "cloud"
  | "repos"
  | "pages"
  | "maps"
  | "weather"
  | "runtime";

export type ApiConnectorProfile = {
  providerId: CredentialProviderId;
  baseUrl: string;
  probePath: string;
  capabilities: ApiConnectorCapability[];
  requiresBackend: boolean;
  docsLabel: string;
};

export type ApiRequestDescriptor = {
  providerId: CredentialProviderId;
  label: string;
  url: string;
  method: "GET" | "POST";
  headers: Record<string, string>;
  directBrowserAllowed: boolean;
  requiresBackend: boolean;
  configured: boolean;
  notes: string;
};

export type ApiConnectorReadiness = {
  providerId: CredentialProviderId;
  label: string;
  configured: boolean;
  directBrowserAllowed: boolean;
  requiresBackend: boolean;
  capabilities: ApiConnectorCapability[];
  probeUrl: string;
  missing: string[];
};

const CONNECTOR_PROFILES: Record<CredentialProviderId, ApiConnectorProfile> = {
  openai: {
    providerId: "openai",
    baseUrl: "https://api.openai.com/v1",
    probePath: "/models",
    capabilities: ["chat", "models"],
    requiresBackend: true,
    docsLabel: "OpenAI model and chat API",
  },
  gemini: {
    providerId: "gemini",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta",
    probePath: "/models",
    capabilities: ["chat", "models"],
    requiresBackend: false,
    docsLabel: "Google Gemini model API",
  },
  anthropic: {
    providerId: "anthropic",
    baseUrl: "https://api.anthropic.com/v1",
    probePath: "/models",
    capabilities: ["chat", "models"],
    requiresBackend: true,
    docsLabel: "Anthropic Claude API",
  },
  openrouter: {
    providerId: "openrouter",
    baseUrl: "https://openrouter.ai/api/v1",
    probePath: "/models",
    capabilities: ["chat", "models"],
    requiresBackend: true,
    docsLabel: "OpenRouter model gateway",
  },
  mistral: {
    providerId: "mistral",
    baseUrl: "https://api.mistral.ai/v1",
    probePath: "/models",
    capabilities: ["chat", "models"],
    requiresBackend: true,
    docsLabel: "Mistral AI model API",
  },
  perplexity: {
    providerId: "perplexity",
    baseUrl: "https://api.perplexity.ai",
    probePath: "/models",
    capabilities: ["chat", "models"],
    requiresBackend: true,
    docsLabel: "Perplexity search and model API",
  },
  groq: {
    providerId: "groq",
    baseUrl: "https://api.groq.com/openai/v1",
    probePath: "/models",
    capabilities: ["chat", "models"],
    requiresBackend: true,
    docsLabel: "Groq OpenAI-compatible model API",
  },
  apify: {
    providerId: "apify",
    baseUrl: "https://api.apify.com/v2",
    probePath: "/users/me",
    capabilities: ["actors", "automation"],
    requiresBackend: true,
    docsLabel: "Apify actor and automation API",
  },
  "google-cloud": {
    providerId: "google-cloud",
    baseUrl: "https://maps.googleapis.com",
    probePath: "/maps/api/tile/v1/createSession",
    capabilities: ["cloud", "maps"],
    requiresBackend: false,
    docsLabel: "Google Cloud Maps and photorealistic tiles",
  },
  github: {
    providerId: "github",
    baseUrl: "https://api.github.com",
    probePath: "/user",
    capabilities: ["repos", "automation"],
    requiresBackend: true,
    docsLabel: "GitHub REST API",
  },
  notion: {
    providerId: "notion",
    baseUrl: "https://api.notion.com/v1",
    probePath: "/users/me",
    capabilities: ["pages", "automation"],
    requiresBackend: true,
    docsLabel: "Notion connector API",
  },
  openweather: {
    providerId: "openweather",
    baseUrl: "https://api.openweathermap.org/data/2.5",
    probePath: "/weather",
    capabilities: ["weather"],
    requiresBackend: false,
    docsLabel: "OpenWeather overlay API",
  },
  bridge: {
    providerId: "bridge",
    baseUrl: "http://127.0.0.1:8001",
    probePath: "/status",
    capabilities: ["runtime", "chat", "automation"],
    requiresBackend: false,
    docsLabel: "Silver Wolf local Bridge runtime",
  },
};

function cleanJoin(baseUrl: string, path: string): string {
  const normalizedBase = baseUrl.replace(/\/+$/, "");
  const normalizedPath = path ? `/${path.replace(/^\/+/, "")}` : "";
  return `${normalizedBase}${normalizedPath}`;
}

function configuredBaseUrl(providerId: CredentialProviderId): string {
  const endpoint = getCredentialEndpoint(providerId);
  return endpoint || CONNECTOR_PROFILES[providerId].baseUrl;
}

export function getApiConnectorProfile(providerId: CredentialProviderId): ApiConnectorProfile {
  return CONNECTOR_PROFILES[providerId];
}

export function getApiConnectorProfiles(): ApiConnectorProfile[] {
  return API_CREDENTIAL_PROVIDERS.map((provider) => CONNECTOR_PROFILES[provider.id]);
}

export function createApiRequestDescriptor(
  providerId: CredentialProviderId,
  path = CONNECTOR_PROFILES[providerId].probePath,
  method: "GET" | "POST" = "GET",
): ApiRequestDescriptor {
  const provider = getCredentialProvider(providerId);
  const profile = CONNECTOR_PROFILES[providerId];
  const record = getCredentialRecord(providerId);
  const directBrowserAllowed = provider.browserUse === "direct-ok" || provider.browserUse === "runtime-endpoint";
  const headers = directBrowserAllowed ? buildCredentialAuthHeaders(providerId) : { ...(provider.defaultHeaders || {}) };

  return {
    providerId,
    label: provider.label,
    url: cleanJoin(configuredBaseUrl(providerId), path),
    method,
    headers,
    directBrowserAllowed,
    requiresBackend: profile.requiresBackend,
    configured: Boolean(record?.secret || record?.endpoint || record?.projectId || record?.databaseId || record?.accountId),
    notes: directBrowserAllowed
      ? provider.notes
      : `${provider.label} should be called through the Bridge/backend so secrets are not exposed in browser requests.`,
  };
}

export function getApiConnectorReadiness(): ApiConnectorReadiness[] {
  return API_CREDENTIAL_PROVIDERS.map((provider) => {
    const profile = CONNECTOR_PROFILES[provider.id];
    const record = getCredentialRecord(provider.id);
    const hasSecret = Boolean(record?.secret);
    const hasEndpoint = Boolean(record?.endpoint);
    const configured = Boolean(hasSecret || hasEndpoint || record?.projectId || record?.databaseId || record?.accountId);
    const missing: string[] = [];

    if (provider.secretLabel && !hasSecret && provider.authMode !== "none") {
      missing.push(provider.envName || provider.secretLabel);
    }
    if (provider.endpointLabel && !hasEndpoint && provider.id !== "bridge") {
      missing.push(provider.endpointLabel);
    }

    return {
      providerId: provider.id,
      label: provider.label,
      configured,
      directBrowserAllowed: provider.browserUse === "direct-ok" || provider.browserUse === "runtime-endpoint",
      requiresBackend: profile.requiresBackend,
      capabilities: profile.capabilities,
      probeUrl: cleanJoin(configuredBaseUrl(provider.id), profile.probePath),
      missing,
    };
  });
}

