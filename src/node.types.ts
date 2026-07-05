import type { AnyNodeSpec } from "./audio-worklet/datagraph-audio-worklet-commands";
import { PanZoomCanvasPosition } from "./components/canvas/utils";
import { PortInfo } from "./components/node/node-utils";
import { Unit } from "./unit-conversion";

export type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

export type NodePortState =
  | {
      type: "in";
      name: string;
      connectedTo: PortInfo[];
      defaultValue: number;
      isDefaultModified: boolean;
    }
  | { type: "out"; name: string; connectedTo: PortInfo[] };

export type NodeInputPortState = Extract<NodePortState, { type: "in" }>;
export type NodeOutputPortState = Extract<NodePortState, { type: "out" }>;

export type NodeStateBase<T extends string, C = undefined, S = undefined> = {
  name?: string;
  kind: T;
  nodeId: string;
  inputPorts: NodeInputPortState[];
  outputPorts: NodeOutputPortState[];
  rustNodeType: string;
  settings: S;
  config: C;
} & PanZoomCanvasPosition;

type EmptyToUndefined<T> = keyof T extends never ? undefined : T;

export type AnyAudioNodeState = {
  [S in AnyNodeSpec as S["kind"]]: NodeStateBase<S["kind"], EmptyToUndefined<Omit<S, "kind">>>;
}[AnyNodeSpec["kind"]];

export type ParamNodeBase<T extends string, S> = NodeStateBase<
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

export type OscilloscopeVisualizerNodeState = NodeStateBase<"visualizer:oscilloscope">;
export type InspectVisualizerNodeState = NodeStateBase<"visualizer:inspect">;
export type AnyVisualizerNodeState = OscilloscopeVisualizerNodeState | InspectVisualizerNodeState;

export type VisualizerKind = AnyVisualizerNodeState["kind"];

export type OutputNodeState = NodeStateBase<"output">;

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
export type AnyNodeState =
  | AnyAudioNodeState
  | AnyParamNodeState
  | AnyVisualizerNodeState
  | OutputNodeState;

export type NodeInteractionProps = {
  inSelectionRange?: boolean;
  selected?: boolean;
  onClick?: (nodeId: string, event: React.MouseEvent<HTMLDivElement>) => void;
  onFocus?: (nodeId: string) => void;
  onBlur?: (nodeId: string) => void;
  onDragCompleted?: (nodeId: string, canvasPos: PanZoomCanvasPosition) => void;
  onDragMove?: (nodeId: string, canvasPos: PanZoomCanvasPosition) => void;
  externalDragOffset?: { dx: number; dy: number };
};

export type NodeKind = AnyNodeState["kind"];

export type NodeState<T extends NodeKind> = Extract<AnyNodeState, { kind: T }>;

export function isDatagraphNodeState(nodeState: AnyNodeState): nodeState is AnyAudioNodeState {
  return nodeState.kind === "datagraph";
}

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

export function isOutputNodeState(nodeState: AnyNodeState): nodeState is OutputNodeState {
  return nodeState.kind === "output";
}

export function isNodeStateOfKind<T extends NodeKind>(
  nodeState: AnyNodeState,
  kind: T
): nodeState is NodeState<T> {
  return nodeState.kind === kind;
}
