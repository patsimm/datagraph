import React, { useCallback, useRef } from "react";

type DragState = {
  lastX: number;
  lastY: number;
};

export type UsePanProps = {
  onPanByScreenPos: (x: number, y: number) => void;
  onPanStart: () => void;
  onPanEnd: () => void;
  isDragHandleElement: (target: EventTarget) => boolean;
};

export function usePan({
  onPanByScreenPos,
  onPanEnd,
  onPanStart,
  isDragHandleElement,
}: UsePanProps) {
  const stateRef = useRef<DragState | null>(null);

  const handlePointerMove = useCallback(
    (ev: PointerEvent) => {
      if (!stateRef.current) return;
      const x = ev.clientX - stateRef.current.lastX;
      const y = ev.clientY - stateRef.current.lastY;
      stateRef.current.lastX = ev.clientX;
      stateRef.current.lastY = ev.clientY;
      onPanByScreenPos(x, y);
    },
    [onPanByScreenPos]
  );

  const handlePointerCancel = useCallback(
    (ev: React.PointerEvent) => {
      if (!stateRef.current) return;
      stateRef.current = null;
      (ev.currentTarget as HTMLElement).removeEventListener("pointermove", handlePointerMove);
      onPanEnd?.();
    },
    [handlePointerMove, onPanEnd]
  );

  const handlePointerDown = useCallback(
    (ev: React.PointerEvent<HTMLDivElement>) => {
      if (ev.button !== 0) return;
      if (!isDragHandleElement(ev.target)) return;
      if (!(ev.target instanceof HTMLElement)) return;

      stateRef.current = {
        lastX: ev.clientX,
        lastY: ev.clientY,
      };

      ev.currentTarget.setPointerCapture(ev.pointerId);
      (ev.currentTarget as HTMLElement).addEventListener("pointermove", handlePointerMove);
      onPanStart();
    },
    [handlePointerMove, isDragHandleElement, onPanStart]
  );

  const handlePointerUp = useCallback(
    (ev: React.PointerEvent) => {
      if (!stateRef.current) return;
      const didMove =
        ev.clientX !== stateRef.current.lastX || ev.clientY !== stateRef.current.lastY;
      stateRef.current = null;
      (ev.currentTarget as HTMLElement).removeEventListener("pointermove", handlePointerMove);
      onPanEnd();

      if (didMove) {
        const suppress = (e: MouseEvent) => {
          e.stopPropagation();
          document.removeEventListener("click", suppress, true);
        };
        document.addEventListener("click", suppress, true);
      }
    },
    [handlePointerMove, onPanEnd]
  );

  return {
    containerProps: {
      onPointerDown: handlePointerDown,
      onPointerUp: handlePointerUp,
      onPointerCancel: handlePointerCancel,
    },
  };
}
