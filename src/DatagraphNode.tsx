import { useEffect } from "react"
import { useDatagraph } from "./datagraph.context"
import { NodeSpec } from "./datagraph-commands"
import { NodeType } from "@datagraph/core"

export type DatagraphNodeProps = {
  nodeKey: string
  spec: NodeSpec
  output?: boolean
  position?: { x: number, y: number }
}

export type DatagraphParamNodeProps = {
  paramKey: string
  value: number
  position?: { x: number, y: number }
}

function getInputPortsForNodeSpec(spec: NodeSpec) {
  switch (spec.kind) {
    case NodeType.Oscillator:
      return 1;
    case NodeType.Gain:
      return 2;
  }
}

function getOutputPortsForNodeSpec(spec: NodeSpec) {
  switch (spec.kind) {
    case NodeType.Oscillator:
      return 1;
    case NodeType.Gain:
      return 1;
  }
}

export function DatagraphNode({ nodeKey, spec, output, position }: DatagraphNodeProps) {
  const { addNode } = useDatagraph()

  useEffect(() => {
    addNode(nodeKey, spec, output)
  }, [nodeKey, spec])
  return (
    <div className="datagraph-node" data-datagraph-node={nodeKey} style={{ left: position?.x, top: position?.y }}>
      <div className="datagraph-node__ports datagraph-node__ports--input">
        {
          [...new Array(getInputPortsForNodeSpec(spec))].map((_, i) =>
            <div key={i} data-datagraph-port={portKey({ node: nodeKey, port: i, portType: "in" })} className="datagraph-node__port"></div>)
        }
      </div>

      {NodeType[spec.kind]} ({nodeKey})
      <div className="datagraph-node__ports datagraph-node__ports--output">
        {
          [...new Array(getOutputPortsForNodeSpec(spec))].map((_, i) =>
            <div key={i} data-datagraph-port={portKey({ node: nodeKey, port: i, portType: "out" })} className="datagraph-node__port"></div>)
        }
      </div>
    </div>
  )
}

export function DatagraphParamNode({ paramKey, value, position }: DatagraphParamNodeProps) {
  const { addParam } = useDatagraph()

  useEffect(() => {
    addParam(paramKey, value)
  }, [paramKey, value])

  return (
    <div className="datagraph-node" data-datagraph-node={paramKey} style={{ left: position?.x, top: position?.y }}>
      <div className="datagraph-node__ports datagraph-node__ports--input"></div>
      {paramKey}
      <div className="datagraph-node__ports datagraph-node__ports--output">
        <div data-datagraph-port={portKey({ node: paramKey, port: 0, portType: "out" })} className="datagraph-node__port"></div>
      </div>
    </div>
  )
}

export type PortInfo = {
  node: string,
  port: number,
  portType: "in" | "out",
}

export function portKey({ node, port, portType }: PortInfo) {
  return `${node}[${portType}:${port}]`
}

export function parsePortKey(portKey: string): PortInfo {
  const [node, port] = portKey.split("[")
  const [portType, portIndex] = port.split("]")[0].split(":")

  return { node, port: parseInt(portIndex), portType: portType as "in" | "out" }
}

export function getDatagraphNodeElement(nodeKey: string) {
  const el = document.querySelector(`[data-datagraph-node="${nodeKey}"]`) as HTMLElement
  if (!el) { throw new Error(`Node element with key ${nodeKey} not found`) }
  return el
}

export function getDatagraphNodePortElement(portKey: string) {
  const el = document.querySelector(`[data-datagraph-port="${portKey}"]`) as HTMLElement
  if (!el) { throw new Error(`Node port element with key ${portKey} not found`) }
  return el
}

export function getDatagraphNodePortElementForInfo(portInfo: PortInfo) {
  const el = document.querySelector(`[data-datagraph-port="${portKey(portInfo)}"]`) as HTMLElement
  if (!el) { throw new Error(`Node port element with key ${portKey(portInfo)} not found`) }
  return el
}

export function getDatagraphNodeKeyFromElement(el: HTMLElement) {
  const nodeKey = el.getAttribute("data-datagraph-node")
  return nodeKey
}

export function getDatagraphNodePortFromElement(el: HTMLElement) {
  const port = el.getAttribute("data-datagraph-port")
  return port
}

export function getDatagraphNodePortInfoFromElement(el: HTMLElement) {
  const port = getDatagraphNodePortFromElement(el)
  if (!port) return null;
  return parsePortKey(port)
}


