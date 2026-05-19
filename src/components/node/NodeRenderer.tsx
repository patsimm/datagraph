import { isParamKind, NodeInteractionProps } from "../../node.types";
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
  ...interactionProps
}: NodeRendererProps) {
  if (isParamKind(node)) {
    return <ParamNode {...node} {...interactionProps} />;
  }

  switch (node.kind) {
    case "oscilloscope":
      return <VisualizerNode {...node} {...interactionProps} />;
    default:
      return (
        <Node
          {...node}
          {...interactionProps}
          label={node.kind}
          inputPorts={node.inputPorts ?? []}
          outputPorts={node.outputPorts ?? []}
        />
      );
  }
});
