import { portKey } from "./node-utils";
import "./Node.css";
import type { NodeInteractionProps } from "../../node.types";

import classNames from "classnames";

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
            <div
              key={i}
              data-port={portKey({ node: nodeId, port: i, portType: "in" })}
              className="node__port"
              title={name}
            ></div>
          ))}
        </div>
        <div className="node__ports node__ports--output">
          {outputPorts.map((name, i) => (
            <div
              key={i}
              data-port={portKey({ node: nodeId, port: i, portType: "out" })}
              className="node__port"
              title={name}
            ></div>
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
