import { useEffect } from "react";
import { useStore } from "../../core/state/store";
import { dataBus } from "../../core/data/DataBus";
import { pluginManager } from "../../core/plugins/PluginManager";
import { wsClient } from "../../core/data/WsClient";
import { resolveEngineUrl } from "../../core/data/resolveEngineUrl";
import { fetchLocalEngineManifest } from "../../core/data/engineManifest";

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
        const unsubReg = dataBus.on("pluginRegistered", ({ pluginId, defaultInterval }) => {
            setTimeout(() => {
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
                useStore.getState().setLayerEnabled(pluginId, enabled);
            }, 0);
        });

        const unsubUnreg = dataBus.on("pluginUnregistered", ({ pluginId }) => {
            setTimeout(() => {
                clearEntities(pluginId);
                removeLayer(pluginId);
            }, 0);
        });

        const unsubLoading = dataBus.on("layerLoadingChanged", ({ pluginId, loading }) => {
            setTimeout(() => {
                setLayerLoading(pluginId, loading);
            }, 0);
        });

        return () => {
            unsubReg();
            unsubUnreg();
            unsubData();
            unsubToggle();
            unsubLoading();
        };
    }, [setPollingInterval, setEntities, setEntityCount, clearEntities, removeLayer, setLayerLoading]);

    return null;
}
