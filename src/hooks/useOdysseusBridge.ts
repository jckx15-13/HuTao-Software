import { useEffect, useState, useCallback } from 'react';
import { addTelemetryLog, setHardwareParameter } from '../lib/jsonStorage';

export interface OdysseusBridgeStatus {
  online: boolean;
  port: number;
  host: string;
  hardwareAvailable: boolean;
  localLlmAvailable: boolean;
  modelName: string;
  lastTelemetryTime?: string;
}

export interface HardwareTelemetryPayload {
  deviceId: string;
  signalStrength: number;
  batteryLevel: number;
  loraStatus: string;
  temperature?: number;
  latitude?: number;
  longitude?: number;
  altitude?: number;
}

const BRIDGE_BASE_URL = 'http://127.0.0.1:8001';

export function useOdysseusBridge() {
  const [status, setStatus] = useState<OdysseusBridgeStatus>({
    online: false,
    port: 8001,
    host: '127.0.0.1',
    hardwareAvailable: false,
    localLlmAvailable: false,
    modelName: 'google/gemma-2-27b-it',
  });

  const [telemetry, setTelemetry] = useState<HardwareTelemetryPayload | null>(null);

  /**
   * Poll bridge daemon health and status.
   */
  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch(`${BRIDGE_BASE_URL}/status`, { signal: AbortSignal.timeout(2000) });
      if (res.ok) {
        const data = await res.json();
        setStatus({
          online: true,
          port: 8001,
          host: '127.0.0.1',
          hardwareAvailable: data.hardware_available ?? true,
          localLlmAvailable: data.local_llm_available ?? true,
          modelName: data.model_name ?? 'google/gemma-2-27b-it',
          lastTelemetryTime: new Date().toISOString(),
        });
      } else {
        setStatus((prev) => ({ ...prev, online: false }));
      }
    } catch (err) {
      setStatus((prev) => ({ ...prev, online: false }));
    }
  }, []);

  /**
   * Send command to Odysseus Hardware / LoRa bridge.
   */
  const sendHardwareCommand = useCallback(async (command: string, payload: Record<string, unknown> = {}) => {
    try {
      const res = await fetch(`${BRIDGE_BASE_URL}/hardware/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command, payload }),
      });
      if (res.ok) {
        const data = await res.json();
        addTelemetryLog({
          source: 'Odysseus-Hardware',
          rawPayload: { command, payload, result: data },
        });
        return data;
      }
    } catch (err) {
      console.warn('[OdysseusBridge] Error executing hardware command:', err);
    }
    return null;
  }, []);

  /**
   * Stream LLM prompt to local edge model via bridge.
   */
  const generateLocalLlm = useCallback(async (prompt: string, model?: string): Promise<string | null> => {
    try {
      const res = await fetch(`${BRIDGE_BASE_URL}/llm/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, model: model || status.modelName }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.text || data.response || null;
      }
    } catch (err) {
      console.warn('[OdysseusBridge] Local LLM generate error:', err);
    }
    return null;
  }, [status.modelName]);

  useEffect(() => {
    checkStatus();
    const timer = setInterval(checkStatus, 5000);
    return () => clearInterval(timer);
  }, [checkStatus]);

  return {
    status,
    telemetry,
    checkStatus,
    sendHardwareCommand,
    generateLocalLlm,
  };
}
