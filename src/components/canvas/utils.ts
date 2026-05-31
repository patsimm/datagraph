export type ClientPosition = {
  clientX: number;
  clientY: number;
};

export type ClientRect = {
  width: number;
  height: number;
} & ClientPosition;

export type PanZoomCanvasPosition = {
  canvasX: number;
  canvasY: number;
};

export type PanZoomCanvasRect = {
  width: number;
  height: number;
} & PanZoomCanvasPosition;

export function isPointInRect(point: PanZoomCanvasPosition, rect: PanZoomCanvasRect) {
  return (
    point.canvasX >= rect.canvasX &&
    point.canvasX <= rect.canvasX + rect.width &&
    point.canvasY >= rect.canvasY &&
    point.canvasY <= rect.canvasY + rect.height
  );
}
