import { portKey } from "./node-utils";
import "./Node.css";
import type { NodePortState, NodeInteractionProps } from "../../node.types";
import { useCanvasDragging } from "../canvas/canvas-dragging.hook";
import { NodePort } from "./NodePort";
import { CanvasPos } from "../canvas/PanZoomCanvas";

import classNames from "classnames";
import { useCallback, useMemo, useState } from "react";

export type NodeProps = {
  kind: string;
  label: React.ReactNode;
  nodeId: string;
  inputPorts: NodePortState[];
  outputPorts: NodePortState[];
  rustNodeType: string;
} & NodeInteractionProps &
  CanvasPos;

export function Node({
  nodeId,
  kind,
  label,
  inputPorts,
  outputPorts,
  canvasX,
  canvasY,
  children,
  selected,
  onClick,
  onFocus,
  onBlur,
  onPortConnectionInitiated,
  onPortConnectionCompleted,
  onCanvasPositionChanged,
}: React.PropsWithChildren<NodeProps>) {
  const canvasPosition = useMemo(() => ({ canvasX, canvasY }), [canvasX, canvasY]);
  const [displayPosition, setDisplayPosition] = useState<CanvasPos>(canvasPosition);
  const [prevPosition, setPrevPosition] = useState(canvasPosition);
  const [dragging, setDragging] = useState(false);

  if (canvasPosition !== prevPosition) {
    setPrevPosition(canvasPosition);
    setDisplayPosition(canvasPosition);
  }

  const handleDragStart = useCallback(() => {
    setDragging(true);
  }, []);

  const handleDraggedToCanvasPos = useCallback((pos: CanvasPos) => {
    setDisplayPosition(pos);
  }, []);

  const handleDragEnd = useCallback(
    (pos: CanvasPos, didMove: boolean) => {
      setDragging(false);
      if (didMove) {
        onCanvasPositionChanged(nodeId, pos);
      }
    },
    [nodeId, onCanvasPositionChanged]
  );

  const isValidDragTarget = useCallback((target: EventTarget) => {
    const htmlElement = target as HTMLElement;
    if (htmlElement.closest(".node__ports")) {
      return false;
    }
    return true;
  }, []);

  const canvasDraggingProps = useCanvasDragging({
    onDragStart: handleDragStart,
    onDraggedToCanvasPos: handleDraggedToCanvasPos,
    onDragEnd: handleDragEnd,
    isValidTarget: isValidDragTarget,
  });

  const handleFocus = useCallback(() => {
    onFocus?.(nodeId);
  }, [nodeId, onFocus]);

  const handleBlur = useCallback(() => {
    onBlur?.(nodeId);
  }, [nodeId, onBlur]);

  return (
    <div
      className={classNames("node", {
        "node--selected": selected,
        "node--dragging": dragging,
      })}
      data-node-id={nodeId}
      data-kind={kind}
      data-input-ports={inputPorts.length}
      data-output-ports={outputPorts.length}
      style={{ left: displayPosition.canvasX, top: displayPosition.canvasY }}
      onClick={(ev) => onClick?.(nodeId, ev)}
      tabIndex={0}
      onFocus={handleFocus}
      onBlur={handleBlur}
      {...canvasDraggingProps}
    >
      <div className="node__wrapper">
        <div className={"node__ports node__ports--input"}>
          {inputPorts.map((port, i) => (
            <NodePort
              key={portKey({ nodeId: nodeId, port: i, portType: "in" })}
              portName={port.name}
              nodeId={nodeId}
              port={i}
              portType="in"
              connected={port.connectedTo.length > 0}
              hasCustomDefault={port.type === "in" && port.isDefaultModified}
              onPortConnectionInitiated={onPortConnectionInitiated}
              onPortConnectionCompleted={onPortConnectionCompleted}
            />
          ))}
        </div>
        <div className="node__ports node__ports--output">
          {outputPorts.map((port, i) => (
            <NodePort
              key={portKey({ nodeId: nodeId, port: i, portType: "out" })}
              portName={port.name}
              nodeId={nodeId}
              port={i}
              portType="out"
              connected={port.connectedTo.length > 0}
              onPortConnectionInitiated={onPortConnectionInitiated}
              onPortConnectionCompleted={onPortConnectionCompleted}
            />
          ))}
        </div>
        <div className="node__content">
          <div className="node__head">
            <div className="node__label">{label || kind}</div>
          </div>
          {children && <div className="node__body">{children}</div>}
        </div>
      </div>
    </div>
  );
}
