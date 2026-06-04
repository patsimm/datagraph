import { useDatagraph } from "../../datagraph.context";
import { parsePortKey, PortInfo, portKey } from "./node-utils";

import { useEffect, useRef } from "react";

export function usePortData(port: PortInfo, onChange: (data: number[]) => void) {
  const { ready, subscribePortData, unsubscribePortData, readPortData } = useDatagraph();
  const key = portKey(port);
  const onChangeRef = useRef(onChange);
  const subscribeRef = useRef(subscribePortData);
  const unsubscribeRef = useRef(unsubscribePortData);
  const readRef = useRef(readPortData);

  // Prevent subscriptions tearing down on audioContextState changes (new fn refs) scrambling multi-oscilloscope data.
  useEffect(() => {
    onChangeRef.current = onChange;
    subscribeRef.current = subscribePortData;
    unsubscribeRef.current = unsubscribePortData;
    readRef.current = readPortData;
  });

  useEffect(() => {
    if (!ready) return;
    const info = parsePortKey(key);
    subscribeRef.current!(info);
    let rafId: number;
    const loop = () => {
      const data = readRef.current!(info);
      if (data) onChangeRef.current(data);
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(rafId);
      unsubscribeRef.current!(info);
    };
  }, [key, ready]);
}
