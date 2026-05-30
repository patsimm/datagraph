import "./Edge.css";
import { getNodeElement, getNodePortElement, portKey } from "../node/node-utils";
import { Edge } from "./Edge";

import { useCallback, useEffect, useState } from "react";
import { flushSync } from "react-dom";

export type EdgeProps = {
  from: string;
  fromPort: number;
  to: string;
  toPort: number;
  containerRef: React.RefObject<Pick<HTMLElement, "getBoundingClientRect"> | null>;
  onClick?: (ev: React.MouseEvent<SVGLineElement>) => void;
  ghost?: boolean;
};

export function PortConnectionEdge({
  containerRef,
  from,
  fromPort,
  to,
  toPort,
  onClick,
}: EdgeProps) {
  const [position, setPosition] = useState({ fromX: 0, fromY: 0, toX: 0, toY: 0 });

  const recalculatePosition = useCallback(() => {
    const fromPortElem = getNodePortElement(
      portKey({
        nodeId: from,
        port: fromPort,
        portType: "out",
      })
    );
    const toPortElem = getNodePortElement(
      portKey({
        nodeId: to,
        port: toPort,
        portType: "in",
      })
    );

    const containerElem = containerRef.current;
    if (!containerElem) return;

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

    setPosition({ fromX: fromPosX, fromY: fromPosY, toX: toPosX, toY: toPosY });
  }, [containerRef, from, fromPort, to, toPort]);

  useEffect(() => {
    const fromElem = getNodeElement(from);
    const toElem = getNodeElement(to);
    const observer = new MutationObserver(() => flushSync(recalculatePosition));
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

  return <Edge onClick={onClick} {...position} />;
}
