import { PortInfo, portKey } from "../components/node/node-utils";
import {
  AnyNodeSpec,
  GraphEvent,
  GraphEventHandler,
  GraphEventType,
} from "./datagraph-audio-worklet-commands";
import { LatestValueSubscription } from "./latest-value-subscription";
import { PortDataSubscriptionReader } from "./port-data-subscription";

import * as datagraph from "@patsimm/datagraph-core";

export class AudioGraphWrapper {
  private audioGraph: datagraph.AudioGraph;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private listeners: Map<string, Set<(event: any) => void>> = new Map();
  private nodeDataReader: PortDataSubscriptionReader;

  latestValueSubscription: LatestValueSubscription;

  constructor(audioGraph: datagraph.AudioGraph) {
    this.audioGraph = audioGraph;
    this.nodeDataReader = new PortDataSubscriptionReader(audioGraph);
    this.latestValueSubscription = new LatestValueSubscription(audioGraph);

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

  addParam(value: number): void {
    this.audioGraph.addParam(value);
  }

  addNode(nodeSpec: AnyNodeSpec): void {
    this.audioGraph.add(nodeSpec.typename);
  }

  removeNode(nodeId: string): void {
    this.audioGraph.remove(nodeId);
  }

  setParam(nodeId: string, value: number): void {
    if (Number.isNaN(value) || !Number.isFinite(value)) {
      console.error(`Invalid parameter value ${value} for node ${nodeId}`);
      return;
    }
    this.audioGraph.setParamValue(nodeId, value);
  }

  addConnection(from: string, fromPort: number, to: string, toPort: number): void {
    this.audioGraph.connect(from, fromPort, to, toPort);
  }

  removeConnection(from: string, fromPort: number, to: string, toPort: number): void {
    this.audioGraph.disconnect(from, fromPort, to, toPort);
  }

  addPortDataSubscription(port: PortInfo): boolean {
    const index = this.nodeDataReader.subscribe(port);
    if (index === undefined) {
      console.warn(`Failed to subscribe to node data for port ${portKey(port)}`);
      return false;
    }
    return true;
  }

  removePortDataSubscription(port: PortInfo): boolean {
    return this.nodeDataReader.unsubscribe(port);
  }

  readPortData(port: PortInfo) {
    return this.nodeDataReader.read(port);
  }

  addLatestValueSubscription(port: PortInfo): boolean {
    const index = this.latestValueSubscription.subscribe(port);
    if (index === undefined) {
      console.warn(`Failed to subscribe to latest value for port ${portKey(port)}`);
      return false;
    }
    return true;
  }

  removeLatestValueSubscription(port: PortInfo): boolean {
    return this.latestValueSubscription.unsubscribe(port);
  }

  readLatestValue(port: PortInfo): number | undefined {
    return this.latestValueSubscription.read(port);
  }

  setDefaultInputValue(nodeId: string, port: number, value: number): void {
    if (Number.isNaN(value) || !Number.isFinite(value)) {
      console.error(`Invalid default input value ${value} for node ${nodeId} port ${port}`);
      return;
    }
    this.audioGraph.setDefaultInputValue(nodeId, port, value);
  }

  resetDefaultInputValue(nodeId: string, port: number): void {
    this.audioGraph.setDefaultInputValue(nodeId, port, 0);
  }
}
