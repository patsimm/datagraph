import { useDatagraph } from "./datagraph.context";
import {
  isParamKind,
  isParamNodeState,
  isVisualizerKind,
  type AnyNodeState,
  type NodeKind,
  type NodeState,
} from "./node.types";
import type { AnyNodeSpec } from "./audio-worklet/datagraph-audio-worklet-commands";
import { convertToCv } from "./unit-conversion";

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
    setParam: setParamInGraph,
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

  const setParamValue = useCallback(
    async (nodeId: string, value: number) => {
      if (!ready) return;
      const node = nodes[nodeId];
      if (!isParamNodeState(node)) {
        throw new Error(`Node ${nodeId} is not a param node`);
      }
      const unit = node.settings.unit;
      if (!unit) return;
      await setParamInGraph(nodeId, convertToCv(value, unit));
      updateNodeState(
        nodeId,
        (current) =>
          ({
            ...current,
            config: { ...(current.config as object), value },
          }) as AnyNodeState
      );
    },
    [nodes, ready, setParamInGraph, updateNodeState]
  );

  const addNode = useCallback(
    async <T extends NodeKind>(
      kind: T,
      position: { x: number; y: number },
      config: NodeState<T>["config"],
      settings: NodeState<T>["settings"]
    ) => {
      if (!ready) return null;
      let nodeId: string;
      if (isParamKind(kind)) {
        const typedConfig = config as NodeState<"param:slider" | "param:button">["config"];
        nodeId = await addParamToGraph(typedConfig.value);
        console.log("Added param node to graph with id", nodeId);
        const { nodeType } = await nodeInfo(nodeId);
        setNodes((prev) => ({
          ...prev,
          [nodeId]: {
            nodeId,
            kind,
            rustNodeType: nodeType,
            inputPorts: [],
            outputPorts: ["output"].map((name) => name).map((name) => ({ name, connectedTo: [] })),
            ...position,
            config: {
              value: typedConfig.value,
            },
            settings: {
              ...settings,
            },
          } as AnyNodeState,
        }));
      } else if (isVisualizerKind(kind)) {
        const info = await addNodeToGraph({ kind: "passthrough" });
        nodeId = info.nodeId;
        setNodes((prev) => ({
          ...prev,
          [nodeId]: {
            nodeId,
            kind,
            inputPorts: ["input"].map((name) => ({ name, connectedTo: [] })),
            outputPorts: ["output"].map((name) => ({ name, connectedTo: [] })),
            rustNodeType: info.nodeType,
            ...position,
            settings: undefined,
            config: undefined,
          } as unknown as AnyNodeState,
        }));
      } else {
        const info = await addNodeToGraph({
          kind,
          ...(config ?? {}),
        } as AnyNodeSpec);
        nodeId = info.nodeId;
        setNodes((prev) => ({
          ...prev,
          [info.nodeId]: {
            nodeId,
            inputPorts: info.inputNames.map((name) => ({ name, connectedTo: [] })),
            outputPorts: info.outputNames.map((name) => ({ name, connectedTo: [] })),
            kind,
            rustNodeType: info.nodeType,
            config,
            settings: undefined,
            ...position,
          } as AnyNodeState,
        }));
      }
      return nodeId;
    },
    [addNodeToGraph, addParamToGraph, nodeInfo, ready]
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

  return { nodes, addNode, removeNode, updateNodeState, getNode, setParamValue };
}

const nodesContext = createContext<{
  nodes: { [nodeId: string]: AnyNodeState };
  addNode: <T extends NodeKind>(
    kind: T,
    position: { x: number; y: number },
    config: NodeState<T>["config"],
    settings: NodeState<T>["settings"]
  ) => Promise<string | null>;
  removeNode: (nodeId: string) => Promise<void>;
  updateNodeState: (nodeId: string, update: (current: AnyNodeState) => AnyNodeState) => void;
  getNode: (nodeId: string) => AnyNodeState | undefined;
  setParamValue: (nodeId: string, value: number) => Promise<void>;
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
  setParamValue: async () => {
    throw new Error("Nodes context not initialized yet");
  },
});

export function NodesProvider({ children }: { children: React.ReactNode }) {
  const { nodes, addNode, removeNode, updateNodeState, getNode, setParamValue } = useAllNodes();

  return (
    <nodesContext.Provider
      value={{ nodes, addNode, removeNode, updateNodeState, getNode, setParamValue }}
    >
      {children}
    </nodesContext.Provider>
  );
}

export function useNodes() {
  return useContext(nodesContext);
}
