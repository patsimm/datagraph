import { useDatagraph } from "../../datagraph.context";
import "./Datagraph.css";
import { useNodeDragging } from "./node-dragging.hook";
import { useEdgeDragging } from "./edge-dragging.hook";
import { Edge } from "../edge/Edge";
import { getNodeKeyFromElement, PortInfo, portKey } from "../node/node-utils";
import { ContextMenu } from "../contextmenu/ContextMenu";
import { OutputNode } from "../node/OutputNode";
import { ContextView } from "./ContextView";
import { useSelection } from "../../selection.context";
import { useNodes } from "../../nodes.context";
import type { NodeKind, NodeState } from "../../node.types";
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
  const { handleNodeSelected } = useSelection();

  const handleEdgeClick = useCallback(
    (edge: { from: PortInfo; to: PortInfo }) => disconnectPorts([edge.from, edge.to]),
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
    async <T extends NodeKind>(
      kind: T,
      position: { x: number; y: number },
      config: NodeState<T>["config"],
      settings: NodeState<T>["settings"]
    ) => {
      const nodeId = await addNode(kind, position, config, settings);
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
      const nodeId =
        document.activeElement instanceof HTMLElement
          ? getNodeKeyFromElement(document.activeElement)
          : null;
      if (!nodeId) return;
      if (ev.key === "Backspace" || ev.key === "Delete") {
        disconnectNodes(nodeId);
        removeNode(nodeId);
        handleNodeSelected(null);
      }
    },
    [disconnectNodes, handleNodeSelected, removeNode]
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
          <button
            onClick={() => handleClickAdd("sin", { x: menu.x, y: menu.y }, undefined, undefined)}
          >
            sin
          </button>
          <button
            onClick={() => handleClickAdd("saw", { x: menu.x, y: menu.y }, undefined, undefined)}
          >
            saw
          </button>
          <button
            onClick={() => handleClickAdd("square", { x: menu.x, y: menu.y }, undefined, undefined)}
          >
            square
          </button>
          <button
            onClick={() =>
              handleClickAdd("multiply", { x: menu.x, y: menu.y }, undefined, undefined)
            }
          >
            multiply
          </button>
          <button
            onClick={() => handleClickAdd("add", { x: menu.x, y: menu.y }, undefined, undefined)}
          >
            add
          </button>
          <button
            onClick={() => handleClickAdd("delay", { x: menu.x, y: menu.y }, undefined, undefined)}
          >
            delay
          </button>
          <button
            onClick={() =>
              handleClickAdd("one-pole", { x: menu.x, y: menu.y }, undefined, undefined)
            }
          >
            one-pole lowpass
          </button>
          <button
            onClick={() =>
              handleClickAdd(
                "adsr",
                { x: menu.x, y: menu.y },
                { attack: 0.1, decay: 0.1, sustain: 0.8, release: 0.1 },
                undefined
              )
            }
          >
            adsr
          </button>
          <button
            onClick={() =>
              handleClickAdd("passthrough", { x: menu.x, y: menu.y }, undefined, undefined)
            }
          >
            passthrough
          </button>
          <button
            onClick={() =>
              handleClickAdd(
                "param:slider",
                { x: menu.x, y: menu.y },
                { value: 0 },
                { unit: "raw", min: 0, max: 1, step: 0.01 }
              )
            }
          >
            slider
          </button>
          <button
            onClick={() =>
              handleClickAdd(
                "param:button",
                { x: menu.x, y: menu.y },
                { value: 0 },
                { unit: "raw", onValue: 1, offValue: 0 }
              )
            }
          >
            button
          </button>
          <button
            onClick={() =>
              handleClickAdd("oscilloscope", { x: menu.x, y: menu.y }, undefined, undefined)
            }
          >
            oscilloscope
          </button>
          <button
            onClick={() =>
              handleClickAdd("param:input", { x: menu.x, y: menu.y }, { value: 0 }, { unit: "raw" })
            }
          >
            input
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
