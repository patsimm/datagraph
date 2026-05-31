import { useDatagraph } from "../../datagraph.context";
import "./Datagraph.css";
import { getNodeKeyFromElement, PortInfo } from "../node/node-utils";
import { OutputNode } from "../node/OutputNode";
import { ContextView } from "./ContextView";
import { useSelection } from "../../selection.context";
import { useNodes } from "../../nodes.context";
import { Nodes } from "./Nodes";
import { usePortConnections } from "../../edges.context";
import {
  PanZoomCanvas,
  PanZoomCanvasContext,
  PanZoomCanvasProvider,
} from "../canvas/PanZoomCanvas";
import { NodeInfo } from "../../audio-worklet/datagraph-audio-worklet-commands";
import { Toolbar } from "./Toolbar";
import { Edges, EdgesHandle } from "../edge/Edges";

import React, { useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";

type NodeSelectionHandle = {
  nodeSelectionPointerDown: (e: React.PointerEvent) => boolean;
};

type NodeSelectionState = {
  startX: number;
  startY: number;
};

type SelectionClientRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

type NodeSelectionProps = {
  disableSelection?: boolean;
  onSelectionComplete?: (selectionClientRect: SelectionClientRect) => void;
  onSelectionChange?: (selectionClientRect: SelectionClientRect) => void;
  ref: React.Ref<NodeSelectionHandle>;
};

function NodeSelection({
  ref,
  disableSelection,
  onSelectionChange,
  onSelectionComplete,
}: NodeSelectionProps) {
  const selectionStateRef = useRef<NodeSelectionState | null>(null);
  const [selectionRect, setSelectionRect] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (disableSelection) return false;
      const eventTarget = e.target as Element;
      if (!(eventTarget instanceof HTMLElement) || eventTarget.dataset.canvasBackground !== "true")
        return false;
      const target = e.currentTarget as HTMLElement;
      target.setPointerCapture(e.pointerId);
      const x = e.clientX;
      const y = e.clientY;
      selectionStateRef.current = {
        startX: x,
        startY: y,
      };

      const handlePointerMove = (e: PointerEvent) => {
        if (!selectionStateRef.current) return;
        const x = e.clientX;
        const y = e.clientY;
        const width = x - selectionStateRef.current.startX;
        const height = y - selectionStateRef.current.startY;
        const newRect = {
          left: Math.min(selectionStateRef.current.startX, x),
          top: Math.min(selectionStateRef.current.startY, y),
          width: Math.abs(width),
          height: Math.abs(height),
        };
        setSelectionRect(newRect);
        onSelectionChange?.(newRect);
      };

      const handlePointerUp = (e: PointerEvent) => {
        if (!selectionStateRef.current) return;

        const target = e.currentTarget as HTMLElement;
        if (selectionRect) {
          onSelectionComplete?.(selectionRect);
        }
        setSelectionRect(null);
        target.removeEventListener("pointermove", handlePointerMove);
        target.removeEventListener("pointerup", handlePointerUp);
        target.removeEventListener("pointercancel", handlePointerCancel);
      };

      const handlePointerCancel = (e: PointerEvent) => {
        const target = e.currentTarget as HTMLElement;
        setSelectionRect(null);
        target.removeEventListener("pointermove", handlePointerMove);
        target.removeEventListener("pointerup", handlePointerUp);
        target.removeEventListener("pointercancel", handlePointerCancel);
      };

      target.addEventListener("pointermove", handlePointerMove);
      target.addEventListener("pointerup", handlePointerUp);
      target.addEventListener("pointercancel", handlePointerUp);
      return true;
    },
    [disableSelection, onSelectionChange, onSelectionComplete, selectionRect]
  );

  useImperativeHandle(ref, () => ({
    nodeSelectionPointerDown: handlePointerDown,
  }));

  return <>{selectionRect && <div className="node-selection" style={selectionRect} />}</>;
}

export function Datagraph() {
  const ref = useRef<HTMLDivElement>(null);
  const datagraph = useDatagraph();
  const { ready } = datagraph;
  const { removeNode } = useNodes();
  const [outputNode, setOutputNode] = useState<NodeInfo | null>(null);
  const { disconnectPorts, disconnectNodes } = usePortConnections();
  const { handleNodeSelected } = useSelection();
  const edgesHandleRef = useRef<EdgesHandle>(null);
  const nodeSelectionHandleRef = useRef<NodeSelectionHandle>(null);
  const canvasHandle = useRef<PanZoomCanvasContext | null>(null);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (edgesHandleRef.current?.portConnectPointerDown(e)) return;
    nodeSelectionHandleRef.current?.nodeSelectionPointerDown(e);
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    edgesHandleRef.current?.portConnectPointerUp(e);
  }, []);

  const handleEdgeClick = useCallback(
    (edge: { from: PortInfo; to: PortInfo }, ev: React.MouseEvent) => {
      console.log("Edge clicked", edge);
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
    <PanZoomCanvasProvider canvasHandle={canvasHandle}>
      {" "}
      <div ref={ref} onKeyDown={handleKeyDown} className="datagraph">
        {outputNode && <Toolbar outputNode={outputNode} />}
        <ContextView />
        <div
          className="datagraph__canvas"
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
        >
          <NodeSelection ref={nodeSelectionHandleRef} disableSelection />
          <PanZoomCanvas ref={canvasHandle}>
            <Nodes onNodeClick={handleNodeClick} />
            <Edges ref={edgesHandleRef} onEdgeClick={handleEdgeClick} />
            {outputNode && <OutputNode node={outputNode} x={200} y={500} />}
          </PanZoomCanvas>
        </div>
      </div>
    </PanZoomCanvasProvider>
  );
}
