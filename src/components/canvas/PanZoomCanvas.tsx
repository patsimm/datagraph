import { usePan } from "./pan.hook";
import "./PanZoomCanvas.css";

import classNames from "classnames";
import React, { useCallback, useContext, useRef, useState } from "react";
import { flushSync } from "react-dom";

const context = React.createContext<PanZoomCanvasContext>({
  moveByScreenPos: () => {
    throw new Error("PanZoomCanvasContext not wired");
  },
  isDragHandleElement: () => {
    throw new Error("PanZoomCanvasContext not wired");
  },
  getBoundingClientRect: () => {
    throw new Error("PanZoomCanvasContext not wired");
  },
  setDragging: () => {
    throw new Error("PanZoomCanvasContext not wired");
  },
  clientToCanvasPos: () => {
    throw new Error("PanZoomCanvasContext not wired");
  },
});

export type PanZoomCanvasContext = {
  moveByScreenPos: (x: number, y: number) => void;
  isDragHandleElement: (target: EventTarget) => boolean;
  getBoundingClientRect: () => DOMRect;
  setDragging(dragging: boolean): void;
  clientToCanvasPos(pos: { clientX: number; clientY: number }): { x: number; y: number };
};

export function PanZoomCanvas({ children }: React.PropsWithChildren) {
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

  const getBoundingClientRect = useCallback(() => {
    if (!contentRef.current) {
      throw new Error("contentRef was not wired");
    }
    return contentRef.current.getBoundingClientRect();
  }, []);

  const isDragHandleElement = (target: EventTarget) => {
    const ele = target instanceof HTMLElement ? (target as HTMLElement) : null;
    return ele === contentRef.current || ele === containerRef.current;
  };

  const clientToCanvasPos = (pos: { clientX: number; clientY: number }) => {
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) {
      throw new Error("containerRef was not wired");
    }
    const containerX = pos.clientX - containerRect.x;
    const containerY = pos.clientY - containerRect.y;

    const x = containerX / position.zoom - position.x;
    const y = containerY / position.zoom - position.y;
    return { x, y };
  };

  const { containerProps } = usePan({
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

  return (
    <context.Provider
      value={{
        moveByScreenPos: panByScreenPos,
        getBoundingClientRect,
        isDragHandleElement,
        setDragging,
        clientToCanvasPos,
      }}
    >
      <div
        className={classNames("scroll-dragging", { "scroll-dragging--dragging": dragging })}
        ref={containerRef}
        onWheel={handleScroll}
        {...containerProps}
      >
        <div
          className="scroll-dragging__content"
          style={{
            transform: `scale(${position.zoom}) translate(${position.x}px, ${position.y}px)`,
          }}
          ref={contentRef}
          data-canvas-background="true"
        >
          {children}
        </div>
      </div>
    </context.Provider>
  );
}

export function usePanZoomCanvas() {
  return useContext(context);
}
