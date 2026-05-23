import { useDatagraph } from "../../datagraph.context";
import { PortInfo } from "./node-utils";

import { useEffect, useRef, useState } from "react";

export function useLatestPortValues(ports: PortInfo[]): number[] {
  const { ready, subscribeLatestValue, unsubscribeLatestValue, readLatestValue } = useDatagraph();
  const [values, setValues] = useState<number[]>(() => ports.map(() => 0));
  const rafRef = useRef<number>(0);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    if (!ready) return;
    ports.forEach((p) => subscribeLatestValue(p));
    return () => {
      ports.forEach((p) => unsubscribeLatestValue(p));
    };
  }, [ready, ports, subscribeLatestValue, unsubscribeLatestValue]);

  useEffect(() => {
    if (!ready) return;
    const poll = () => {
      if (frameRef.current++ % 2 === 0) {
        const next = ports.map((p) => readLatestValue(p) ?? 0);
        setValues(next);
      }
      rafRef.current = requestAnimationFrame(poll);
    };
    rafRef.current = requestAnimationFrame(poll);
    return () => cancelAnimationFrame(rafRef.current);
  }, [ready, ports, readLatestValue]);

  return ports.map((_, i) => values[i] ?? 0);
}
