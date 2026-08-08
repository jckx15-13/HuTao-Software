import { useDeviceProfile } from "@/hooks/useDeviceProfile";

/**
 * True when side panels present as sheets over the workspace rather than docking
 * beside it — watches, phones, phablets, and short landscape tablets.
 *
 * This used to be its own `(max-width: 768px)` media query, which disagreed with
 * the 760px threshold `panelGeometry` and `DockedLayout` used. Viewports between
 * 760px and 768px were "mobile" to every consumer of this hook while the layout
 * was already docking panels. It now derives from the shared device profile, so
 * the two can no longer drift apart.
 */
export function useIsMobile(): boolean {
    return useDeviceProfile().panelPresentation !== 'docked';
}
