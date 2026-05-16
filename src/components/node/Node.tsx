import { parsePortKey, PortInfo, portKey } from "./node-utils";
import "./Node.css";
import type { NodeInteractionProps } from "../../node.types";
import {
  PortConnectionCompletedEvent,
  PortConnectionInitiatedEvent,
} from "../datagraph/connection-events";

import classNames from "classnames";
import { useCallback, useEffect, useRef } from "react";

export type NodeProps = {
  nodeId: string;
  kind: string;
  label: React.ReactNode;
  inputPorts: string[];
  outputPorts: string[];
  x: number;
  y: number;
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
  onPortConnectionInitiated,
  onPortConnectionCompleted,
}: React.PropsWithChildren<NodeProps>) {
  return (
    <div
      className={classNames("node", {
        "node--selected": selected,
      })}
      data-node-id={nodeId}
      data-kind={kind}
      style={{ left: x, top: y }}
      onClick={(ev) => onClick?.(nodeId, ev)}
    >
      <div className="node__wrapper">
        <div className="node__ports node__ports--input">
          {inputPorts.map((name, i) => (
            <Port
              key={portKey({ node: nodeId, port: i, portType: "in" })}
              portName={name}
              portKey={portKey({ node: nodeId, port: i, portType: "in" })}
              onPortConnectionInitiated={onPortConnectionInitiated}
              onPortConnectionCompleted={onPortConnectionCompleted}
            />
          ))}
        </div>
        <div className="node__ports node__ports--output">
          {outputPorts.map((name, i) => (
            <Port
              key={portKey({ node: nodeId, port: i, portType: "out" })}
              portName={name}
              portKey={portKey({ node: nodeId, port: i, portType: "out" })}
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
  onPortConnectionInitiated?: (startPort: PortInfo) => void;
  onPortConnectionCompleted?: (startPort: PortInfo, endPort: PortInfo) => void;
};

function Port({
  portKey,
  portName,
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

  return <div ref={ref} data-port={portKey} className="node__port" title={portName}></div>;
}
