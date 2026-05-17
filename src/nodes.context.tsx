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
      if (!ready) return;
      if (config.kind === "param:slider" || config.kind === "param:button") {
        const nodeId = await addParamToGraph(config.value);
        setNodes((prev) => ({
          ...prev,
          [nodeId]: {
            nodeId,
            onChange: handleParamChange,
            inputPorts: [],
            outputPorts: ["output"].map((name) => name).map((name) => ({ name, connectedTo: [] })),
            ...config,
          },
        }));
      } else if (config.kind === "oscilloscope") {
        const { nodeId } = await addNodeToGraph({ kind: "passthrough" });
        setNodes((prev) => ({
          ...prev,
          [nodeId]: {
            nodeId,
            inputPorts: ["input"].map((name) => ({ name, connectedTo: [] })),
            outputPorts: ["output"].map((name) => ({ name, connectedTo: [] })),
            ...config,
          },
        }));
      } else {
        const { x, y, ...spec } = config;
        const info = await addNodeToGraph(spec);
        setNodes((prev) => ({
          ...prev,
          [info.nodeId]: {
            nodeId: info.nodeId,
            inputPorts: info.inputNames.map((name) => ({ name, connectedTo: [] })),
            outputPorts: info.outputNames.map((name) => ({ name, connectedTo: [] })),
            kind: spec.kind,
            x,
            y,
          },
        }));
      }
    },
    [addNodeToGraph, addParamToGraph, handleParamChange, ready]
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

  return { nodes, addNode, removeNode, updateNodeState };
}

const nodesContext = createContext<{
  nodes: { [nodeId: string]: AnyNodeState };
  addNode: (config: AnyNodeConfig) => Promise<void>;
  removeNode: (nodeId: string) => Promise<void>;
  updateNodeState: (nodeId: string, update: (current: AnyNodeState) => AnyNodeState) => void;
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
});

export function NodesProvider({ children }: { children: React.ReactNode }) {
  const { nodes, addNode, removeNode, updateNodeState } = useAllNodes();

  return (
    <nodesContext.Provider value={{ nodes, addNode, removeNode, updateNodeState }}>
      {children}
    </nodesContext.Provider>
  );
}

export function useNodes() {
  return useContext(nodesContext);
}
