"use client";

import React, { useEffect, useState, useMemo } from "react";
import { pluginManager } from "@/core/plugins/PluginManager";
import { dataBus } from "@/core/data/DataBus";
import { useStore } from "@/core/state/store";

interface Props {
  timeStart: number;
  timeEnd: number;
}

function clamp(n: number, a = 0, b = 1) {
  return Math.max(a, Math.min(b, n));
}

export default function TimelineLanes({ timeStart, timeEnd }: Props) {
  const timelineAvailability = useStore((s) => s.timelineAvailability);
  const [enabled, setEnabled] = useState(() => pluginManager.getEnabledPlugins());

  useEffect(() => {
    const refresh = () => setEnabled(pluginManager.getEnabledPlugins());
    dataBus.on("pluginRegistered", refresh);
    dataBus.on("pluginUnregistered", refresh);
    dataBus.on("layerToggled", refresh);
    return () => {
      dataBus.off("pluginRegistered", refresh);
      dataBus.off("pluginUnregistered", refresh);
      dataBus.off("layerToggled", refresh);
    };
  }, []);

  const rangeMs = Math.max(1, timeEnd - timeStart);

  return (
    <div className="w-full space-y-1 text-[10px] text-white/60">
      {enabled.map((m) => {
        const id = m.plugin.id;
        const availability = timelineAvailability[id] || [];
        return (
          <div key={id} className="flex items-center gap-3">
            <div className="w-28 text-[9px] text-white/40 truncate">{m.plugin.name || id}</div>
            <div className="flex-1 h-2 bg-white/5 rounded relative overflow-hidden">
              {availability.map((intv, idx) => {
                const left = ((intv.start - timeStart) / rangeMs) * 100;
                const right = ((intv.end - timeStart) / rangeMs) * 100;
                const clampedLeft = clamp(left, -50, 100);
                const clampedRight = clamp(right, -50, 150);
                const width = Math.max(0, clampedRight - clampedLeft);
                return (
                  <div
                    key={idx}
                    title={`${new Date(intv.start).toISOString()} → ${new Date(intv.end).toISOString()}`}
                    className="absolute top-0 h-2 bg-cyan-500/60"
                    style={{ left: `${clampedLeft}%`, width: `${width}%` }}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
