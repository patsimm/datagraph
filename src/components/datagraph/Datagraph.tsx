import { useDatagraph } from "../../datagraph.context";
import "./Datagraph.css";
import { useNodeDragging } from "./node-dragging.hook";
import { useEdgeDragging } from "./edge-dragging.hook";
import { DatagraphEdge } from "../edge/DatagraphEdge";
import { PortInfo, DatagraphNode, portKey, DatagraphNodeProps } from "../node/DatagraphNode";
import { DatagraphParamNode, DatagraphParamNodeProps } from "../node/DatagraphParamNode";
import { ContextMenu } from "../contextmenu/ContextMenu";
import { NodeSpec, NodeSpecKind } from "../../audio-worklet/datagraph-audio-worklet-commands";
import { DatagraphOutputNodeNode } from "../node/DatagraphOutputNode";
import {
  DatagraphVisualizerNode,
  DatagraphVisualizerNodeProps,
} from "../node/DatagraphVisualizerNode";

import React, { useCallback, useEffect, useState } from "react";

function useEdges() {
  const { ready, addConnection, removeConnection } = useDatagraph();
  const [edges, setEdges] = useState<{ from: PortInfo; to: PortInfo }[]>([]);

  const addEdge = useCallback(
    async (from: PortInfo, to: PortInfo) => {
      if (!ready) return;
      await addConnection(from.node, from.port, to.node, to.port);
      setEdges((edges) => [...edges, { from, to }]);
    },
    [addConnection, ready]
  );

  const removeEdge = useCallback(
    async (from: PortInfo, to: PortInfo) => {
      if (!ready) return;
      await removeConnection(from.node, from.port, to.node, to.port);
      setEdges((edges) => edges.filter((e) => e.from !== from || e.to !== to));
    },
    [ready, removeConnection]
  );

  return { edges, addEdge, removeEdge };
}

function useNodes() {
  const { ready, addNode: addNodeToGraph, removeNode: removeNodeFromGraph } = useDatagraph();
  const [nodes, setNodes] = useState<(DatagraphNodeProps & { kind: NodeSpecKind })[]>([]);

  const addNode = useCallback(
    async (spec: NodeSpec, position: { x: number; y: number }) => {
      if (!ready) return;
      const info = await addNodeToGraph(spec);
      setNodes((nodes) => [
        ...nodes,
        {
          label: spec.kind,
          nodeId: info.nodeId,
          position,
          inputPorts: info.inputNames,
          outputPorts: info.outputNames,
          kind: spec.kind,
        },
      ]);
    },
    [addNodeToGraph, ready]
  );

  const removeNode = useCallback(
    async (nodeId: string) => {
      if (!ready) return;
      await removeNodeFromGraph(nodeId);
      setNodes((nodes) => nodes.filter((n) => n.nodeId !== nodeId));
    },
    [ready, removeNodeFromGraph]
  );

  return {
    addNode,
    removeNode,
    nodes,
  };
}

function useParams() {
  const { ready, addParam: addParamToGraph, removeNode: removeNodeFromGraph } = useDatagraph();
  const [params, setParams] = useState<Omit<DatagraphParamNodeProps, "onClick" | "selected">[]>([]);

  const addParam = useCallback(
    async (value: number, position: { x: number; y: number }) => {
      if (!ready) return;
      const nodeId = await addParamToGraph(value);
      setParams((params) => [...params, { nodeId, kind: "param", value: value, position }]);
    },
    [addParamToGraph, ready]
  );

  const removeParam = useCallback(
    async (nodeId: string) => {
      if (!ready) return;
      await removeNodeFromGraph(nodeId);
      setParams((params) => params.filter((p) => p.nodeId !== nodeId));
    },
    [ready, removeNodeFromGraph]
  );

  return {
    params,
    addParam,
    removeParam,
  };
}

function useVisualizers() {
  const { ready, addNode, removeNode } = useDatagraph();
  const [visualizers, setVisualizers] = useState<
    Omit<DatagraphVisualizerNodeProps, "onClick" | "selected">[]
  >([]);

  const addVisualizer = useCallback(
    async (position: { x: number; y: number }) => {
      if (!ready) return;
      const { nodeId } = await addNode({ kind: "passthrough" });
      setVisualizers((visualizers) => [...visualizers, { nodeId, kind: "visualizer", position }]);
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

export function Datagraph() {
  const { ready, start } = useDatagraph();
  const { nodes, addNode, removeNode } = useNodes();
  const { params, addParam, removeParam } = useParams();
  const { visualizers, addVisualizer, removeVisizalizer } = useVisualizers();
  const [outputNode, setOutputNode] = useState<string | null>(null);
  useNodeDragging();
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set());
  const { edges, addEdge, removeEdge } = useEdges();
  const [draggedPort, setDraggedPort] = useState<PortInfo | null>(null);

  const handleEdgeDragStart = useCallback((port: PortInfo) => {
    setDraggedPort(port);
  }, []);

  const handleEdgeDragEnd = useCallback(
    async (port: PortInfo | null) => {
      if (!draggedPort || !port) {
        setDraggedPort(null);
        return;
      }
      if (draggedPort.portType === port.portType) {
        setDraggedPort(null);
        throw new Error(`Cannot connect ${draggedPort.portType} to ${port.portType}`);
      }
      const from = draggedPort.portType === "out" ? draggedPort : port;
      const to = draggedPort.portType === "in" ? draggedPort : port;
      await addEdge(from, to);
      setDraggedPort(null);
    },
    [addEdge, draggedPort]
  );

  const handleEdgeClick = useCallback(
    (edge: { from: PortInfo; to: PortInfo }) => removeEdge(edge.from, edge.to),
    [removeEdge]
  );

  const { ghostRef } = useEdgeDragging({
    onDragStart: handleEdgeDragStart,
    onDragEnd: handleEdgeDragEnd,
  });

  const handleClickStart = useCallback(async () => {
    if (ready) return;
    const { outputNodeId } = await start();
    setOutputNode(outputNodeId);
  }, [ready, start]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setMenu({ x: e.clientX, y: e.clientY });
  }, []);

  const handleCloseContextMenu = useCallback(() => {
    setMenu(null);
  }, []);

  const handleClickAdd = useCallback(
    async (spec: NodeSpec) => {
      if (!menu) return;
      await addNode(spec, { x: menu!.x, y: menu!.y });
      setMenu(null);
    },
    [addNode, menu]
  );

  const handleClickAddParam = useCallback(async () => {
    if (!menu || !ready) return;
    await addParam(0, { x: menu!.x, y: menu!.y });
    setMenu(null);
  }, [addParam, menu, ready]);

  const handleNodeClick = useCallback((nodeId: string, ev: React.MouseEvent) => {
    if (ev.shiftKey) {
      setSelectedNodes((selectedNodes) =>
        selectedNodes.has(nodeId)
          ? new Set([...selectedNodes].filter((n) => n !== nodeId))
          : new Set([...selectedNodes, nodeId])
      );
    } else {
      setSelectedNodes(new Set([nodeId]));
    }
  }, []);

  const handleClickAddVisualizer = useCallback(async () => {
    if (!menu || !ready) return;
    await addVisualizer({ x: menu!.x, y: menu!.y });
    setMenu(null);
  }, [addVisualizer, menu, ready]);

  const handleKeyDown = useCallback(
    async (ev: KeyboardEvent) => {
      if (!selectedNodes.size) return;
      if (ev.key === "Backspace" || ev.key === "Delete") {
        const edgesToRemove = edges.filter(
          (edge) =>
            (edge.from.node && selectedNodes.has(edge.from.node)) ||
            (edge.to.node && selectedNodes.has(edge.to.node))
        );
        for (const edge of edgesToRemove) {
          await removeEdge(edge.from, edge.to);
        }
        for (const nodeId of selectedNodes) {
          if (nodes.some((n) => n.nodeId === nodeId)) {
            await removeNode(nodeId);
          }
          if (params.some((p) => p.nodeId === nodeId)) {
            await removeParam(nodeId);
          }
          if (visualizers.some((v) => v.nodeId === nodeId)) {
            await removeVisizalizer(nodeId);
          }
        }
      }
    },
    [
      edges,
      nodes,
      params,
      removeEdge,
      removeNode,
      removeParam,
      removeVisizalizer,
      selectedNodes,
      visualizers,
    ]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  return ready ? (
    <div onContextMenu={handleContextMenu} className="datagraph">
      {menu && (
        <ContextMenu x={menu.x} y={menu.y} onClose={handleCloseContextMenu}>
          <div className="contextmenu__title">add Node</div>
          <button onClick={() => handleClickAdd({ kind: "sin" })}>sin</button>
          <button onClick={() => handleClickAdd({ kind: "saw" })}>saw</button>
          <button onClick={() => handleClickAdd({ kind: "square" })}>square</button>
          <button onClick={() => handleClickAdd({ kind: "multiply" })}>multiply</button>
          <button onClick={() => handleClickAdd({ kind: "add" })}>add</button>
          <button onClick={() => handleClickAdd({ kind: "delay" })}>delay</button>
          <button onClick={() => handleClickAdd({ kind: "one-pole" })}>one-pole lowpass</button>
          <button
            onClick={() =>
              handleClickAdd({ kind: "adsr", attack: 0.1, decay: 0.1, sustain: 0.7, release: 0.2 })
            }
          >
            adsr
          </button>
          <button onClick={() => handleClickAdd({ kind: "passthrough" })}>passthrough</button>
          <button onClick={handleClickAddParam}>param</button>
          <button onClick={handleClickAddVisualizer}>visualizer</button>
        </ContextMenu>
      )}

      <svg className="datagraph-edge" ref={ghostRef}>
        <line className="datagraph-edge__line datagraph-edge__line--ghost" />
      </svg>
      {edges.map((edge) => (
        <DatagraphEdge
          key={`${portKey(edge.from)}->${portKey(edge.to)}`}
          from={edge.from.node}
          fromPort={edge.from.port}
          to={edge.to.node}
          toPort={edge.to.port}
          onClick={() => handleEdgeClick(edge)}
        />
      ))}

      {params.map((p) => (
        <DatagraphParamNode
          onClick={handleNodeClick}
          key={p.nodeId}
          selected={selectedNodes.has(p.nodeId)}
          {...p}
        />
      ))}
      {visualizers.map((v) => (
        <DatagraphVisualizerNode
          onClick={handleNodeClick}
          key={v.nodeId}
          selected={selectedNodes.has(v.nodeId)}
          {...v}
        />
      ))}
      {nodes.map((n) => (
        <DatagraphNode
          onClick={handleNodeClick}
          key={n.nodeId}
          selected={selectedNodes.has(n.nodeId)}
          {...n}
        />
      ))}
      {outputNode && <DatagraphOutputNodeNode nodeId={outputNode} position={{ x: 200, y: 500 }} />}
    </div>
  ) : (
    <button onClick={handleClickStart}>Start Datagraph</button>
  );
}
