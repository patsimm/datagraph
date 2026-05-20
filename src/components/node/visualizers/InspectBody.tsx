import { useDatagraph } from "../../../datagraph.context";

import { useCallback, useEffect, useState } from "react";

export function InspectBody({ nodeId }: { nodeId: string }) {
  const { ready, subscribeNode, unsubscribeNode } = useDatagraph();
  const [value, setValue] = useState<string>("—");

  const handleData = useCallback((data: Float32Array) => {
    setValue(data[data.length - 1].toFixed(4));
  }, []);

  useEffect(() => {
    if (!ready) return;
    subscribeNode(nodeId, handleData);
    return () => {
      unsubscribeNode(nodeId);
    };
  }, [handleData, nodeId, ready, subscribeNode, unsubscribeNode]);

  return <span className="datagraph-node__value-display">{value}</span>;
}
