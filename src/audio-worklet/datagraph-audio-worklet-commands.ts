import { Graph, Param } from "@patsimm/datagraph-core";
import * as datagraph from "@patsimm/datagraph-core";

export type NodeSpec =
  | { kind: "sin" }
  | { kind: "saw" }
  | { kind: "square" }
  | {
      kind: "adsr";
      attack: number;
      decay: number;
      sustain: number;
      release: number;
    }
  | { kind: "multiply" }
  | { kind: "add" }
  | { kind: "delay" }
  | { kind: "one-pole" }
  | { kind: "passthrough" };

export type NodeSpecKind = NodeSpec["kind"];

export type NodeInfo = {
  inputNames: string[];
  outputNames: string[];
  nodeType: string;
};

export type GraphContext = {
  graph: Graph;
  params: Map<string, Param>;
  sampleRate: number;
  subscribe: (nodeId: string) => number | undefined;
  unsubscribe: (nodeId: string) => boolean;
};

export const commandHandlers = {
  add_param: async (context: GraphContext, { value }: { value: number }) => {
    const param = datagraph.createParam(value);
    const nodeId = context.graph.addParam(param);
    context.params.set(nodeId, param);
    return nodeId;
  },
  add_node: async (context: GraphContext, { node }: { node: NodeSpec }) => {
    let graphNode: datagraph.GraphNode;
    switch (node.kind) {
      case "sin":
        graphNode = datagraph.createSin(context.sampleRate);
        break;
      case "saw":
        graphNode = datagraph.createSaw(context.sampleRate);
        break;
      case "square":
        graphNode = datagraph.createSquare(context.sampleRate);
        break;
      case "adsr":
        graphNode = datagraph.createADSR(
          context.sampleRate,
          node.attack,
          node.decay,
          node.sustain,
          node.release
        );
        break;
      case "multiply":
        graphNode = datagraph.createMultiply();
        break;
      case "add":
        graphNode = datagraph.createAdd();
        break;
      case "delay":
        graphNode = datagraph.createDelay();
        break;
      case "one-pole":
        graphNode = datagraph.createOnePoleLowPass(BigInt(50), context.sampleRate);
        break;
      case "passthrough":
        graphNode = datagraph.createPassthrough();
        break;
    }
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
    };
  },
  remove_node: async (context: GraphContext, { nodeId }: { nodeId: string }) => {
    context.graph.remove(nodeId);
    if (context.params.has(nodeId)) {
      const param = context.params.get(nodeId)!;
      context.params.delete(nodeId);
      param.free();
    }
  },
  set_param: async (
    context: GraphContext,
    { nodeId, value }: { nodeId: string; value: number }
  ) => {
    context.params.get(nodeId)!.set(value);
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
  subscribe_data: async (context: GraphContext, { nodeId }: { nodeId: string }) => {
    return context.subscribe(nodeId);
  },
  unsubscribe_data: async (context: GraphContext, { nodeId }: { nodeId: string }) => {
    return context.unsubscribe(nodeId);
  },
  node_info: async (context: GraphContext, { nodeId }: { nodeId: string }) => {
    const info = context.graph.nodeInfo(nodeId);
    return {
      nodeId,
      nodeType: info.nodeType,
      inputNames: info.inputNames as string[],
      outputNames: info.outputNames as string[],
    };
  },
} as const;

export type CommandHandlers = typeof commandHandlers;

export type CommandType = keyof CommandHandlers | "init";

export type CommandPayload<T extends CommandType> = T extends keyof CommandHandlers
  ? CommandHandlers[T] extends (context: GraphContext, payload: infer P) => Promise<unknown>
    ? P
    : never
  : T extends "init"
    ? { wasmBytes: ArrayBuffer; nodeDataSharedArrayBuffer: SharedArrayBuffer }
    : never;

export type CommandResult<T extends CommandType> = T extends keyof CommandHandlers
  ? CommandHandlers[T] extends (...args: never[]) => Promise<infer R>
    ? R
    : never
  : T extends "init"
    ? { outputNodeId: string }
    : never;

export type CommandHandler<T extends keyof CommandHandlers> = (
  context: GraphContext,
  payload: CommandPayload<T>
) => Promise<CommandResult<T>>;
