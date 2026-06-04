import { useDatagraph } from "../../datagraph.context";
import { PortInfo, portKey } from "./node-utils";

import { createContext, useCallback, useContext, useEffect, useRef } from "react";

type Subscription = {
  ports: PortInfo[];
  callback: (values: number[]) => void;
};

type LatestPortValueContextType = {
  subscribe: (sub: Subscription) => () => void;
};

const latestPortValueContext = createContext<LatestPortValueContextType>({
  subscribe: () => () => {},
});

export function LatestPortValueProvider({ children }: { children: React.ReactNode }) {
  const datagraph = useDatagraph();
  const subscriptionsRef = useRef<Set<Subscription>>(new Set());
  const datagraphRef = useRef(datagraph);

  useEffect(() => {
    datagraphRef.current = datagraph;
  });

  useEffect(() => {
    if (!datagraph.ready) return;
    const dg = datagraphRef.current;
    if (!dg.ready) return;
    for (const sub of subscriptionsRef.current) {
      sub.ports.forEach((p) => dg.subscribeLatestValue(p));
    }
  }, [datagraph.ready]);

  useEffect(() => {
    if (!datagraph.ready) return;
    let rafId: number;
    const loop = () => {
      const dg = datagraphRef.current;
      if (dg.ready) {
        for (const sub of subscriptionsRef.current) {
          const values = sub.ports.map((p) => dg.readLatestValue(p) ?? 0);
          sub.callback(values);
        }
      }
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [datagraph.ready]);

  const subscribe = useCallback((sub: Subscription) => {
    subscriptionsRef.current.add(sub);
    const dg = datagraphRef.current;
    if (dg.ready) {
      sub.ports.forEach((p) => dg.subscribeLatestValue(p));
    }
    return () => {
      subscriptionsRef.current.delete(sub);
      const dg = datagraphRef.current;
      if (dg.ready) {
        sub.ports.forEach((p) => dg.unsubscribeLatestValue(p));
      }
    };
  }, []);

  return (
    <latestPortValueContext.Provider value={{ subscribe }}>
      {children}
    </latestPortValueContext.Provider>
  );
}

export function useLatestPortValues(ports: PortInfo[], onChange: (values: number[]) => void) {
  const { subscribe } = useContext(latestPortValueContext);
  const onChangeRef = useRef(onChange);
  const portsRef = useRef(ports);

  useEffect(() => {
    onChangeRef.current = onChange;
    portsRef.current = ports;
  });

  const portsKey = ports.map((p) => portKey(p)).join(",");

  useEffect(() => {
    return subscribe({
      ports: portsRef.current,
      callback: (values) => onChangeRef.current(values),
    });
  }, [subscribe, portsKey]);
}
