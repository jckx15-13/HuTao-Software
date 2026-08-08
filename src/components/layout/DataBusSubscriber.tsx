import { useEffect } from "react";
import { useStore } from "../../core/state/store";
import { dataBus } from "../../core/data/DataBus";
import { pluginManager } from "../../core/plugins/PluginManager";
import { wsClient } from "../../core/data/WsClient";
import { resolveEngineUrl } from "../../core/data/resolveEngineUrl";
import { fetchLocalEngineManifest } from "../../core/data/engineManifest";
import { useDiagnosticsStore } from '@/store/diagnosticsStore';

/**
 * Headless component that bridges the DataBus event system with the Zustand store.
 * Handles automatic WebSocket subscription/unsubscription when layers are toggled.
 */
export function DataBusSubscriber() {
    const setPollingInterval = useStore((s) => s.setPollingInterval);
    const setEntities = useStore((s) => s.setEntities);
    const setEntityCount = useStore((s) => s.setEntityCount);
    const clearEntities = useStore((s) => s.clearEntities);
    const removeLayer = useStore((s) => s.removeLayer);
    const setLayerLoading = useStore((s) => s.setLayerLoading);
    const cacheMaxAge = useStore((s) => s.dataConfig.cacheMaxAge);

    useEffect(() => {
        fetchLocalEngineManifest();
        pluginManager.setCacheMaxAge(cacheMaxAge);
    }, [cacheMaxAge]);

    useEffect(() => {
        let active = true;

        const unsubReg = dataBus.on("pluginRegistered", ({ pluginId, defaultInterval }) => {
            setTimeout(() => {
                if (!active) return;
                useStore.getState().initLayer(pluginId, false);
                const currentIntervals = useStore.getState().dataConfig.pollingIntervals;
                if (!currentIntervals[pluginId]) {
                    setPollingInterval(pluginId, defaultInterval);
                }
            }, 0);
        });

        const unsubData = dataBus.on("dataUpdated", ({ pluginId, entities }) => {
            // Defer state updates by one tick to prevent React render loop issues
            setTimeout(() => {
                if (!active) return;
                setEntities(pluginId, entities);
                setEntityCount(pluginId, entities.length);
            }, 0);
        });

        const unsubToggle = dataBus.on("layerToggled", ({ pluginId, enabled }) => {
            const engineUrl = resolveEngineUrl(pluginId);
            if (enabled) {
                wsClient.subscribe(pluginId, engineUrl);
            } else {
                wsClient.unsubscribe(pluginId, engineUrl);
            }
            setTimeout(() => {
                if (!active) return;
                useStore.getState().setLayerEnabled(pluginId, enabled);
            }, 0);
        });

        const unsubUnreg = dataBus.on("pluginUnregistered", ({ pluginId }) => {
            setTimeout(() => {
                if (!active) return;
                clearEntities(pluginId);
                removeLayer(pluginId);
            }, 0);
        });

        const unsubLoading = dataBus.on("layerLoadingChanged", ({ pluginId, loading }) => {
            setTimeout(() => {
                if (!active) return;
                setLayerLoading(pluginId, loading);
            }, 0);
        });

        const unsubPluginErr = dataBus.on('pluginError', ({ pluginId, message, error }) => {
            try {
                useDiagnosticsStore.getState().add({
                    level: 'warning',
                    message: message || `[Plugin:${pluginId}] error`,
                    stack: error?.stack || null,
                    metadata: { pluginId, engineUrl: resolveEngineUrl(pluginId || '') },
                    suggestion: 'Inspect plugin manifest and upstream engine availability; check network and auth',
                });
            } catch (e) {
                console.warn('[DataBusSubscriber] failed to record pluginError', e);
            }
        });

        return () => {
            active = false;
            unsubReg();
            unsubUnreg();
            unsubData();
            unsubToggle();
            unsubLoading();
            unsubPluginErr();
        };
    }, [setPollingInterval, setEntities, setEntityCount, clearEntities, removeLayer, setLayerLoading]);

    return null;
}
