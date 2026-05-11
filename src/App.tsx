import { Datagraph } from './Datagraph'
import { DatagraphProvider, useDatagraph } from './datagraph.context'

function StartButton() {
  const { start } = useDatagraph()
  return (
    <button onClick={start}>Start</button>)
}


export function App() {
  return (
    <DatagraphProvider>
      <div>
        <h1>datagraph</h1>
        <StartButton />
        <Datagraph />
      </div>
    </DatagraphProvider>
  )
}
