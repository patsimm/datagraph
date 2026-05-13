import { PortInfo, getDatagraphNodePortFromElement, parsePortKey } from "../node/DatagraphNode";

import { useRef, useCallback, useEffect } from "react";

type DraggingState = {
  draggingKey: string;
  dragStartX: number;
  dragStartY: number;
  elemOffsetX: number;
  elemOffsetY: number;
};

type EdgeDraggingState = {
  onDragStart: (port: PortInfo) => void;
  onDragEnd: (port: PortInfo | null) => void;
};

export function useEdgeDragging({ onDragStart, onDragEnd }: EdgeDraggingState) {
  const draggingStateRef = useRef<DraggingState | null>(null);
  const edgeRef = useRef<SVGSVGElement | null>(null);

  const handlePointerDown = useCallback(
    (event: PointerEvent) => {
      if (!(event.target instanceof HTMLElement)) return;
      const portKey = getDatagraphNodePortFromElement(event.target);
      if (!portKey) return;

      onDragStart(parsePortKey(portKey));

      const nodeElem = event.target as HTMLElement;
      const containerElem = document.querySelector(".datagraph") as HTMLElement;

      const offsetX = event.clientX - nodeElem.getBoundingClientRect().left;
      const offsetY = event.clientY - nodeElem.getBoundingClientRect().top;

      const startPosX =
        nodeElem.getBoundingClientRect().left -
        containerElem.getBoundingClientRect().left +
        0.5 * nodeElem.getBoundingClientRect().width;
      const startPosY =
        nodeElem.getBoundingClientRect().top -
        containerElem.getBoundingClientRect().top +
        0.5 * nodeElem.getBoundingClientRect().height;

      draggingStateRef.current = {
        draggingKey: portKey,
        dragStartX: startPosX,
        dragStartY: startPosY,
        elemOffsetX: offsetX,
        elemOffsetY: offsetY,
      };
      edgeRef.current!.style.left = `${startPosX}px`;
      edgeRef.current!.style.top = `${startPosY}px`;
      edgeRef.current!.style.width = `0px`;
      edgeRef.current!.style.height = `0px`;
      edgeRef.current!.style.display = "block";
      const line = edgeRef.current!.querySelector(".datagraph-edge__line")!;
      line.setAttribute("x1", "0");
      line.setAttribute("y1", "0");
      line.setAttribute("x2", "0");
      line.setAttribute("y2", "0");
    },
    [onDragStart]
  );

  const handlePointerUp = useCallback(
    (event: PointerEvent) => {
      draggingStateRef.current = null;
      edgeRef.current!.style.left = `0px`;
      edgeRef.current!.style.top = `0px`;
      edgeRef.current!.style.width = `0px`;
      edgeRef.current!.style.height = `0px`;
      edgeRef.current!.style.display = "none";

      const portKey =
        event.target instanceof HTMLElement ? getDatagraphNodePortFromElement(event.target) : null;
      onDragEnd(portKey ? parsePortKey(portKey) : null);
    },
    [onDragEnd]
  );

  const handlePointerMove = useCallback(
    (event: PointerEvent) => {
      if (!draggingStateRef.current) return;

      const containerElem = document.querySelector(".datagraph") as HTMLElement;

      // Calculate new position
      const x = event.clientX - containerElem.getBoundingClientRect().left;
      const y = event.clientY - containerElem.getBoundingClientRect().top;

      const startPosX = draggingStateRef.current.dragStartX;
      const startPosY = draggingStateRef.current.dragStartY;

      // Update element position
      edgeRef.current!.style.left = `${Math.min(startPosX, x)}px`;
      edgeRef.current!.style.top = `${Math.min(startPosY, y)}px`;
      edgeRef.current!.style.width = `${Math.abs(x - draggingStateRef.current.dragStartX)}px`;
      edgeRef.current!.style.height = `${Math.abs(y - draggingStateRef.current.dragStartY)}px`;
      const line = edgeRef.current!.querySelector(".datagraph-edge__line")!;
      line.setAttribute("x1", `${startPosX - Math.min(startPosX, x)}`);
      line.setAttribute("y1", `${startPosY - Math.min(startPosY, y)}`);
      line.setAttribute("x2", `${x - Math.min(startPosX, x)}`);
      line.setAttribute("y2", `${y - Math.min(startPosY, y)}`);
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

  return {
    lineRef: edgeRef,
  };
}
