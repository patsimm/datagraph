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
import {
  NodeInfo,
  PASSTHROUGH_TYPENAME,
  NodeAddedEvent,
  NodeRemovedEvent,
} from "./audio-worklet/datagraph-audio-worklet-commands";
import { convertToCv } from "./unit-conversion";
import { isPointInRect, PanZoomCanvasPosition, PanZoomCanvasRect } from "./components/canvas/utils";

import { useState, useCallback, useEffect, useRef, createContext, useContext } from "react";

export type {
  AnyNodeState,
  AnyParamNodeState,
  AnyParamNodeConfig as AnyParamConfig,
} from "./node.types";

type PendingCreation = {
  kind: NodeKind;
  position: PanZoomCanvasPosition;
  config: unknown;
  settings: unknown;
  resolve: (info: NodeInfo) => void;
};

function buildNodeState(info: NodeInfo, pending: PendingCreation): AnyNodeState {
  const { kind, position, config, settings } = pending;
  if (isParamKind(kind)) {
    const typedConfig = config as { value: number };
    return {
      nodeId: info.nodeId,
      kind,
      rustNodeType: info.nodeType,
      inputPorts: [],
      outputPorts: [{ type: "out", name: "output", connectedTo: [] }],
      ...position,
      config: { value: typedConfig.value },
      settings,
    } as AnyNodeState;
  } else if (isVisualizerKind(kind)) {
    return {
      nodeId: info.nodeId,
      kind,
      inputPorts: [
        { type: "in", name: "input", connectedTo: [], defaultValue: 0, isDefaultModified: false },
      ],
      outputPorts: [{ type: "out", name: "output", connectedTo: [] }],
      rustNodeType: info.nodeType,
      ...position,
      settings: undefined,
      config: undefined,
    } as AnyNodeState;
  } else {
    return {
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
    } as AnyNodeState;
  }
}

function useAllNodes() {
  const {
    ready,
    addNode: addNodeToGraph,
    addParam: addParamToGraph,
    removeNode: removeNodeFromGraph,
    setParam: setParamInGraph,
    setDefaultInputValue: setDefaultInputValueInGraph,
    resetDefaultInputValue: resetDefaultInputValueInGraph,
    on,
    off,
  } = useDatagraph();
  const [nodes, setNodes] = useState<{ [nodeId: string]: AnyNodeState }>({});
  const pendingCreations = useRef<PendingCreation[]>([]);

  useEffect(() => {
    if (!ready) return;

    const handleNodeAdded = ({ nodeInfo }: NodeAddedEvent) => {
      const pending = pendingCreations.current.shift();
      if (!pending) return;
      const info: NodeInfo = {
        nodeId: nodeInfo.nodeId,
        nodeType: nodeInfo.nodeType,
        inputNames: nodeInfo.inputNames as string[],
        outputNames: nodeInfo.outputNames as string[],
        defaultInputValues: [...nodeInfo.defaultInputValues] as number[],
      };
      setNodes((prev) => ({ ...prev, [info.nodeId]: buildNodeState(info, pending) }));
      pending.resolve(info);
    };

    const handleNodeRemoved = ({ nodeInfo }: NodeRemovedEvent) => {
      setNodes((prev) => {
        const next = { ...prev };
        delete next[nodeInfo.nodeId];
        return next;
      });
    };

    on("nodeAdded", handleNodeAdded);
    on("nodeRemoved", handleNodeRemoved);
    return () => {
      off("nodeAdded", handleNodeAdded);
      off("nodeRemoved", handleNodeRemoved);
    };
  }, [ready, on, off]);

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
      setParamInGraph(nodeId, convertToCv(value, unit));
      updateNodeState(
        nodeId,
        (current) =>
          ({
            config: { ...(current.config as object), value },
          }) as AnyNodeState
      );
    },
    [nodes, ready, setParamInGraph, updateNodeState]
  );

  const addNode = useCallback(
    <T extends NodeKind>(
      kind: T,
      position: PanZoomCanvasPosition,
      config: NodeState<T>["config"],
      settings: NodeState<T>["settings"]
    ): Promise<NodeInfo | null> => {
      if (!ready) return Promise.resolve(null);
      return new Promise((resolve) => {
        pendingCreations.current.push({ kind, position, config, settings, resolve });
        if (isParamKind(kind)) {
          const typedConfig = config as NodeState<"param:slider" | "param:button">["config"];
          const typedSettings = settings as AnyParamNodeState["settings"];
          const cvValue = typedSettings?.unit
            ? convertToCv(typedConfig.value, typedSettings.unit)
            : typedConfig.value;
          addParamToGraph(cvValue);
        } else if (isVisualizerKind(kind)) {
          addNodeToGraph({ kind: "datagraph", typename: PASSTHROUGH_TYPENAME });
        } else {
          addNodeToGraph({
            kind: "datagraph",
            typename: (config as { typename: string }).typename,
          });
        }
      });
    },
    [ready, addNodeToGraph, addParamToGraph]
  );

  const removeNode = useCallback(
    (nodeId: string) => {
      if (!ready) return;
      removeNodeFromGraph(nodeId);
    },
    [ready, removeNodeFromGraph]
  );

  const injectOutputNode = useCallback(
    (info: NodeInfo, position: PanZoomCanvasPosition) => {
      setNodes((prev) => ({
        ...prev,
        [info.nodeId]: {
          kind: "output",
          nodeId: info.nodeId,
          rustNodeType: info.nodeType,
          inputPorts: [
            { type: "in", name: "input", connectedTo: [], defaultValue: 0, isDefaultModified: false },
          ],
          outputPorts: [],
          settings: undefined,
          config: undefined,
          ...position,
        } as AnyNodeState,
      }));
    },
    []
  );

  const getNode = useCallback(
    (nodeId: string) => {
      return nodes[nodeId];
    },
    [nodes]
  );

  const updateNodeSettings = useCallback(
    <T extends NodeKind>(
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
        const paramSettings = updatedSettings as AnyParamNodeState["settings"];
        setParamInGraph(nodeId, convertToCv(node.config.value, paramSettings.unit));
      }
    },
    [nodes, ready, setParamInGraph, updateNodeState]
  );

  const setDefaultInputValue = useCallback(
    (nodeId: string, port: number, value: number) => {
      if (!ready) return;
      setDefaultInputValueInGraph(nodeId, port, value);
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
    (nodeId: string, port: number) => {
      if (!ready) return;
      resetDefaultInputValueInGraph(nodeId, port);
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

  const updateNodePosition = useCallback(
    (nodeId: string, position: PanZoomCanvasPosition) => {
      updateNodeState(nodeId, (current) => ({ ...current, ...position }));
    },
    [updateNodeState]
  );

  const getNodesInRange = useCallback(
    (range: PanZoomCanvasRect) => {
      const nodesInRange = Object.values(nodes).filter((node) => isPointInRect(node, range));
      return nodesInRange;
    },
    [nodes]
  );

  return {
    nodes,
    addNode,
    removeNode,
    injectOutputNode,
    updateNodeState,
    updateNodeSettings,
    getNode,
    setParamValue,
    setDefaultInputValue,
    resetDefaultInputValue,
    updateNodePosition,
    getNodesInRange,
  };
}

const nodesContext = createContext<{
  nodes: { [nodeId: string]: AnyNodeState };
  addNode: <T extends NodeKind>(
    kind: T,
    position: PanZoomCanvasPosition,
    config: NodeState<T>["config"],
    settings: NodeState<T>["settings"]
  ) => Promise<NodeInfo | null>;
  removeNode: (nodeId: string) => void;
  injectOutputNode: (info: NodeInfo, position: PanZoomCanvasPosition) => void;
  updateNodeState: (nodeId: string, update: (current: AnyNodeState) => AnyNodeState) => void;
  getNode: (nodeId: string) => AnyNodeState | undefined;
  setParamValue: (nodeId: string, value: number) => Promise<void>;
  updateNodeSettings: <T extends NodeKind>(
    kind: T,
    nodeId: string,
    updateNodeSettings: (current: NodeState<T>["settings"]) => NodeState<T>["settings"]
  ) => void;
  updateNodePosition: (nodeId: string, position: PanZoomCanvasPosition) => void;
  setDefaultInputValue: (nodeId: string, port: number, value: number) => void;
  resetDefaultInputValue: (nodeId: string, port: number) => void;
  getNodesInRange: (range: PanZoomCanvasRect) => AnyNodeState[];
}>({
  nodes: {},
  addNode: async () => {
    throw new Error("Nodes context not initialized yet");
  },
  removeNode: () => {
    throw new Error("Nodes context not initialized yet");
  },
  injectOutputNode: () => {
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
  updateNodePosition: () => {
    throw new Error("Nodes context not initialized yet");
  },
  setDefaultInputValue: () => {
    throw new Error("Nodes context not initialized yet");
  },
  resetDefaultInputValue: () => {
    throw new Error("Nodes context not initialized yet");
  },
  getNodesInRange: () => {
    throw new Error("Nodes context not initialized yet");
  },
});

export function NodesProvider({ children }: { children: React.ReactNode }) {
  const {
    nodes,
    addNode,
    removeNode,
    injectOutputNode,
    updateNodeState,
    getNode,
    setParamValue,
    updateNodeSettings,
    setDefaultInputValue,
    resetDefaultInputValue,
    updateNodePosition,
    getNodesInRange,
  } = useAllNodes();

  return (
    <nodesContext.Provider
      value={{
        nodes,
        addNode,
        removeNode,
        injectOutputNode,
        updateNodeState,
        getNode,
        setParamValue,
        updateNodeSettings,
        setDefaultInputValue,
        resetDefaultInputValue,
        updateNodePosition,
        getNodesInRange,
      }}
    >
      {children}
    </nodesContext.Provider>
  );
}

export function useNodes() {
  return useContext(nodesContext);
}
