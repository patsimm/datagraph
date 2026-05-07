import * as datagraph from "@datagraph/core";

export function parseError(error: number[]) {
  switch (error[0]) {
    case datagraph.DatagraphError.GraphConnectionErrorNodeNotFound:
      return {
        type: datagraph.DatagraphError[error[0]],
        nodeId: error[1],
      }
    case datagraph.DatagraphError.GraphConnectionErrorPortNotFound:
      return {
        type: datagraph.DatagraphError[error[0]],
        nodeId: error[1],
        nodetype: datagraph.NodeType[error[2]],
        port: error[3],
      }
  }
}
