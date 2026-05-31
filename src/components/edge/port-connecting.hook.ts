import { useCanvasDragging } from "../canvas/canvas-dragging.hook";
import { usePanZoomCanvas } from "../canvas/PanZoomCanvas";
import { ClientPosition, PanZoomCanvasPosition } from "../canvas/utils";
import { useGhostEdge } from "./ghost-edge.context";
import { usePortConnections } from "../../edges.context";
import { getNodePortElement, getNodePortKeyFromElement, parsePortKey } from "../node/node-utils";

import { useRef, useCallback } from "react";

export function usePortConnecting(thisPortKey: string) {
  const panZoom = usePanZoomCanvas();
  const { setPosition } = useGhostEdge();
  const { connect } = usePortConnections();
  const hoveredPortRef = useRef<HTMLElement | null>(null);
  const startCanvasPosRef = useRef<{ fromX: number; fromY: number } | null>(null);

  const handleDragStart = useCallback(() => {
    const portElem = getNodePortElement(thisPortKey);
    const rect = portElem.getBoundingClientRect();
    const { canvasX, canvasY } = panZoom.clientToCanvasPos({
      clientX: rect.left + 0.5 * rect.width,
      clientY: rect.top + 0.5 * rect.height,
    });
    startCanvasPosRef.current = { fromX: canvasX, fromY: canvasY };
    setPosition({ fromX: canvasX, fromY: canvasY, toX: canvasX, toY: canvasY });
    portElem.classList.add("node__port--dragging");
  }, [thisPortKey, panZoom, setPosition]);

  const handleDragMove = useCallback(
    (pos: PanZoomCanvasPosition & ClientPosition) => {
      if (!startCanvasPosRef.current) return;
      const { fromX, fromY } = startCanvasPosRef.current;

      const elemUnderCursor = document.elementFromPoint(pos.clientX, pos.clientY);
      const portKeyUnderCursor =
        elemUnderCursor instanceof HTMLElement ? getNodePortKeyFromElement(elemUnderCursor) : null;

      const portUnderCursor =
        portKeyUnderCursor && portKeyUnderCursor !== thisPortKey
          ? (elemUnderCursor as HTMLElement)
          : null;

      let toX = pos.canvasX;
      let toY = pos.canvasY;
      if (portUnderCursor) {
        const rect = portUnderCursor.getBoundingClientRect();
        const snapped = panZoom.clientToCanvasPos({
          clientX: rect.left + 0.5 * rect.width,
          clientY: rect.top + 0.5 * rect.height,
        });
        toX = snapped.canvasX;
        toY = snapped.canvasY;
      }

      setPosition({ fromX, fromY, toX, toY });

      if (portUnderCursor !== hoveredPortRef.current) {
        hoveredPortRef.current?.classList.remove("node__port--dragging");
        portUnderCursor?.classList.add("node__port--dragging");
        hoveredPortRef.current = portUnderCursor;
      }
    },
    [thisPortKey, panZoom, setPosition]
  );

  const handleDragEnd = useCallback(
    (pos: PanZoomCanvasPosition & ClientPosition) => {
      const portElem = getNodePortElement(thisPortKey);
      portElem.classList.remove("node__port--dragging");
      hoveredPortRef.current?.classList.remove("node__port--dragging");
      hoveredPortRef.current = null;
      startCanvasPosRef.current = null;
      setPosition(null);

      const endElem = document.elementFromPoint(pos.clientX, pos.clientY);
      const endPortKey =
        endElem instanceof HTMLElement ? getNodePortKeyFromElement(endElem) : null;
      if (endPortKey && endPortKey !== thisPortKey) {
        const startInfo = parsePortKey(thisPortKey);
        const endInfo = parsePortKey(endPortKey);
        if (startInfo.portType !== endInfo.portType) {
          connect(startInfo, endInfo);
        }
      }
    },
    [thisPortKey, connect, setPosition]
  );

  return useCanvasDragging({
    onDragStart: handleDragStart,
    onDragMove: handleDragMove,
    onDragEnd: handleDragEnd,
  });
}
