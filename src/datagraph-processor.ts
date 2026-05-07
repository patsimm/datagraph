/// <reference types="@types/audioworklet" />
import { initSync } from "@datagraph/core"
import * as datagraph from "@datagraph/core"
import { parseError } from "./DatagraphError";

type NodeSpec =
  | { kind: 'oscillator'; sampleRate: number }
  | { kind: 'adsr'; sampleRate: number; attack: number; decay: number; sustain: number; release: number }
  | { kind: 'gain' }
  | { kind: 'delay' }

type Command =
  | { type: 'add_param'; key: string; value: number }
  | { type: 'add_node'; key: string; node: NodeSpec }
  | { type: 'connect'; from: string; fromPort: number; to: string; toPort: number }
  | { type: 'set_output'; key: string }
  | { type: 'set_param'; key: string; value: number }

class DatagraphProcessor extends AudioWorkletProcessor {
  graph: datagraph.Graph | null = null
  nodeIds = new Map<string, datagraph.NodeId>()
  params = new Map<string, datagraph.Param>()
  output: datagraph.NodeId | null = null
  sample_num = 0

  constructor() {
    super()
    this.port.onmessage = (e: MessageEvent) => {
      if (e.data instanceof ArrayBuffer) {
        initSync({ module: e.data })
        this.graph = datagraph.createGraph()
        this.port.postMessage({ type: 'ready' })
        return
      }

      const cmd = e.data as Command
      const graph = this.graph!

      try {
        switch (cmd.type) {
          case 'add_param': {
            const param = datagraph.createParam(cmd.value)
            this.params.set(cmd.key, param)
            this.nodeIds.set(cmd.key, graph.addParam(param))
            break
          }
          case 'add_node': {
            let graphNode: datagraph.GraphNode
            const spec = cmd.node
            switch (spec.kind) {
              case 'oscillator': graphNode = datagraph.createOscillator(spec.sampleRate); break
              case 'adsr': graphNode = datagraph.createADSR(spec.sampleRate, spec.attack, spec.decay, spec.sustain, spec.release); break
              case 'gain': graphNode = datagraph.createGain(); break
              case 'delay': graphNode = datagraph.createDelay(); break
            }
            this.nodeIds.set(cmd.key, graph.add(graphNode))
            break
          }
          case 'connect': {
            graph.connect(
              this.nodeIds.get(cmd.from)!,
              cmd.fromPort,
              this.nodeIds.get(cmd.to)!,
              cmd.toPort,
            )
            break
          }
          case 'set_output': {
            this.output = this.nodeIds.get(cmd.key)!
            break
          }
          case 'set_param': {
            this.params.get(cmd.key)!.set(cmd.value)
            break
          }
        }
      } catch (err) {
        if (err instanceof Array) {
          const error = parseError(err)
          console.log(`Error processing command ${cmd.type}`, cmd, error)
        }
      }
    }
  }

  process(_inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
    if (this.graph === null || this.output === null) return true
    const output = outputs[0]
    output.forEach((channel) => {
      for (let i = 0; i < channel.length; i++) {
        this.sample_num++
        this.graph!.tick(this.sample_num)
        channel[i] = this.graph!.output(this.output!)[0]
      }
    })
    return true
  }
}

registerProcessor("datagraph-processor", DatagraphProcessor)
