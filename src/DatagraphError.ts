import * as datagraph from "@patsimm/datagraph-core";

export function parseError(error: unknown[]) {
  switch (error[0]) {
    case datagraph.DatagraphError.NodeNotFound:
      return {
        type: "NodeNotFound" as const,
        nodeId: error[1],
      };
    case datagraph.DatagraphError.PortNotFound:
      return {
        type: "PortNotFound" as const,
        nodeId: error[1],
        nodetype: error[2],
        port: error[3],
      };
    case datagraph.DatagraphError.PortAlreadyConnected:
      return {
        type: "PortAlreadyConnected" as const,
        nodeId: error[1],
        nodetype: error[2],
        port: error[3],
      };
    case datagraph.DatagraphError.ImpossibleConnection:
      return {
        type: "ImpossibleConnection" as const,
        fromNodeId: error[1],
        fromNodeType: error[2],
        fromPort: error[3],
        toNodeId: error[4],
        toNodeType: error[5],
        toPort: error[6],
      };
  }
}

export type DatagraphError = NonNullable<ReturnType<typeof parseError>>;

export type DatagraphErrorType = DatagraphError["type"];
