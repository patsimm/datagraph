import { usePanZoomCanvas } from "./PanZoomCanvas";

import React, { useCallback } from "react";

type UseCanvasDraggingProps = {
  onDragStart?: () => void;
  onDraggedToCanvasPos: (pos: { canvasX: number; canvasY: number }) => void;
  onDragEnd?: (pos: { canvasX: number; canvasY: number }, didMove: boolean) => void;
  isValidTarget?: (target: EventTarget) => boolean;
};

const DRAG_START_DELAY_MS = 100;

export function useCanvasDragging({
  onDraggedToCanvasPos,
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
      const dragOffsetX =
        event.clientX -
        targetElement.getBoundingClientRect().left -
        targetElement.getBoundingClientRect().width * 0.5;
      const dragOffsetY =
        event.clientY -
        targetElement.getBoundingClientRect().top -
        targetElement.getBoundingClientRect().height * 0.5;
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

        onDragEnd?.(
          panZoom.clientToCanvasPos({
            clientX: event.clientX - dragOffsetX,
            clientY: event.clientY - dragOffsetY,
          }),
          didMove
        );

        if (!didMove) return;
        const suppressClick = (e: MouseEvent) => {
          e.stopPropagation();
          document.removeEventListener("click", suppressClick, true);
        };
        document.addEventListener("click", suppressClick, true);
      };

      const handlePointerMove = (event: PointerEvent) => {
        const canvasPos = panZoom.clientToCanvasPos({
          clientX: event.clientX - dragOffsetX,
          clientY: event.clientY - dragOffsetY,
        });
        onDraggedToCanvasPos({ canvasX: canvasPos.canvasX, canvasY: canvasPos.canvasY });
        if (dragStartTimeout) {
          clearTimeout(dragStartTimeout);
          dragStartTimeout = null;
        }
        if (!didDragStart) {
          didDragStart = true;
          onDragStart?.();
        }
        didMove = true;
      };

      targetElement.setPointerCapture(event.pointerId);
      targetElement.addEventListener("pointermove", handlePointerMove);
      targetElement.addEventListener("pointerup", handlePointerUp, { once: true });
      dragStartTimeout = setTimeout(() => {
        didDragStart = true;
        onDragStart?.();
      }, DRAG_START_DELAY_MS);
    },
    [isValidTarget, onDragEnd, onDragStart, onDraggedToCanvasPos, panZoom]
  );

  return { onPointerDown: handlePointerDown };
}
