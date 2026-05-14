import classNames from "classnames";
import "./Node.css";

export type NodeProps = {
  nodeId: string;
  kind: string;
  label?: React.ReactNode;
  inputPorts: string[];
  outputPorts: string[];
  selected?: boolean;
  x?: number;
  y?: number;
  onClick?: (nodeId: string, event: React.MouseEvent<HTMLDivElement>) => void;
};

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

export type PortInfo = {
  node: string;
  port: number;
  portType: "in" | "out";
};

export function portKey({ node, port, portType }: PortInfo) {
  return `${node}[${portType}:${port}]`;
}

export function parsePortKey(portKey: string): PortInfo {
  const [node, port] = portKey.split("[");
  const [portType, portIndex] = port.split("]")[0].split(":");

  return { node, port: parseInt(portIndex), portType: portType as "in" | "out" };
}

export function getDatagraphNodeElement(nodeKey: string) {
  const el = document.querySelector(`[data-node-id="${nodeKey}"]`) as HTMLElement;
  if (!el) {
    throw new Error(`Node element with key ${nodeKey} not found`);
  }
  return el;
}

export function getDatagraphNodePortElement(portKey: string) {
  const el = document.querySelector(`[data-port="${portKey}"]`) as HTMLElement;
  if (!el) {
    throw new Error(`Node port element with key ${portKey} not found`);
  }
  return el;
}

export function getDatagraphNodePortElementForInfo(portInfo: PortInfo) {
  const el = document.querySelector(`[data-port="${portKey(portInfo)}"]`) as HTMLElement;
  if (!el) {
    throw new Error(`Node port element with key ${portKey(portInfo)} not found`);
  }
  return el;
}

export function getDatagraphNodeKeyFromElement(el: HTMLElement) {
  const nodeKey = el.getAttribute("data-node-id");
  return nodeKey;
}

export function getDatagraphNodePortFromElement(el: HTMLElement) {
  const port = el.getAttribute("data-port");
  return port;
}

export function getDatagraphNodePortInfoFromElement(el: HTMLElement) {
  const port = getDatagraphNodePortFromElement(el);
  if (!port) return null;
  return parsePortKey(port);
}
