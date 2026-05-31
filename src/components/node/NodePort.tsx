import {
  PortConnectionInitiatedEvent,
  PortConnectionCompletedEvent,
} from "../edge/connection-events";
import { PortInfo, parsePortKey, portKey } from "./node-utils";
import "./NodePort.css";

import classNames from "classnames";
import { useRef, useCallback, useEffect } from "react";

export type NodePortProps = {
  nodeId: string;
  port: number;
  portType: "in" | "out";
  portName: string;
  connected: boolean;
  hasCustomDefault?: boolean;
  onPortConnectionInitiated?: (startPort: PortInfo) => void;
  onPortConnectionCompleted?: (startPort: PortInfo, endPort: PortInfo) => void;
};

export function NodePort({
  nodeId,
  port,
  portType,
  portName,
  connected,
  hasCustomDefault,
  onPortConnectionInitiated,
  onPortConnectionCompleted,
}: NodePortProps) {
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
    const elem = ref.current;
    elem.addEventListener(PortConnectionInitiatedEvent.EVENT_NAME, handlePortConnectionInitiated);
    elem.addEventListener(PortConnectionCompletedEvent.EVENT_NAME, handlePortConnectionCompleted);
    return () => {
      elem.removeEventListener(
        PortConnectionInitiatedEvent.EVENT_NAME,
        handlePortConnectionInitiated
      );
      elem.removeEventListener(
        PortConnectionCompletedEvent.EVENT_NAME,
        handlePortConnectionCompleted
      );
    };
  }, [handlePortConnectionCompleted, handlePortConnectionInitiated]);

  return (
    <div
      className={classNames("node-port", {
        "node-port--connected": connected,
        "node-port--has-custom-default": hasCustomDefault,
        "node-port--input": portType === "in",
        "node-port--output": portType === "out",
      })}
    >
      <div className="node-port__indicator" />
      <div
        className="node-port__hover-target"
        title={portName}
        data-port={portKey({ nodeId, port, portType })}
        ref={ref}
      />
    </div>
  );
}
