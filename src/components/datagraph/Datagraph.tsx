import { useDatagraph } from "../../datagraph.context";
import "./Datagraph.css";
import { getNodeKeyFromElement, PortInfo } from "../node/node-utils";
import { useClipboard } from "../../use-clipboard";
import { ContextView } from "./ContextView";
import { useSelection } from "../../selection.context";
import { useNodes } from "../../nodes.context";
import { Nodes } from "./Nodes";
import { usePortConnections } from "../../edges.context";
import {
  PanZoomCanvas,
  PanZoomCanvasContext,
  PanZoomCanvasPointerEvent,
  PanZoomCanvasProvider,
  usePanZoomCanvas,
} from "../canvas/PanZoomCanvas";
import { NodeInfo } from "../../audio-worklet/datagraph-audio-worklet-commands";
import { Toolbar } from "./Toolbar";
import { Edges } from "../edge/Edges";
import { GhostEdgeProvider } from "../edge/ghost-edge.context";
import { PanZoomCanvasRect, ClientRect } from "../canvas/utils";

import React, { useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";

type NodeSelectionHandle = {
  nodeSelectionPointerDown: (e: PanZoomCanvasPointerEvent) => boolean;
};

type NodeSelectionProps = {
  disableSelection?: boolean;
  onSelectionComplete?: (selectionClientRect: PanZoomCanvasRect) => void;
  onSelectionChange?: (selectionClientRect: PanZoomCanvasRect) => void;
  ref: React.Ref<NodeSelectionHandle>;
};

function NodeSelection({
  ref,
  disableSelection,
  onSelectionChange,
  onSelectionComplete,
}: NodeSelectionProps) {
  const [selectionRect, setSelectionRect] = useState<ClientRect | null>(null);
  const { handleSelectionRangeChanged, handleRangeSelectionCompleted } = useSelection();
  const { clientToCanvasRect } = usePanZoomCanvas();

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (disableSelection) return false;
      if (e.button !== 0) return false;
      const target = e.currentTarget as HTMLElement;
      target.setPointerCapture(e.pointerId);
      const startX = e.clientX;
      const startY = e.clientY;
      let moved = false;

      const handlePointerMove = (e: PointerEvent) => {
        const x = e.clientX;
        const y = e.clientY;
        const width = x - startX;
        const height = y - startY;
        const newRect = {
          clientX: Math.min(startX, x),
          clientY: Math.min(startY, y),
          width: Math.abs(width),
          height: Math.abs(height),
        };
        setSelectionRect(newRect);

        const canvasRect = clientToCanvasRect(newRect);
        onSelectionChange?.(canvasRect);
        handleSelectionRangeChanged(canvasRect);
        moved = true;
      };

      const handlePointerUp = (e: PointerEvent) => {
        const x = e.clientX;
        const y = e.clientY;
        const width = x - startX;
        const height = y - startY;
        const newRect = {
          clientX: Math.min(startX, x),
          clientY: Math.min(startY, y),
          width: Math.abs(width),
          height: Math.abs(height),
        };

        if (moved) {
          const canvasRect = clientToCanvasRect(newRect);
          onSelectionComplete?.(canvasRect);
          handleRangeSelectionCompleted(canvasRect);
          const suppressClick = (ev: MouseEvent) => {
            ev.stopPropagation();
            document.removeEventListener("click", suppressClick, true);
          };
          document.addEventListener("click", suppressClick, true);
        }
        setSelectionRect(null);
        handleSelectionRangeChanged(null);
        const target = e.currentTarget as HTMLElement;
        target.releasePointerCapture(e.pointerId);
        target.removeEventListener("pointermove", handlePointerMove);
        target.removeEventListener("pointerup", handlePointerUp);
        target.removeEventListener("pointercancel", handlePointerCancel);
      };

      const handlePointerCancel = (e: PointerEvent) => {
        const target = e.currentTarget as HTMLElement;
        setSelectionRect(null);
        handleSelectionRangeChanged(null);
        target.removeEventListener("pointermove", handlePointerMove);
        target.removeEventListener("pointerup", handlePointerUp);
        target.removeEventListener("pointercancel", handlePointerCancel);
      };

      target.addEventListener("pointermove", handlePointerMove);
      target.addEventListener("pointerup", handlePointerUp);
      target.addEventListener("pointercancel", handlePointerUp);
      return true;
    },
    [
      clientToCanvasRect,
      disableSelection,
      handleRangeSelectionCompleted,
      handleSelectionRangeChanged,
      onSelectionChange,
      onSelectionComplete,
    ]
  );

  useImperativeHandle(ref, () => ({
    nodeSelectionPointerDown: handlePointerDown,
  }));

  return (
    <>
      {selectionRect && (
        <div
          className="node-selection"
          style={{
            left: selectionRect.clientX,
            top: selectionRect.clientY,
            width: selectionRect.width,
            height: selectionRect.height,
          }}
        />
      )}
    </>
  );
}

export function Datagraph() {
  const ref = useRef<HTMLDivElement>(null);
  const datagraph = useDatagraph();
  const { ready } = datagraph;
  const { removeNode, injectOutputNode } = useNodes();
  const [outputNode, setOutputNode] = useState<NodeInfo | null>(null);
  const { disconnectPorts, disconnectNodes } = usePortConnections();
  const { handleNodeSelected } = useSelection();
  const { copy, paste } = useClipboard();
  const nodeSelectionHandleRef = useRef<NodeSelectionHandle>(null);
  const canvasHandle = useRef<PanZoomCanvasContext | null>(null);

  const handlePointerDown = useCallback((e: PanZoomCanvasPointerEvent) => {
    nodeSelectionHandleRef.current?.nodeSelectionPointerDown(e);
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
      injectOutputNode(outputNode, { canvasX: 0, canvasY: 0 });
    });
  }, [ready, datagraph, injectOutputNode]);

  const handleNodeClick = useCallback(
    (nodeId: string, ev: React.MouseEvent) => {
      ev.stopPropagation();
      handleNodeSelected(nodeId);
    },
    [handleNodeSelected]
  );

  const handleKeyDown = useCallback(
    (ev: React.KeyboardEvent) => {
      if ((ev.metaKey || ev.ctrlKey) && ev.key === "c") {
        ev.preventDefault();
        copy();
        return;
      }
      if ((ev.metaKey || ev.ctrlKey) && ev.key === "v") {
        ev.preventDefault();
        paste();
        return;
      }
      const nodeId =
        document.activeElement instanceof HTMLElement
          ? getNodeKeyFromElement(document.activeElement)
          : null;
      if (!nodeId) return;
      if (nodeId === outputNode?.nodeId) return;
      if (ev.key === "Backspace" || ev.key === "Delete") {
        disconnectNodes(nodeId);
        removeNode(nodeId);
        handleNodeSelected(null);
      }
    },
    [copy, paste, disconnectNodes, handleNodeSelected, outputNode?.nodeId, removeNode]
  );

  return (
    <PanZoomCanvasProvider canvasHandle={canvasHandle}>
      <GhostEdgeProvider>
        <div ref={ref} onKeyDown={handleKeyDown} className="datagraph" tabIndex={-1}>
          {outputNode && <Toolbar outputNode={outputNode} />}
          <ContextView />
          <div className="datagraph__canvas">
            <NodeSelection ref={nodeSelectionHandleRef} />
            <PanZoomCanvas
              ref={canvasHandle}
              onPointerDown={handlePointerDown}
              onClick={() => {
                handleNodeSelected(null);
                ref.current?.focus();
              }}
            >
              <Nodes onNodeClick={handleNodeClick} />
              <Edges onEdgeClick={handleEdgeClick} />
            </PanZoomCanvas>
          </div>
        </div>
      </GhostEdgeProvider>
    </PanZoomCanvasProvider>
  );
}
