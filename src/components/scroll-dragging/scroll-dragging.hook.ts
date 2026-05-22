import { ScrollDraggingHandle } from "./ScrollDragging";

import React, { useCallback, useRef } from "react";

type DragState = {
  startX: number;
  startY: number;
  startPanX: number;
  startPanY: number;
};

export type ScrollDraggingProps = {
  dragHandleRef: React.RefObject<ScrollDraggingHandle | null>;
};

export function useScrollDragging({ dragHandleRef }: ScrollDraggingProps) {
  const panRef = useRef({ x: 0, y: 0 });
  const stateRef = useRef<DragState | null>(null);

  const handlePointerMove = useCallback(
    (ev: PointerEvent) => {
      if (!stateRef.current) return;
      const x = stateRef.current.startPanX + ev.clientX - stateRef.current.startX;
      const y = stateRef.current.startPanY + ev.clientY - stateRef.current.startY;
      panRef.current = { x, y };
      dragHandleRef.current?.move(x, y);
    },
    [dragHandleRef]
  );

  const handlePointerCancel = useCallback(
    (ev: React.PointerEvent) => {
      if (!stateRef.current) return;
      stateRef.current = null;
      (ev.currentTarget as HTMLElement).removeEventListener("pointermove", handlePointerMove);
      dragHandleRef.current?.setDragging(false);
    },
    [dragHandleRef, handlePointerMove]
  );

  const handlePointerDown = useCallback(
    (ev: React.PointerEvent<HTMLDivElement>) => {
      if (ev.button !== 0) return;
      if (!dragHandleRef.current?.isDragHandleElement(ev.target)) return;
      if (!(ev.target instanceof HTMLElement)) return;

      stateRef.current = {
        startX: ev.clientX,
        startY: ev.clientY,
        startPanX: panRef.current.x,
        startPanY: panRef.current.y,
      };

      ev.currentTarget.setPointerCapture(ev.pointerId);
      (ev.currentTarget as HTMLElement).addEventListener("pointermove", handlePointerMove);
      dragHandleRef.current?.setDragging(true);
    },
    [dragHandleRef, handlePointerMove]
  );

  const handlePointerUp = useCallback(
    (ev: React.PointerEvent) => {
      if (!stateRef.current) return;
      const didMove =
        ev.clientX !== stateRef.current.startX || ev.clientY !== stateRef.current.startY;
      stateRef.current = null;
      (ev.currentTarget as HTMLElement).removeEventListener("pointermove", handlePointerMove);
      dragHandleRef.current?.setDragging(false);

      if (didMove) {
        const suppress = (e: MouseEvent) => {
          e.stopPropagation();
          document.removeEventListener("click", suppress, true);
        };
        document.addEventListener("click", suppress, true);
      }
    },
    [dragHandleRef, handlePointerMove]
  );

  return {
    containerProps: {
      onPointerDown: handlePointerDown,
      onPointerUp: handlePointerUp,
      onPointerCancel: handlePointerCancel,
    },
  };
}
