import { PortInfo } from "../components/node/node-utils";

import { Graph } from "@patsimm/datagraph-core";
import * as datagraph from "@patsimm/datagraph-core";

export type AnyNodeSpec = { kind: "datagraph"; typename: string };

export type NodeSpecKind = AnyNodeSpec["kind"];

export const PASSTHROUGH_TYPENAME = "datagraph::nodes::passthrough::Passthrough";

export type NodeInfo = {
  inputNames: string[];
  outputNames: string[];
  nodeType: string;
};

export type GraphContext = {
  graph: Graph;
  sampleRate: number;
  subscribePortData: (port: PortInfo) => number | undefined;
  unsubscribePortData: (port: PortInfo) => boolean;
  subscribeLatestValue: (port: PortInfo) => number | undefined;
  unsubscribeLatestValue: (port: PortInfo) => boolean;
  latestValueSubscriptionIndex: (port: PortInfo) => number | undefined;
};

export const commandHandlers = {
  add_param: async (context: GraphContext, { value }: { value: number }) => {
    return context.graph.addParam(value);
  },
  add_node: async (context: GraphContext, { node }: { node: AnyNodeSpec }) => {
    const graphNode = datagraph.createNode(node.typename, context.sampleRate);
    if (!graphNode) throw new Error(`Unknown node type: ${node.typename}`);
    const nodeId = context.graph.add(graphNode);
    const info = context.graph.nodeInfo(nodeId);
    if (!info) {
      throw new Error(`Failed to get node info for node ${nodeId}`);
    }
    return {
      nodeId,
      nodeType: info.nodeType,
      inputNames: info.inputNames as string[],
      outputNames: info.outputNames as string[],
      defaultInputValues: [...info.defaultInputValues] as number[],
    };
  },
  remove_node: async (context: GraphContext, { nodeId }: { nodeId: string }) => {
    context.graph.remove(nodeId);
  },
  set_param: async (
    context: GraphContext,
    { nodeId, value }: { nodeId: string; value: number }
  ) => {
    context.graph.setParamValue(nodeId, value);
  },
  connect: async (
    context: GraphContext,
    { from, fromPort, to, toPort }: { from: string; fromPort: number; to: string; toPort: number }
  ) => {
    context.graph.connect(from, fromPort, to, toPort);
  },
  disconnect: async (
    context: GraphContext,
    { from, fromPort, to, toPort }: { from: string; fromPort: number; to: string; toPort: number }
  ) => {
    context.graph.disconnect(from, fromPort, to, toPort);
  },
  subscribe_data: async (context: GraphContext, port: PortInfo) => {
    return context.subscribePortData(port);
  },
  unsubscribe_data: async (context: GraphContext, port: PortInfo) => {
    return context.unsubscribePortData(port);
  },
  subscribe_latest_value: async (context: GraphContext, port: PortInfo) => {
    return context.subscribeLatestValue(port);
  },
  unsubscribe_latest_value: async (context: GraphContext, port: PortInfo) => {
    return context.unsubscribeLatestValue(port);
  },
  latest_value_subscription_index: async (context: GraphContext, port: PortInfo) => {
    return context.latestValueSubscriptionIndex(port);
  },
  node_info: async (context: GraphContext, { nodeId }: { nodeId: string }) => {
    const info = context.graph.nodeInfo(nodeId);
    return {
      nodeId,
      nodeType: info.nodeType,
      inputNames: info.inputNames as string[],
      outputNames: info.outputNames as string[],
      defaultInputValues: [...info.defaultInputValues] as number[],
    };
  },
  set_default_input_value: async (
    context: GraphContext,
    { nodeId, port, value }: { nodeId: string; port: number; value: number }
  ) => {
    return context.graph.setDefaultInputValue(nodeId, port, value);
  },
  reset_default_input_value: async (
    context: GraphContext,
    { nodeId, port }: { nodeId: string; port: number }
  ) => {
    context.graph.setDefaultInputValue(nodeId, port, 0);
  },
} as const;

export type CommandHandlers = typeof commandHandlers;

export type CommandType = keyof CommandHandlers | "init";

export type CommandPayload<T extends CommandType> = T extends keyof CommandHandlers
  ? CommandHandlers[T] extends (context: GraphContext, payload: infer P) => Promise<unknown>
    ? P
    : never
  : T extends "init"
    ? {
        wasmBytes: ArrayBuffer;
        nodeDataSharedArrayBuffer: SharedArrayBuffer;
        latestValueSharedArrayBuffer: SharedArrayBuffer;
      }
    : never;

export type CommandResult<T extends CommandType> = T extends keyof CommandHandlers
  ? CommandHandlers[T] extends (...args: never[]) => Promise<infer R>
    ? R
    : never
  : T extends "init"
    ? { outputNodeId: string; nodeTypes: string[] }
    : never;

export type CommandHandler<T extends keyof CommandHandlers> = (
  context: GraphContext,
  payload: CommandPayload<T>
) => Promise<CommandResult<T>>;
