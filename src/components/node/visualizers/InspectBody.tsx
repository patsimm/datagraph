import { useLatestPortValues } from "../latest-port-values.hook";

import { useMemo } from "react";

export function InspectBody({ nodeId }: { nodeId: string }) {
  const ports = useMemo(() => [{ nodeId, port: 0, portType: "in" as const }], [nodeId]);
  const values = useLatestPortValues(ports);

  return <span className="datagraph-node__value-display">{values[0].toFixed(4)}</span>;
}
