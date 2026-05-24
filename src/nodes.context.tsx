import { useDatagraph } from "./datagraph.context";
import {
  AnyParamNodeState,
  isNodeStateOfKind,
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
    setDefaultInputValue: setDefaultInputValueInGraph,
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
        const { nodeType } = await nodeInfo(nodeId);
        setNodes((prev) => ({
          ...prev,
          [nodeId]: {
            nodeId,
            kind,
            rustNodeType: nodeType,
            inputPorts: [],
            outputPorts: ["output"]
              .map((name) => name)
              .map((name) => ({
                type: "out",
                name,
                connectedTo: [],
              })),
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
            inputPorts: ["input"].map((name) => ({
              type: "in",
              name,
              connectedTo: [],
              defaultValue: 0,
            })),
            outputPorts: ["output"].map((name) => ({
              type: "out",
              name,
              connectedTo: [],
            })),
            rustNodeType: info.nodeType,
            ...position,
            settings: undefined,
            config: undefined,
          } as AnyNodeState,
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
            inputPorts: info.inputNames.map((name, index) => ({
              type: "in",
              name,
              connectedTo: [],
              defaultValue: info.defaultInputValues[index] ?? 0,
            })),
            outputPorts: info.outputNames.map((name) => ({
              type: "out",
              name,
              connectedTo: [],
            })),
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

  const updateNodeSettings = useCallback(
    async <T extends NodeKind>(
      kind: T,
      nodeId: string,
      updateNodeSettings: (current: NodeState<T>["settings"]) => NodeState<T>["settings"]
    ) => {
      if (!ready) return;
      const node = nodes[nodeId];
      if (!node) throw new Error(`Node ${nodeId} not found`);
      if (!isNodeStateOfKind(node, kind)) throw new Error(`Node ${nodeId} is not of kind ${kind}`);
      const updatedSettings = updateNodeSettings(node.settings as NodeState<T>["settings"]);
      updateNodeState(
        nodeId,
        (current) =>
          ({
            ...current,
            settings: updatedSettings,
          }) as AnyNodeState
      );
      if (isParamKind(kind) && isParamNodeState(node)) {
        const pramSetings = updatedSettings as AnyParamNodeState["settings"];
        await setParamInGraph(nodeId, convertToCv(node.config.value, pramSetings.unit));
      }
    },
    [nodes, ready, setParamInGraph, updateNodeState]
  );

  const setDefaultInputValue = useCallback(
    async (nodeId: string, port: number, value: number) => {
      if (!ready) return;
      await setDefaultInputValueInGraph(nodeId, port, value);
      setNodes((prev) => ({
        ...prev,
        [nodeId]: {
          ...prev[nodeId],
          inputPorts: prev[nodeId].inputPorts.map((p, i) =>
            i === port ? { ...p, defaultValue: value } : p
          ),
        },
      }));
    },
    [ready, setDefaultInputValueInGraph]
  );

  return {
    nodes,
    addNode,
    removeNode,
    updateNodeState,
    updateNodeSettings,
    getNode,
    setParamValue,
    setDefaultInputValue,
  };
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
  updateNodeSettings: <T extends NodeKind>(
    kind: T,
    nodeId: string,
    updateNodeSettings: (current: NodeState<T>["settings"]) => NodeState<T>["settings"]
  ) => Promise<void>;
  setDefaultInputValue: (nodeId: string, port: number, value: number) => Promise<void>;
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
  updateNodeSettings: async () => {
    throw new Error("Nodes context not initialized yet");
  },
  setDefaultInputValue: async () => {
    throw new Error("Nodes context not initialized yet");
  },
});

export function NodesProvider({ children }: { children: React.ReactNode }) {
  const {
    nodes,
    addNode,
    removeNode,
    updateNodeState,
    getNode,
    setParamValue,
    updateNodeSettings,
    setDefaultInputValue,
  } = useAllNodes();

  return (
    <nodesContext.Provider
      value={{
        nodes,
        addNode,
        removeNode,
        updateNodeState,
        getNode,
        setParamValue,
        updateNodeSettings,
        setDefaultInputValue,
      }}
    >
      {children}
    </nodesContext.Provider>
  );
}

export function useNodes() {
  return useContext(nodesContext);
}
