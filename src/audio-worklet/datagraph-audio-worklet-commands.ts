import { Graph, Param, initSync } from "@datagraph/core";
import * as datagraph from "@datagraph/core";

export type NodeSpec =
  | { kind: "oscillator" }
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
  graph: Graph | null;
  params: Map<string, Param>;
  output: string | null;
  sampleRate: number;
};

export const commandHandlers = {
  init: async (context: GraphContext, { wasmBytes }: { wasmBytes: ArrayBuffer }) => {
    initSync({ module: wasmBytes });
    context.graph = datagraph.createGraph();
  },
  add_param: async (context: GraphContext, { value }: { value: number }) => {
    const param = datagraph.createParam(value);
    const nodeId = context.graph!.addParam(param);
    context.params.set(nodeId, param);
    return nodeId;
  },
  add_node: async (context: GraphContext, { node }: { node: NodeSpec }) => {
    let graphNode: datagraph.GraphNode;
    switch (node.kind) {
      case "oscillator":
        graphNode = datagraph.createOscillator(context.sampleRate);
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
    const nodeId = context.graph!.add(graphNode);
    const info = context.graph!.nodeInfo(nodeId);
    if (!info) {
      throw new Error(`Failed to get node info for node ${nodeId}`);
    }
    return {
      nodeId,
      nodeType: info.nodeType,
      inputNames: info.inputNames,
      outputNames: info.outputNames,
    };
  },
  set_output: async (context: GraphContext, { nodeId }: { nodeId: string }) => {
    context.output = nodeId;
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
    context.graph!.connect(from, fromPort, to, toPort);
  },
  disconnect: async (
    context: GraphContext,
    { from, fromPort, to, toPort }: { from: string; fromPort: number; to: string; toPort: number }
  ) => {
    context.graph!.disconnect(from, fromPort, to, toPort);
  },
} as const;

type CommandHandlers = typeof commandHandlers;

export type CommandType = keyof CommandHandlers;

export type CommandPayload<T extends CommandType> = CommandHandlers[T] extends (
  context: GraphContext,
  payload: infer P
) => Promise<unknown>
  ? P
  : never;

export type CommandResult<T extends CommandType> = CommandHandlers[T] extends (
  ...args: never[]
) => Promise<infer R>
  ? R
  : never;

export type Command = {
  [T in CommandType]: { type: T; payload: CommandPayload<T>; result: CommandResult<T> };
}[CommandType];

export type CommandHandler<T extends CommandType> = (
  context: GraphContext,
  payload: CommandPayload<T>
) => Promise<CommandResult<T>>;
