import { useCallback, useEffect, useState } from 'react';
import { getSatelliteCatalog } from '@/core/satellites/satelliteCatalog';
import type { SatelliteConfig } from '@/core/satellites/satelliteData';

type UseSatelliteCatalogResult = {
  satellites: SatelliteConfig[];
  error: string | null;
  isLoading: boolean;
};

export function useSatelliteCatalog(): UseSatelliteCatalogResult {
  const [satellites, setSatellites] = useState<SatelliteConfig[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadCatalog = useCallback(async () => {
    let catalogError: string | null = null;
    const catalog = await getSatelliteCatalog((catalogLoadError) => {
      catalogError = catalogLoadError instanceof Error ? catalogLoadError.message : String(catalogLoadError);
    });
    return { catalog, catalogError };
  }, []);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      const result = await loadCatalog();
      if (!mounted) return;
      setSatellites(result.catalog);
      setError(result.catalogError);
      setIsLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, [loadCatalog]);

  return {
    satellites,
    error,
    isLoading,
  };
}
