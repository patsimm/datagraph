import { isParamNodeState, isVisualizerNodeState, NodeInteractionProps } from "../../node.types";
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
  if (isParamNodeState(node)) {
    return <ParamNode {...node} {...interactionProps} />;
  }

  if (isVisualizerNodeState(node)) {
    return <VisualizerNode {...node} {...interactionProps} />;
  }

  return (
    <Node
      {...node}
      {...interactionProps}
      label={node.config?.typename?.split("::").at(-1) ?? node.kind}
      inputPorts={node.inputPorts ?? []}
      outputPorts={node.outputPorts ?? []}
    />
  );
});
