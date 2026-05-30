import { usePanZoomCanvas } from "../canvas/PanZoomCanvas";
import { getNodePortElement, getNodePortKeyFromElement } from "../node/node-utils";
import { PortConnectionCompletedEvent, PortConnectionInitiatedEvent } from "./connection-events";

import React, { useRef, useCallback } from "react";

type DraggingState = {
  dragStartPort: string;
  dragStartX: number;
  dragStartY: number;
};

export function usePortConnecting() {
  const panZoom = usePanZoomCanvas();
  const draggingStateRef = useRef<DraggingState | null>(null);
  const hoveredPortRef = useRef<HTMLElement | null>(null);
  const [position, setPosition] = React.useState<{
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
  } | null>(null);

  const handlePointerMove = useCallback(
    (event: PointerEvent) => {
      if (!draggingStateRef.current) return;

      const { x, y } = panZoom.clientToCanvasPos(event);
      const startPosX = draggingStateRef.current.dragStartX;
      const startPosY = draggingStateRef.current.dragStartY;

      setPosition({ fromX: startPosX, fromY: startPosY, toX: x, toY: y });

      const elemUnderCursor = document.elementFromPoint(event.clientX, event.clientY);
      const portKeyUnderCursor =
        elemUnderCursor instanceof HTMLElement ? getNodePortKeyFromElement(elemUnderCursor) : null;
      if (portKeyUnderCursor === draggingStateRef.current.dragStartPort) return;

      const portUnderCursor =
        elemUnderCursor instanceof HTMLElement && portKeyUnderCursor ? elemUnderCursor : null;
      const portPositionUnderCursor = portUnderCursor?.getBoundingClientRect();
      const canvasPortPosUnderCursor =
        portPositionUnderCursor &&
        panZoom.clientToCanvasPos({
          clientX: portPositionUnderCursor.left + 0.5 * portPositionUnderCursor.width,
          clientY: portPositionUnderCursor.top + 0.5 * portPositionUnderCursor.height,
        });

      setPosition({
        fromX: startPosX,
        fromY: startPosY,
        toX: canvasPortPosUnderCursor?.x ?? x,
        toY: canvasPortPosUnderCursor?.y ?? y,
      });

      if (portUnderCursor !== hoveredPortRef.current) {
        hoveredPortRef.current?.classList.remove("node__port--dragging");
        portUnderCursor?.classList.add("node__port--dragging");
        hoveredPortRef.current = portUnderCursor;
      }
    },
    [panZoom]
  );

  const handlePointerDown = useCallback(
    (event: React.PointerEvent): boolean => {
      if (!(event.target instanceof HTMLElement)) return false;
      const portKey = getNodePortKeyFromElement(event.target);
      if (!portKey) return false;

      const nodeElem = event.target as HTMLElement;
      const portelem = getNodePortElement(portKey);

      const startPos = panZoom.clientToCanvasPos({
        clientX:
          nodeElem.getBoundingClientRect().left + 0.5 * nodeElem.getBoundingClientRect().width,
        clientY:
          nodeElem.getBoundingClientRect().top + 0.5 * nodeElem.getBoundingClientRect().height,
      });

      draggingStateRef.current = {
        dragStartPort: portKey,
        dragStartX: startPos.x,
        dragStartY: startPos.y,
      };
      setPosition({ fromX: startPos.x, fromY: startPos.y, toX: startPos.x, toY: startPos.y });

      const elem = event.currentTarget as HTMLElement;
      elem.setPointerCapture(event.pointerId);
      elem.addEventListener("pointermove", handlePointerMove);

      portelem.classList.add("node__port--dragging");
      portelem.dispatchEvent(new PortConnectionInitiatedEvent(portKey));
      return true;
    },
    [handlePointerMove, panZoom]
  );

  const handlePointerUp = useCallback(
    (event: React.PointerEvent) => {
      if (!draggingStateRef.current) return;

      const elem = event.currentTarget as HTMLElement;
      elem.removeEventListener("pointermove", handlePointerMove);

      hoveredPortRef.current?.classList.remove("node__port--dragging");
      hoveredPortRef.current = null;

      const startPortKey = draggingStateRef.current.dragStartPort;
      const startPortElem = getNodePortElement(startPortKey);
      startPortElem.classList.remove("node__port--dragging");
      draggingStateRef.current = null;

      const suppressClick = (e: MouseEvent) => {
        e.stopPropagation();
        document.removeEventListener("click", suppressClick, true);
      };
      document.addEventListener("click", suppressClick, true);

      setPosition({ fromX: 0, fromY: 0, toX: 0, toY: 0 });

      const endPortElem = document.elementFromPoint(event.clientX, event.clientY);
      const endPortKey =
        endPortElem instanceof HTMLElement && getNodePortKeyFromElement(endPortElem);
      if (endPortKey && endPortElem instanceof HTMLElement) {
        endPortElem.dispatchEvent(new PortConnectionCompletedEvent(endPortKey, startPortKey));
      }
    },
    [handlePointerMove]
  );

  return {
    handlePointerDown,
    handlePointerUp,
    position,
  };
}
