import { getNodePortElement, getNodePortKeyFromElement } from "../node/node-utils";
import { PortConnectionCompletedEvent, PortConnectionInitiatedEvent } from "./connection-events";

import { useRef, useCallback, useEffect } from "react";

type DraggingState = {
  dragStartPort: string;
  dragStartX: number;
  dragStartY: number;
};

export function useEdgeDragging() {
  const draggingStateRef = useRef<DraggingState | null>(null);
  const edgeRef = useRef<SVGSVGElement | null>(null);

  const handlePointerDown = useCallback((event: PointerEvent) => {
    if (!edgeRef.current) return;
    if (!(event.target instanceof HTMLElement)) return;
    const portKey = getNodePortKeyFromElement(event.target);
    if (!portKey) return;

    const nodeElem = event.target as HTMLElement;
    const portelem = getNodePortElement(portKey);
    const containerElem = document.querySelector(".datagraph") as HTMLElement;

    const startPosX =
      nodeElem.getBoundingClientRect().left -
      containerElem.getBoundingClientRect().left +
      0.5 * nodeElem.getBoundingClientRect().width;
    const startPosY =
      nodeElem.getBoundingClientRect().top -
      containerElem.getBoundingClientRect().top +
      0.5 * nodeElem.getBoundingClientRect().height;

    draggingStateRef.current = {
      dragStartPort: portKey,
      dragStartX: startPosX,
      dragStartY: startPosY,
    };
    edgeRef.current.style.left = `${startPosX}px`;
    edgeRef.current.style.top = `${startPosY}px`;
    edgeRef.current.style.width = `0px`;
    edgeRef.current.style.height = `0px`;
    edgeRef.current.style.display = "block";
    const line = edgeRef.current.querySelector(".edge__line")!;
    line.setAttribute("x1", "0");
    line.setAttribute("y1", "0");
    line.setAttribute("x2", "0");
    line.setAttribute("y2", "0");

    portelem.dispatchEvent(new PortConnectionInitiatedEvent(portKey));
  }, []);

  const handlePointerUp = useCallback((event: PointerEvent) => {
    if (!edgeRef.current || !draggingStateRef.current) return;
    const startPortKey = draggingStateRef.current.dragStartPort;
    draggingStateRef.current = null;

    const suppressClick = (e: MouseEvent) => {
      e.stopPropagation();
      document.removeEventListener("click", suppressClick, true);
    };
    document.addEventListener("click", suppressClick, true);

    edgeRef.current.style.left = `0px`;
    edgeRef.current.style.top = `0px`;
    edgeRef.current.style.width = `0px`;
    edgeRef.current.style.height = `0px`;
    edgeRef.current.style.display = "none";

    const endPortElem = event.target instanceof HTMLElement ? event.target : null;
    const endPortKey = endPortElem && getNodePortKeyFromElement(endPortElem);
    if (endPortKey) {
      endPortElem.dispatchEvent(new PortConnectionCompletedEvent(endPortKey, startPortKey));
    }
  }, []);

  const handlePointerMove = useCallback(
    (event: PointerEvent) => {
      if (!edgeRef.current) return;
      if (!draggingStateRef.current) return;

      const containerElem = document.querySelector(".datagraph") as HTMLElement;

      // Calculate new position
      const x = event.clientX - containerElem.getBoundingClientRect().left;
      const y = event.clientY - containerElem.getBoundingClientRect().top;

      const startPosX = draggingStateRef.current.dragStartX;
      const startPosY = draggingStateRef.current.dragStartY;

      // Update element position
      edgeRef.current.style.left = `${Math.min(startPosX, x)}px`;
      edgeRef.current.style.top = `${Math.min(startPosY, y)}px`;
      edgeRef.current.style.width = `${Math.abs(x - draggingStateRef.current.dragStartX)}px`;
      edgeRef.current.style.height = `${Math.abs(y - draggingStateRef.current.dragStartY)}px`;
      const line = edgeRef.current!.querySelector(".edge__line")!;
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
    ghostRef: edgeRef,
  };
}
