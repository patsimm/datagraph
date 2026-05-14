/// <reference types="@types/audioworklet" />
import "./audioworklet-polyfills";
import { parseError } from "../DatagraphError";
import {
  CommandHandler,
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

class DatagraphProcessor extends AudioWorkletProcessor {
  _context: GraphContext = {
    graph: null,
    params: new Map(),
    output: null,
    sampleRate,
  };
  sample_num = 0;

  constructor() {
    super();
    this.port.onmessage = (e: MessageEvent) => {
      const msg = e.data as DatagraphAudioWorkletMessage<CommandType>;
      const {
        id,
        command: { type, ...payload },
      } = msg;

      this.handleCommand(type, payload)
        .then((result) => {
          const response: DatagraphAudioWorkletResponse<CommandType> = { id, status: "ok", result };
          this.port.postMessage(response);
        })
        .catch((err) => {
          const error = err instanceof Array ? (parseError(err) ?? err) : err;
          const response: DatagraphAudioWorkletResponse<CommandType> = {
            id,
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
    return await (commandHandlers[type] as unknown as CommandHandler<T>)(this._context, payload);
  }

  process(_inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
    const { graph, output } = this._context;
    if (graph === null || output === null) return true;
    const out = outputs[0];
    out.forEach((channel) => {
      for (let i = 0; i < channel.length; i++) {
        this.sample_num++;
        graph.tick(this.sample_num);
        channel[i] = graph.output(output)[0];
      }
    });
    return true;
  }
}

registerProcessor("datagraph-processor", DatagraphProcessor);
