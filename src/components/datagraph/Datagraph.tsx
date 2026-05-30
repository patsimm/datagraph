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
import { PanZoomCanvas } from "../canvas/PanZoomCanvas";
import { PortConnectionEdge } from "../edge/PortConnectionEdge";
import { Edge } from "../edge/Edge";
import { NodeInfo } from "../../audio-worklet/datagraph-audio-worklet-commands";
import { Toolbar } from "./Toolbar";

import React, { useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";

export function Datagraph() {
  const ref = useRef<HTMLDivElement>(null);
  const datagraph = useDatagraph();
  const { ready } = datagraph;
  const { removeNode } = useNodes();
  const [outputNode, setOutputNode] = useState<NodeInfo | null>(null);
  const { disconnectPorts, disconnectNodes } = usePortConnections();
  const { handleNodeSelected } = useSelection();
  const edgesHandleRef = useRef<EdgesHandle>(null);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    edgesHandleRef.current?.portConnectPointerDown(e);
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    edgesHandleRef.current?.portConnectPointerUp(e);
  }, []);

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
        <PanZoomCanvas>
          <Nodes onNodeClick={handleNodeClick} />
          <Edges ref={edgesHandleRef} onEdgeClick={handleEdgeClick} />
          {outputNode && <OutputNode node={outputNode} x={200} y={500} />}
        </PanZoomCanvas>
      </div>
    </div>
  );
}

type EdgesHandle = {
  portConnectPointerDown: (e: React.PointerEvent) => void;
  portConnectPointerUp: (e: React.PointerEvent) => void;
};

type EdgesProps = {
  onEdgeClick: (edge: { from: PortInfo; to: PortInfo }, ev: React.MouseEvent) => void;
  ref: React.Ref<EdgesHandle>;
};

function Edges({ ref, onEdgeClick }: EdgesProps) {
  const {
    handlePointerDown: portConnectPointerDown,
    handlePointerUp: portConnectPointerUp,
    position: ghostPosition,
  } = usePortConnecting();
  const { edges } = usePortConnections();

  useImperativeHandle(ref, () => ({
    portConnectPointerDown,
    portConnectPointerUp,
  }));

  return (
    <>
      {ghostPosition && <Edge ghost {...ghostPosition} />}
      {edges.map((edge) => (
        <PortConnectionEdge
          key={`${portKey(edge.from)}->${portKey(edge.to)}`}
          from={edge.from.nodeId}
          fromPort={edge.from.port}
          to={edge.to.nodeId}
          toPort={edge.to.port}
          onClick={(ev) => onEdgeClick?.(edge, ev)}
        />
      ))}
    </>
  );
}
