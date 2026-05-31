import "./Edge.css";
import { getNodeElement, getNodePortElement, portKey } from "../node/node-utils";
import { Edge } from "./Edge";
import { usePanZoomCanvas } from "../canvas/PanZoomCanvas";

import { useCallback, useEffect, useState } from "react";
import { flushSync } from "react-dom";

export type EdgeProps = {
  from: string;
  fromPort: number;
  to: string;
  toPort: number;
  onClick?: (ev: React.MouseEvent<SVGLineElement>) => void;
  ghost?: boolean;
};

export function PortConnectionEdge({ from, fromPort, to, toPort, onClick }: EdgeProps) {
  const panZoom = usePanZoomCanvas();

  const calculatePortPosition = useCallback(() => {
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

    const { canvasX: fromX, canvasY: fromY } = panZoom.clientToCanvasPos({
      clientX:
        fromPortElem.getBoundingClientRect().left +
        0.5 * fromPortElem.getBoundingClientRect().width,
      clientY:
        fromPortElem.getBoundingClientRect().top +
        0.5 * fromPortElem.getBoundingClientRect().height,
    });

    const { canvasX: toX, canvasY: toY } = panZoom.clientToCanvasPos({
      clientX:
        toPortElem.getBoundingClientRect().left + 0.5 * toPortElem.getBoundingClientRect().width,
      clientY:
        toPortElem.getBoundingClientRect().top + 0.5 * toPortElem.getBoundingClientRect().height,
    });

    return { fromX, fromY, toX, toY };
  }, [from, fromPort, panZoom, to, toPort]);

  const [position, setPosition] = useState(calculatePortPosition);

  const recalculatePosition = useCallback(() => {
    setPosition(calculatePortPosition());
  }, [calculatePortPosition]);

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

    return () => {
      observer.disconnect();
    };
  }, [from, recalculatePosition, to]);

  return <Edge onClick={onClick} {...position} />;
}
