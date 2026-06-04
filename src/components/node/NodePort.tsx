import { usePortConnecting } from "../edge/port-connecting.hook";
import { portKey } from "./node-utils";
import "./NodePort.css";

import classNames from "classnames";

export type NodePortProps = {
  nodeId: string;
  port: number;
  portType: "in" | "out";
  portName: string;
  connected: boolean;
  hasCustomDefault?: boolean;
  className?: string;
};

export function NodePort({
  nodeId,
  port,
  portType,
  portName,
  connected,
  hasCustomDefault,
  className,
}: NodePortProps) {
  const key = portKey({ nodeId, port, portType });
  const { onPointerDown } = usePortConnecting(key);

  return (
    <div
      data-port={key}
      data-port-index={port}
      className={classNames("node-port", className, {
        "node-port--connected": connected,
        "node-port--has-custom-default": hasCustomDefault,
        "node-port--input": portType === "in",
        "node-port--output": portType === "out",
      })}
    >
      <div className="node-port__indicator" />
      <div className="node-port__hover-target" title={portName} onPointerDown={onPointerDown} />
    </div>
  );
}
