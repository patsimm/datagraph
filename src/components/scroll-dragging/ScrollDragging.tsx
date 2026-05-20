import { useScrollDragging } from "./scroll-dragging.hook";
import "./ScrollDragging.css";

import React, { forwardRef, useCallback, useImperativeHandle, useRef } from "react";

export type ScrollDraggingHandle = {
  move: (x: number, y: number) => void;
  isDragHandleElement: (target: EventTarget) => boolean;
  getBoundingClientRect: () => DOMRect;
  setDragging(dragging: boolean): void;
};

export const ScrollDragging = forwardRef<ScrollDraggingHandle, React.PropsWithChildren>(
  ({ children }, ref) => {
    const contentRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const move = useCallback((x: number, y: number) => {
      if (!contentRef.current) {
        throw new Error("contentRef was not wired");
      }
      contentRef.current.style.transform = `translate(${x}px, ${y}px)`;
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

    const setDragging = (dragging: boolean) => {
      containerRef.current?.classList.toggle("scroll-dragging--dragging", dragging);
    };

    useImperativeHandle(ref, () => ({
      move,
      getBoundingClientRect,
      isDragHandleElement,
      setDragging,
    }));

    const dragHandleRef = useRef<ScrollDraggingHandle>({
      move,
      getBoundingClientRect,
      isDragHandleElement,
      setDragging,
    });

    const { containerProps } = useScrollDragging({ dragHandleRef });

    return (
      <div className="scroll-dragging" ref={containerRef} {...containerProps}>
        <div className="scroll-dragging__content" ref={contentRef} data-canvas-background="true">
          {children}
        </div>
      </div>
    );
  }
);
