import { useDatagraph } from "./datagraph.context";
import { NodeSpec } from "./datagraph-commands";
import { DatagraphNodeBase } from "./DatagraphNodeBase";

import { NodeType } from "@datagraph/core";
import { useEffect } from "react";

export type DatagraphNodeProps = {
  nodeKey: string;
  spec: NodeSpec;
  output?: boolean;
  position?: { x: number; y: number };
};

function getInputPortsForNodeSpec(spec: NodeSpec) {
  switch (spec.kind) {
    case NodeType.Oscillator:
      return 1;
    case NodeType.Gain:
      return 2;
    case NodeType.ADSR:
      return 1;
    case NodeType.Delay:
      return 1;
  }
}

function getOutputPortsForNodeSpec(spec: NodeSpec) {
  switch (spec.kind) {
    case NodeType.Oscillator:
      return 1;
    case NodeType.Gain:
      return 1;
    case NodeType.ADSR:
      return 1;
    case NodeType.Delay:
      return 1;
  }
}

export function DatagraphNode({ nodeKey, spec, output, position }: DatagraphNodeProps) {
  const { addNode } = useDatagraph();

  useEffect(() => {
    addNode(nodeKey, spec, output);
  }, [addNode, nodeKey, output, spec]);

  const inputCount = getInputPortsForNodeSpec(spec) ?? 0;
  const outputCount = getOutputPortsForNodeSpec(spec) ?? 0;

  return (
    <DatagraphNodeBase
      nodeKey={nodeKey}
      inputPorts={[...new Array(inputCount)].map((_, i) => ({
        node: nodeKey,
        port: i,
        portType: "in" as const,
      }))}
      outputPorts={[...new Array(outputCount)].map((_, i) => ({
        node: nodeKey,
        port: i,
        portType: "out" as const,
      }))}
      position={position}
    >
      {NodeType[spec.kind]} ({nodeKey})
    </DatagraphNodeBase>
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
