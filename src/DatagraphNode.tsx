import { useEffect } from "react"
import { useDatagraph } from "./datagraph.context"
import { NodeSpec } from "./datagraph-commands"
import { NodeType } from "@datagraph/core"

export type DatagraphNodeProps = {
  nodeKey: string
  spec: NodeSpec
  output?: boolean
}

export function DatagraphNode({ nodeKey, spec, output }: DatagraphNodeProps) {
  const { addNode } = useDatagraph()

  useEffect(() => {
    addNode(nodeKey, spec, output)
  }, [nodeKey, spec])
  return (
    <div>
      {NodeType[spec.kind]} ({nodeKey})
    </div>
  )
}
