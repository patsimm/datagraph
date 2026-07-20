import { useDatagraph } from "./datagraph.context";
import {
  NodeInfo,
  PASSTHROUGH_TYPENAME,
  NodeRemovedEvent,
  WasmNodeInfo,
} from "./audio-worklet/datagraph-audio-worklet-commands";
import {
  AnyParamNodeState,
  defaultNodeSettings,
  isNodeStateOfKind,
  isParamKind,
  isParamNodeState,
  isVisualizerKind,
  type AnyNodeState,
  type NodeKind,
  type NodeState,
} from "./node.types";
import { convertToCv } from "./unit-conversion";
import { isPointInRect, PanZoomCanvasPosition, PanZoomCanvasRect } from "./components/canvas/utils";

import { useState, useCallback, useEffect, createContext, useContext } from "react";

function toNodeInfo(wasmInfo: WasmNodeInfo): NodeInfo {
  return {
    nodeId: wasmInfo.nodeId,
    nodeType: wasmInfo.nodeType,
    inputNames: wasmInfo.inputNames as string[],
    outputNames: wasmInfo.outputNames as string[],
    defaultInputValues: [...wasmInfo.defaultInputValues] as number[],
  };
}

export type {
  AnyNodeState,
  AnyParamNodeState,
  AnyParamNodeConfig as AnyParamConfig,
} from "./node.types";

type PendingCreation = {
  name: string;
  kind: NodeKind;
  position: PanZoomCanvasPosition;
  config: unknown;
  settings: unknown;
};

function buildNodeState(info: NodeInfo, pending: PendingCreation): AnyNodeState {
  const { kind, position, config, settings, name } = pending;
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
      name,
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
      name,
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
      name,
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

  useEffect(() => {
    if (!ready) return;

    const handleNodeRemoved = ({ nodeInfo }: NodeRemovedEvent) => {
      setNodes((prev) => {
        const next = { ...prev };
        delete next[nodeInfo.nodeId];
        return next;
      });
    };

    on("nodeRemoved", handleNodeRemoved);
    return () => {
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
      const unit = node.settings?.unit;
      const cvValue = unit ? convertToCv(value, unit) : value;
      setParamInGraph(nodeId, cvValue);
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
    <T extends NodeKind>(
      name: string,
      kind: T,
      position: PanZoomCanvasPosition,
      config: NodeState<T>["config"],
      settings?: Partial<NodeState<T>["settings"]>
    ): Promise<NodeInfo | null> => {
      if (!ready) return Promise.resolve(null);

      let wasmInfo: WasmNodeInfo | undefined;
      const initializedSettings = {
        ...defaultNodeSettings[kind],
        ...settings,
      };
      if (isParamKind(kind)) {
        const typedConfig = config as NodeState<"param:slider" | "param:button">["config"];
        const cvValue = initializedSettings?.unit
          ? convertToCv(typedConfig.value, initializedSettings.unit)
          : typedConfig.value;
        wasmInfo = addParamToGraph(cvValue);
      } else if (isVisualizerKind(kind)) {
        wasmInfo = addNodeToGraph({ kind: "datagraph", typename: PASSTHROUGH_TYPENAME });
      } else {
        wasmInfo = addNodeToGraph({
          kind: "datagraph",
          typename: (config as { typename: string }).typename,
        });
      }

      if (!wasmInfo) return Promise.resolve(null);
      const info = toNodeInfo(wasmInfo);
      const pending: PendingCreation = {
        name,
        kind,
        position,
        config,
        settings: initializedSettings,
      };
      setNodes((prev) => ({ ...prev, [info.nodeId]: buildNodeState(info, pending) }));
      return Promise.resolve(info);
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

  const injectOutputNode = useCallback((info: NodeInfo, position: PanZoomCanvasPosition) => {
    setNodes((prev) => ({
      ...prev,
      [info.nodeId]: {
        name: "Speaker",
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
  }, []);

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
    name: string,
    kind: T,
    position: PanZoomCanvasPosition,
    config: NodeState<T>["config"],
    settings?: Partial<NodeState<T>["settings"]>
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
