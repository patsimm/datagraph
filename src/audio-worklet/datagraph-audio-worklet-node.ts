import { PortInfo, portKey } from "../components/node/node-utils";
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
import {
  createLatestValueBuffer,
  LatestValueSubscriptionReader,
} from "./latest-value-subscription";
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
  nodeDataSubscriptionReader: NodeDataSubscriptionReader;
  latestValueSubscriptionReader: LatestValueSubscriptionReader;

  constructor(context: BaseAudioContext, name: string) {
    super(context, name);

    this.nodeDataSubscriptionReader = new NodeDataSubscriptionReader(createNodeDataBuffer());
    this.latestValueSubscriptionReader = new LatestValueSubscriptionReader(
      createLatestValueBuffer()
    );

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
      console.log("First user activation detected, resuming audio context 🔊");
      context?.resume();
    }

    return new Promise<CommandResult<T>>((resolve, reject) => {
      const id = crypto.randomUUID();
      const message: DatagraphAudioWorkletMessage<T> = {
        id,
        command: { type, payload },
      };
      this._pending.set(id, { resolve, reject });
      this.port.postMessage(message);
    });
  }

  async initialize() {
    const wasmBytes = await fetch(wasmUrl).then((r) => r.arrayBuffer());
    return await this.sendCommand("init", {
      wasmBytes,
      nodeDataSharedArrayBuffer: this.nodeDataSubscriptionReader.nodeDataBuffer,
      latestValueSharedArrayBuffer: this.latestValueSubscriptionReader.nodeDataBuffer,
    });
  }

  async addParam(value: number) {
    return await this.sendCommand("add_param", { value });
  }

  async addNode(nodeSpec: AnyNodeSpec) {
    return await this.sendCommand("add_node", { node: nodeSpec });
  }

  async removeNode(nodeId: string) {
    await this.removeNodeDataSubscription(nodeId);
    await this.sendCommand("remove_node", { nodeId });
  }

  async setParam(nodeId: string, value: number) {
    if (Number.isNaN(value) || !Number.isFinite(value)) {
      console.error(`Invalid parameter value ${value} for node ${nodeId}`);
      return;
    }
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

  async addNodeDataSubscription(nodeId: string, callback: (data: Float32Array) => void) {
    const subscriptionIndex = await this.sendCommand("subscribe_data", {
      nodeId,
      port: 0,
      portType: "out",
    });
    if (subscriptionIndex === undefined) {
      console.warn(`Failed to subscribe to node data for node ${nodeId}`);
      return false;
    }
    this.nodeDataSubscriptionReader.addSubscription(nodeId, subscriptionIndex, callback);
    return true;
  }

  async removeNodeDataSubscription(nodeId: string) {
    if (!this.nodeDataSubscriptionReader.removeSubscription(nodeId)) return false;
    return await this.sendCommand("unsubscribe_data", { nodeId, port: 0, portType: "out" });
  }

  async addLatestValueSubscription(port: PortInfo) {
    const subscriptionIndex = await this.sendCommand("subscribe_latest_value", port);
    if (subscriptionIndex === undefined) {
      console.warn(`Failed to subscribe to latest value for port ${portKey(port)}`);
      return false;
    }
    this.latestValueSubscriptionReader.register(port, subscriptionIndex);
    return true;
  }

  async removeLatestValueSubscription(port: PortInfo) {
    if (!this.latestValueSubscriptionReader.unregister(port)) return false;
    return await this.sendCommand("unsubscribe_latest_value", port);
  }

  readLatestValue(port: PortInfo): number | undefined {
    return this.latestValueSubscriptionReader.read(port);
  }

  async setDefaultInputValue(nodeId: string, port: number, value: number) {
    if (Number.isNaN(value) || !Number.isFinite(value)) {
      console.error(`Invalid default input value ${value} for node ${nodeId} port ${port}`);
      return;
    }
    return await this.sendCommand("set_default_input_value", { nodeId, port, value });
  }

  async resetDefaultInputValue(nodeId: string, port: number) {
    return await this.sendCommand("reset_default_input_value", { nodeId, port });
  }
}
