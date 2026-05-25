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
import { NodeInfo } from "../../audio-worklet/datagraph-audio-worklet-commands";
import { Toolbar } from "./Toolbar";

import React, { useCallback, useEffect, useRef, useState } from "react";

export function Datagraph() {
  const ref = useRef<HTMLDivElement>(null);
  const scrollDraggingRef = useRef<ScrollDraggingHandle>(null);
  const datagraph = useDatagraph();
  const { ready } = datagraph;
  const nodeTypes = datagraph.ready ? datagraph.nodeTypes : [];
  const { addNode, removeNode } = useNodes();
  const [outputNode, setOutputNode] = useState<NodeInfo | null>(null);
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
      ev.stopPropagation();
      disconnectPorts([edge.from, edge.to]);
    },
    [disconnectPorts]
  );

  useEffect(() => {
    if (ready) return;
    datagraph.start().then(({ outputNode }) => {
      setOutputNode(outputNode);
    });
  }, [ready, datagraph]);

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
      const nodeInfo = await addNode(kind, position, config, settings);
      setMenu(null);
      handleNodeSelected(nodeInfo?.nodeId ?? null);
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
          {nodeTypes.map((typename) => (
            <button
              key={typename}
              onClick={() =>
                handleClickAdd(
                  "datagraph",
                  getCanvasPosition(menu.x, menu.y),
                  { typename },
                  undefined
                )
              }
            >
              {typename.split("::").at(-1)}
            </button>
          ))}
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
      {outputNode && <Toolbar outputNode={outputNode} />}
      <ContextView />
      <div className="datagraph__canvas" onClick={handleClick}>
        <ScrollDragging ref={scrollDraggingRef}>
          {ghostPosition && <Edge ghost {...ghostPosition} />}
          {edges.map((edge) => (
            <PortConnectionEdge
              containerRef={scrollDraggingRef}
              key={`${portKey(edge.from)}->${portKey(edge.to)}`}
              from={edge.from.nodeId}
              fromPort={edge.from.port}
              to={edge.to.nodeId}
              toPort={edge.to.port}
              onClick={(ev) => handleEdgeClick(edge, ev)}
            />
          ))}
          <Nodes onNodeClick={handleNodeClick} />
          {outputNode && <OutputNode node={outputNode} x={200} y={500} />}
        </ScrollDragging>
      </div>
    </div>
  );
}
