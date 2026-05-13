import { Datagraph } from "./components/datagraph/Datagraph";
import { DatagraphProvider } from "./datagraph.context";

export function App() {
  return (
    <DatagraphProvider>
      <Datagraph />
    </DatagraphProvider>
  );
}
