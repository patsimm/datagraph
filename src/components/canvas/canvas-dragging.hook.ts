import { usePanZoomCanvas } from "./PanZoomCanvas";
import { ClientPosition, PanZoomCanvasPosition } from "./utils";

import React, { useCallback } from "react";

type UseCanvasDraggingProps = {
  onDragStart?: (pos: PanZoomCanvasPosition & ClientPosition) => void;
  onDragMove: (pos: PanZoomCanvasPosition & ClientPosition) => void;
  onDragEnd?: (pos: PanZoomCanvasPosition & ClientPosition, didMove: boolean) => void;
  isValidTarget?: (target: EventTarget) => boolean;
};

const DRAG_START_DELAY_MS = 100;

export function useCanvasDragging({
  onDragMove,
  onDragEnd,
  onDragStart,
  isValidTarget = () => true,
}: UseCanvasDraggingProps) {
  const panZoom = usePanZoomCanvas();

  const handlePointerDown = useCallback(
    (event: React.PointerEvent) => {
      if (!isValidTarget(event.target)) return;

      event.stopPropagation();

      const targetElement = event.currentTarget as HTMLElement;
      const startClientPos = { clientX: event.clientX, clientY: event.clientY };
      const startPos = { ...startClientPos, ...panZoom.clientToCanvasPos(startClientPos) };
      let didMove = false;
      let dragStartTimeout: number | null = null;
      let didDragStart = false;

      const handlePointerUp = (event: PointerEvent) => {
        if (dragStartTimeout) {
          clearTimeout(dragStartTimeout);
          dragStartTimeout = null;
        }

        const elem = event.currentTarget as HTMLElement;
        elem.removeEventListener("pointermove", handlePointerMove);

        const clientPos = { clientX: event.clientX, clientY: event.clientY };
        onDragEnd?.({ ...clientPos, ...panZoom.clientToCanvasPos(clientPos) }, didMove);

        if (!didMove) return;
        const suppressClick = (e: MouseEvent) => {
          e.stopPropagation();
          document.removeEventListener("click", suppressClick, true);
        };
        document.addEventListener("click", suppressClick, true);
      };

      const handlePointerMove = (event: PointerEvent) => {
        if (dragStartTimeout) {
          clearTimeout(dragStartTimeout);
          dragStartTimeout = null;
        }
        if (!didDragStart) {
          didDragStart = true;
          onDragStart?.(startPos);
        }

        const clientPos = { clientX: event.clientX, clientY: event.clientY };
        const canvasPos = panZoom.clientToCanvasPos(clientPos);
        onDragMove({ ...clientPos, ...canvasPos });
        didMove = true;
      };

      targetElement.setPointerCapture(event.pointerId);
      targetElement.addEventListener("pointermove", handlePointerMove);
      targetElement.addEventListener("pointerup", handlePointerUp, { once: true });
      dragStartTimeout = setTimeout(() => {
        didDragStart = true;
        onDragStart?.(startPos);
      }, DRAG_START_DELAY_MS);
    },
    [isValidTarget, onDragEnd, onDragStart, onDragMove, panZoom]
  );

  return { onPointerDown: handlePointerDown };
}
