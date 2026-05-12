import * as datagraph from "@datagraph/core";

export function parseError(error: unknown[]) {
  const errorType = error[0] as datagraph.DatagraphError;
  switch (error[0]) {
    case datagraph.DatagraphError.GraphConnectionErrorNodeNotFound:
      return {
        type: errorType,
        nodeId: error[1],
      };
    case datagraph.DatagraphError.GraphConnectionErrorPortNotFound:
      return {
        type: errorType,
        nodeId: error[1],
        nodetype: error[2] as datagraph.NodeType,
        port: error[3],
      };
  }
}
