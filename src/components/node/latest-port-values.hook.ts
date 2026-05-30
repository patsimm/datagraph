import { useDatagraph } from "../../datagraph.context";
import { PortInfo } from "./node-utils";

import { useEffect, useState } from "react";

export function useLatestPortValues(ports: PortInfo[]): number[] {
  const { ready, subscribeLatestValue, unsubscribeLatestValue, readLatestValue } = useDatagraph();
  const [values, setValues] = useState<number[]>(() => ports.map(() => 0));

  useEffect(() => {
    if (!ready) return;
    ports.forEach((p) => subscribeLatestValue(p));
    return () => {
      ports.forEach((p) => unsubscribeLatestValue(p));
    };
  }, [ready, ports, subscribeLatestValue, unsubscribeLatestValue]);

  useEffect(() => {
    if (!ready) return;
    let rafId: number;
    const loop = () => {
      const next = ports.map((p) => readLatestValue(p) ?? 0);
      setValues(next);
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [ready, ports, readLatestValue]);

  return ports.map((_, i) => values[i] ?? 0);
}
