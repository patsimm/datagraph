import { useNodes } from "../../nodes.context";
import { usePanZoomCanvas } from "../canvas/PanZoomCanvas";
import { getNodeElement } from "./node-utils";

import React, { useRef, useCallback } from "react";

type NodeDraggingState = {
  startDragX: number;
  startDragY: number;
  startLeft: number;
  startTop: number;
};

export function useNodeDragging(nodeId: string) {
  const panZoom = usePanZoomCanvas();
  const { updateNodeState, getNode } = useNodes();
  const draggingStateRef = useRef<NodeDraggingState | null>(null);

  const handlePointerMove = useCallback(
    (event: PointerEvent) => {
      if (!draggingStateRef.current) return;
      const draggingNodeElem = getNodeElement(nodeId);

      const canvasPos = panZoom.clientToCanvasPos(event);
      const x =
        canvasPos.x - draggingStateRef.current.startDragX + draggingStateRef.current.startLeft;
      const y =
        canvasPos.y - draggingStateRef.current.startDragY + draggingStateRef.current.startTop;
      draggingNodeElem.style.left = `${x}px`;
      draggingNodeElem.style.top = `${y}px`;
    },
    [nodeId, panZoom]
  );

  const handlePointerDown = useCallback(
    (event: React.PointerEvent) => {
      const target = event.target as HTMLElement;
      if (target.getAttribute("data-port")) return;

      event.stopPropagation();

      const { x: startDragX, y: startDragY } = panZoom.clientToCanvasPos(event);

      const nodeElem = event.currentTarget as HTMLElement;
      draggingStateRef.current = {
        startDragX,
        startDragY,
        startLeft: parseFloat(nodeElem.style.left) || 0,
        startTop: parseFloat(nodeElem.style.top) || 0,
      };

      nodeElem.setPointerCapture(event.pointerId);
      nodeElem.addEventListener("pointermove", handlePointerMove);
      nodeElem.classList.add("node--dragging");
    },
    [handlePointerMove, panZoom]
  );

  const handlePointerUp = useCallback(
    (event: React.PointerEvent) => {
      if (!draggingStateRef.current) return;

      const elem = event.currentTarget as HTMLElement;
      elem.removeEventListener("pointermove", handlePointerMove);
      elem.classList.remove("node--dragging");

      const didMove =
        event.clientX !== draggingStateRef.current.startDragX ||
        event.clientY !== draggingStateRef.current.startDragY;
      draggingStateRef.current = null;

      const draggingNodeElem = getNodeElement(nodeId);
      const x = parseFloat(draggingNodeElem.style.left);
      const y = parseFloat(draggingNodeElem.style.top);

      const node = getNode(nodeId);
      if (node && didMove) {
        updateNodeState(nodeId, (current) => ({ ...current, x, y }));
      }

      if (didMove) {
        const suppressClick = (e: MouseEvent) => {
          e.stopPropagation();
          document.removeEventListener("click", suppressClick, true);
        };
        document.addEventListener("click", suppressClick, true);
      }
    },
    [nodeId, getNode, updateNodeState, handlePointerMove]
  );

  return { handlePointerDown, handlePointerUp };
}
