/// <reference types="@types/audioworklet" />
import "./audioworklet-polyfills";

import * as datagraph from "@patsimm/datagraph-core";

class DatagraphProcessor extends AudioWorkletProcessor {
  processor: datagraph.WasmAudioProcessor;

  constructor(options: { processorOptions: [ArrayBuffer, WebAssembly.Memory, number] }) {
    super();
    const [module, memory, handle] = options.processorOptions;
    datagraph.initSync({ module, memory });
    this.processor = datagraph.WasmAudioProcessor.unpack(handle);
    this.processor.setPort(this.port);
  }

  process(_inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
    return this.processor.process(outputs[0][0]);
  }
}

registerProcessor("datagraph-processor", DatagraphProcessor);
