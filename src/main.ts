import processorUrl from "./datagraph-processor?url"
import wasmUrl from "@datagraph/core/datagraph_bg.wasm?url"

const app = document.querySelector<HTMLDivElement>('#app')!
app.innerHTML = '<h1>datagraph</h1><button id="start">Start Audio</button>'

const button = document.querySelector<HTMLButtonElement>('#start')!
button.addEventListener('click', async () => {
  const audioContext = new AudioContext()
  await audioContext.audioWorklet.addModule(processorUrl)
  const node = new AudioWorkletNode(audioContext, "datagraph-processor")
  node.connect(audioContext.destination)

  node.port.onmessage = (e) => {
    if (e.data?.type !== 'ready') return

    // Params
    node.port.postMessage({ type: 'add_param', key: 'frequency', value: 1.0 })
    node.port.postMessage({ type: 'add_param', key: 'adsr_gate', value: 0.0 })
    node.port.postMessage({ type: 'add_param', key: 'gain', value: 0.5 })

    // Nodes
    node.port.postMessage({ type: 'add_node', key: 'oscillator', node: { kind: 'oscillator', sampleRate: 44100 } })
    node.port.postMessage({ type: 'add_node', key: 'adsr', node: { kind: 'adsr', sampleRate: 44100, attack: 0.1, decay: 0.1, sustain: 0.5, release: 0.2 } })
    node.port.postMessage({ type: 'add_node', key: 'adsr_gain', node: { kind: 'gain' } })
    node.port.postMessage({ type: 'add_node', key: 'delay', node: { kind: 'delay' } })
    node.port.postMessage({ type: 'add_node', key: 'output', node: { kind: 'gain' } })

    // Connections
    node.port.postMessage({ type: 'connect', from: 'frequency', fromPort: 0, to: 'oscillator', toPort: 1 })
    node.port.postMessage({ type: 'connect', from: 'adsr_gate', fromPort: 0, to: 'adsr', toPort: 0 })
    node.port.postMessage({ type: 'connect', from: 'oscillator', fromPort: 0, to: 'adsr_gain', toPort: 0 })
    node.port.postMessage({ type: 'connect', from: 'adsr', fromPort: 0, to: 'adsr_gain', toPort: 1 })
    node.port.postMessage({ type: 'connect', from: 'adsr_gain', fromPort: 0, to: 'delay', toPort: 0 })
    node.port.postMessage({ type: 'connect', from: 'gain', fromPort: 0, to: 'output', toPort: 1 })
    node.port.postMessage({ type: 'connect', from: 'delay', fromPort: 0, to: 'output', toPort: 0 })

    node.port.postMessage({ type: 'set_output', key: 'output' })

    // Replicate original timing: trigger at 1s, release at ~1.227s
    setTimeout(() => {
      node.port.postMessage({ type: 'set_param', key: 'frequency', value: 1.0 })
      node.port.postMessage({ type: 'set_param', key: 'adsr_gate', value: 1.0 })
    }, 1000)

    setTimeout(() => {
      node.port.postMessage({ type: 'set_param', key: 'adsr_gate', value: 0.0 })
    }, 1000 + (10000 / 44100) * 1000)
  }

  const wasmBytes = await fetch(wasmUrl).then(r => r.arrayBuffer())
  node.port.postMessage(wasmBytes, [wasmBytes])

  button.disabled = true
  button.textContent = 'Audio Running'
})
