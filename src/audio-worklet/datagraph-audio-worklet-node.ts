import {
  CommandPayload,
  CommandResult,
  CommandType,
  NodeSpec,
} from "./datagraph-audio-worklet-commands";
import {
  DatagraphAudioWorkletMessage,
  DatagraphAudioWorkletResponse,
} from "./datagraph-audio-worklet-message";
import { createNodeDataBuffer, readNodeData } from "./node-data-subscription";

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
  nodeDataBuffer: SharedArrayBuffer;
  subscriptionRafs: Map<string, number> = new Map();
  subscriptionIndex: Map<string, number> = new Map();

  constructor(context: BaseAudioContext, name: string) {
    super(context, name);

    this.nodeDataBuffer = createNodeDataBuffer();

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
    type: T,
    payload: CommandPayload<T>
  ): Promise<CommandResult<T>> {
    return new Promise<CommandResult<T>>((resolve, reject) => {
      const id = crypto.randomUUID();
      const message: DatagraphAudioWorkletMessage<T> = {
        id,
        command: { type, payload },
      };
      console.log("Sending message", message);
      this._pending.set(id, { resolve, reject });
      this.port.postMessage(message);
    });
  }

  async initialize() {
    const wasmBytes = await fetch(wasmUrl).then((r) => r.arrayBuffer());
    return await this.sendCommand("init", {
      wasmBytes,
      nodeDataSharedArrayBuffer: this.nodeDataBuffer,
    });
  }

  async addParam(value: number) {
    return await this.sendCommand("add_param", { value });
  }

  async addNode(nodeSpec: NodeSpec) {
    return await this.sendCommand("add_node", { node: nodeSpec });
  }

  async removeNode(nodeId: string) {
    await this.sendCommand("remove_node", { nodeId });
  }

  async setParam(nodeId: string, value: number) {
    await this.sendCommand("set_param", { nodeId, value });
  }

  async addConnection(from: string, fromPort: number, to: string, toPort: number) {
    await this.sendCommand("connect", { from, fromPort, to, toPort });
  }

  async removeConnection(from: string, fromPort: number, to: string, toPort: number) {
    await this.sendCommand("disconnect", { from, fromPort, to, toPort });
  }

  addNodeSubscription(nodeId: string, callback: (data: Float32Array) => void) {
    this.sendCommand("subscribe_data", { nodeId }).then((subscriptionId) => {
      this.subscriptionIndex.set(nodeId, subscriptionId);
    });

    const poll = () => {
      if (this.subscriptionIndex.has(nodeId)) {
        const subscriptionId = this.subscriptionIndex.get(nodeId)!;
        const data = readNodeData(this.nodeDataBuffer, subscriptionId);
        if (data) callback(data);
      }
      const rafId = requestAnimationFrame(poll);
      this.subscriptionRafs.set(nodeId, rafId);
    };
    const rafId = requestAnimationFrame(poll);
    this.subscriptionRafs.set(nodeId, rafId);
  }

  async removeNodeSubscription(nodeId: string) {
    const rafId = this.subscriptionRafs.get(nodeId);
    // TODO: Really remove the subscription from the processor side as well, therefore the id handling needs to be improved
    cancelAnimationFrame(rafId!);
    this.subscriptionRafs.delete(nodeId);
  }

  readNodeData(subscription_index: number) {
    return readNodeData(this.nodeDataBuffer, subscription_index);
  }
}
