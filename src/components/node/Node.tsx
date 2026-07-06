import { portKey } from "./node-utils";
import "./Node.css";
import type { NodePortState, NodeInteractionProps } from "../../node.types";
import { useCanvasDragging } from "../canvas/canvas-dragging.hook";
import { NodePort, NodePortProps } from "./NodePort";
import { PanZoomCanvasPosition } from "../canvas/utils";

import classNames from "classnames";
import { ComponentPropsWithoutRef, JSX, useCallback, useMemo, useRef, useState } from "react";
import { PortType } from "@patsimm/datagraph-core";

export type NodeProps = {
  kind: string;
  label: React.ReactNode;
  nodeId: string;
  inputPorts: NodePortState[];
  outputPorts: NodePortState[];
  rustNodeType: string;
  renderPort?: (props: NodePortProps, portType: PortType, portIndex: number) => JSX.Element;
} & NodeInteractionProps &
  PanZoomCanvasPosition &
  Omit<ComponentPropsWithoutRef<"div">, keyof NodeInteractionProps>;

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
  inSelectionRange,
  onClick,
  onFocus,
  onBlur,
  onDragCompleted,
  onDragMove,
  externalDragOffset,
  className,
  renderPort,
  ...forwardedProps
}: React.PropsWithChildren<NodeProps>) {
  const canvasPosition = useMemo(() => ({ canvasX, canvasY }), [canvasX, canvasY]);
  const [displayPosition, setDisplayPosition] = useState<PanZoomCanvasPosition>(canvasPosition);
  const [prevPosition, setPrevPosition] = useState(canvasPosition);
  const [dragging, setDragging] = useState(false);
  const dragOffsetRef = useRef<{ dx: number; dy: number } | null>(null);

  if (canvasPosition !== prevPosition) {
    setPrevPosition(canvasPosition);
    setDisplayPosition(canvasPosition);
  }

  const handleDragStart = useCallback(
    (pos: PanZoomCanvasPosition) => {
      dragOffsetRef.current = { dx: pos.canvasX - canvasX, dy: pos.canvasY - canvasY };
      setDragging(true);
    },
    [canvasX, canvasY]
  );

  const handleDraggedToCanvasPos = useCallback(
    (pos: PanZoomCanvasPosition) => {
      if (!dragOffsetRef.current) return;
      const newPos = {
        canvasX: pos.canvasX - dragOffsetRef.current.dx,
        canvasY: pos.canvasY - dragOffsetRef.current.dy,
      };
      setDisplayPosition(newPos);
      onDragMove?.(nodeId, newPos);
    },
    [nodeId, onDragMove]
  );

  const handleDragEnd = useCallback(
    (pos: PanZoomCanvasPosition, didMove: boolean) => {
      setDragging(false);
      if (didMove && dragOffsetRef.current) {
        onDragCompleted?.(nodeId, {
          canvasX: pos.canvasX - dragOffsetRef.current.dx,
          canvasY: pos.canvasY - dragOffsetRef.current.dy,
        });
      }
      dragOffsetRef.current = null;
    },
    [nodeId, onDragCompleted]
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
    onDragMove: handleDraggedToCanvasPos,
    onDragEnd: handleDragEnd,
    isValidTarget: isValidDragTarget,
  });

  const handleFocus = useCallback(() => {
    onFocus?.(nodeId);
  }, [nodeId, onFocus]);

  const handleBlur = useCallback(() => {
    onBlur?.(nodeId);
  }, [nodeId, onBlur]);

  const PortRenderer = useMemo(
    () =>
      renderPort
        ? ({ portIndex, ...props }: NodePortProps & { portIndex: number }) =>
            renderPort(props, props.portType, portIndex)
        : (props: NodePortProps) => <NodePort {...props} />,
    [renderPort]
  );

  return (
    <div
      className={classNames(className, "node", {
        "node--selected": selected,
        "node--dragging": dragging,
        "node--in-selection-range": inSelectionRange,
      })}
      data-node-id={nodeId}
      data-kind={kind}
      data-input-ports={inputPorts.length}
      data-output-ports={outputPorts.length}
      style={{
        left: displayPosition.canvasX + (externalDragOffset?.dx ?? 0),
        top: displayPosition.canvasY + (externalDragOffset?.dy ?? 0),
      }}
      onClick={(ev) => onClick?.(nodeId, ev)}
      tabIndex={0}
      onFocus={handleFocus}
      onBlur={handleBlur}
      {...canvasDraggingProps}
      {...forwardedProps}
    >
      <div className="node__wrapper">
        <div className={"node__ports node__ports--input"}>
          {inputPorts.map((port, i) => (
            <PortRenderer
              key={portKey({ nodeId: nodeId, port: i, portType: "in" })}
              portName={port.name}
              nodeId={nodeId}
              port={i}
              portType="in"
              connected={port.connectedTo.length > 0}
              hasCustomDefault={port.type === "in" && port.isDefaultModified}
              portIndex={i}
            />
          ))}
        </div>
        <div className="node__ports node__ports--output">
          {outputPorts.map((port, i) => (
            <PortRenderer
              key={portKey({ nodeId: nodeId, port: i, portType: "out" })}
              portName={port.name}
              nodeId={nodeId}
              port={i}
              portType="out"
              connected={port.connectedTo.length > 0}
              portIndex={i}
            />
          ))}
        </div>
        <div className="node__content">
          <div className="node__head">
            <div className="node__label">{label || kind}</div>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
