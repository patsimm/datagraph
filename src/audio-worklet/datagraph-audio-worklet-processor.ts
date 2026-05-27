/// <reference types="@types/audioworklet" />
import "./audioworklet-polyfills";
import { parseError } from "../DatagraphError";
import {
  CommandHandler,
  CommandHandlers,
  CommandPayload,
  CommandResult,
  CommandType,
  GraphContext,
  commandHandlers,
} from "./datagraph-audio-worklet-commands";
import {
  DatagraphAudioWorkletMessage,
  DatagraphAudioWorkletResponse,
} from "./datagraph-audio-worklet-message";
import { NodeDataSubscriptionWriter } from "./node-data-subscription";
import { LatestValueSubscriptionWriter } from "./latest-value-subscription";
import { PortInfo, portKey } from "../components/node/node-utils";
import { PASSTHROUGH_TYPENAME } from "./datagraph-audio-worklet-commands";

import * as datagraph from "@patsimm/datagraph-core";

class DatagraphProcessor extends AudioWorkletProcessor {
  graph: datagraph.Graph | null = null;
  outputNodeId: string | null = null;
  nodeDataSubscriptionWriter: NodeDataSubscriptionWriter | null = null;
  latestValueSubscriptionWriter: LatestValueSubscriptionWriter | null = null;

  constructor() {
    super();
    this.port.onmessage = (e: MessageEvent) => {
      const msg = e.data as DatagraphAudioWorkletMessage<CommandType>;

      this.handleCommand(msg.command.type, msg.command.payload)
        .then((result) => {
          const response: DatagraphAudioWorkletResponse<CommandType> = {
            id: msg.id,
            status: "ok",
            result,
          };
          this.port.postMessage(response);
        })
        .catch((err) => {
          const error = err instanceof Array ? (parseError(err) ?? err) : err;
          const response: DatagraphAudioWorkletResponse<CommandType> = {
            id: msg.id,
            status: "error",
            error,
          };
          this.port.postMessage(response);
        });
    };
  }

  async handleCommand<T extends CommandType>(
    type: T,
    payload: CommandPayload<T>
  ): Promise<CommandResult<T>> {
    if (type === "init") {
      return (await this.init(payload as CommandPayload<"init">)) as CommandResult<T>;
    }
    if (!this.graph || !this.nodeDataSubscriptionWriter || !this.latestValueSubscriptionWriter) {
      throw new Error(`Cannot execute command ${type} before initialization`);
    }
    const context: GraphContext = {
      graph: this.graph,
      sampleRate,
      subscribePortData: (port: PortInfo) => this.nodeDataSubscriptionWriter!.subscribe(port),
      unsubscribePortData: (port: PortInfo) => this.nodeDataSubscriptionWriter!.unsubscribe(port),
      subscribeLatestValue: (port: PortInfo) => this.latestValueSubscriptionWriter!.subscribe(port),
      unsubscribeLatestValue: (port: PortInfo) =>
        this.latestValueSubscriptionWriter!.unsubscribe(port),
      latestValueSubscriptionIndex: (port: PortInfo) =>
        this.latestValueSubscriptionWriter!.getIndex(port),
    };
    const commandHandler = commandHandlers[type as keyof typeof commandHandlers] as CommandHandler<
      keyof typeof commandHandlers
    >;
    return commandHandler(
      context,
      payload as CommandPayload<keyof CommandHandlers>
    ) as CommandResult<T>;
  }

  async init({
    wasmBytes,
    nodeDataSharedArrayBuffer,
    latestValueSharedArrayBuffer,
  }: CommandPayload<"init">): Promise<CommandResult<"init">> {
    datagraph.initSync({ module: wasmBytes });
    this.graph = datagraph.createGraph(sampleRate);
    this.outputNodeId = this.graph.add(datagraph.createNode(PASSTHROUGH_TYPENAME, sampleRate)!);
    const outputInfo = this.graph.nodeInfo(this.outputNodeId);
    this.nodeDataSubscriptionWriter = new NodeDataSubscriptionWriter(nodeDataSharedArrayBuffer);
    this.latestValueSubscriptionWriter = new LatestValueSubscriptionWriter(
      latestValueSharedArrayBuffer
    );
    return {
      outputNode: {
        nodeId: this.outputNodeId,
        nodeType: outputInfo.nodeType,
        defaultInputValues: [...outputInfo.defaultInputValues] as number[],
        inputNames: outputInfo.inputNames as string[],
        outputNames: outputInfo.outputNames as string[],
      },
      nodeTypes: datagraph.nodeTypes() as string[],
    };
  }

  process(_inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
    if (!this.graph || !this.outputNodeId) return true;

    const out = outputs[0];
    const channel0 = out[0];
    if (!channel0) return true;

    const subscribedPortList = this.nodeDataSubscriptionWriter?.subscribedPorts() ?? [];
    const portKeys: string[] = [
      portKey({ nodeId: this.outputNodeId, port: 0, portType: "out" }),
      ...subscribedPortList.map(portKey),
    ];
    const buffers: Float32Array[] = [
      channel0,
      ...subscribedPortList.map(() => new Float32Array(channel0.length)),
    ];

    this.graph.processBatch(portKeys, buffers);
    this.nodeDataSubscriptionWriter?.writeBatch(portKeys, buffers);
    this.latestValueSubscriptionWriter?.writeFromGraph(this.graph);

    for (let c = 1; c < out.length; c++) {
      out[c].set(channel0);
    }

    return true;
  }
}

registerProcessor("datagraph-processor", DatagraphProcessor);
