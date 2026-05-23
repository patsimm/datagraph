import { arePortsEqual, PortInfo, toDatagraphPortType } from "../components/node/node-utils";

import * as datagraph from "@patsimm/datagraph-core";

export const BUFFER_SIZE = 2048; // samples per node
export const MAX_SUBSCRIPTION_COUNT = 8; // max nodes to monitor
const STRIDE = 1 + BUFFER_SIZE; // flag + samples

export function createNodeDataBuffer(): SharedArrayBuffer {
  return new SharedArrayBuffer(MAX_SUBSCRIPTION_COUNT * STRIDE * Float32Array.BYTES_PER_ELEMENT);
}

export class NodeDataSubscriptionWriter {
  subscriptions: { port: PortInfo; index: number; refCount: number }[] = [];
  nodeDataBuffer: SharedArrayBuffer;
  private view: Float32Array;
  private freeList: number[] = Array.from({ length: MAX_SUBSCRIPTION_COUNT }, (_, i) => i);
  nodeDataAccumulators: Float32Array[] = Array.from(
    { length: MAX_SUBSCRIPTION_COUNT },
    () => new Float32Array(BUFFER_SIZE)
  );
  nodeDataAccumulatorIndex = 0;

  constructor(nodeDataBuffer: SharedArrayBuffer) {
    this.nodeDataBuffer = nodeDataBuffer;
    this.view = new Float32Array(nodeDataBuffer);
  }

  subscribe(port: PortInfo): number | undefined {
    const existing = this.subscriptions.find((s) => arePortsEqual(s.port, port));
    if (existing) {
      existing.refCount++;
      return existing.index;
    }

    const freeIndex = this.freeList.pop();
    if (freeIndex === undefined) {
      console.warn("Max subscription count reached, cannot subscribe to node data");
      return undefined;
    }

    this.subscriptions.push({ port, index: freeIndex, refCount: 1 });
    return freeIndex;
  }

  unsubscribe(port: PortInfo): boolean {
    const idx = this.subscriptions.findIndex((s) => arePortsEqual(s.port, port));
    if (idx === -1) return false;
    const subscription = this.subscriptions[idx];
    subscription.refCount--;
    if (subscription.refCount === 0) {
      this.freeList.push(subscription.index);
      this.subscriptions.splice(idx, 1);
      this.nodeDataAccumulators[subscription.index].fill(0);
    }
    return true;
  }

  writeFromGraph(graph: datagraph.Graph) {
    for (const subscription of this.subscriptions) {
      this.nodeDataAccumulators[subscription.index][this.nodeDataAccumulatorIndex] =
        graph.portValue(
          subscription.port.nodeId,
          subscription.port.port,
          toDatagraphPortType(subscription.port.portType)
        ) || 0;
    }
    this.nodeDataAccumulatorIndex++;
    if (this.nodeDataAccumulatorIndex >= BUFFER_SIZE) {
      for (const subscription of this.subscriptions) {
        const base = subscription.index * STRIDE;
        this.view.set(this.nodeDataAccumulators[subscription.index], base + 1);
        this.view[base] = 1;
      }
      this.nodeDataAccumulatorIndex = 0;
    }
  }
}

export class NodeDataSubscriptionReader {
  private view: Float32Array;
  private readBuffers: Float32Array[];
  private indexRafs: Map<
    number,
    { rafId: number; callbacks: Map<string, (data: Float32Array) => void> }
  > = new Map();

  constructor(public nodeDataBuffer: SharedArrayBuffer) {
    this.view = new Float32Array(nodeDataBuffer);
    this.readBuffers = Array.from(
      { length: MAX_SUBSCRIPTION_COUNT },
      () => new Float32Array(BUFFER_SIZE)
    );
  }

  addSubscription(
    nodeId: string,
    subscriptionIndex: number,
    callback: (data: Float32Array) => void
  ) {
    const existing = this.indexRafs.get(subscriptionIndex);
    if (existing) {
      existing.callbacks.set(nodeId, callback);
      return;
    }

    const callbacks = new Map([[nodeId, callback]]);
    const entry = { rafId: 0, callbacks };
    this.indexRafs.set(subscriptionIndex, entry);

    const poll = () => {
      const base = subscriptionIndex * STRIDE;
      if (this.view[base] !== 0) {
        this.view[base] = 0;
        const buf = this.readBuffers[subscriptionIndex];
        buf.set(this.view.subarray(base + 1, base + STRIDE));
        entry.callbacks.forEach((cb) => cb(buf));
      }
      entry.rafId = requestAnimationFrame(poll);
    };
    entry.rafId = requestAnimationFrame(poll);
  }

  removeSubscription(nodeId: string) {
    for (const [index, entry] of this.indexRafs) {
      if (!entry.callbacks.has(nodeId)) continue;
      entry.callbacks.delete(nodeId);
      if (entry.callbacks.size === 0) {
        cancelAnimationFrame(entry.rafId);
        this.indexRafs.delete(index);
      }
      return true;
    }
    return false;
  }
}
