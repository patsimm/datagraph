import { useEffect } from "react"
import { useDatagraph } from "./datagraph.context"
import { NodeSpec } from "./datagraph-commands"
import { NodeType } from "@datagraph/core"

export type DatagraphNodeProps = {
  nodeKey: string
  spec: NodeSpec
}

export function DatagraphNode({ nodeKey, spec }: DatagraphNodeProps) {
  const { addNode } = useDatagraph()

  useEffect(() => {
    addNode(nodeKey, spec)
  }, [nodeKey, spec])
  return (
    <div>
      {NodeType[spec.kind]} ({nodeKey})
    </div>
  )
}
