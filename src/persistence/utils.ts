import { NodeInfo } from "../audio-worklet/datagraph-audio-worklet-commands";
import { PortInfo } from "../components/node/node-utils";
import { AnyNodeState } from "../node.types";

export const OUTPUT_SENTINEL = "__output__";

export type SerializedNodeState = Pick<
  AnyNodeState,
  "kind" | "canvasX" | "canvasY" | "config" | "settings" | "name"
> & { defaultInputValues: number[]; originalNodeId: string };

export type SerializedGraphState = {
  version: 1;
  nodes: SerializedNodeState[];
  edges: { from: PortInfo; to: PortInfo }[];
};

export function mapNodeStateToSerializedNodeState(nodeState: AnyNodeState): SerializedNodeState {
  return {
    name: nodeState.name,
    originalNodeId: nodeState.nodeId,
    kind: nodeState.kind,
    canvasX: nodeState.canvasX,
    canvasY: nodeState.canvasY,
    config: nodeState.config,
    settings: nodeState.settings,
    defaultInputValues: nodeState.inputPorts.map((p) => p.defaultValue),
  };
}

export function normalizePortInfo(port: PortInfo, outputNodeId: string | null): PortInfo {
  if (outputNodeId && port.nodeId === outputNodeId) {
    return { ...port, nodeId: OUTPUT_SENTINEL };
  }
  return port;
}

export function denormalizePortInfo(port: PortInfo, idMap: Map<string, NodeInfo>): PortInfo | null {
  const newId = idMap.get(port.nodeId)?.nodeId;
  if (!newId) return null;
  return { ...port, nodeId: newId };
}

export function retrieveGraphState(
  nodes: { [nodeId: string]: AnyNodeState },
  edges: { from: PortInfo; to: PortInfo }[]
): SerializedGraphState {
  return {
    version: 1,
    nodes: Object.entries(nodes).map(([id, nodeState]) => ({
      ...mapNodeStateToSerializedNodeState(nodeState),
      originalNodeId: id,
    })),
    edges,
  };
}
