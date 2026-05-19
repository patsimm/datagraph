import type { NodeSpec } from "./audio-worklet/datagraph-audio-worklet-commands";
import { PortInfo } from "./components/node/node-utils";

export type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

export type NodePort = {
  name: string;
  connectedTo: PortInfo[];
};

export type NodeBase = {
  nodeId: string;
  x: number;
  y: number;
  inputPorts: NodePort[];
  outputPorts: NodePort[];
  rustNodeType: string;
};

export type AnyAudioNodeState = NodeBase & {
  kind: NodeSpec["kind"];
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
  "nodeId" | "rustNodeType" | "inputPorts" | "outputPorts" | "onChange" | "label"
>;
export type AnyVisualizerNodeConfig = DistributiveOmit<
  AnyVisualizerNodeState,
  "nodeId" | "rustNodeType" | "inputPorts" | "outputPorts"
>;
export type AnyAudioNodeConfig = DistributiveOmit<
  AnyAudioNodeState,
  "nodeId" | "rustNodeType" | "inputPorts" | "outputPorts"
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

export type NodeState<T extends AnyNodeState["kind"]> = AnyNodeState extends infer U
  ? U extends { kind: T }
    ? U
    : never
  : never;
