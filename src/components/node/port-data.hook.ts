import { useDatagraph } from "../../datagraph.context";
import { parsePortKey, PortInfo, portKey } from "./node-utils";

import { useEffect, useRef } from "react";

export function usePortData(port: PortInfo, onChange: (data: number[]) => void) {
  const { ready, subscribePortData, unsubscribePortData, readPortData } = useDatagraph();
  const key = portKey(port);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  useEffect(() => {
    if (!ready) return;
    const info = parsePortKey(key);
    subscribePortData(info);
    let rafId: number;
    const loop = () => {
      const data = readPortData(info);
      if (data) onChangeRef.current(data);
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(rafId);
      unsubscribePortData(info);
    };
  }, [key, readPortData, ready, subscribePortData, unsubscribePortData]);
}
