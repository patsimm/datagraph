import {
  CommandPayload,
  CommandResult,
  CommandType,
  AnyNodeSpec,
} from "./datagraph-audio-worklet-commands";
import {
  DatagraphAudioWorkletMessage,
  DatagraphAudioWorkletResponse,
} from "./datagraph-audio-worklet-message";
import { createNodeDataBuffer, NodeDataSubscriptionReader } from "./node-data-subscription";

import wasmUrl from "@patsimm/datagraph-core/pkg/datagraph_bg.wasm?url";

export class DatagraphAudioWorkletNode extends AudioWorkletNode {
  _pending: Map<
    string,
    {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      resolve: (value: any) => void;
      reject: (err: unknown) => void;
    }
  > = new Map();
  nodeSubscriptionReader: NodeDataSubscriptionReader;

  constructor(context: BaseAudioContext, name: string) {
    super(context, name);

    this.nodeSubscriptionReader = new NodeDataSubscriptionReader(createNodeDataBuffer());

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
    const context = this.context instanceof AudioContext ? this.context : undefined;
    if (context && context.state === "suspended" && navigator.userActivation.isActive) {
      console.log("First user activation detected, resuming audio context");
      context?.resume();
    }

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
      nodeDataSharedArrayBuffer: this.nodeSubscriptionReader.nodeDataBuffer,
    });
  }

  async addParam(value: number) {
    return await this.sendCommand("add_param", { value });
  }

  async addNode(nodeSpec: AnyNodeSpec) {
    return await this.sendCommand("add_node", { node: nodeSpec });
  }

  async removeNode(nodeId: string) {
    if (this.nodeSubscriptionReader.removeSubscription(nodeId)) {
      await this.sendCommand("unsubscribe_data", { nodeId });
    }
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

  async nodeInfo(nodeId: string) {
    return await this.sendCommand("node_info", { nodeId });
  }

  addNodeSubscription(nodeId: string, callback: (data: Float32Array) => void) {
    this.sendCommand("subscribe_data", { nodeId }).then((subscriptionIndex) => {
      if (subscriptionIndex === undefined) {
        console.warn(`Failed to subscribe to node data for node ${nodeId}`);
        return;
      }
      this.nodeSubscriptionReader.addSubscription(nodeId, subscriptionIndex, callback);
    });
  }

  async removeNodeSubscription(nodeId: string) {
    this.nodeSubscriptionReader.removeSubscription(nodeId);
    return await this.sendCommand("unsubscribe_data", { nodeId });
  }
}
