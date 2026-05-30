import { PortInfo, portKey } from "../components/node/node-utils";

import { AudioGraph } from "@patsimm/datagraph-core";

export const BUFFER_SIZE = 2048;

const MAX_PORT_DATA_SUBSCRIPTIONS = 64;

export class PortDataSubscriptionReader {
  private ptr: number;
  private stride: number;
  private memory: WebAssembly.Memory;
  private lastGen: Map<number, number> = new Map();
  private audioGraph: AudioGraph;

  private portDataSubscriptions: Map<string, { index: number; refCount: number }> = new Map(); // nodeId → slot index
  private portDataFreeSlots: number[] = Array.from(
    { length: MAX_PORT_DATA_SUBSCRIPTIONS },
    (_, i) => i
  );

  constructor(audioGraph: AudioGraph) {
    this.audioGraph = audioGraph;
    this.ptr = audioGraph.nodeDataBufferPtr();
    this.stride = audioGraph.nodeDataBufferStride();
    this.memory = audioGraph.nodeDataMemory();
  }

  subscribe(port: PortInfo): number | undefined {
    const key = portKey(port);
    const existing = this.portDataSubscriptions.get(key);
    if (existing) {
      existing.refCount++;
      return existing.index;
    }

    const slotIndex = this.portDataFreeSlots.pop();
    if (slotIndex === undefined) {
      console.warn("Max node data subscription count reached");
      return;
    }
    this.portDataSubscriptions.set(key, { index: slotIndex, refCount: 1 });
    this.audioGraph.subscribeNodeData(port.nodeId, port.port, port.portType, slotIndex);
    return slotIndex;
  }

  unsubscribe(port: PortInfo): boolean {
    const key = portKey(port);
    const existing = this.portDataSubscriptions.get(key);
    if (!existing) return false;

    existing.refCount--;
    if (existing.refCount === 0) {
      this.audioGraph.unsubscribeNodeData(existing.index);
      this.portDataSubscriptions.delete(key);
    }

    return true;
  }

  read(port: PortInfo): number[] | null {
    const key = portKey(port);
    const existing = this.portDataSubscriptions.get(key);
    if (!existing) return null;
    const subscriptionIndex = existing.index;
    const base = subscriptionIndex * this.stride;
    const genView = new Int32Array(this.memory.buffer, this.ptr + base * 4, 1);
    const currentGen = Atomics.load(genView, 0);
    const prevGen = this.lastGen.get(subscriptionIndex) ?? -1;
    if (currentGen === prevGen) return null;
    this.lastGen.set(subscriptionIndex, currentGen);
    return [...new Float32Array(this.memory.buffer, this.ptr + (base + 1) * 4, this.stride - 1)];
  }
}
