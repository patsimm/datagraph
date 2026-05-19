import { parsePortKey, PortInfo, portKey } from "./node-utils";
import "./Node.css";
import type { NodePort, NodeInteractionProps } from "../../node.types";
import {
  PortConnectionCompletedEvent,
  PortConnectionInitiatedEvent,
} from "../datagraph/connection-events";

import classNames from "classnames";
import { useCallback, useEffect, useRef } from "react";

export type NodeProps = {
  kind: string;
  label: React.ReactNode;
  nodeId: string;
  x: number;
  y: number;
  inputPorts: NodePort[];
  outputPorts: NodePort[];
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
    >
      <div className="node__wrapper">
        <div className={"node__ports node__ports--input"}>
          {inputPorts.map((port, i) => (
            <Port
              key={portKey({ node: nodeId, port: i, portType: "in" })}
              portName={port.name}
              portKey={portKey({ node: nodeId, port: i, portType: "in" })}
              connected={port.connectedTo.length > 0}
              onPortConnectionInitiated={onPortConnectionInitiated}
              onPortConnectionCompleted={onPortConnectionCompleted}
            />
          ))}
        </div>
        <div className="node__ports node__ports--output">
          {outputPorts.map((port, i) => (
            <Port
              key={portKey({ node: nodeId, port: i, portType: "out" })}
              portName={port.name}
              portKey={portKey({ node: nodeId, port: i, portType: "out" })}
              connected={port.connectedTo.length > 0}
              onPortConnectionInitiated={onPortConnectionInitiated}
              onPortConnectionCompleted={onPortConnectionCompleted}
            />
          ))}
        </div>
        <div className="node__content">
          <div className="node__head">
            <div className="node__icon">🔘</div>
            <div className="node__label">{label || kind}</div>
          </div>
          {children && <div className="node__body">{children}</div>}
        </div>
      </div>
    </div>
  );
}

export type PortProps = {
  portKey: string;
  portName: string;
  connected: boolean;
  onPortConnectionInitiated?: (startPort: PortInfo) => void;
  onPortConnectionCompleted?: (startPort: PortInfo, endPort: PortInfo) => void;
};

function Port({
  portKey,
  portName,
  connected,
  onPortConnectionInitiated,
  onPortConnectionCompleted,
}: PortProps) {
  const ref = useRef<HTMLDivElement>(null);

  const handlePortConnectionInitiated = useCallback(
    (ev: Event) => {
      if (ev instanceof PortConnectionInitiatedEvent) {
        onPortConnectionInitiated?.(parsePortKey(ev.detail.startPortKey));
      }
    },
    [onPortConnectionInitiated]
  );
  const handlePortConnectionCompleted = useCallback(
    (ev: Event) => {
      if (ev instanceof PortConnectionCompletedEvent) {
        onPortConnectionCompleted?.(
          parsePortKey(ev.detail.startPortKey),
          parsePortKey(ev.detail.endPortKey)
        );
      }
    },
    [onPortConnectionCompleted]
  );

  useEffect(() => {
    if (!ref.current) return;
    ref.current.addEventListener(
      PortConnectionInitiatedEvent.EVENT_NAME,
      handlePortConnectionInitiated
    );
    ref.current.addEventListener(
      PortConnectionCompletedEvent.EVENT_NAME,
      handlePortConnectionCompleted
    );
  }, [handlePortConnectionCompleted, handlePortConnectionInitiated]);

  return (
    <div
      ref={ref}
      data-port={portKey}
      className={classNames("node__port", { "node__port--connected": connected })}
      title={portName}
    ></div>
  );
}
