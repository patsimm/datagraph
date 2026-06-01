import { NodeInfo } from "../audio-worklet/datagraph-audio-worklet-commands";
import { usePortConnections } from "../edges.context";
import { useNodes } from "../nodes.context";
import { SerializedGraphState, denormalizePortInfo } from "./utils";

import { useCallback } from "react";

export function useRestoreNodes() {
  const { addNode, setDefaultInputValue } = useNodes();
  const { connect } = usePortConnections();

  return useCallback(
    async (
      { nodes, edges }: SerializedGraphState,
      preSeedMap: Map<string, NodeInfo> = new Map()
    ): Promise<Map<string, NodeInfo>> => {
      const idMap = new Map<string, NodeInfo>(preSeedMap);

      for (const nodeState of nodes) {
        if (idMap.has(nodeState.originalNodeId)) continue;
        const newInfo = await addNode(
          nodeState.kind,
          { canvasX: nodeState.canvasX, canvasY: nodeState.canvasY },
          nodeState.config,
          nodeState.settings
        );
        if (newInfo) idMap.set(nodeState.originalNodeId, newInfo);
      }

      for (const edge of edges) {
        const from = denormalizePortInfo(edge.from, idMap);
        const to = denormalizePortInfo(edge.to, idMap);
        if (from && to) connect(from, to);
      }

      for (const nodeState of nodes) {
        const newInfo = idMap.get(nodeState.originalNodeId);
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
