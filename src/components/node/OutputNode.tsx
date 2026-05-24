import { NodeInfo } from "../../audio-worklet/datagraph-audio-worklet-commands";
import { useDatagraph } from "../../datagraph.context";
import { usePortConnections } from "../../edges.context";
import { NodePort } from "../../node.types";
import { Node, NodeProps } from "./Node";
import { PortInfo } from "./node-utils";

import { useCallback, useEffect, useMemo, useState } from "react";

export type OutputNodeProps = Omit<
  NodeProps,
  "rustNodeType" | "inputPorts" | "outputPorts" | "kind" | "onPortConnectionCompleted"
>;

const OUTPUT_PORTS: NodePort[] = [];

export function OutputNode(props: OutputNodeProps) {
  const [info, setInfo] = useState<NodeInfo | null>(null);
  const { edges, connect } = usePortConnections();
  const { ready, nodeInfo } = useDatagraph();

  useEffect(() => {
    if (!ready) return;
    nodeInfo(props.nodeId).then(setInfo);
  }, [nodeInfo, props.nodeId, ready]);

  const handleOutputConnectionCompleted = useCallback(
    async (port1: PortInfo, port2: PortInfo) => {
      await connect(port1, port2);
    },
    [connect]
  );

  const inputPorts = useMemo(() => {
    const connectedTo = edges.filter((e) => e.to.nodeId === props.nodeId).map((e) => e.from);
    return [
      {
        type: "in" as const,
        name: "input",
        connectedTo,
        defaultValue: 0,
        isDefaultModified: false,
      },
    ];
  }, [edges, props.nodeId]);

  return (
    info && (
      <Node
        kind="output"
        inputPorts={inputPorts}
        outputPorts={OUTPUT_PORTS}
        onPortConnectionCompleted={handleOutputConnectionCompleted}
        rustNodeType={info.nodeType}
        {...props}
      ></Node>
    )
  );
}
