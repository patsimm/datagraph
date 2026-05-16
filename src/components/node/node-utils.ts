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

export function getNodeElement(nodeKey: string) {
  const el = document.querySelector(`[data-node-id="${nodeKey}"]`) as HTMLElement;
  if (!el) throw new Error(`Node element with key ${nodeKey} not found`);
  return el;
}

export function getNodePortElement(key: string) {
  const el = document.querySelector(`[data-port="${key}"]`) as HTMLElement;
  if (!el) throw new Error(`Node port element with key ${key} not found`);
  return el;
}

export function getNodeKeyFromElement(el: HTMLElement) {
  return el.getAttribute("data-node-id");
}

export function getNodePortKeyFromElement(el: HTMLElement) {
  return el.getAttribute("data-port");
}
