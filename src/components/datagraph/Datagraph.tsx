import { useDatagraph } from "../../datagraph.context";
import "./Datagraph.css";
import { useNodeDragging } from "./node-dragging.hook";
import { useEdgeDragging } from "./edge-dragging.hook";
import { Edge } from "../edge/Edge";
import { PortInfo, portKey } from "../node/node-utils";
import { ContextMenu } from "../contextmenu/ContextMenu";
import { OutputNode } from "../node/OutputNode";
import { ContextView } from "./ContextView";
import { useSelection } from "../../selection.context";
import { useNodes } from "../../nodes.context";
import { Nodes } from "./Nodes";
import { usePortConnections } from "../../edges.context";

import React, { useCallback, useEffect, useRef, useState } from "react";

export function Datagraph() {
  const ref = useRef<HTMLDivElement>(null);
  const { ready, start } = useDatagraph();
  const { addNode, removeNode } = useNodes();
  const [outputNode, setOutputNode] = useState<string | null>(null);
  useNodeDragging();
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const { edges, disconnectPorts, disconnectNodes } = usePortConnections();
  const { handleNodeSelected, getSelectedNode } = useSelection();

  const handleEdgeClick = useCallback(
    (edge: { from: PortInfo; to: PortInfo }) => disconnectPorts(edge.from, edge.to),
    [disconnectPorts]
  );

  const { ghostRef } = useEdgeDragging();

  useEffect(() => {
    if (ready) return;
    start().then(({ outputNodeId }) => {
      setOutputNode(outputNodeId);
    });
  }, [ready, start]);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target !== ref.current || !ready) return;
      setMenu({ x: e.clientX, y: e.clientY });
    },
    [ready]
  );

  const handleCloseContextMenu = useCallback(() => {
    setMenu(null);
  }, []);

  const handleClickAdd = useCallback(
    async (spec: Parameters<typeof addNode>[0]) => {
      const nodeId = await addNode(spec);
      setMenu(null);
      handleNodeSelected(nodeId);
    },
    [addNode, handleNodeSelected]
  );

  const handleNodeClick = useCallback(
    (nodeId: string) => {
      handleNodeSelected(nodeId);
    },
    [handleNodeSelected]
  );

  const handleKeyDown = useCallback(
    async (ev: KeyboardEvent) => {
      const selectedNode = getSelectedNode();
      if (!selectedNode) return;
      if (ev.key === "Backspace" || ev.key === "Delete") {
        disconnectNodes(selectedNode.nodeId);
        removeNode(selectedNode.nodeId);
        handleNodeSelected(null);
      }
    },
    [disconnectNodes, getSelectedNode, handleNodeSelected, removeNode]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  return (
    <div ref={ref} onClick={handleClick} className="datagraph">
      <ContextView />
      {menu && (
        <ContextMenu x={menu.x} y={menu.y} onClose={handleCloseContextMenu}>
          <div className="contextmenu__title">add Node</div>
          <button onClick={() => handleClickAdd({ kind: "sin", x: menu.x, y: menu.y })}>sin</button>
          <button onClick={() => handleClickAdd({ kind: "saw", x: menu.x, y: menu.y })}>saw</button>
          <button onClick={() => handleClickAdd({ kind: "square", x: menu.x, y: menu.y })}>
            square
          </button>
          <button onClick={() => handleClickAdd({ kind: "multiply", x: menu.x, y: menu.y })}>
            multiply
          </button>
          <button onClick={() => handleClickAdd({ kind: "add", x: menu.x, y: menu.y })}>add</button>
          <button onClick={() => handleClickAdd({ kind: "delay", x: menu.x, y: menu.y })}>
            delay
          </button>
          <button onClick={() => handleClickAdd({ kind: "one-pole", x: menu.x, y: menu.y })}>
            one-pole lowpass
          </button>
          <button
            onClick={() =>
              handleClickAdd({
                kind: "adsr",
                attack: 0.1,
                decay: 0.1,
                sustain: 0.8,
                release: 0.1,
                x: menu.x,
                y: menu.y,
              })
            }
          >
            adsr
          </button>
          <button onClick={() => handleClickAdd({ kind: "passthrough", x: menu.x, y: menu.y })}>
            passthrough
          </button>
          <button
            onClick={() =>
              handleClickAdd({
                kind: "param:slider",
                min: 0,
                max: 1,
                value: 0,
                step: 0.01,
                x: menu.x,
                y: menu.y,
              })
            }
          >
            slider
          </button>
          <button
            onClick={() =>
              handleClickAdd({
                kind: "param:button",
                onValue: 1,
                offValue: 0,
                value: 0,
                x: menu.x,
                y: menu.y,
              })
            }
          >
            button
          </button>
          <button onClick={() => handleClickAdd({ kind: "oscilloscope", x: menu.x, y: menu.y })}>
            oscilloscope
          </button>
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
      {outputNode && <OutputNode label="speaker" nodeId={outputNode} x={200} y={500} />}
    </div>
  );
}
