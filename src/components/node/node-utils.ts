export type PortInfo = {
  node: string;
  port: number;
  portType: "in" | "out";
};

export function portKey({ node, port, portType }: PortInfo) {
  return `${node}[${portType}:${port}]`;
}

export function parsePortKey(key: string): PortInfo {
  const [node, port] = key.split("[");
  const [portType, portIndex] = port.split("]")[0].split(":");
  return { node, port: parseInt(portIndex), portType: portType as "in" | "out" };
}

export function getDatagraphNodeElement(nodeKey: string) {
  const el = document.querySelector(`[data-node-id="${nodeKey}"]`) as HTMLElement;
  if (!el) throw new Error(`Node element with key ${nodeKey} not found`);
  return el;
}

export function getDatagraphNodePortElement(key: string) {
  const el = document.querySelector(`[data-port="${key}"]`) as HTMLElement;
  if (!el) throw new Error(`Node port element with key ${key} not found`);
  return el;
}

export function getDatagraphNodePortElementForInfo(portInfo: PortInfo) {
  const el = document.querySelector(`[data-port="${portKey(portInfo)}"]`) as HTMLElement;
  if (!el) throw new Error(`Node port element with key ${portKey(portInfo)} not found`);
  return el;
}

export function getDatagraphNodeKeyFromElement(el: HTMLElement) {
  return el.getAttribute("data-node-id");
}

export function getDatagraphNodePortFromElement(el: HTMLElement) {
  return el.getAttribute("data-port");
}

export function getDatagraphNodePortInfoFromElement(el: HTMLElement) {
  const port = getDatagraphNodePortFromElement(el);
  if (!port) return null;
  return parsePortKey(port);
}
