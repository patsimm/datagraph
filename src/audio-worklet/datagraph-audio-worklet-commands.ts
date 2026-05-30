import type {
  GraphEvent,
  PortInfo as WasmPortInfo,
  NodeInfo as WasmNodeInfo,
} from "@patsimm/datagraph-core";

export type { GraphEvent };

export type AnyNodeSpec = { kind: "datagraph"; typename: string };

export type NodeSpecKind = AnyNodeSpec["kind"];

export const PASSTHROUGH_TYPENAME = "datagraph::nodes::math::Passthrough";

export type NodeInfo = {
  nodeId: string;
  inputNames: string[];
  outputNames: string[];
  nodeType: string;
  defaultInputValues: number[];
};

export type NodeAddedEvent = Extract<GraphEvent, { type: "nodeAdded" }>;
export type NodeRemovedEvent = Extract<GraphEvent, { type: "nodeRemoved" }>;
export type ConnectedEvent = Extract<GraphEvent, { type: "connected" }>;
export type DisconnectedEvent = Extract<GraphEvent, { type: "disconnected" }>;
export type PortSnapshotEvent = Extract<GraphEvent, { type: "portSnapshot" }>;
export type TriggerEvent = Extract<GraphEvent, { type: "trigger" }>;

export type GraphEventType = GraphEvent["type"];
export type GraphEventHandler<T extends GraphEventType> = (
  event: Extract<GraphEvent, { type: T }>
) => void;

export type { WasmPortInfo, WasmNodeInfo };
