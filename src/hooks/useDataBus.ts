import { useEffect } from 'react';
import { dataBus } from '@/core/data/DataBus';
import { DataBusEvents } from '@/core/plugins/PluginTypes';

/**
 * A custom hook to safely subscribe to DataBus events with automatic cleanup.
 * 
 * @param event The event name to subscribe to.
 * @param callback The function to call when the event is emitted.
 * @param deps Dependency array for the effect.
 */
export function useDataBus<K extends keyof DataBusEvents>(
  event: K,
  callback: (payload: DataBusEvents[K]) => void,
  deps: any[] = []
) {
  useEffect(() => {
    dataBus.on(event, callback);
    return () => dataBus.off(event, callback);
  }, [event, ...deps]);
}

/**
 * A hook to subscribe to multiple events at once.
 */
export function useDataBusMulti(
  eventMap: Partial<{ [K in keyof DataBusEvents]: (payload: DataBusEvents[K]) => void }>,
  deps: any[] = []
) {
  useEffect(() => {
    const entries = Object.entries(eventMap) as [keyof DataBusEvents, any][];
    
    entries.forEach(([event, cb]) => {
      if (cb) dataBus.on(event, cb);
    });

    return () => {
      entries.forEach(([event, cb]) => {
        if (cb) dataBus.off(event, cb);
      });
    };
  }, [JSON.stringify(Object.keys(eventMap)), ...deps]);
}
