import { useNodes } from "./nodes.context";
import { usePortConnections } from "./edges.context";
import type { AnyNodeState } from "./node.types";
import type { PortInfo } from "./components/node/node-utils";
import { NodeInfo } from "./audio-worklet/datagraph-audio-worklet-commands";

import { useCallback } from "react";

const OUTPUT_SENTINEL = "__output__";

type GraphState = {
  version: 1;
  nodes: {
    [nodeId: string]: Pick<AnyNodeState, "kind" | "canvasX" | "canvasY" | "config" | "settings"> & {
      defaultInputValues: number[];
    };
  };
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

function mapNodeStateToGraphNodeState(nodeState: AnyNodeState): GraphState["nodes"][string] {
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
    mapNodeStateToGraphNodeState(nodeState),
  ]);
  return {
    version: 1,
    nodes: Object.fromEntries(n),
    edges: edges,
  };
}

export function useGraphPersistence(outputNodeInfo: NodeInfo | null) {
  const { nodes, addNode, removeNode, updateNodePosition, setDefaultInputValue } = useNodes();
  const { edges, connect, disconnectNodes } = usePortConnections();

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
          await removeNode(id);
        }
      }

      const infoMap = new Map<string, NodeInfo>();

      for (const [oldId, nodeState] of Object.entries(state.nodes)) {
        if (oldId === OUTPUT_SENTINEL) {
          if (outputNodeInfo) {
            updateNodePosition(outputNodeInfo.nodeId, {
              canvasX: nodeState.canvasX,
              canvasY: nodeState.canvasY,
            });
            infoMap.set(OUTPUT_SENTINEL, outputNodeInfo);
          }
          continue;
        }
        const newInfo = await addNode(
          nodeState.kind,
          { canvasX: nodeState.canvasX, canvasY: nodeState.canvasY },
          nodeState.config,
          nodeState.settings
        );
        if (newInfo) infoMap.set(oldId, newInfo);
      }

      // Ensure output node is mapped for edge restoration even if absent from saved nodes
      if (outputNodeInfo?.nodeId && !infoMap.has(OUTPUT_SENTINEL)) {
        infoMap.set(OUTPUT_SENTINEL, outputNodeInfo);
      }

      for (const edge of state.edges) {
        const from = denormalizePortInfo(edge.from, infoMap);
        const to = denormalizePortInfo(edge.to, infoMap);
        if (from && to) {
          await connect(from, to);
        }
      }

      for (const [oldId, nodeState] of Object.entries(state.nodes)) {
        if (oldId === OUTPUT_SENTINEL) continue;
        const newInfo = infoMap.get(oldId);
        if (!newInfo) continue;
        for (let i = 0; i < nodeState.defaultInputValues.length; i++) {
          const defaultValue = nodeState.defaultInputValues[i];
          if (defaultValue !== newInfo.defaultInputValues[i]) {
            await setDefaultInputValue(newInfo.nodeId, i, defaultValue);
          }
        }
      }
    };
    input.click();
  }, [nodes, outputNodeInfo, disconnectNodes, removeNode, addNode, connect, setDefaultInputValue, updateNodePosition]);

  return { saveGraph, loadGraph };
}
