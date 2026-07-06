import "./ParamNode.css";
import { Node } from "./Node";
import type { AnyParamNodeState, NodeInteractionProps } from "../../node.types";
import { useNodes } from "../../nodes.context";
import { ParamBody } from "./params/ParamBody";

export type ParamNodeProps = AnyParamNodeState & NodeInteractionProps;

export function ParamNode({ nodeId, config, ...nodeProps }: ParamNodeProps) {
  const { setParamValue } = useNodes();
  return (
    <Node nodeId={nodeId} label={nodeProps.kind.split(":")[1]} {...nodeProps}>
      <ParamBody nodeId={nodeId} onChange={setParamValue} config={config} {...nodeProps} />
    </Node>
  );
}

ParamNode.outputPortNames = ["value"];
