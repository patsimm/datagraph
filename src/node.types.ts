import type { NodeSpec } from "./audio-worklet/datagraph-audio-worklet-commands";
import { PortInfo } from "./components/node/node-utils";

export type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

export type NodeBase = { nodeId: string; x: number; y: number };

export type AnyAudioNodeState = NodeBase & {
  kind: NodeSpec["kind"];
  inputPorts: string[];
  outputPorts: string[];
};

export type ParamNodeBase = {
  value: number;
  onChange: (nodeId: string, value: number) => void;
} & NodeBase;

export type SliderParamNodeState = ParamNodeBase & {
  kind: "param:slider";
  min?: number;
  max?: number;
  step?: number;
};

export type ButtonParamNodeState = ParamNodeBase & {
  kind: "param:button";
  onValue: number;
  offValue: number;
};

export type AnyParamNodeState = SliderParamNodeState | ButtonParamNodeState;
export type AnyVisualizerNodeState = NodeBase & { kind: "oscilloscope" };

export type AnyParamNodeConfig = DistributiveOmit<
  AnyParamNodeState,
  "nodeId" | "onChange" | "label"
>;
export type AnyVisualizerNodeConfig = DistributiveOmit<AnyVisualizerNodeState, "nodeId">;
export type AnyAudioNodeConfig = DistributiveOmit<
  AnyAudioNodeState,
  "nodeId" | "inputPorts" | "outputPorts"
> &
  NodeSpec;

export type AnyNodeConfig = AnyParamNodeConfig | AnyVisualizerNodeConfig | AnyAudioNodeConfig;
export type AnyNodeState = AnyAudioNodeState | AnyParamNodeState | AnyVisualizerNodeState;

export type NodeInteractionProps = {
  selected?: boolean;
  onClick?: (nodeId: string, event: React.MouseEvent<HTMLDivElement>) => void;
  onPortConnectionInitiated?: (startPort: PortInfo) => void;
  onPortConnectionCompleted?: (startPort: PortInfo, endPort: PortInfo) => void;
};
