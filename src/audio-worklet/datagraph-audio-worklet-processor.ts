/// <reference types="@types/audioworklet" />
import { parseError } from "../DatagraphError";
import { Command } from "./datagraph-audio-worklet-commands";
import {
  DatagraphAudioWorkletMessage,
  DatagraphAudioWorkletResponse,
} from "./datagraph-audio-worklet-message";

import { initSync } from "@datagraph/core";
import * as datagraph from "@datagraph/core";

class DatagraphProcessor extends AudioWorkletProcessor {
  graph: datagraph.Graph | null = null;
  nodeIds = new Map<string, datagraph.NodeId>();
  params = new Map<string, datagraph.Param>();
  output: datagraph.NodeId | null = null;
  sample_num = 0;

  constructor() {
    super();
    this.port.onmessage = (e: MessageEvent) => {
      const msg = e.data as DatagraphAudioWorkletMessage;
      const { id } = msg;

      try {
        this.handleCommand(msg.command);
        const response: DatagraphAudioWorkletResponse = { id, status: "ok" };
        this.port.postMessage(response);
      } catch (err) {
        const error = err instanceof Array ? (parseError(err) ?? err) : err;
        const response: DatagraphAudioWorkletResponse = { id, status: "error", error };
        this.port.postMessage(response);
      }
    };
  }

  handleCommand(cmd: Command) {
    switch (cmd.type) {
      case "init": {
        initSync({ module: cmd.wasmBytes });
        this.graph = datagraph.createGraph();
        this.port.postMessage({ type: "ready" });
        return;
      }
      case "add_param": {
        const param = datagraph.createParam(cmd.value);
        this.params.set(cmd.key, param);
        this.nodeIds.set(cmd.key, this.graph!.addParam(param));
        break;
      }
      case "add_node": {
        let graphNode: datagraph.GraphNode;
        const spec = cmd.node;
        switch (spec.kind) {
          case datagraph.NodeType.Oscillator:
            graphNode = datagraph.createOscillator(spec.sampleRate);
            break;
          case datagraph.NodeType.ADSR:
            graphNode = datagraph.createADSR(
              spec.sampleRate,
              spec.attack,
              spec.decay,
              spec.sustain,
              spec.release
            );
            break;
          case datagraph.NodeType.Gain:
            graphNode = datagraph.createGain();
            break;
          case datagraph.NodeType.Delay:
            graphNode = datagraph.createDelay();
            break;
        }
        this.nodeIds.set(cmd.key, this.graph!.add(graphNode));
        break;
      }
      case "connect": {
        this.graph!.connect(
          this.nodeIds.get(cmd.from)!,
          cmd.fromPort,
          this.nodeIds.get(cmd.to)!,
          cmd.toPort
        );
        break;
      }
      case "disconnect": {
        this.graph!.disconnect(
          this.nodeIds.get(cmd.from)!,
          cmd.fromPort,
          this.nodeIds.get(cmd.to)!,
          cmd.toPort
        );
        break;
      }
      case "set_output": {
        this.output = this.nodeIds.get(cmd.key)!;
        break;
      }
      case "set_param": {
        this.params.get(cmd.key)!.set(cmd.value);
        break;
      }
    }
  }

  process(_inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
    if (this.graph === null || this.output === null) return true;
    const output = outputs[0];
    output.forEach((channel) => {
      for (let i = 0; i < channel.length; i++) {
        this.sample_num++;
        this.graph!.tick(this.sample_num);
        channel[i] = this.graph!.output(this.output!)[0];
      }
    });
    return true;
  }
}

registerProcessor("datagraph-processor", DatagraphProcessor);
