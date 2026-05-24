import type { AnyNodeSpec } from "./audio-worklet/datagraph-audio-worklet-commands";
import { PortInfo } from "./components/node/node-utils";
import { Unit } from "./unit-conversion";

export type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

export type NodePort =
  | {
      type: "in";
      name: string;
      connectedTo: PortInfo[];
      defaultValue: number;
    }
  | { type: "out"; name: string; connectedTo: PortInfo[] };

export type NodeInputPort = Extract<NodePort, { type: "in" }>;
export type NodeOutputPort = Extract<NodePort, { type: "out" }>;

export type NodeBase<T extends string, C = undefined, S = undefined> = {
  kind: T;
  nodeId: string;
  x: number;
  y: number;
  inputPorts: NodeInputPort[];
  outputPorts: NodeOutputPort[];
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

export type AnyParamNodeState = SliderParamNodeState | ButtonParamNodeState | InputParamNodeState;
export type ParamNodeState<T extends AnyParamNodeState["kind"]> = Extract<
  AnyParamNodeState,
  { kind: T }
>;

export type ParamKind = AnyParamNodeState["kind"];

export type OscilloscopeVisualizerNodeState = NodeBase<"visualizer:oscilloscope">;
export type InspectVisualizerNodeState = NodeBase<"visualizer:inspect">;
export type AnyVisualizerNodeState = OscilloscopeVisualizerNodeState | InspectVisualizerNodeState;

export type VisualizerKind = AnyVisualizerNodeState["kind"];

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

export function isParamKind(kind: NodeKind): kind is ParamKind {
  return kind.startsWith("param:");
}
export function isParamNodeState(nodeState: AnyNodeState): nodeState is AnyParamNodeState {
  return isParamKind(nodeState.kind);
}
export function isVisualizerKind(kind: NodeKind): kind is VisualizerKind {
  return kind.startsWith("visualizer:");
}
export function isVisualizerNodeState(
  nodeState: AnyNodeState
): nodeState is AnyVisualizerNodeState {
  return isVisualizerKind(nodeState.kind);
}

export function isNodeStateOfKind<T extends NodeKind>(
  nodeState: AnyNodeState,
  kind: T
): nodeState is NodeState<T> {
  return nodeState.kind === kind;
}
