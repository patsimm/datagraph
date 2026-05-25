import { useDatagraph } from "../../datagraph.context";
import "./Datagraph.css";
import { usePortConnecting } from "./port-connecting.hook";
import { getNodeKeyFromElement, PortInfo, portKey } from "../node/node-utils";
import { OutputNode } from "../node/OutputNode";
import { ContextView } from "./ContextView";
import { useSelection } from "../../selection.context";
import { useNodes } from "../../nodes.context";
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
  const { removeNode } = useNodes();
  const [outputNode, setOutputNode] = useState<NodeInfo | null>(null);
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

  const handleNodeClick = useCallback(
    (nodeId: string, ev: React.MouseEvent) => {
      ev.stopPropagation();
      handleNodeSelected(nodeId);
    },
    [handleNodeSelected]
  );

  const handleKeyDown = useCallback(
    (ev: React.KeyboardEvent) => {
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

  return (
    <div
      ref={ref}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onKeyDown={handleKeyDown}
      className="datagraph"
    >
      {outputNode && <Toolbar outputNode={outputNode} />}
      <ContextView />
      <div className="datagraph__canvas">
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
