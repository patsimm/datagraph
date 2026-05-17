import { usePortConnections } from "../../edges.context";
import { NodePort } from "../../node.types";
import { Node, NodeProps } from "./Node";
import { PortInfo } from "./node-utils";

import { useCallback, useMemo } from "react";

export type OutputNodeProps = Omit<
  NodeProps,
  "inputPorts" | "outputPorts" | "kind" | "onPortConnectionCompleted"
>;

const OUTPUT_PORTS: NodePort[] = [];

export function OutputNode(props: OutputNodeProps) {
  const { edges, connect } = usePortConnections();

  const handleOutputConnectionCompleted = useCallback(
    async (port1: PortInfo, port2: PortInfo) => {
      console.log("Output connection completed", port1, port2);
      await connect(port1, port2);
    },
    [connect]
  );

  const inputPorts = useMemo(() => {
    const connectedTo = edges.filter((e) => e.to.node === props.nodeId).map((e) => e.from);
    return [{ name: "input", connectedTo }];
  }, [edges, props.nodeId]);

  return (
    <Node
      kind="output"
      inputPorts={inputPorts}
      outputPorts={OUTPUT_PORTS}
      onPortConnectionCompleted={handleOutputConnectionCompleted}
      {...props}
    ></Node>
  );
}
