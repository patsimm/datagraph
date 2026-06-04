import {
  isDatagraphNodeState,
  isOutputNodeState,
  isParamNodeState,
  isVisualizerNodeState,
  NodeInteractionProps,
} from "../../node.types";
import { AnyNodeState } from "../../nodes.context";
import { SequencerNode } from "./datagraph/SequencerNode";
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

  if (isOutputNodeState(node)) {
    return (
      <Node
        kind="output"
        nodeId={node.nodeId}
        rustNodeType={node.rustNodeType}
        canvasX={node.canvasX}
        canvasY={node.canvasY}
        label="speaker"
        inputPorts={node.inputPorts}
        outputPorts={[]}
        {...interactionProps}
      />
    );
  }

  if (isDatagraphNodeState(node)) {
    if (node.config?.typename === "datagraph::nodes::sequencer::Sequencer") {
      return (
        <SequencerNode
          {...node}
          {...interactionProps}
          inputPorts={node.inputPorts ?? []}
          outputPorts={node.outputPorts ?? []}
        />
      );
    }
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
