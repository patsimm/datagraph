import React, { useCallback, useRef } from "react";

type DragState = {
  lastX: number;
  lastY: number;
  started: boolean;
};

export type UsePanProps = {
  disablePan?: boolean;
  onPanByScreenPos: (x: number, y: number) => void;
  onPanStart: () => void;
  onPanEnd: () => void;
};

export function usePan({ onPanByScreenPos, onPanEnd, onPanStart, disablePan }: UsePanProps) {
  const stateRef = useRef<DragState | null>(null);

  const handlePointerMove = useCallback(
    (ev: React.PointerEvent) => {
      if (!stateRef.current) return;
      const x = ev.clientX - stateRef.current.lastX;
      const y = ev.clientY - stateRef.current.lastY;
      stateRef.current.lastX = ev.clientX;
      stateRef.current.lastY = ev.clientY;
      onPanByScreenPos(x, y);
    },
    [onPanByScreenPos]
  );

  const handlePointerCancel = useCallback(() => {
    if (!stateRef.current) return;
    stateRef.current = null;
    onPanEnd?.();
  }, [onPanEnd]);

  const handlePointerDown = useCallback(
    (ev: React.PointerEvent<HTMLDivElement>) => {
      if (disablePan) return;
      if (ev.button !== 1) return;
      if (!(ev.target instanceof HTMLElement)) return;
      ev.preventDefault();

      stateRef.current = {
        lastX: ev.clientX,
        lastY: ev.clientY,
        started: false,
      };

      ev.currentTarget.setPointerCapture(ev.pointerId);
      onPanStart();
    },
    [disablePan, onPanStart]
  );

  const handlePointerUp = useCallback(
    (ev: React.PointerEvent) => {
      if (!stateRef.current) return;
      const didMove =
        ev.clientX !== stateRef.current.lastX || ev.clientY !== stateRef.current.lastY;
      stateRef.current = null;
      onPanEnd();

      if (didMove) {
        const suppress = (e: MouseEvent) => {
          e.stopPropagation();
          document.removeEventListener("click", suppress, true);
        };
        document.addEventListener("click", suppress, true);
      }
    },
    [onPanEnd]
  );

  return {
    containerProps: {
      onPointerDown: handlePointerDown,
      onPointerUp: handlePointerUp,
      onPointerCancel: handlePointerCancel,
      onPointerMove: handlePointerMove,
    },
  };
}
