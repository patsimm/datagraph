import { useSelection } from "../../selection.context";
import { PanZoomCanvasPointerEvent, usePanZoomCanvas } from "../canvas/PanZoomCanvas";
import { ClientRect, PanZoomCanvasRect } from "../canvas/utils";

import { useState, useCallback, useImperativeHandle } from "react";

export type NodeSelectionHandle = {
  nodeSelectionPointerDown: (e: PanZoomCanvasPointerEvent) => boolean;
};

export type NodeSelectionProps = {
  disableSelection?: boolean;
  onSelectionComplete?: (selectionClientRect: PanZoomCanvasRect) => void;
  onSelectionChange?: (selectionClientRect: PanZoomCanvasRect) => void;
  ref: React.Ref<NodeSelectionHandle>;
};

export function NodeSelection({
  ref,
  disableSelection,
  onSelectionChange,
  onSelectionComplete,
}: NodeSelectionProps) {
  const [selectionRect, setSelectionRect] = useState<ClientRect | null>(null);
  const { handleSelectionRangeChanged, handleRangeSelectionCompleted } = useSelection();
  const { clientToCanvasRect } = usePanZoomCanvas();

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (disableSelection) return false;
      if (e.button !== 0) return false;
      const target = e.currentTarget as HTMLElement;
      target.setPointerCapture(e.pointerId);
      const startX = e.clientX;
      const startY = e.clientY;
      let moved = false;

      const handlePointerMove = (e: PointerEvent) => {
        const x = e.clientX;
        const y = e.clientY;
        const width = x - startX;
        const height = y - startY;
        const newRect = {
          clientX: Math.min(startX, x),
          clientY: Math.min(startY, y),
          width: Math.abs(width),
          height: Math.abs(height),
        };
        setSelectionRect(newRect);

        const canvasRect = clientToCanvasRect(newRect);
        onSelectionChange?.(canvasRect);
        handleSelectionRangeChanged(canvasRect);
        moved = true;
      };

      const handlePointerUp = (e: PointerEvent) => {
        const x = e.clientX;
        const y = e.clientY;
        const width = x - startX;
        const height = y - startY;
        const newRect = {
          clientX: Math.min(startX, x),
          clientY: Math.min(startY, y),
          width: Math.abs(width),
          height: Math.abs(height),
        };

        if (moved) {
          const canvasRect = clientToCanvasRect(newRect);
          onSelectionComplete?.(canvasRect);
          handleRangeSelectionCompleted(canvasRect);
          const suppressClick = (ev: MouseEvent) => {
            ev.stopPropagation();
            document.removeEventListener("click", suppressClick, true);
          };
          document.addEventListener("click", suppressClick, true);
        }
        setSelectionRect(null);
        handleSelectionRangeChanged(null);
        const target = e.currentTarget as HTMLElement;
        target.releasePointerCapture(e.pointerId);
        target.removeEventListener("pointermove", handlePointerMove);
        target.removeEventListener("pointerup", handlePointerUp);
        target.removeEventListener("pointercancel", handlePointerCancel);
      };

      const handlePointerCancel = (e: PointerEvent) => {
        const target = e.currentTarget as HTMLElement;
        setSelectionRect(null);
        handleSelectionRangeChanged(null);
        target.removeEventListener("pointermove", handlePointerMove);
        target.removeEventListener("pointerup", handlePointerUp);
        target.removeEventListener("pointercancel", handlePointerCancel);
      };

      target.addEventListener("pointermove", handlePointerMove);
      target.addEventListener("pointerup", handlePointerUp);
      target.addEventListener("pointercancel", handlePointerUp);
      return true;
    },
    [
      clientToCanvasRect,
      disableSelection,
      handleRangeSelectionCompleted,
      handleSelectionRangeChanged,
      onSelectionChange,
      onSelectionComplete,
    ]
  );

  useImperativeHandle(ref, () => ({
    nodeSelectionPointerDown: handlePointerDown,
  }));

  return (
    <>
      {selectionRect && (
        <div
          className="node-selection"
          style={{
            left: selectionRect.clientX,
            top: selectionRect.clientY,
            width: selectionRect.width,
            height: selectionRect.height,
          }}
        />
      )}
    </>
  );
}
