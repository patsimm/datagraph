import type { AnyNodeSpec } from "./audio-worklet/datagraph-audio-worklet-commands";
import { PortInfo } from "./components/node/node-utils";
import { Unit } from "./unit-conversion";

export type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

export type NodePort = {
  name: string;
  connectedTo: PortInfo[];
};

export type NodeBase<T extends string, C = undefined, S = undefined> = {
  kind: T;
  nodeId: string;
  x: number;
  y: number;
  inputPorts: NodePort[];
  outputPorts: NodePort[];
  rustNodeType: string;
  settings: S;
  config: C;
};

type EmptyToUndefined<T> = keyof T extends never ? undefined : T;

export type AnyAudioNodeState = {
  [S in AnyNodeSpec as S["kind"]]: NodeBase<S["kind"], EmptyToUndefined<Omit<S, "kind">>>;
}[AnyNodeSpec["kind"]];

export type ParamNodeBase<T extends string, S> = NodeBase<
  T,
  {
    value: number;
  },
  S
>;

export type SliderParamNodeState = ParamNodeBase<
  "param:slider",
  {
    unit: Unit;
    min: number;
    max: number;
    step: number;
  }
>;
export type ButtonParamNodeState = ParamNodeBase<
  "param:button",
  {
    unit: Unit;
    onValue: number;
    offValue: number;
  }
>;
export type InputParamNodeState = ParamNodeBase<"param:input", { unit: Unit }>;

export function isParamKind(nodeState: AnyNodeState): nodeState is AnyParamNodeState {
  return nodeState.kind.startsWith("param:");
}

export type AnyParamNodeState = SliderParamNodeState | ButtonParamNodeState | InputParamNodeState;
export type ParamNodeState<T extends AnyParamNodeState["kind"]> = Extract<
  AnyParamNodeState,
  { kind: T }
>;
export type AnyVisualizerNodeState = NodeBase<"oscilloscope">;

export type AnyParamNodeConfig = DistributiveOmit<
  AnyParamNodeState,
  "nodeId" | "rustNodeType" | "inputPorts" | "outputPorts" | "label"
>;
export type AnyVisualizerNodeConfig = DistributiveOmit<
  AnyVisualizerNodeState,
  "nodeId" | "rustNodeType" | "inputPorts" | "outputPorts"
>;
export type AnyAudioNodeConfig = DistributiveOmit<
  AnyAudioNodeState,
  "nodeId" | "rustNodeType" | "inputPorts" | "outputPorts"
> &
  AnyNodeSpec;

export type AnyNodeConfig = AnyParamNodeConfig | AnyVisualizerNodeConfig | AnyAudioNodeConfig;
export type AnyNodeState = AnyAudioNodeState | AnyParamNodeState | AnyVisualizerNodeState;

export type NodeInteractionProps = {
  selected?: boolean;
  onClick?: (nodeId: string, event: React.MouseEvent<HTMLDivElement>) => void;
  onFocus?: (nodeId: string) => void;
  onBlur?: (nodeId: string) => void;
  onPortConnectionInitiated?: (startPort: PortInfo) => void;
  onPortConnectionCompleted?: (startPort: PortInfo, endPort: PortInfo) => void;
};

export type NodeKind = AnyNodeState["kind"];

export type NodeState<T extends NodeKind> = Extract<AnyNodeState, { kind: T }>;
