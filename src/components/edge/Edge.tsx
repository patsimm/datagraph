import "./Edge.css";
import { getDatagraphNodePortElementForInfo, getDatagraphNodeElement } from "../node/node-utils";

import { useCallback, useEffect, useRef } from "react";

export type EdgeProps = {
  from: string;
  fromPort: number;
  to: string;
  toPort: number;
  onClick?: () => void;
};

export function Edge({ from, fromPort, to, toPort, onClick }: EdgeProps) {
  const edgeRef = useRef<SVGSVGElement>(null);

  const recalculatePosition = useCallback(() => {
    const fromPortElem = getDatagraphNodePortElementForInfo({
      node: from,
      port: fromPort,
      portType: "out",
    });
    const toPortElem = getDatagraphNodePortElementForInfo({
      node: to,
      port: toPort,
      portType: "in",
    });

    const containerElem = document.querySelector(".datagraph") as HTMLElement;

    const fromPosX =
      fromPortElem.getBoundingClientRect().left -
      containerElem.getBoundingClientRect().left +
      0.5 * fromPortElem.getBoundingClientRect().width;
    const fromPosY =
      fromPortElem.getBoundingClientRect().top -
      containerElem.getBoundingClientRect().top +
      0.5 * fromPortElem.getBoundingClientRect().height;

    const toPosX =
      toPortElem.getBoundingClientRect().left -
      containerElem.getBoundingClientRect().left +
      0.5 * toPortElem.getBoundingClientRect().width;
    const toPosY =
      toPortElem.getBoundingClientRect().top -
      containerElem.getBoundingClientRect().top +
      0.5 * toPortElem.getBoundingClientRect().height;

    const width = Math.abs(fromPosX - toPosX);
    const height = Math.abs(fromPosY - toPosY);
    const startPosX = Math.min(fromPosX, toPosX);
    const startPosY = Math.min(fromPosY, toPosY);

    edgeRef.current!.style.left = `${startPosX}px`;
    edgeRef.current!.style.top = `${startPosY}px`;
    edgeRef.current!.style.width = `${width}px`;
    edgeRef.current!.style.height = `${height}px`;
    const line = edgeRef.current!.querySelector(".edge__line")!;
    line.setAttribute("x1", `${fromPosX - startPosX}`);
    line.setAttribute("y1", `${fromPosY - startPosY}`);
    line.setAttribute("x2", `${toPosX - startPosX}`);
    line.setAttribute("y2", `${toPosY - startPosY}`);
  }, [from, fromPort, to, toPort]);

  useEffect(() => {
    const fromElem = getDatagraphNodeElement(from);
    const toElem = getDatagraphNodeElement(to);
    const observer = new MutationObserver(recalculatePosition);
    observer.observe(fromElem, {
      attributes: true,
      attributeFilter: ["style", "class"],
      subtree: false,
    });
    observer.observe(toElem, {
      attributes: true,
      attributeFilter: ["style", "class"],
      subtree: false,
    });

    recalculatePosition();
    return () => {
      observer.disconnect();
    };
  }, [from, recalculatePosition, to]);

  return (
    <svg className="edge" ref={edgeRef}>
      <line onClick={onClick} className="edge__line" />
    </svg>
  );
}
