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
