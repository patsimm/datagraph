import { useDatagraph } from "../../datagraph.context";
import "./Datagraph.css";
import { usePortConnecting } from "./port-connecting.hook";
import { getNodeKeyFromElement, PortInfo, portKey } from "../node/node-utils";
import { ContextMenu } from "../contextmenu/ContextMenu";
import { OutputNode } from "../node/OutputNode";
import { ContextView } from "./ContextView";
import { useSelection } from "../../selection.context";
import { useNodes } from "../../nodes.context";
import type { NodeKind, NodeState } from "../../node.types";
import { Nodes } from "./Nodes";
import { usePortConnections } from "../../edges.context";
import { ScrollDragging, ScrollDraggingHandle } from "../scroll-dragging/ScrollDragging";
import { PortConnectionEdge } from "../edge/PortConnectionEdge";
import { Edge } from "../edge/Edge";

import React, { useCallback, useEffect, useRef, useState } from "react";

export function Datagraph() {
  const ref = useRef<HTMLDivElement>(null);
  const scrollDraggingRef = useRef<ScrollDraggingHandle>(null);
  const { ready, start } = useDatagraph();
  const { addNode, removeNode } = useNodes();
  const [outputNode, setOutputNode] = useState<string | null>(null);
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const { edges, disconnectPorts, disconnectNodes } = usePortConnections();
  const { handleNodeSelected } = useSelection();
  const {
    handlePointerDown: portConnectPointerDown,
    handlePointerUp: portConnectPointerUp,
    position: ghostPosition,
  } = usePortConnecting({ containerRef: scrollDraggingRef });

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      portConnectPointerDown(e);
    },
    [portConnectPointerDown]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      portConnectPointerUp(e);
    },
    [portConnectPointerUp]
  );

  const handleEdgeClick = useCallback(
    (edge: { from: PortInfo; to: PortInfo }, ev: React.MouseEvent) => {
      console.log("edge click");
      ev.stopPropagation();
      disconnectPorts([edge.from, edge.to]);
    },
    [disconnectPorts]
  );

  useEffect(() => {
    if (ready) return;
    start().then(({ outputNodeId }) => {
      setOutputNode(outputNodeId);
    });
  }, [ready, start]);

  const getCanvasPosition = useCallback((screenX: number, screenY: number) => {
    const canvas = document.querySelector(".scroll-dragging__content") as HTMLElement;
    if (!canvas) return { x: screenX, y: screenY };
    const r = canvas.getBoundingClientRect();
    return { x: screenX - r.left, y: screenY - r.top };
  }, []);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (!ready) return;
      setMenu({ x: e.clientX, y: e.clientY });
    },
    [ready]
  );

  const handleCloseContextMenu = useCallback((ev: React.MouseEvent) => {
    ev.stopPropagation();
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
    (nodeId: string, ev: React.MouseEvent) => {
      ev.stopPropagation();
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
    <div
      ref={ref}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      className="datagraph"
    >
      {menu && (
        <ContextMenu x={menu.x} y={menu.y} onClose={handleCloseContextMenu}>
          <div className="contextmenu__title">add Node</div>
          <button
            onClick={() =>
              handleClickAdd("sin", getCanvasPosition(menu.x, menu.y), undefined, undefined)
            }
          >
            sin
          </button>
          <button
            onClick={() =>
              handleClickAdd("saw", getCanvasPosition(menu.x, menu.y), undefined, undefined)
            }
          >
            saw
          </button>
          <button
            onClick={() =>
              handleClickAdd("square", getCanvasPosition(menu.x, menu.y), undefined, undefined)
            }
          >
            square
          </button>
          <button
            onClick={() =>
              handleClickAdd("multiply", getCanvasPosition(menu.x, menu.y), undefined, undefined)
            }
          >
            multiply
          </button>
          <button
            onClick={() =>
              handleClickAdd("add", getCanvasPosition(menu.x, menu.y), undefined, undefined)
            }
          >
            add
          </button>
          <button
            onClick={() =>
              handleClickAdd("delay", getCanvasPosition(menu.x, menu.y), undefined, undefined)
            }
          >
            delay
          </button>
          <button
            onClick={() =>
              handleClickAdd("one-pole", getCanvasPosition(menu.x, menu.y), undefined, undefined)
            }
          >
            one-pole lowpass
          </button>
          <button
            onClick={() =>
              handleClickAdd(
                "adsr",
                getCanvasPosition(menu.x, menu.y),
                { attack: 0.1, decay: 0.1, sustain: 0.8, release: 0.1 },
                undefined
              )
            }
          >
            adsr
          </button>
          <button
            onClick={() =>
              handleClickAdd("sequencer", getCanvasPosition(menu.x, menu.y), undefined, undefined)
            }
          >
            sequencer
          </button>
          <button
            onClick={() =>
              handleClickAdd("passthrough", getCanvasPosition(menu.x, menu.y), undefined, undefined)
            }
          >
            passthrough
          </button>
          <button
            onClick={() =>
              handleClickAdd(
                "param:slider",
                getCanvasPosition(menu.x, menu.y),
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
                getCanvasPosition(menu.x, menu.y),
                { value: 0 },
                { unit: "raw", onValue: 1, offValue: 0 }
              )
            }
          >
            button
          </button>
          <button
            onClick={() =>
              handleClickAdd(
                "visualizer:oscilloscope",
                getCanvasPosition(menu.x, menu.y),
                undefined,
                undefined
              )
            }
          >
            oscilloscope
          </button>
          <button
            onClick={() =>
              handleClickAdd(
                "visualizer:inspect",
                getCanvasPosition(menu.x, menu.y),
                undefined,
                undefined
              )
            }
          >
            inspect
          </button>
          <button
            onClick={() =>
              handleClickAdd(
                "param:input",
                getCanvasPosition(menu.x, menu.y),
                { value: 0 },
                { unit: "raw" }
              )
            }
          >
            input
          </button>
        </ContextMenu>
      )}

      <div className="datagraph__canvas" onClick={handleClick}>
        <ScrollDragging ref={scrollDraggingRef}>
          {ghostPosition && <Edge ghost {...ghostPosition} />}
          {edges.map((edge) => (
            <PortConnectionEdge
              containerRef={scrollDraggingRef}
              key={`${portKey(edge.from)}->${portKey(edge.to)}`}
              from={edge.from.node}
              fromPort={edge.from.port}
              to={edge.to.node}
              toPort={edge.to.port}
              onClick={(ev) => handleEdgeClick(edge, ev)}
            />
          ))}
          <Nodes onNodeClick={handleNodeClick} />
          {outputNode && <OutputNode label="speaker" nodeId={outputNode} x={200} y={500} />}
        </ScrollDragging>
      </div>
      <div className="datagraph__context-view">
        <ContextView />
      </div>
    </div>
  );
}
