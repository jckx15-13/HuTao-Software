import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { loadConfig, type Config } from '../lib/config';

interface ConfigContextValue {
  config: Config | null;
  isLoading: boolean;
  error: Error | null;
}

const ConfigContext = createContext<ConfigContextValue | undefined>(undefined);

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ConfigContextValue>({
    config: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    let active = true;
    
    loadConfig()
      .then((config) => {
        if (active) {
          setState({ config, isLoading: false, error: null });
        }
      })
      .catch((err) => {
        if (active) {
          setState({ config: null, isLoading: false, error: err instanceof Error ? err : new Error(String(err)) });
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <ConfigContext.Provider value={state}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
}
