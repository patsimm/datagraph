import { NodeSpec } from "./audio-worklet/datagraph-audio-worklet-commands";
import { NodeProps } from "./components/node/Node";
import { ParamNodeProps } from "./components/node/ParamNode";
import { VisualizerNodeProps } from "./components/node/VisualizerNode";
import { useDatagraph } from "./datagraph.context";
import { useEdges } from "./edges.context";

import { useState, useCallback, createContext, useContext } from "react";

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

function useNodesList() {
  const { removeEdgesForNodes } = useEdges();
  const { ready, addNode: addNodeToGraph, removeNode: removeNodeFromGraph } = useDatagraph();
  const [nodes, setNodes] = useState<{ [key: string]: NodeProps }>({});

  const addNode = useCallback(
    async (spec: NodeSpec, position: { x: number; y: number }) => {
      if (!ready) return;
      const info = await addNodeToGraph(spec);
      setNodes((nodes) => ({
        ...nodes,
        [info.nodeId]: {
          label: spec.kind,
          nodeId: info.nodeId,
          inputPorts: info.inputNames,
          outputPorts: info.outputNames,
          kind: spec.kind,
          ...position,
        },
      }));
    },
    [addNodeToGraph, ready]
  );

  const removeNode = useCallback(
    async (nodeId: string) => {
      if (!ready) return;
      await removeEdgesForNodes(nodeId);
      await removeNodeFromGraph(nodeId);
      setNodes((prev) => {
        const next = { ...prev };
        delete next[nodeId];
        return next;
      });
    },
    [ready, removeEdgesForNodes, removeNodeFromGraph]
  );

  return {
    addNode,
    removeNode,
    nodes,
  };
}

type ParamState = DistributiveOmit<ParamNodeProps, "onClick" | "selected">;

function useParamsList() {
  const { ready, addParam: addParamToGraph, removeNode: removeNodeFromGraph } = useDatagraph();
  const [params, setParams] = useState<{ [nodeId: string]: ParamState }>({});

  const addParam = useCallback(
    async (props: DistributiveOmit<ParamState, "nodeId">) => {
      if (!ready) return;
      const nodeId = await addParamToGraph(props.defaultValue);
      setParams((params) => ({ ...params, [nodeId]: { nodeId, ...props } as ParamState }));
    },
    [addParamToGraph, ready]
  );

  const removeParam = useCallback(
    async (nodeId: string) => {
      if (!ready) return;
      await removeNodeFromGraph(nodeId);
      setParams((prev) => {
        const next = { ...prev };
        delete next[nodeId];
        return next;
      });
    },
    [ready, removeNodeFromGraph]
  );

  const updateParamSettings = useCallback(
    (nodeId: string, settings: ParamState) => {
      if (!ready) return;
      const current = params[nodeId];
      if (!current) return;
      const next = { ...current, ...settings };
      setParams((params) => ({ ...params, [nodeId]: next }));
    },
    [params, ready]
  );

  return {
    params,
    addParam,
    removeParam,
    updateParamSettings,
  };
}

function useVisualizersList() {
  const { ready, addNode, removeNode } = useDatagraph();
  const [visualizers, setVisualizers] = useState<
    Omit<VisualizerNodeProps, "onClick" | "selected">[]
  >([]);

  const addVisualizer = useCallback(
    async (position: { x: number; y: number }) => {
      if (!ready) return;
      const { nodeId } = await addNode({ kind: "passthrough" });
      setVisualizers((visualizers) => [
        ...visualizers,
        { nodeId, kind: "oscilloscope", ...position },
      ]);
    },
    [addNode, ready]
  );

  const removeVisizalizer = useCallback(
    async (nodeId: string) => {
      if (!ready) return;
      await removeNode(nodeId);
      setVisualizers((visualizers) => visualizers.filter((v) => v.nodeId !== nodeId));
    },
    [ready, removeNode]
  );

  return {
    visualizers,
    addVisualizer,
    removeVisizalizer,
  };
}

const nodesContext = createContext<{
  nodes: { [nodeId: string]: NodeProps };
  params: { [nodeId: string]: DistributiveOmit<ParamNodeProps, "onClick" | "selected"> };
  visualizers: Omit<VisualizerNodeProps, "onClick" | "selected">[];
  addNode: (spec: NodeSpec, position: { x: number; y: number }) => Promise<void>;
  addParam: (props: DistributiveOmit<ParamState, "nodeId">) => Promise<void>;
  updateParamSettings: (nodeId: string, settings: ParamState) => Promise<void>;
  addVisualizer: (position: { x: number; y: number }) => Promise<void>;
  removeNode: (nodeId: string) => Promise<void>;
}>({
  nodes: {},
  params: {},
  visualizers: [],
  addNode: async () => {
    throw new Error("Nodes context not initialized yet");
  },
  addParam: async () => {
    throw new Error("Nodes context not initialized yet");
  },
  updateParamSettings: async () => {
    throw new Error("Nodes context not initialized yet");
  },
  addVisualizer: async () => {
    throw new Error("Nodes context not initialized yet");
  },
  removeNode: async () => {
    throw new Error("Nodes context not initialized yet");
  },
});

export function NodesProvider({ children }: { children: React.ReactNode }) {
  const { visualizers, addVisualizer, removeVisizalizer } = useVisualizersList();
  const { params, addParam, removeParam, updateParamSettings } = useParamsList();
  const { nodes, addNode, removeNode: removeNodeFromList } = useNodesList();

  const handleRemoveNode = useCallback(
    async (nodeId: string) => {
      if (nodes[nodeId]) {
        await removeNodeFromList(nodeId);
      }
      if (params[nodeId]) {
        await removeParam(nodeId);
      }
      if (visualizers.some((v) => v.nodeId === nodeId)) {
        await removeVisizalizer(nodeId);
      }
    },
    [nodes, params, removeNodeFromList, removeParam, removeVisizalizer, visualizers]
  );

  return (
    <nodesContext.Provider
      value={{
        nodes,
        params,
        visualizers,
        addNode,
        addParam,
        addVisualizer,
        removeNode: handleRemoveNode,
        updateParamSettings,
      }}
    >
      {children}
    </nodesContext.Provider>
  );
}

export function useNodes() {
  return useContext(nodesContext);
}
