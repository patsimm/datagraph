/// <reference types="@types/audioworklet" />
import "./audioworklet-polyfills";
import { parseError } from "../DatagraphError";
import {
  CommandHandler,
  CommandHandlers,
  CommandPayload,
  CommandResult,
  CommandType,
  GraphContext,
  commandHandlers,
} from "./datagraph-audio-worklet-commands";
import {
  DatagraphAudioWorkletMessage,
  DatagraphAudioWorkletResponse,
} from "./datagraph-audio-worklet-message";
import { writeNodeData, BUFFER_SIZE } from "./node-data-subscription";

import * as datagraph from "@datagraph/core";

class DatagraphProcessor extends AudioWorkletProcessor {
  graph: datagraph.Graph | null = null;
  outputNodeId: string | null = null;
  nodeSubscriptions: string[] = [];
  nodeDataSAB: SharedArrayBuffer | null = null;
  nodeDataAccumulators: Float32Array[] = [];
  nodeDataAccumulatorIndex = 0;
  params: Map<string, datagraph.Param> = new Map();
  sample_num = 0;

  constructor() {
    super();
    this.port.onmessage = (e: MessageEvent) => {
      const msg = e.data as DatagraphAudioWorkletMessage<CommandType>;

      this.handleCommand(msg.command.type, msg.command.payload)
        .then((result) => {
          const response: DatagraphAudioWorkletResponse<CommandType> = {
            id: msg.id,
            status: "ok",
            result,
          };
          this.port.postMessage(response);
        })
        .catch((err) => {
          const error = err instanceof Array ? (parseError(err) ?? err) : err;
          const response: DatagraphAudioWorkletResponse<CommandType> = {
            id: msg.id,
            status: "error",
            error,
          };
          this.port.postMessage(response);
        });
    };
  }

  async handleCommand<T extends CommandType>(
    type: T,
    payload: CommandPayload<T>
  ): Promise<CommandResult<T>> {
    if (type === "init") {
      return (await this.init(payload as CommandPayload<"init">)) as CommandResult<T>;
    }
    if (!this.graph) {
      throw new Error(`Cannot execute command ${type} before initialization`);
    }
    const context: GraphContext = {
      graph: this.graph,
      params: this.params,
      sampleRate,
      subscriptions: this.nodeSubscriptions,
    };
    const commandHandler = commandHandlers[type as keyof typeof commandHandlers] as CommandHandler<
      keyof typeof commandHandlers
    >;
    return commandHandler(
      context,
      payload as CommandPayload<keyof CommandHandlers>
    ) as CommandResult<T>;
  }

  async init({
    wasmBytes,
    nodeDataSharedArrayBuffer,
  }: CommandPayload<"init">): Promise<CommandResult<"init">> {
    datagraph.initSync({ module: wasmBytes });
    this.graph = datagraph.createGraph();
    this.outputNodeId = this.graph.add(datagraph.createPassthrough());
    this.nodeDataSAB = nodeDataSharedArrayBuffer;
    return { outputNodeId: this.outputNodeId };
  }

  process(_inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
    if (!this.graph || !this.outputNodeId) return true;

    if (this.nodeDataAccumulators.length !== this.nodeSubscriptions.length) {
      this.nodeDataAccumulators = this.nodeSubscriptions.map(() => new Float32Array(BUFFER_SIZE));
      this.nodeDataAccumulatorIndex = 0;
    }

    const out = outputs[0];
    for (let c = 0; c < out.length; c++) {
      const channel = out[c];
      for (let i = 0; i < channel.length; i++) {
        this.sample_num++;
        this.graph.tick(this.sample_num);
        channel[i] = this.graph.output(this.outputNodeId)[0];

        if (c === 0 && this.nodeDataSAB) {
          for (let s = 0; s < this.nodeSubscriptions.length; s++) {
            this.nodeDataAccumulators[s][this.nodeDataAccumulatorIndex] = this.graph.output(
              this.nodeSubscriptions[s]
            )[0];
          }
          this.nodeDataAccumulatorIndex++;
          if (this.nodeDataAccumulatorIndex >= BUFFER_SIZE) {
            for (let s = 0; s < this.nodeSubscriptions.length; s++) {
              writeNodeData(this.nodeDataSAB, s, this.nodeDataAccumulators[s]);
            }
            this.nodeDataAccumulatorIndex = 0;
          }
        }
      }
    }
    return true;
  }
}

registerProcessor("datagraph-processor", DatagraphProcessor);
