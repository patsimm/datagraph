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
};

export function NodePort({ nodeId, port, portType, portName, connected, hasCustomDefault }: NodePortProps) {
  const key = portKey({ nodeId, port, portType });
  const { onPointerDown } = usePortConnecting(key);

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
        data-port={key}
        onPointerDown={onPointerDown}
      />
    </div>
  );
}
