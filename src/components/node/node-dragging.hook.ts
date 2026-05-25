import { useNodes } from "../../nodes.context";
import { getNodeElement } from "./node-utils";

import React, { useRef, useCallback } from "react";

type NodeDraggingState = {
  startDragX: number;
  startDragY: number;
  startLeft: number;
  startTop: number;
};

export function useNodeDragging(nodeId: string) {
  const { updateNodeState, getNode } = useNodes();
  const draggingStateRef = useRef<NodeDraggingState | null>(null);

  const handlePointerMove = useCallback(
    (event: PointerEvent) => {
      if (!draggingStateRef.current) return;
      const draggingNodeElem = getNodeElement(nodeId);
      const x =
        event.clientX - draggingStateRef.current.startDragX + draggingStateRef.current.startLeft;
      const y =
        event.clientY - draggingStateRef.current.startDragY + draggingStateRef.current.startTop;
      draggingNodeElem.style.left = `${x}px`;
      draggingNodeElem.style.top = `${y}px`;
    },
    [nodeId]
  );

  const handlePointerDown = useCallback(
    (event: React.PointerEvent) => {
      const target = event.target as HTMLElement;
      if (target.getAttribute("data-port")) return;

      event.stopPropagation();

      const nodeElem = event.currentTarget as HTMLElement;
      draggingStateRef.current = {
        startDragX: event.clientX,
        startDragY: event.clientY,
        startLeft: parseFloat(nodeElem.style.left) || 0,
        startTop: parseFloat(nodeElem.style.top) || 0,
      };

      nodeElem.setPointerCapture(event.pointerId);
      nodeElem.addEventListener("pointermove", handlePointerMove);
      nodeElem.classList.add("node--dragging");
    },
    [handlePointerMove]
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
