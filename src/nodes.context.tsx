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
import { NodeInfo, PASSTHROUGH_TYPENAME } from "./audio-worklet/datagraph-audio-worklet-commands";
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
    resetDefaultInputValue: resetDefaultInputValueInGraph,
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
      if (isParamKind(kind)) {
        const typedConfig = config as NodeState<"param:slider" | "param:button">["config"];
        const typedSettings = settings as AnyParamNodeState["settings"];
        const initialCvValue = typedSettings?.unit
          ? convertToCv(typedConfig.value, typedSettings.unit)
          : typedConfig.value;
        const nodeId = await addParamToGraph(initialCvValue);
        const info = await nodeInfo(nodeId);
        setNodes((prev) => ({
          ...prev,
          [nodeId]: {
            nodeId,
            kind,
            rustNodeType: info.nodeType,
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
        return info;
      } else if (isVisualizerKind(kind)) {
        const info = await addNodeToGraph({ kind: "datagraph", typename: PASSTHROUGH_TYPENAME });
        setNodes((prev) => ({
          ...prev,
          [info.nodeId]: {
            nodeId: info.nodeId,
            kind,
            inputPorts: ["input"].map((name) => ({
              type: "in",
              name,
              connectedTo: [],
              defaultValue: 0,
              isDefaultModified: false,
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
        return info;
      } else {
        const info = await addNodeToGraph({
          kind: "datagraph",
          typename: (config as { typename: string }).typename,
        });
        setNodes((prev) => ({
          ...prev,
          [info.nodeId]: {
            nodeId: info.nodeId,
            inputPorts: info.inputNames.map((name, index) => ({
              type: "in",
              name,
              connectedTo: [],
              defaultValue: info.defaultInputValues[index] ?? 0,
              isDefaultModified: false,
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
        return info;
      }
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
            i === port ? { ...p, defaultValue: value, isDefaultModified: true } : p
          ),
        },
      }));
    },
    [ready, setDefaultInputValueInGraph]
  );

  const resetDefaultInputValue = useCallback(
    async (nodeId: string, port: number) => {
      if (!ready) return;
      await resetDefaultInputValueInGraph(nodeId, port);
      setNodes((prev) => ({
        ...prev,
        [nodeId]: {
          ...prev[nodeId],
          inputPorts: prev[nodeId].inputPorts.map((p, i) =>
            i === port ? { ...p, defaultValue: 0, isDefaultModified: false } : p
          ),
        },
      }));
    },
    [ready, resetDefaultInputValueInGraph]
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
    resetDefaultInputValue,
  };
}

const nodesContext = createContext<{
  nodes: { [nodeId: string]: AnyNodeState };
  addNode: <T extends NodeKind>(
    kind: T,
    position: { x: number; y: number },
    config: NodeState<T>["config"],
    settings: NodeState<T>["settings"]
  ) => Promise<NodeInfo | null>;
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
  resetDefaultInputValue: (nodeId: string, port: number) => Promise<void>;
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
  resetDefaultInputValue: async () => {
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
    resetDefaultInputValue,
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
        resetDefaultInputValue,
      }}
    >
      {children}
    </nodesContext.Provider>
  );
}

export function useNodes() {
  return useContext(nodesContext);
}
