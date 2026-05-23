import {
  arePortsEqual,
  PortInfo,
  portKey,
  toDatagraphPortType,
} from "../components/node/node-utils";

import * as datagraph from "@patsimm/datagraph-core";

export const MAX_SUBSCRIPTION_COUNT = 2048; // max nodes to monitor

export function createLatestValueBuffer(): SharedArrayBuffer {
  return new SharedArrayBuffer(MAX_SUBSCRIPTION_COUNT * Float32Array.BYTES_PER_ELEMENT);
}

export class LatestValueSubscriptionWriter {
  subscriptions: { port: PortInfo; index: number; refCount: number }[] = [];
  nodeDataBuffer: SharedArrayBuffer;
  private view: Float32Array;
  private freeList: number[] = Array.from({ length: MAX_SUBSCRIPTION_COUNT }, (_, i) => i);

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
    }
    return true;
  }

  writeFromGraph(graph: datagraph.Graph) {
    for (const subscription of this.subscriptions) {
      this.view[subscription.index] =
        graph.portValue(
          subscription.port.nodeId,
          subscription.port.port,
          toDatagraphPortType(subscription.port.portType)
        ) ?? 0;
    }
  }

  getIndex(port: PortInfo): number | undefined {
    return this.subscriptions.find((s) => arePortsEqual(s.port, port))?.index;
  }
}

export class LatestValueSubscriptionReader {
  private view: Float32Array;
  private subscriptions: Map<string, { index: number; refCount: number }> = new Map();

  constructor(public nodeDataBuffer: SharedArrayBuffer) {
    this.view = new Float32Array(nodeDataBuffer);
  }

  register(port: PortInfo, index: number): void {
    const key = portKey(port);
    const existing = this.subscriptions.get(key);
    if (existing) {
      existing.refCount++;
    } else {
      this.subscriptions.set(key, { index, refCount: 1 });
    }
  }

  unregister(port: PortInfo): boolean {
    const key = portKey(port);
    const entry = this.subscriptions.get(key);
    if (!entry) return false;
    entry.refCount--;
    if (entry.refCount === 0) {
      this.subscriptions.delete(key);
    }
    return true;
  }

  read(port: PortInfo): number | undefined {
    const entry = this.subscriptions.get(portKey(port));
    if (entry === undefined) return undefined;
    return this.view[entry.index];
  }
}
