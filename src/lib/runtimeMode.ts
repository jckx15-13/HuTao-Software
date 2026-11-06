/** True when GPU-heavy views should stay off for headless or forced-fallback runs. */
export function isFallbackRuntime(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;

  return (
    new URLSearchParams(window.location.search).has('fallback') ||
    /HeadlessChrome/i.test(navigator.userAgent)
  );
}
