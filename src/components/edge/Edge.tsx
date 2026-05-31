import "./Edge.css";

import classNames from "classnames";
import { useRef } from "react";

export type EdgeProps = {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  onClick?: (ev: React.MouseEvent<SVGLineElement>) => void;
  ghost?: boolean;
};

export function Edge({ fromX, fromY, toX, toY, onClick, ghost }: EdgeProps) {
  const edgeRef = useRef<SVGSVGElement>(null);

  const width = Math.abs(fromX - toX);
  const height = Math.abs(fromY - toY);
  const startPosX = Math.min(fromX, toX);
  const startPosY = Math.min(fromY, toY);

  const x1 = fromX - startPosX;
  const y1 = fromY - startPosY;
  const x2 = toX - startPosX;
  const y2 = toY - startPosY;

  return (
    <svg
      width={width}
      height={height}
      style={{ left: `${startPosX}px`, top: `${startPosY}px` }}
      className={classNames("edge", { "edge--ghost": ghost })}
      ref={edgeRef}
    >
      <line
        onPointerDown={(e) => e.stopPropagation()}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        onClick={onClick}
        className="edge__line"
      />
    </svg>
  );
}
