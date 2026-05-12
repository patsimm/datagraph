import { Command, NodeSpec } from "./datagraph-audio-worklet-commands";
import {
  DatagraphAudioWorkletMessage,
  DatagraphAudioWorkletResponse,
} from "./datagraph-audio-worklet-message";

import wasmUrl from "@datagraph/core/datagraph_bg.wasm?url";

export class DatagraphAudioWorkletNode extends AudioWorkletNode {
  _pending: Map<string, { resolve: (value?: unknown) => void; reject: (err: unknown) => void }> =
    new Map();

  constructor(context: BaseAudioContext, name: string) {
    super(context, name);
    this.port.onmessage = (e: MessageEvent) => {
      const response = e.data as DatagraphAudioWorkletResponse;
      const promise = this._pending.get(response.id);
      if (promise) {
        if (response.status === "ok") {
          promise.resolve();
        } else if (response.status === "error") {
          promise.reject(response.error);
        }
        this._pending.delete(response.id);
      }
    };
  }

  private sendCommand(command: Command): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const id = crypto.randomUUID();
      const message: DatagraphAudioWorkletMessage = {
        id,
        command,
      };
      console.log("Sending command", command);
      this._pending.set(id, { resolve, reject });
      this.port.postMessage(message);
    });
  }

  async initialize() {
    const wasmBytes = await fetch(wasmUrl).then((r) => r.arrayBuffer());
    await this.sendCommand({ type: "init", wasmBytes });
  }

  async addParam(key: string, value: number) {
    await this.sendCommand({ type: "add_param", key, value });
  }

  async addNode(key: string, nodeSpec: NodeSpec, output: boolean = false) {
    await this.sendCommand({ type: "add_node", key, node: nodeSpec });
    if (output) {
      await this.sendCommand({ type: "set_output", key });
    }
  }

  async setParam(key: string, value: number) {
    await this.sendCommand({ type: "set_param", key, value });
  }

  async addConnection(from: string, fromPort: number, to: string, toPort: number) {
    await this.sendCommand({ type: "connect", from, fromPort, to, toPort });
  }

  async removeConnection(from: string, fromPort: number, to: string, toPort: number) {
    await this.sendCommand({ type: "disconnect", from, fromPort, to, toPort });
  }
}
