import { usePan } from "./pan.hook";
import "./PanZoomCanvas.css";
import { ClientPosition, PanZoomCanvasPosition, ClientRect, PanZoomCanvasRect } from "./utils";

import classNames from "classnames";
import React, {
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export type PanZoomCanvasContext = {
  panByScreenPos: (x: number, y: number) => void;
  clientToCanvasPos(pos: ClientPosition): PanZoomCanvasPosition;
  clientToCanvasRect(clientRect: ClientRect): PanZoomCanvasRect;
};

const defaultContextValue: PanZoomCanvasContext = {
  panByScreenPos: () => {
    throw new Error("PanZoomCanvasContext not wired");
  },
  clientToCanvasPos: () => {
    throw new Error("PanZoomCanvasContext not wired");
  },
  clientToCanvasRect: () => {
    throw new Error("PanZoomCanvasContext not wired");
  },
};

const context = React.createContext<PanZoomCanvasContext>(defaultContextValue);

export type PanZoomCanvasPointerEvent<T extends Element = Element> = PanZoomCanvasPosition &
  React.PointerEvent<T>;

export type PanZoomCanvasMouseEvent<T extends Element = Element> = PanZoomCanvasPosition &
  React.MouseEvent<T>;

export type PanZoomCanvasProps = {
  ref: React.Ref<PanZoomCanvasContext>;
  disablePan?: boolean;
  canvasSize?: { width: number; height: number };
  onPointerDown?: (event: PanZoomCanvasPointerEvent<HTMLDivElement>) => void;
  onPointerUp?: (event: PanZoomCanvasPointerEvent<HTMLDivElement>) => void;
  onPointerMove?: (event: PanZoomCanvasPointerEvent<HTMLDivElement>) => void;
  onClick?: (event: PanZoomCanvasMouseEvent<HTMLDivElement>) => void;
};

export function PanZoomCanvas({
  ref,
  children,
  disablePan,
  canvasSize = { width: 8000, height: 8000 },
  onPointerDown,
  onPointerUp,
  onPointerMove,
  onClick,
}: React.PropsWithChildren<PanZoomCanvasProps>) {
  const contentRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef(1);
  const [dragging, setDragging] = useState(false);

  const panByScreenPos = useCallback((moveByX: number, moveByY: number) => {
    const container = containerRef.current;
    if (!container) return;
    container.scrollLeft -= moveByX;
    container.scrollTop -= moveByY;
  }, []);

  const clientToCanvasPos = useCallback(
    (pos: { clientX: number; clientY: number }) => {
      const contentElement = contentRef.current;
      if (!contentElement) {
        throw new Error("contentRef was not wired");
      }
      const contentRect = contentElement.getBoundingClientRect();
      return {
        canvasX: (pos.clientX - contentRect.x) / zoomRef.current - canvasSize.width / 2,
        canvasY: (pos.clientY - contentRect.y) / zoomRef.current - canvasSize.height / 2,
      };
    },
    [canvasSize.height, canvasSize.width]
  );

  const clientToCanvasRect = useCallback(
    (clientRect: ClientRect) => {
      return {
        width: clientRect.width / zoomRef.current,
        height: clientRect.height / zoomRef.current,
        ...clientToCanvasPos(clientRect),
      };
    },
    [clientToCanvasPos]
  );

  const makePointerEvent = useCallback(
    <T extends Element>(ev: React.PointerEvent<T>): PanZoomCanvasPointerEvent<T> => ({
      ...clientToCanvasPos({ clientX: ev.clientX, clientY: ev.clientY }),
      ...ev,
    }),
    [clientToCanvasPos]
  );

  const makeMouseEvent = useCallback(
    <T extends Element>(ev: React.MouseEvent<T>): PanZoomCanvasMouseEvent<T> => ({
      ...clientToCanvasPos({ clientX: ev.clientX, clientY: ev.clientY }),
      ...ev,
    }),
    [clientToCanvasPos]
  );

  const handleZoom = useCallback((zoomBy: number, centerX: number, centerY: number) => {
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content) return;

    const outerRect = container.getBoundingClientRect();
    const cursorX = centerX - outerRect.x;
    const cursorY = centerY - outerRect.y;

    const oldZoom = zoomRef.current;
    const newZoom = Math.min(Math.max(0.3, oldZoom * Math.exp(-zoomBy * 0.001)), 2);
    const canvasX = (cursorX + container.scrollLeft) / oldZoom;
    const canvasY = (cursorY + container.scrollTop) / oldZoom;

    zoomRef.current = newZoom;

    // Apply zoom and scroll correction synchronously in the same JS turn so the
    // browser never paints an intermediate frame with mismatched zoom and scroll.
    content.style.zoom = String(newZoom);
    // Force layout so the browser uses the new scroll area dimensions before we
    // set scrollLeft/scrollTop, otherwise it clamps against the stale max.
    void container.scrollWidth;
    container.scrollLeft = canvasX * newZoom - cursorX;
    container.scrollTop = canvasY * newZoom - cursorY;
  }, []);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.scrollLeft = canvasSize.width / 2 - container.clientWidth / 2;
    container.scrollTop = canvasSize.height / 2 - container.clientHeight / 2;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { containerProps } = usePan({
    disablePan,
    onPanByScreenPos: panByScreenPos,
    onPanStart: () => setDragging(true),
    onPanEnd: () => setDragging(false),
  });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (ev: WheelEvent) => {
      if (ev.ctrlKey || ev.metaKey) {
        ev.preventDefault();
        handleZoom(ev.deltaY * 20, ev.clientX, ev.clientY);
      }
      // Plain scroll: let the browser handle natively
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, [handleZoom]);

  useImperativeHandle(ref, () => ({
    clientToCanvasPos,
    panByScreenPos,
    clientToCanvasRect,
  }));

  return (
    <div
      className={classNames("panzoomcanvas", {
        "panzoomcanvas--panning": dragging,
        "panzoomcanvas--pan-disabled": disablePan,
      })}
      ref={containerRef}
      onPointerDown={(ev) => {
        onPointerDown?.(makePointerEvent(ev));
        if (!ev.defaultPrevented) {
          containerProps.onPointerDown?.(ev);
        }
      }}
      onPointerUp={(ev) => {
        onPointerUp?.(makePointerEvent(ev));
        if (!ev.defaultPrevented) {
          containerProps.onPointerUp?.(ev);
        }
      }}
      onPointerMove={(ev) => {
        onPointerMove?.(makePointerEvent(ev));
        if (!ev.defaultPrevented) {
          containerProps.onPointerMove?.(ev);
        }
      }}
      onClick={(ev) => {
        onClick?.(makeMouseEvent(ev));
      }}
    >
      <div
        className="panzoomcanvas__content-wrapper"
        style={{
          width: canvasSize.width,
          height: canvasSize.height,
        }}
        ref={contentRef}
        data-canvas-background="true"
      >
        <div className="panzoomcanvas__content">{children}</div>
      </div>
    </div>
  );
}

export type PanZoomCanvasProviderProps = {
  canvasHandle: React.RefObject<PanZoomCanvasContext | null>;
};

export const PanZoomCanvasProvider = ({
  canvasHandle,
  children,
}: React.PropsWithChildren<PanZoomCanvasProviderProps>) => {
  const value = useMemo<PanZoomCanvasContext>(
    () => ({
      panByScreenPos: (...args) =>
        (canvasHandle.current ?? defaultContextValue).panByScreenPos(...args),
      clientToCanvasPos: (...args) =>
        (canvasHandle.current ?? defaultContextValue).clientToCanvasPos(...args),
      clientToCanvasRect: (...args) =>
        (canvasHandle.current ?? defaultContextValue).clientToCanvasRect(...args),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  return <context.Provider value={value}>{children}</context.Provider>;
};

export function usePanZoomCanvas() {
  return useContext(context);
}
