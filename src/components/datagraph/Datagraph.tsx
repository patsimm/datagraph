import { useDatagraph } from "../../datagraph.context";
import "./Datagraph.css";
import { useNodeDragging } from "./node-dragging.hook";
import { useEdgeDragging } from "./edge-dragging.hook";
import { Edge } from "../edge/Edge";
import { PortInfo, Node, portKey, NodeProps } from "../node/Node";
import { ParamNode, ParamNodeProps } from "../node/ParamNode";
import { ContextMenu } from "../contextmenu/ContextMenu";
import { NodeSpec } from "../../audio-worklet/datagraph-audio-worklet-commands";
import { OutputNode } from "../node/OutputNode";
import { VisualizerNode, VisualizerNodeProps } from "../node/VisualizerNode";

import React, { useCallback, useEffect, useState } from "react";

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

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
  const [nodes, setNodes] = useState<NodeProps[]>([]);

  const addNode = useCallback(
    async (spec: NodeSpec, position: { x: number; y: number }) => {
      if (!ready) return;
      const info = await addNodeToGraph(spec);
      setNodes((nodes) => [
        ...nodes,
        {
          label: spec.kind,
          nodeId: info.nodeId,
          inputPorts: info.inputNames,
          outputPorts: info.outputNames,
          kind: spec.kind,
          ...position,
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
  type ParamState = DistributiveOmit<ParamNodeProps, "onClick" | "selected">;
  const [params, setParams] = useState<ParamState[]>([]);

  const addParam = useCallback(
    async (props: DistributiveOmit<ParamState, "nodeId">) => {
      if (!ready) return;
      const nodeId = await addParamToGraph(props.defaultValue);
      setParams((params) => [...params, { nodeId, ...props } as ParamState]);
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

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (!ready) return;
      setMenu({ x: e.clientX, y: e.clientY });
    },
    [ready]
  );

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

  const handleClickAddParam = useCallback(
    async (props: Parameters<typeof addParam>[0]) => {
      if (!menu || !ready) return;
      await addParam({ x: menu.x, y: menu.y, ...props });
      setMenu(null);
    },
    [addParam, menu, ready]
  );

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
    await addVisualizer({ x: menu.x, y: menu.y });
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

  return (
    <div onContextMenu={handleContextMenu} className="datagraph">
      {!ready && (
        <button className="datagraph__start-button" onClick={handleClickStart}>
          Start Datagraph
        </button>
      )}
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
          <button
            onClick={() =>
              handleClickAddParam({
                kind: "param:slider",
                min: 0,
                max: 1,
                defaultValue: 0,
                step: 0.01,
              })
            }
          >
            slider
          </button>
          <button
            onClick={() =>
              handleClickAddParam({
                kind: "param:button",
                onValue: 1,
                offValue: 0,
                defaultValue: 0,
              })
            }
          >
            button
          </button>
          <button onClick={handleClickAddVisualizer}>oscilloscope</button>
        </ContextMenu>
      )}

      <svg className="edge" ref={ghostRef}>
        <line className="edge__line edge__line--ghost" />
      </svg>
      {edges.map((edge) => (
        <Edge
          key={`${portKey(edge.from)}->${portKey(edge.to)}`}
          from={edge.from.node}
          fromPort={edge.from.port}
          to={edge.to.node}
          toPort={edge.to.port}
          onClick={() => handleEdgeClick(edge)}
        />
      ))}

      {params.map((p) => {
        return (
          <ParamNode
            key={p.nodeId}
            onClick={handleNodeClick}
            selected={selectedNodes.has(p.nodeId)}
            {...p}
          />
        );
      })}
      {visualizers.map((v) => (
        <VisualizerNode
          onClick={handleNodeClick}
          key={v.nodeId}
          selected={selectedNodes.has(v.nodeId)}
          {...v}
        />
      ))}
      {nodes.map((n) => (
        <Node
          onClick={handleNodeClick}
          key={n.nodeId}
          selected={selectedNodes.has(n.nodeId)}
          {...n}
        />
      ))}
      {outputNode && <OutputNode nodeId={outputNode} x={200} y={500} />}
    </div>
  );
}
