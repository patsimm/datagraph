import { useDatagraph } from "./datagraph.context";
import { getDatagraphNodeElement, getDatagraphNodePortElementForInfo } from "./DatagraphNode";

import { useCallback, useEffect, useRef } from "react";

export type DatagraphEdgeProps = {
  from: string;
  fromPort: number;
  to: string;
  toPort: number;
};

export function DatagraphEdge({ from, fromPort, to, toPort }: DatagraphEdgeProps) {
  const { addConnection } = useDatagraph();
  const edgeRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    addConnection(from, fromPort, to, toPort);
  }, [addConnection, from, fromPort, to, toPort]);

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
    edgeRef.current!.innerHTML = `<line x1="${fromPosX - startPosX}" y1="${fromPosY - startPosY}" x2="${toPosX - startPosX}" y2="${toPosY - startPosY}" stroke="black" stroke-width="2"/>`;
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
  }, [from, recalculatePosition, to]);
  return <svg className="datagraph-edge" ref={edgeRef}></svg>;
}
