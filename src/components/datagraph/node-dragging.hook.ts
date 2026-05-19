import { useNodes } from "../../nodes.context";
import { getNodeKeyFromElement, getNodeElement } from "../node/node-utils";

import { useRef, useCallback, useEffect } from "react";

type NodeDraggingState = {
  draggingKey: string;
  startDragX: number;
  startDragY: number;
  startLeft: number;
  startTop: number;
};

export function useNodeDragging() {
  const { updateNodeState, getNode } = useNodes();
  const draggingStateRef = useRef<NodeDraggingState | null>(null);

  const handlePointerDown = useCallback(
    (event: PointerEvent) => {
      if (event.target instanceof HTMLElement) {
        const nodeKey = getNodeKeyFromElement(event.target);
        if (!nodeKey) return;

        const nodeElem = event.target as HTMLElement;
        const startDragX = event.clientX;
        const startDragY = event.clientY;
        const startLeft = nodeElem.getBoundingClientRect().left;
        const startTop = nodeElem.getBoundingClientRect().top;
        draggingStateRef.current = {
          draggingKey: nodeKey,
          startDragX,
          startDragY,
          startLeft,
          startTop,
        };
      }
    },
    [draggingStateRef]
  );

  const handlePointerUp = useCallback(
    (ev: PointerEvent) => {
      if (!draggingStateRef.current) return;
      const draggingNodeId = draggingStateRef.current.draggingKey;
      const didMove =
        ev.clientX !== draggingStateRef.current.startDragX ||
        ev.clientY !== draggingStateRef.current.startDragY;
      draggingStateRef.current = null;

      const draggingNodeElem = getNodeElement(draggingNodeId);

      // Calculate new position
      const x = parseFloat(draggingNodeElem.style.left);
      const y = parseFloat(draggingNodeElem.style.top);

      const node = getNode(draggingNodeId);
      if (node && didMove) {
        updateNodeState(draggingNodeId, (current) => ({ ...current, x, y }));
      }

      if (didMove) {
        const suppressClick = (e: MouseEvent) => {
          e.stopPropagation();
          document.removeEventListener("click", suppressClick, true);
        };
        document.addEventListener("click", suppressClick, true);
      }
    },
    [getNode, updateNodeState]
  );

  const handlePointerMove = useCallback(
    (event: PointerEvent) => {
      if (!draggingStateRef.current) return;

      const draggingNodeElem = getNodeElement(draggingStateRef.current.draggingKey);

      // Calculate new position
      const x =
        event.clientX - draggingStateRef.current.startDragX + draggingStateRef.current.startLeft;
      const y =
        event.clientY - draggingStateRef.current.startDragY + draggingStateRef.current.startTop;

      // Update element position
      draggingNodeElem.style.left = `${x}px`;
      draggingNodeElem.style.top = `${y}px`;
    },
    [draggingStateRef]
  );

  useEffect(() => {
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("pointerup", handlePointerUp);
    document.addEventListener("pointermove", handlePointerMove);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("pointerup", handlePointerUp);
      document.removeEventListener("pointermove", handlePointerMove);
    };
  }, [handlePointerDown, handlePointerMove, handlePointerUp]);
}
