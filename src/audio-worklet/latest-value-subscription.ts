import { PortInfo, portKey } from "../components/node/node-utils";

import { AudioGraph } from "@patsimm/datagraph-core";

export const MAX_SUBSCRIPTION_COUNT = 2048;

export class LatestValueSubscription {
  private subscriptions: Map<string, { index: number; refCount: number }> = new Map();
  private freeList: number[] = Array.from({ length: MAX_SUBSCRIPTION_COUNT }, (_, i) => i);
  private ptr: number;
  private memory: WebAssembly.Memory;

  constructor(private audioGraph: AudioGraph) {
    this.ptr = audioGraph.latestValueBufferPtr();
    this.memory = audioGraph.latestValueMemory();
  }

  subscribe(port: PortInfo): number | undefined {
    const key = portKey(port);
    const existing = this.subscriptions.get(key);
    if (existing) {
      existing.refCount++;
      return existing.index;
    }
    const index = this.freeList.pop();
    if (index === undefined) {
      console.warn("Max subscription count reached, cannot subscribe to latest value");
      return undefined;
    }
    this.audioGraph.subscribeLatestValue(port.nodeId, port.port, port.portType, index);
    this.subscriptions.set(key, { index, refCount: 1 });
    return index;
  }

  unsubscribe(port: PortInfo): boolean {
    const key = portKey(port);
    const entry = this.subscriptions.get(key);
    if (!entry) return false;
    entry.refCount--;
    if (entry.refCount === 0) {
      this.audioGraph.unsubscribeLatestValue(entry.index);
      this.freeList.push(entry.index);
      this.subscriptions.delete(key);
    }
    return true;
  }

  read(port: PortInfo): number | undefined {
    const entry = this.subscriptions.get(portKey(port));
    if (entry === undefined) return undefined;
    // Re-wrap each call so memory growth is handled transparently
    const f32 = new Float32Array(this.memory.buffer, this.ptr);
    return f32[entry.index];
  }
}
