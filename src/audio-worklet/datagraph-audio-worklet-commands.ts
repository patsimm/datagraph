import { Graph, Param, initSync } from "@datagraph/core";
import * as datagraph from "@datagraph/core";

export type NodeSpec =
  | { kind: "oscillator"; sampleRate: number }
  | {
      kind: "adsr";
      attack: number;
      decay: number;
      sustain: number;
      release: number;
    }
  | { kind: "gain" }
  | { kind: "delay" }
  | { kind: "one-pole" };

export type NodeInfo = {
  inputNames: string[];
  outputNames: string[];
  nodeType: string;
};

export type GraphContext = {
  graph: Graph | null;
  nodeIds: Map<string, number>;
  params: Map<string, Param>;
  output: number | null;
  sampleRate: number;
};

export const commandHandlers = {
  init: async (context: GraphContext, { wasmBytes }: { wasmBytes: ArrayBuffer }) => {
    initSync({ module: wasmBytes });
    context.graph = datagraph.createGraph();
  },
  add_param: async (context: GraphContext, { key, value }: { key: string; value: number }) => {
    const param = datagraph.createParam(value);
    context.params.set(key, param);
    const nodeId = context.graph!.addParam(param);
    context.nodeIds.set(key, nodeId);
  },
  add_node: async (context: GraphContext, { key, node }: { key: string; node: NodeSpec }) => {
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
      case "gain":
        graphNode = datagraph.createGain();
        break;
      case "delay":
        graphNode = datagraph.createDelay();
        break;
      case "one-pole":
        graphNode = datagraph.createOnePoleLowPass(BigInt(50), context.sampleRate);
        break;
    }
    const nodeId = context.graph!.add(graphNode);
    context.nodeIds.set(key, nodeId);
    const info = context.graph!.nodeInfo(nodeId);
    if (!info) {
      throw new Error(`Failed to get node info for node ${key} (id: ${nodeId})`);
    }
    return {
      nodeType: info.nodeType,
      inputNames: info.inputNames,
      outputNames: info.outputNames,
    };
  },
  set_output: async (context: GraphContext, { key }: { key: string }) => {
    context.output = context.nodeIds.get(key)!;
  },
  set_param: async (context: GraphContext, { key, value }: { key: string; value: number }) => {
    context.params.get(key)!.set(value);
  },
  connect: async (
    context: GraphContext,
    { from, fromPort, to, toPort }: { from: string; fromPort: number; to: string; toPort: number }
  ) => {
    context.graph!.connect(context.nodeIds.get(from)!, fromPort, context.nodeIds.get(to)!, toPort);
  },
  disconnect: async (
    context: GraphContext,
    { from, fromPort, to, toPort }: { from: string; fromPort: number; to: string; toPort: number }
  ) => {
    context.graph!.disconnect(
      context.nodeIds.get(from)!,
      fromPort,
      context.nodeIds.get(to)!,
      toPort
    );
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
