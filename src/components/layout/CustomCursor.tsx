import { useEffect, useMemo, useRef } from "react";
import { CursorEngine } from "@/core/cursor";
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

  const config = useMemo(
    () => ({
      enabled: true,
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
  const isHeadless = typeof window !== 'undefined' && (
    /HeadlessChrome/i.test(navigator.userAgent) ||
    navigator.webdriver ||
    window.location.search.includes('fallback')
  );

  useEffect(() => {
    if (isHeadless || !mountRef.current) return;
    const engine = new CursorEngine(config);
    engineRef.current = engine;
    engine.init();
    engine.attach(mountRef.current);
    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (isHeadless) return;
    engineRef.current?.updateConfig(config);
  }, [config]);

  return <div ref={mountRef} aria-hidden="true" />;
}
