import { NodeInteractionProps } from "../../node.types";
import { AnyNodeState } from "../../nodes.context";
import { Node } from "./Node";
import { ParamNode } from "./ParamNode";
import { VisualizerNode } from "./VisualizerNode";

import React from "react";

export type NodeRendererProps = {
  node: AnyNodeState;
} & NodeInteractionProps;

export const NodeRenderer = React.memo(function NodeRenderer({
  node,
  selected,
  onClick,
}: NodeRendererProps) {
  switch (node.kind) {
    case "param:slider":
    case "param:button":
      return <ParamNode {...node} selected={selected} onClick={onClick} />;
    case "oscilloscope":
      return <VisualizerNode {...node} selected={selected} onClick={onClick} />;
    default:
      return (
        <Node
          {...node}
          label={node.kind}
          inputPorts={node.inputPorts ?? []}
          outputPorts={node.outputPorts ?? []}
          selected={selected}
          onClick={onClick}
        />
      );
  }
});
