import { useEffect, useId } from "react"
import { useDatagraph } from "./datagraph.context"

export type DatagraphEdgeProps = {
  from: string
  fromPort: number
  to: string
  toPort: number
}

export function DatagraphEdge({ from, fromPort, to, toPort }: DatagraphEdgeProps) {
  const { addConnection } = useDatagraph()
  const nodeId = useId()

  useEffect(() => {
    addConnection(from, fromPort, to, toPort)
  }, [nodeId, from, fromPort, to, toPort])
  return (
    <div>
      ({from} port {fromPort}) → ({to} port {toPort})
    </div>
  )
}
