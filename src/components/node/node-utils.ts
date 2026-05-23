import * as datagraph from "@patsimm/datagraph-core";

export type PortInfo = {
  nodeId: string;
  port: number;
  portType: "in" | "out";
};

export type PortType = PortInfo["portType"];

export function arePortsEqual(portA: PortInfo, portB: PortInfo) {
  return (
    portA.nodeId === portB.nodeId && portA.port === portB.port && portA.portType === portB.portType
  );
}

export function toDatagraphPortType(port: PortType): datagraph.PortType {
  switch (port) {
    case "in":
      return datagraph.PortType.Input;
    case "out":
      return datagraph.PortType.Output;
    default:
      throw new Error(`Invalid port type: ${port}`);
  }
}

export function portKey({ nodeId, port, portType }: PortInfo) {
  return `${nodeId}[${portType}:${port}]`;
}

export function parsePortKey(key: string): PortInfo {
  const [node, port] = key.split("[");
  const [portType, portIndex] = port.split("]")[0].split(":");
  return { nodeId: node, port: parseInt(portIndex), portType: portType as "in" | "out" };
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
