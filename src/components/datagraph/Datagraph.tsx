import { useDatagraph } from "../../datagraph.context";
import "./Datagraph.css";
import { useNodeDragging } from "./node-dragging.hook";
import { useEdgeDragging } from "./edge-dragging.hook";
import { Edge } from "../edge/Edge";
import { PortInfo, portKey } from "../node/Node";
import { ContextMenu } from "../contextmenu/ContextMenu";
import { NodeSpec } from "../../audio-worklet/datagraph-audio-worklet-commands";
import { OutputNode } from "../node/OutputNode";
import { ContextView } from "./ContextView";
import { useSelection } from "../../selection.context";
import { useNodes } from "../../nodes.context";
import { Nodes } from "./Nodes";
import { useEdges } from "../../edges.context";

import React, { useCallback, useEffect, useState } from "react";

export function Datagraph() {
  const { ready, start } = useDatagraph();
  const { addNode, addParam, addVisualizer, removeNode } = useNodes();
  const [outputNode, setOutputNode] = useState<string | null>(null);
  useNodeDragging();
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const { edges, addEdge, removeEdge, removeEdgesForNodes } = useEdges();
  const [draggedPort, setDraggedPort] = useState<PortInfo | null>(null);
  const { selectedNodeId, setSelectedNodeId } = useSelection();

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

  const handleNodeClick = useCallback(
    (nodeId: string) => {
      setSelectedNodeId(nodeId);
    },
    [setSelectedNodeId]
  );

  const handleClickAddVisualizer = useCallback(async () => {
    if (!menu || !ready) return;
    await addVisualizer({ x: menu.x, y: menu.y });
    setMenu(null);
  }, [addVisualizer, menu, ready]);

  const handleKeyDown = useCallback(
    async (ev: KeyboardEvent) => {
      if (!selectedNodeId) return;
      if (ev.key === "Backspace" || ev.key === "Delete") {
        removeEdgesForNodes(selectedNodeId);
        removeNode(selectedNodeId);
        setSelectedNodeId(null);
      }
    },
    [removeEdgesForNodes, removeNode, selectedNodeId, setSelectedNodeId]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  return (
    <div onContextMenu={handleContextMenu} className="datagraph">
      <ContextView />
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
      <Nodes onNodeClick={handleNodeClick} />
      {outputNode && <OutputNode nodeId={outputNode} x={200} y={500} />}
    </div>
  );
}
