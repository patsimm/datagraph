import { portKey } from "./node-utils";
import "./Node.css";
import type { NodePortState, NodeInteractionProps } from "../../node.types";
import { useNodeDragging } from "./node-dragging.hook";
import { NodePort } from "./NodePort";

import classNames from "classnames";
import { useCallback } from "react";

export type NodeProps = {
  kind: string;
  label: React.ReactNode;
  nodeId: string;
  x: number;
  y: number;
  inputPorts: NodePortState[];
  outputPorts: NodePortState[];
  rustNodeType: string;
} & NodeInteractionProps;

export function Node({
  nodeId,
  kind,
  label,
  inputPorts,
  outputPorts,
  x,
  y,
  children,
  selected,
  onClick,
  onFocus,
  onBlur,
  onPortConnectionInitiated,
  onPortConnectionCompleted,
}: React.PropsWithChildren<NodeProps>) {
  const { handlePointerDown, handlePointerUp } = useNodeDragging(nodeId);

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
      })}
      data-node-id={nodeId}
      data-kind={kind}
      data-input-ports={inputPorts.length}
      data-output-ports={outputPorts.length}
      style={{ left: x, top: y }}
      onClick={(ev) => onClick?.(nodeId, ev)}
      tabIndex={0}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
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
