import { portKey, PortInfo } from "./DatagraphNode"

export type DatagraphNodeBaseProps = {
  nodeKey: string
  inputPorts: PortInfo[]
  outputPorts: PortInfo[]
  position?: { x: number, y: number }
  children?: React.ReactNode
}

export function DatagraphNodeBase({ nodeKey, inputPorts, outputPorts, position, children }: DatagraphNodeBaseProps) {
  return (
    <div className="datagraph-node" data-datagraph-node={nodeKey} style={{ left: position?.x, top: position?.y }}>
      <div className="datagraph-node__ports datagraph-node__ports--input">
        {inputPorts.map((info, i) =>
          <div key={i} data-datagraph-port={portKey(info)} className="datagraph-node__port"></div>
        )}
      </div>
      {children}
      <div className="datagraph-node__ports datagraph-node__ports--output">
        {outputPorts.map((info, i) =>
          <div key={i} data-datagraph-port={portKey(info)} className="datagraph-node__port"></div>
        )}
      </div>
    </div>
  )
}
