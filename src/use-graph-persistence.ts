import { useNodes } from "./nodes.context";
import { usePortConnections } from "./edges.context";
import type { AnyNodeState } from "./node.types";
import type { PortInfo } from "./components/node/node-utils";
import { NodeInfo } from "./audio-worklet/datagraph-audio-worklet-commands";

import { useCallback } from "react";

const OUTPUT_SENTINEL = "__output__";

export type SerializedNodeState = Pick<
  AnyNodeState,
  "kind" | "canvasX" | "canvasY" | "config" | "settings"
> & { defaultInputValues: number[] };

type GraphState = {
  version: 1;
  nodes: { [nodeId: string]: SerializedNodeState };
  edges: { from: PortInfo; to: PortInfo }[];
};

function normalizePortInfo(port: PortInfo, outputNodeId: string | null): PortInfo {
  if (outputNodeId && port.nodeId === outputNodeId) {
    return { ...port, nodeId: OUTPUT_SENTINEL };
  }
  return port;
}

function denormalizePortInfo(port: PortInfo, idMap: Map<string, NodeInfo>): PortInfo | null {
  const newId = idMap.get(port.nodeId)?.nodeId;
  if (!newId) return null;
  return { ...port, nodeId: newId };
}

export function mapNodeStateToSerializedNodeState(nodeState: AnyNodeState): SerializedNodeState {
  return {
    kind: nodeState.kind,
    canvasX: nodeState.canvasX,
    canvasY: nodeState.canvasY,
    config: nodeState.config,
    settings: nodeState.settings,
    defaultInputValues: nodeState.inputPorts.map((p) => p.defaultValue),
  };
}

function retrieveGraphState(
  nodes: { [nodeId: string]: AnyNodeState },
  edges: { from: PortInfo; to: PortInfo }[]
): GraphState {
  const n = Object.entries(nodes).map(([id, nodeState]) => [
    id,
    mapNodeStateToSerializedNodeState(nodeState),
  ]);
  return {
    version: 1,
    nodes: Object.fromEntries(n),
    edges: edges,
  };
}

export function useRestoreNodes() {
  const { addNode, setDefaultInputValue } = useNodes();
  const { connect } = usePortConnections();

  return useCallback(
    async (
      nodes: { [oldId: string]: SerializedNodeState },
      edges: { from: PortInfo; to: PortInfo }[],
      preSeedMap: Map<string, NodeInfo> = new Map()
    ): Promise<Map<string, NodeInfo>> => {
      const idMap = new Map<string, NodeInfo>(preSeedMap);

      for (const [oldId, nodeState] of Object.entries(nodes)) {
        if (idMap.has(oldId)) continue;
        const newInfo = await addNode(
          nodeState.kind,
          { canvasX: nodeState.canvasX, canvasY: nodeState.canvasY },
          nodeState.config,
          nodeState.settings
        );
        if (newInfo) idMap.set(oldId, newInfo);
      }

      for (const edge of edges) {
        const from = denormalizePortInfo(edge.from, idMap);
        const to = denormalizePortInfo(edge.to, idMap);
        if (from && to) connect(from, to);
      }

      for (const [oldId, nodeState] of Object.entries(nodes)) {
        const newInfo = idMap.get(oldId);
        if (!newInfo) continue;
        for (let i = 0; i < nodeState.defaultInputValues.length; i++) {
          if (nodeState.defaultInputValues[i] !== newInfo.defaultInputValues[i]) {
            setDefaultInputValue(newInfo.nodeId, i, nodeState.defaultInputValues[i]);
          }
        }
      }

      return idMap;
    },
    [addNode, connect, setDefaultInputValue]
  );
}

export function useGraphPersistence(outputNodeInfo: NodeInfo | null) {
  const { nodes, removeNode, updateNodePosition } = useNodes();
  const { edges, disconnectNodes } = usePortConnections();
  const restoreNodes = useRestoreNodes();

  const saveGraph = useCallback(() => {
    const normalizedEdges = edges.map((edge) => ({
      from: normalizePortInfo(edge.from, outputNodeInfo?.nodeId ?? null),
      to: normalizePortInfo(edge.to, outputNodeInfo?.nodeId ?? null),
    }));

    const normalizedNodes = outputNodeInfo
      ? Object.fromEntries(
          Object.entries(nodes).map(([id, state]) =>
            id === outputNodeInfo.nodeId ? [OUTPUT_SENTINEL, state] : [id, state]
          )
        )
      : nodes;

    const state: GraphState = retrieveGraphState(normalizedNodes, normalizedEdges);
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `datagraph-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [edges, nodes, outputNodeInfo]);

  const loadGraph = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      let state: GraphState;
      try {
        state = JSON.parse(await file.text());
      } catch {
        alert("Invalid file.");
        return;
      }

      if (state.version !== 1) {
        alert("Unsupported file version.");
        return;
      }

      const allCurrentIds = Object.keys(nodes);
      const nodesToRemove = allCurrentIds.filter((id) => id !== outputNodeInfo?.nodeId);
      if (allCurrentIds.length > 0) {
        disconnectNodes(...allCurrentIds);
        for (const id of nodesToRemove) {
          removeNode(id);
        }
      }

      const preSeedMap = new Map<string, NodeInfo>();
      if (outputNodeInfo) {
        const outputState = state.nodes[OUTPUT_SENTINEL];
        if (outputState) {
          updateNodePosition(outputNodeInfo.nodeId, {
            canvasX: outputState.canvasX,
            canvasY: outputState.canvasY,
          });
        }
        preSeedMap.set(OUTPUT_SENTINEL, outputNodeInfo);
      }

      await restoreNodes(state.nodes, state.edges, preSeedMap);
    };
    input.click();
  }, [nodes, outputNodeInfo, disconnectNodes, removeNode, restoreNodes, updateNodePosition]);

  return { saveGraph, loadGraph };
}
