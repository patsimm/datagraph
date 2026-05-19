import { useDatagraph } from "./datagraph.context";
import type { AnyNodeState, AnyNodeConfig } from "./node.types";

import { useState, useCallback, createContext, useContext } from "react";

export type {
  AnyNodeState,
  AnyParamNodeState,
  AnyParamNodeConfig as AnyParamConfig,
} from "./node.types";

function useAllNodes() {
  const {
    ready,
    addNode: addNodeToGraph,
    addParam: addParamToGraph,
    removeNode: removeNodeFromGraph,
    nodeInfo,
    setParam,
  } = useDatagraph();
  const [nodes, setNodes] = useState<{ [nodeId: string]: AnyNodeState }>({});

  const updateNodeState = useCallback(
    (nodeId: string, update: (current: AnyNodeState) => AnyNodeState) => {
      if (!ready) return;
      setNodes((prev) => {
        const current = prev[nodeId];
        if (!current) return prev;
        return { ...prev, [nodeId]: update(current) };
      });
    },
    [ready]
  );

  const handleParamChange = useCallback(
    async (nodeId: string, value: number) => {
      if (!ready) return;
      await setParam(nodeId, value);
      updateNodeState(nodeId, (current) => ({ ...current, value }) as AnyNodeState);
    },
    [ready, setParam, updateNodeState]
  );

  const addNode = useCallback(
    async (config: AnyNodeConfig) => {
      if (!ready) return null;
      let nodeId: string;
      if (config.kind === "param:slider" || config.kind === "param:button") {
        nodeId = await addParamToGraph(config.value);
        const { nodeType } = await nodeInfo(nodeId);
        setNodes((prev) => ({
          ...prev,
          [nodeId]: {
            nodeId,
            onChange: handleParamChange,
            inputPorts: [],
            outputPorts: ["output"].map((name) => name).map((name) => ({ name, connectedTo: [] })),
            rustNodeType: nodeType,
            ...config,
          },
        }));
      } else if (config.kind === "oscilloscope") {
        const info = await addNodeToGraph({ kind: "passthrough" });
        nodeId = info.nodeId;
        setNodes((prev) => ({
          ...prev,
          [nodeId]: {
            nodeId,
            inputPorts: ["input"].map((name) => ({ name, connectedTo: [] })),
            outputPorts: ["output"].map((name) => ({ name, connectedTo: [] })),
            rustNodeType: info.nodeType,
            ...config,
          },
        }));
      } else {
        const { x, y, ...spec } = config;
        const info = await addNodeToGraph(spec);
        nodeId = info.nodeId;
        setNodes((prev) => ({
          ...prev,
          [info.nodeId]: {
            nodeId,
            inputPorts: info.inputNames.map((name) => ({ name, connectedTo: [] })),
            outputPorts: info.outputNames.map((name) => ({ name, connectedTo: [] })),
            kind: spec.kind,
            rustNodeType: info.nodeType,
            x,
            y,
          },
        }));
      }
      return nodeId;
    },
    [addNodeToGraph, addParamToGraph, handleParamChange, nodeInfo, ready]
  );

  const removeNode = useCallback(
    async (nodeId: string) => {
      if (!ready) return;
      await removeNodeFromGraph(nodeId);
      setNodes((prev) => {
        const next = { ...prev };
        delete next[nodeId];
        return next;
      });
    },
    [ready, removeNodeFromGraph]
  );

  const getNode = useCallback(
    (nodeId: string) => {
      return nodes[nodeId];
    },
    [nodes]
  );

  return { nodes, addNode, removeNode, updateNodeState, getNode };
}

const nodesContext = createContext<{
  nodes: { [nodeId: string]: AnyNodeState };
  addNode: (config: AnyNodeConfig) => Promise<string | null>;
  removeNode: (nodeId: string) => Promise<void>;
  updateNodeState: (nodeId: string, update: (current: AnyNodeState) => AnyNodeState) => void;
  getNode: (nodeId: string) => AnyNodeState;
}>({
  nodes: {},
  addNode: async () => {
    throw new Error("Nodes context not initialized yet");
  },
  removeNode: async () => {
    throw new Error("Nodes context not initialized yet");
  },
  updateNodeState: () => {
    throw new Error("Nodes context not initialized yet");
  },
  getNode: () => {
    throw new Error("Nodes context not initialized yet");
  },
});

export function NodesProvider({ children }: { children: React.ReactNode }) {
  const { nodes, addNode, removeNode, updateNodeState, getNode } = useAllNodes();

  return (
    <nodesContext.Provider value={{ nodes, addNode, removeNode, updateNodeState, getNode }}>
      {children}
    </nodesContext.Provider>
  );
}

export function useNodes() {
  return useContext(nodesContext);
}
