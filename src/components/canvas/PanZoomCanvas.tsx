import { usePan } from "./pan.hook";
import "./PanZoomCanvas.css";

import classNames from "classnames";
import React, {
  useCallback,
  useContext,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { flushSync } from "react-dom";

export type ClientPos = {
  clientX: number;
  clientY: number;
};

export type CanvasPos = {
  canvasX: number;
  canvasY: number;
};

export type PanZoomCanvasContext = {
  panByScreenPos: (x: number, y: number) => void;
  clientToCanvasPos(pos: ClientPos): CanvasPos;
};

const defaultContextValue: PanZoomCanvasContext = {
  panByScreenPos: () => {
    throw new Error("PanZoomCanvasContext not wired");
  },
  clientToCanvasPos: () => {
    throw new Error("PanZoomCanvasContext not wired");
  },
};

const context = React.createContext<PanZoomCanvasContext>(defaultContextValue);

export type PanZoomCanvasProps = {
  ref: React.Ref<PanZoomCanvasContext>;
  disablePan?: boolean;
};

export function PanZoomCanvas({
  ref,
  children,
  disablePan,
}: React.PropsWithChildren<PanZoomCanvasProps>) {
  const contentRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0, zoom: 1 });
  const [dragging, setDragging] = useState(false);

  const panByScreenPos = useCallback((moveByX: number, moveByY: number) => {
    flushSync(() =>
      setPosition(({ x, y, zoom }) => {
        const newX = x + moveByX / zoom;
        const newY = y + moveByY / zoom;
        return { x: newX, y: newY, zoom };
      })
    );
  }, []);

  const isDragHandleElement = useCallback((target: EventTarget) => {
    const ele = target instanceof HTMLElement ? (target as HTMLElement) : null;
    return ele === contentRef.current || ele === containerRef.current;
  }, []);

  const clientToCanvasPos = useCallback((pos: { clientX: number; clientY: number }) => {
    const containerElement =
      containerRef.current instanceof HTMLElement ? containerRef.current : null;

    if (!containerElement) {
      throw new Error("containerRef was not wired");
    }
    const containerRect = containerElement.getBoundingClientRect();

    const panX = containerElement.dataset.panX ? parseFloat(containerElement.dataset.panX) : 0;
    const panY = containerElement.dataset.panY ? parseFloat(containerElement.dataset.panY) : 0;
    const zoom = containerElement.dataset.zoom ? parseFloat(containerElement.dataset.zoom) : 1;

    const containerX = pos.clientX - containerRect.x;
    const containerY = pos.clientY - containerRect.y;

    return {
      canvasX: containerX / zoom - panX,
      canvasY: containerY / zoom - panY,
    };
  }, []);

  const { containerProps } = usePan({
    disablePan,
    onPanByScreenPos: panByScreenPos,
    isDragHandleElement,
    onPanStart: () => setDragging(true),
    onPanEnd: () => setDragging(false),
  });

  const handleScroll = useCallback((ev: React.WheelEvent) => {
    const outerRect = containerRef.current?.getBoundingClientRect();
    if (!outerRect) return;

    const cursorX = ev.clientX - outerRect.x;
    const cursorY = ev.clientY - outerRect.y;

    setPosition(({ x, y, zoom }) => {
      const nextZoom = Math.min(Math.max(0.3, zoom * Math.exp(-ev.deltaY * 0.001)), 2);
      const scale = 1 / nextZoom - 1 / zoom;

      return {
        x: x + cursorX * scale,
        y: y + cursorY * scale,
        zoom: nextZoom,
      };
    });
  }, []);

  useImperativeHandle(ref, () => ({
    clientToCanvasPos,
    panByScreenPos,
    isDragHandleElement,
  }));

  return (
    <div
      className={classNames("panzoomcanvas", {
        "panzoomcanvas--panning": dragging,
        "panzoomcanvas--pan-disabled": disablePan,
      })}
      data-pan-x={position.x}
      data-pan-y={position.y}
      data-zoom={position.zoom}
      ref={containerRef}
      onWheel={handleScroll}
      {...containerProps}
    >
      <div
        className="panzoomcanvas__content"
        style={{
          transform: `scale(${position.zoom}) translate(${position.x}px, ${position.y}px)`,
        }}
        ref={contentRef}
        data-canvas-background="true"
      >
        {children}
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
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  return <context.Provider value={value}>{children}</context.Provider>;
};

export function usePanZoomCanvas() {
  return useContext(context);
}
