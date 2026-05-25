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
    [nodeId: string]: Pick<AnyNodeState, "kind" | "x" | "y" | "config" | "settings"> & {
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
    x: nodeState.x,
    y: nodeState.y,
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
  const { nodes, addNode, removeNode, setDefaultInputValue } = useNodes();
  const { edges, connect, disconnectNodes } = usePortConnections();

  const saveGraph = useCallback(() => {
    const normalizedEdges = edges.map((edge) => ({
      from: normalizePortInfo(edge.from, outputNodeInfo?.nodeId ?? null),
      to: normalizePortInfo(edge.to, outputNodeInfo?.nodeId ?? null),
    }));

    const state: GraphState = retrieveGraphState(nodes, normalizedEdges);
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `datagraph-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [edges, nodes, outputNodeInfo?.nodeId]);

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

      const currentNodeIds = Object.keys(nodes);
      if (currentNodeIds.length > 0) {
        disconnectNodes(...currentNodeIds);
        for (const id of currentNodeIds) {
          await removeNode(id);
        }
      }

      const infoMap = new Map<string, NodeInfo>();
      if (outputNodeInfo?.nodeId) {
        infoMap.set(OUTPUT_SENTINEL, outputNodeInfo);
      }

      for (const [oldId, nodeState] of Object.entries(state.nodes)) {
        const newInfo = await addNode(
          nodeState.kind,
          { x: nodeState.x, y: nodeState.y },
          nodeState.config,
          nodeState.settings
        );
        if (newInfo) infoMap.set(oldId, newInfo);
      }

      for (const edge of state.edges) {
        const from = denormalizePortInfo(edge.from, infoMap);
        const to = denormalizePortInfo(edge.to, infoMap);
        if (from && to) {
          await connect(from, to);
        }
      }

      for (const [oldId, nodeState] of Object.entries(state.nodes)) {
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
  }, [nodes, outputNodeInfo, disconnectNodes, removeNode, addNode, connect, setDefaultInputValue]);

  return { saveGraph, loadGraph };
}
