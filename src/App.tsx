import { NodeType } from '@datagraph/core'
import { DatagraphProvider } from './datagraph.context'
import { DatagraphNode } from './DatagraphNode'
import { DatagraphEdge } from './DatagraphEdge'

export function App() {
  return (
    <DatagraphProvider>
      <div>
        <h1>datagraph</h1>
        <DatagraphNode nodeKey='oscillator' spec={{ kind: NodeType.Oscillator, sampleRate: 44100 }} />
        <DatagraphNode nodeKey='adsr' spec={{ kind: NodeType.ADSR, sampleRate: 44100, attack: 0.1, decay: 0.1, sustain: 0.5, release: 0.2 }} />
        <DatagraphNode nodeKey='adsr_gain' spec={{ kind: NodeType.Gain }} />
        <DatagraphNode nodeKey='delay' spec={{ kind: NodeType.Delay }} />
        <DatagraphNode nodeKey='output' spec={{ kind: NodeType.Gain }} />
        <DatagraphEdge from='frequency' fromPort={0} to='oscillator' toPort={1} />
        <DatagraphEdge from='adsr_gate' fromPort={0} to='adsr' toPort={0} />
        <DatagraphEdge from='oscillator' fromPort={0} to='adsr_gain' toPort={0} />
        <DatagraphEdge from='adsr' fromPort={0} to='adsr_gain' toPort={1} />
        <DatagraphEdge from='adsr_gain' fromPort={0} to='delay' toPort={0} />
        <DatagraphEdge from='gain' fromPort={0} to='output' toPort={1} />
        <DatagraphEdge from='delay' fromPort={0} to='output' toPort={0} />
      </div>
    </DatagraphProvider>
  )
}
