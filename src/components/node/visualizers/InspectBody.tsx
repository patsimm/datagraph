import { useLatestPortValues } from "../latest-port-value.context";

import { useMemo, useState } from "react";

export function InspectBody({ nodeId }: { nodeId: string }) {
  const ports = useMemo(() => [{ nodeId, port: 0, portType: "in" as const }], [nodeId]);
  const [values, setValues] = useState([0]);
  useLatestPortValues(ports, setValues);

  return <span className="datagraph-node__value-display">{(values[0] ?? 0).toFixed(4)}</span>;
}
