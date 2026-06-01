import { useNodes } from "../nodes.context";
import { usePortConnections } from "../edges.context";
import { NodeInfo } from "../audio-worklet/datagraph-audio-worklet-commands";
import { useRestoreNodes } from "./restore-nodes.hook";
import {
  normalizePortInfo,
  OUTPUT_SENTINEL,
  SerializedGraphState,
  retrieveGraphState,
} from "./utils";

import { useCallback } from "react";

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

    const state: SerializedGraphState = retrieveGraphState(normalizedNodes, normalizedEdges);
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

      let state: SerializedGraphState;
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
        const outputState = state.nodes.find((node) => node.originalNodeId === OUTPUT_SENTINEL);
        if (outputState) {
          updateNodePosition(outputNodeInfo.nodeId, {
            canvasX: outputState.canvasX,
            canvasY: outputState.canvasY,
          });
        }
        preSeedMap.set(OUTPUT_SENTINEL, outputNodeInfo);
      }

      await restoreNodes(state, preSeedMap);
    };
    input.click();
  }, [nodes, outputNodeInfo, disconnectNodes, removeNode, restoreNodes, updateNodePosition]);

  return { saveGraph, loadGraph };
}
