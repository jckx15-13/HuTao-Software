declare const __SILVER_WOLF_BRIDGE_URL__: string | undefined;
declare const __SILVER_WOLF_ODYSSEUS_CORE_URL__: string | undefined;

export const FALLBACK_BRIDGE_URL = "http://127.0.0.1:8001";
export const FALLBACK_ODYSSEUS_CORE_URL = "http://127.0.0.1:7000";

function configuredBuildValue(name: "bridge" | "odysseus-core"): string {
  if (name === "bridge" && typeof __SILVER_WOLF_BRIDGE_URL__ !== "undefined") {
    return __SILVER_WOLF_BRIDGE_URL__;
  }
  if (name === "odysseus-core" && typeof __SILVER_WOLF_ODYSSEUS_CORE_URL__ !== "undefined") {
    return __SILVER_WOLF_ODYSSEUS_CORE_URL__;
  }
  return "";
}

function storedEndpointOverride(): string {
  if (typeof window === "undefined") return "";
  const store = (window as any).useUIStore;
  return store?.getState?.()?.engineUrlOverride || "";
}

export function normalizeBridgeBaseUrl(rawUrl?: string | null, fallback = FALLBACK_BRIDGE_URL): string {
  const trimmed = (rawUrl || "").trim();
  const value = trimmed || fallback;
  const withProtocol = /^[a-z][a-z0-9+.-]*:\/\//i.test(value) ? value : `http://${value}`;

  try {
    const parsed = new URL(withProtocol);
    if (parsed.protocol === "ws:") parsed.protocol = "http:";
    if (parsed.protocol === "wss:") parsed.protocol = "https:";
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return fallback;
    }

    parsed.hash = "";
    parsed.search = "";
    parsed.pathname = parsed.pathname.replace(/\/stream\/?$/i, "") || "/";
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return fallback;
  }
}

export function getBridgeBaseUrl(): string {
  return normalizeBridgeBaseUrl(
    storedEndpointOverride() || configuredBuildValue("bridge") || FALLBACK_BRIDGE_URL,
  );
}

export function getOdysseusCoreBaseUrl(): string {
  return normalizeBridgeBaseUrl(
    configuredBuildValue("odysseus-core") || FALLBACK_ODYSSEUS_CORE_URL,
    FALLBACK_ODYSSEUS_CORE_URL,
  );
}

export function bridgeUrl(path = ""): string {
  const suffix = path ? `/${path.replace(/^\/+/, "")}` : "";
  return `${getBridgeBaseUrl()}${suffix}`;
}
