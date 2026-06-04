import { PortInfo, portKey } from "../components/node/node-utils";
import {
  AnyNodeSpec,
  GraphEvent,
  GraphEventHandler,
  GraphEventType,
} from "./datagraph-audio-worklet-commands";

import * as datagraph from "@patsimm/datagraph-core";

export class AudioGraphWrapper {
  private audioGraph: datagraph.AudioGraph;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private listeners: Map<string, Set<(event: any) => void>> = new Map();

  constructor(audioGraph: datagraph.AudioGraph) {
    this.audioGraph = audioGraph;

    this.audioGraph.workletNode.port.onmessage = (e: MessageEvent<GraphEvent>) => {
      const event = e.data;
      const handlers = this.listeners.get(event.type);
      if (handlers) {
        for (const handler of handlers) handler(event);
      }
    };
  }

  on<T extends GraphEventType>(type: T, handler: GraphEventHandler<T>): void {
    let handlers = this.listeners.get(type);
    if (!handlers) {
      handlers = new Set();
      this.listeners.set(type, handlers);
    }
    handlers.add(handler);
  }

  off<T extends GraphEventType>(type: T, handler: GraphEventHandler<T>): void {
    this.listeners.get(type)?.delete(handler);
  }

  addParam(value: number): datagraph.NodeInfo {
    return this.audioGraph.addParam(value);
  }

  addNode(nodeSpec: AnyNodeSpec): datagraph.NodeInfo | undefined {
    return this.audioGraph.addNode(nodeSpec.typename);
  }

  removeNode(nodeId: string): void {
    this.audioGraph.removeNode(nodeId);
  }

  setParam(nodeId: string, value: number): void {
    if (Number.isNaN(value) || !Number.isFinite(value)) {
      console.error(`Invalid parameter value ${value} for node ${nodeId}`);
      return;
    }
    this.audioGraph.setParam(nodeId, value);
  }

  addConnection(from: string, fromPort: number, to: string, toPort: number): void {
    this.audioGraph.connect(from, fromPort, to, toPort);
  }

  removeConnection(from: string, fromPort: number, to: string, toPort: number): void {
    this.audioGraph.disconnect(from, fromPort, to, toPort);
  }

  addPortDataSubscription(port: PortInfo): boolean {
    const key = portKey(port);
    const result = this.audioGraph.subscribePortData(key);
    if (!result) {
      console.warn(`Failed to subscribe to node data for port ${key}`);
    }
    return result;
  }

  removePortDataSubscription(port: PortInfo): boolean {
    this.audioGraph.unsubscribePortData(portKey(port));
    return true;
  }

  // Rust returns Float32Array | undefined; spread to number[] to preserve
  // the existing contract for usePortData (onChange: (data: number[]) => void)
  readPortData(port: PortInfo): number[] | null {
    const data = this.audioGraph.readPortData(portKey(port));
    return data != null ? [...data] : null;
  }

  addLatestValueSubscription(port: PortInfo): boolean {
    const key = portKey(port);
    const result = this.audioGraph.subscribeLatestValue(key);
    if (!result) {
      console.warn(`Failed to subscribe to latest value for port ${key}`);
    }
    return result;
  }

  removeLatestValueSubscription(port: PortInfo): boolean {
    this.audioGraph.unsubscribeLatestValue(portKey(port));
    return true;
  }

  readLatestValue(port: PortInfo): number {
    return this.audioGraph.readLatestValue(portKey(port));
  }

  setDefaultInputValue(nodeId: string, port: number, value: number): void {
    if (Number.isNaN(value) || !Number.isFinite(value)) {
      console.error(`Invalid default input value ${value} for node ${nodeId} port ${port}`);
      return;
    }
    this.audioGraph.setDefaultInput(nodeId, port, value);
  }

  resetDefaultInputValue(nodeId: string, port: number): void {
    this.audioGraph.setDefaultInput(nodeId, port, 0);
  }
}
