import { NodeInfo } from "../../audio-worklet/datagraph-audio-worklet-commands";
import { usePortConnections } from "../../edges.context";
import { NodePortState } from "../../node.types";
import { Node } from "./Node";

import { useMemo } from "react";

export type OutputNodeProps = {
  node: NodeInfo;
  x: number;
  y: number;
};
const OUTPUT_PORTS: NodePortState[] = [];

export function OutputNode({ node, x, y }: OutputNodeProps) {
  const { edges, connect } = usePortConnections();

  const inputPorts = useMemo(() => {
    const connectedTo = edges.filter((e) => e.to.nodeId === node.nodeId).map((e) => e.from);
    return [
      {
        type: "in" as const,
        name: "input",
        connectedTo,
        defaultValue: 0,
        isDefaultModified: false,
      },
    ];
  }, [edges, node.nodeId]);

  return (
    <Node
      kind="output"
      inputPorts={inputPorts}
      outputPorts={OUTPUT_PORTS}
      onPortConnectionCompleted={connect}
      onCanvasPositionChanged={console.log}
      rustNodeType={node.nodeType}
      canvasX={x}
      canvasY={y}
      label="speaker"
      nodeId={node.nodeId}
    ></Node>
  );
}
