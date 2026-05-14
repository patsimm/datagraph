import { CommandResult, CommandType, NodeSpec } from "./datagraph-audio-worklet-commands";
import {
  DatagraphAudioWorkletMessage,
  DatagraphAudioWorkletResponse,
} from "./datagraph-audio-worklet-message";

import wasmUrl from "@datagraph/core/datagraph_bg.wasm?url";

export class DatagraphAudioWorkletNode extends AudioWorkletNode {
  _pending: Map<
    string,
    {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      resolve: (value: any) => void;
      reject: (err: unknown) => void;
    }
  > = new Map();

  constructor(context: BaseAudioContext, name: string) {
    super(context, name);
    this.port.onmessage = (e: MessageEvent) => {
      const response = e.data as DatagraphAudioWorkletResponse<CommandType>;
      const promise = this._pending.get(response.id);
      if (promise) {
        if (response.status === "ok") {
          promise.resolve(response.result);
        } else if (response.status === "error") {
          promise.reject(response.error);
        }
        this._pending.delete(response.id);
      }
    };
  }

  private sendCommand<T extends CommandType>(
    command: DatagraphAudioWorkletMessage<T>["command"]
  ): Promise<CommandResult<T>> {
    return new Promise<CommandResult<T>>((resolve, reject) => {
      const id = crypto.randomUUID();
      const message: DatagraphAudioWorkletMessage<T> = {
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

  async addParam(value: number) {
    return await this.sendCommand({ type: "add_param", value });
  }

  async addNode(nodeSpec: NodeSpec, output: boolean = false) {
    const nodeInfo = await this.sendCommand({ type: "add_node", node: nodeSpec });
    if (output) {
      await this.sendCommand({ type: "set_output", nodeId: nodeInfo.nodeId });
    }
    return nodeInfo;
  }

  async removeNode(nodeId: string) {
    await this.sendCommand({ type: "remove_node", nodeId });
  }

  async setParam(nodeId: string, value: number) {
    await this.sendCommand({ type: "set_param", nodeId, value });
  }

  async addConnection(from: string, fromPort: number, to: string, toPort: number) {
    await this.sendCommand({ type: "connect", from, fromPort, to, toPort });
  }

  async removeConnection(from: string, fromPort: number, to: string, toPort: number) {
    await this.sendCommand({ type: "disconnect", from, fromPort, to, toPort });
  }
}
