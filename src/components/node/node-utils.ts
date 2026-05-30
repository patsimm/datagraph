import * as datagraph from "@patsimm/datagraph-core";

export type PortInfo = {
  nodeId: string;
  port: number;
  portType: datagraph.PortType;
};

export function arePortsEqual(portA: PortInfo, portB: PortInfo) {
  return (
    portA.nodeId === portB.nodeId && portA.port === portB.port && portA.portType === portB.portType
  );
}

export function portKey({ nodeId, port, portType }: PortInfo) {
  return `${nodeId}[${portType}:${port}]`;
}

export function parsePortKey(key: string): PortInfo {
  const [node, port] = key.split("[");
  const [portType, portIndex] = port.split("]")[0].split(":");
  if (portType !== "in" && portType !== "out") throw new Error(`Unknown portType: ${portType}`);
  return { nodeId: node, port: parseInt(portIndex), portType: portType as datagraph.PortType };
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
