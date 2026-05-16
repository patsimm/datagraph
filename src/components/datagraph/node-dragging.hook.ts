import { useNodes } from "../../nodes.context";
import { getDatagraphNodeKeyFromElement, getDatagraphNodeElement } from "../node/node-utils";

import { useRef, useCallback, useEffect } from "react";

type NodeDraggingState = {
  draggingKey: string;
  elemOffsetX: number;
  elemOffsetY: number;
};

export function useNodeDragging() {
  const { updateNodeState } = useNodes();
  const draggingStateRef = useRef<NodeDraggingState | null>(null);

  const handlePointerDown = useCallback(
    (event: PointerEvent) => {
      if (event.target instanceof HTMLElement) {
        const nodeKey = getDatagraphNodeKeyFromElement(event.target);
        if (!nodeKey) return;

        const nodeElem = event.target as HTMLElement;
        const offsetX = event.clientX - nodeElem.getBoundingClientRect().left;
        const offsetY = event.clientY - nodeElem.getBoundingClientRect().top;
        draggingStateRef.current = {
          draggingKey: nodeKey,
          elemOffsetX: offsetX,
          elemOffsetY: offsetY,
        };
      }
    },
    [draggingStateRef]
  );

  const handlePointerUp = useCallback(() => {
    if (!draggingStateRef.current) return;

    const draggingNodeElem = getDatagraphNodeElement(draggingStateRef.current.draggingKey);

    // Calculate new position
    const x = parseFloat(draggingNodeElem.style.left);
    const y = parseFloat(draggingNodeElem.style.top);

    updateNodeState(draggingStateRef.current.draggingKey, { x, y });

    draggingStateRef.current = null;
  }, [updateNodeState]);

  const handlePointerMove = useCallback(
    (event: PointerEvent) => {
      if (!draggingStateRef.current) return;

      const draggingNodeElem = getDatagraphNodeElement(draggingStateRef.current.draggingKey);
      const containerElem = document.querySelector(".datagraph") as HTMLElement;

      // Calculate new position
      const x =
        event.clientX -
        draggingStateRef.current.elemOffsetX -
        containerElem.getBoundingClientRect().left;
      const y =
        event.clientY -
        draggingStateRef.current.elemOffsetY -
        containerElem.getBoundingClientRect().top;

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
