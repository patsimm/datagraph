import classNames from "classnames";
import "./DatagraphNode.css";

export type DatagraphNodeProps = {
  nodeId: string;
  inputPorts: string[];
  outputPorts: string[];
  selected?: boolean;
  position?: { x: number; y: number };
  onClick?: (nodeId: string, event: React.MouseEvent<HTMLDivElement>) => void;
};

export function DatagraphNode({
  nodeId,
  inputPorts,
  outputPorts,
  position,
  children,
  selected,
  onClick,
}: React.PropsWithChildren<DatagraphNodeProps>) {
  return (
    <div
      className={classNames("datagraph-node", { "datagraph-node--selected": selected })}
      data-datagraph-node={nodeId}
      style={{ left: position?.x, top: position?.y }}
      onClick={(ev) => onClick?.(nodeId, ev)}
    >
      <div className="datagraph-node__ports datagraph-node__ports--input">
        {inputPorts.map((name, i) => (
          <div
            key={i}
            data-datagraph-port={portKey({ node: nodeId, port: i, portType: "in" })}
            className="datagraph-node__port"
            title={name}
          ></div>
        ))}
      </div>
      {children}
      <div className="datagraph-node__ports datagraph-node__ports--output">
        {outputPorts.map((name, i) => (
          <div
            key={i}
            data-datagraph-port={portKey({ node: nodeId, port: i, portType: "out" })}
            className="datagraph-node__port"
            title={name}
          ></div>
        ))}
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
  const el = document.querySelector(`[data-datagraph-node="${nodeKey}"]`) as HTMLElement;
  if (!el) {
    throw new Error(`Node element with key ${nodeKey} not found`);
  }
  return el;
}

export function getDatagraphNodePortElement(portKey: string) {
  const el = document.querySelector(`[data-datagraph-port="${portKey}"]`) as HTMLElement;
  if (!el) {
    throw new Error(`Node port element with key ${portKey} not found`);
  }
  return el;
}

export function getDatagraphNodePortElementForInfo(portInfo: PortInfo) {
  const el = document.querySelector(`[data-datagraph-port="${portKey(portInfo)}"]`) as HTMLElement;
  if (!el) {
    throw new Error(`Node port element with key ${portKey(portInfo)} not found`);
  }
  return el;
}

export function getDatagraphNodeKeyFromElement(el: HTMLElement) {
  const nodeKey = el.getAttribute("data-datagraph-node");
  return nodeKey;
}

export function getDatagraphNodePortFromElement(el: HTMLElement) {
  const port = el.getAttribute("data-datagraph-port");
  return port;
}

export function getDatagraphNodePortInfoFromElement(el: HTMLElement) {
  const port = getDatagraphNodePortFromElement(el);
  if (!port) return null;
  return parsePortKey(port);
}
