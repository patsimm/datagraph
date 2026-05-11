import { createContext, useContext, useEffect, useRef, useState } from "react"
import processorUrl from "./datagraph-processor?url"
import wasmUrl from "@datagraph/core/datagraph_bg.wasm?url"
import { NodeSpec } from "./datagraph-commands"

export type DatagraphContext = {
  node: AudioWorkletNode | null
}

const datagraphContext = createContext<DatagraphContext>({
  node: null,
})

export function DatagraphProvider({ children }: { children: React.ReactNode }) {
  const [node, setNode] = useState<AudioWorkletNode | null>(null)

  useEffect(() => {
    async function init() {
      const audioContext = new AudioContext()
      await audioContext.audioWorklet.addModule(processorUrl)
      const workletNode = new AudioWorkletNode(audioContext, "datagraph-processor")
      workletNode.connect(audioContext.destination)

      workletNode.port.onmessage = (e) => {
        if (e.data?.type !== 'ready') return

        // Params
        workletNode.port.postMessage({ type: 'add_param', key: 'frequency', value: 1.0 })
        workletNode.port.postMessage({ type: 'add_param', key: 'adsr_gate', value: 0.0 })
        workletNode.port.postMessage({ type: 'add_param', key: 'gain', value: 0.5 })

        workletNode.port.postMessage({ type: 'set_output', key: 'output' })

        setTimeout(() => {
          workletNode.port.postMessage({ type: 'set_param', key: 'frequency', value: 1.0 })
          workletNode.port.postMessage({ type: 'set_param', key: 'adsr_gate', value: 1.0 })
        }, 1000)

        setTimeout(() => {
          workletNode.port.postMessage({ type: 'set_param', key: 'adsr_gate', value: 0.0 })
        }, 1000 + (10000 / 44100) * 1000)
      }

      const wasmBytes = await fetch(wasmUrl).then(r => r.arrayBuffer())
      workletNode.port.postMessage(wasmBytes, [wasmBytes])

      setNode(workletNode)
    }

    init()
  }, [])

  return (
    <datagraphContext.Provider value={{ node }}>
      {children}
    </datagraphContext.Provider>
  )
}

export const useDatagraph = () => {
  const { node: audioNode } = useContext(datagraphContext)

  const addParam = (key: string, value: number) => {
    audioNode?.port.postMessage({ type: 'add_param', key, value })
  }

  const addNode = (key: string, nodeSpec: NodeSpec) => {
    audioNode?.port.postMessage({ type: 'add_node', key, node: nodeSpec })
  }

  const addConnection = (from: string, fromPort: number, to: string, toPort: number) => {
    audioNode?.port.postMessage({ type: 'connect', from, fromPort, to, toPort })
  }

  return {
    addParam,
    addNode,
    addConnection,
  }
}
