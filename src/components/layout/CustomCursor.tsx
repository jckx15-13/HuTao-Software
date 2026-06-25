import { useEffect, useMemo, useRef, useState } from "react";
import { CursorEngine } from "@/core/cursor";
import { shouldUseNativeCursorFallback } from "@/core/cursor/nativeFallback";
import { useUIStore } from "@/store/uiStore";

type CustomCursorProps = {
  appHighLoad?: boolean;
};

export function CustomCursor({ appHighLoad = false }: CustomCursorProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<CursorEngine | null>(null);
  const cursorDesign = useUIStore((state) => state.cursorDesign);
  const personalisation = useUIStore((state) => state.personalisation);
  const particleEffects = useUIStore((state) => state.particleEffects);
  const [nativeCursorFallback, setNativeCursorFallback] = useState(true);

  const isHeadless = typeof window !== "undefined" && (
    /HeadlessChrome/i.test(navigator.userAgent) ||
    navigator.webdriver ||
    window.location.search.includes("fallback")
  );

  const config = useMemo(
    () => ({
      enabled: !nativeCursorFallback,
      cursorDesign,
      reducedMotion: personalisation.motionReduced,
      appHighLoad,
      animationIntensity: personalisation.animationIntensity,
      accentColor: personalisation.accentColor,
      particleEffects,
    }),
    [
      appHighLoad,
      cursorDesign,
      particleEffects,
      personalisation.accentColor,
      personalisation.animationIntensity,
      personalisation.motionReduced,
    ]
  );
  const configRef = useRef(config);

  useEffect(() => {
    configRef.current = config;
  }, [config]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const coarsePointer = window.matchMedia("(pointer: coarse)");
    const hoverlessPointer = window.matchMedia("(hover: none)");

    const updateFallback = () => {
      setNativeCursorFallback(shouldUseNativeCursorFallback({
        appHighLoad,
        motionReduced: personalisation.motionReduced,
        prefersReducedMotion: prefersReducedMotion.matches,
        coarsePointer: coarsePointer.matches,
        hoverlessPointer: hoverlessPointer.matches,
        documentHidden: document.hidden,
        headless: isHeadless,
      }));
    };

    const subscribe = (query: MediaQueryList) => {
      if (typeof query.addEventListener === "function") {
        query.addEventListener("change", updateFallback);
        return () => query.removeEventListener("change", updateFallback);
      }
      query.addListener(updateFallback);
      return () => query.removeListener(updateFallback);
    };

    const unsubscribers = [
      subscribe(prefersReducedMotion),
      subscribe(coarsePointer),
      subscribe(hoverlessPointer),
    ];

    document.addEventListener("visibilitychange", updateFallback, { passive: true });
    updateFallback();

    return () => {
      for (const unsubscribe of unsubscribers) unsubscribe();
      document.removeEventListener("visibilitychange", updateFallback);
    };
  }, [appHighLoad, isHeadless, personalisation.motionReduced]);

  useEffect(() => {
    if (nativeCursorFallback || !mountRef.current) {
      engineRef.current?.destroy();
      engineRef.current = null;
      mountRef.current?.replaceChildren();
      return;
    }
    const engine = new CursorEngine(configRef.current);
    engineRef.current = engine;
    engine.init();
    engine.attach(mountRef.current);
    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, [nativeCursorFallback]);

  useEffect(() => {
    if (nativeCursorFallback) return;
    engineRef.current?.updateConfig(config);
  }, [config, nativeCursorFallback]);

  return <div ref={mountRef} aria-hidden="true" />;
}
