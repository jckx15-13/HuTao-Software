export type NativeCursorFallbackInput = {
  appHighLoad?: boolean;
  motionReduced?: boolean;
  prefersReducedMotion?: boolean;
  coarsePointer?: boolean;
  hoverlessPointer?: boolean;
  documentHidden?: boolean;
  headless?: boolean;
};

export function shouldUseNativeCursorFallback(input: NativeCursorFallbackInput): boolean {
  return Boolean(
    input.headless ||
      input.appHighLoad ||
      input.motionReduced ||
      input.prefersReducedMotion ||
      input.coarsePointer ||
      input.hoverlessPointer ||
      input.documentHidden
  );
}
