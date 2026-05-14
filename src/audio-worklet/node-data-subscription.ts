import * as datagraph from "@patsimm/datagraph-core";

export const BUFFER_SIZE = 2048; // samples per node
export const MAX_SUBSCRIPTION_COUNT = 8; // max nodes to monitor
const STRIDE = 1 + BUFFER_SIZE; // flag + samples

export function createNodeDataBuffer(): SharedArrayBuffer {
  return new SharedArrayBuffer(MAX_SUBSCRIPTION_COUNT * STRIDE * Float32Array.BYTES_PER_ELEMENT);
}

export function writeNodeData(sab: SharedArrayBuffer, index: number, data: Float32Array) {
  const view = new Float32Array(sab);
  const base = index * STRIDE;
  view.set(data, base + 1); // write samples after the flag
  view[base] = 1; // mark as updated
}

export function readNodeData(sab: SharedArrayBuffer, index: number): Float32Array | null {
  const view = new Float32Array(sab);
  const base = index * STRIDE;
  if (view[base] === 0) return null;
  view[base] = 0; // clear flag
  return view.slice(base + 1, base + STRIDE);
}

export class NodeDataSubscriptionWriter {
  subscriptions: { nodeId: string; port: number; index: number }[] = [];
  nodeDataBuffer: SharedArrayBuffer;
  nodeDataAccumulators: Float32Array[] = [...new Array(MAX_SUBSCRIPTION_COUNT)].map(
    () => new Float32Array(BUFFER_SIZE)
  );
  nodeDataAccumulatorIndex = 0;

  constructor(nodeDataBuffer: SharedArrayBuffer) {
    this.nodeDataBuffer = nodeDataBuffer;
  }

  subscribe(nodeId: string): number | undefined {
    const freeIndex = [...new Array(MAX_SUBSCRIPTION_COUNT).keys()].find(
      (i) => !this.subscriptions.some((subscription) => subscription.index === i)
    );

    if (freeIndex === undefined) {
      console.warn("Max subscription count reached, cannot subscribe to node data");
      return undefined;
    }

    this.subscriptions = [...this.subscriptions, { nodeId, port: 0, index: freeIndex }];
    return freeIndex;
  }

  unsubscribe(nodeId: string): boolean {
    const subscription = this.subscriptions.find((s) => s.nodeId === nodeId);
    if (!subscription) {
      return false;
    }
    this.subscriptions = this.subscriptions.filter((s) => s.nodeId !== nodeId);
    this.nodeDataAccumulators[subscription.index] = new Float32Array(BUFFER_SIZE); // clear accumulator
    return true;
  }

  writeFromGraph(graph: datagraph.Graph) {
    for (const subscription of this.subscriptions) {
      this.nodeDataAccumulators[subscription.index][this.nodeDataAccumulatorIndex] =
        graph.output(subscription.nodeId)[subscription.port] || 0;
    }
    this.nodeDataAccumulatorIndex++;
    if (this.nodeDataAccumulatorIndex >= BUFFER_SIZE) {
      for (const subscription of this.subscriptions) {
        writeNodeData(
          this.nodeDataBuffer,
          subscription.index,
          this.nodeDataAccumulators[subscription.index]
        );
      }
      this.nodeDataAccumulatorIndex = 0;
    }
  }
}

export class NodeDataSubscriptionReader {
  subscriptionRafs: Map<string, number> = new Map();

  constructor(public nodeDataBuffer: SharedArrayBuffer) {}

  addSubscription(
    nodeId: string,
    subscriptionIndex: number,
    callback: (data: Float32Array) => void
  ) {
    const poll = () => {
      const data = readNodeData(this.nodeDataBuffer, subscriptionIndex);
      if (data) callback(data);
      const rafId = requestAnimationFrame(poll);
      this.subscriptionRafs.set(nodeId, rafId);
    };
    const rafId = requestAnimationFrame(poll);
    this.subscriptionRafs.set(nodeId, rafId);
  }

  removeSubscription(nodeId: string) {
    const rafId = this.subscriptionRafs.get(nodeId);
    if (rafId === undefined) return false;
    cancelAnimationFrame(rafId);
    return this.subscriptionRafs.delete(nodeId);
  }
}
