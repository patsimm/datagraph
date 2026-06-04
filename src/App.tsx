import { Datagraph } from "./components/datagraph/Datagraph";
import { DatagraphProvider } from "./datagraph.context";
import { LatestPortValueProvider } from "./components/node/latest-port-value.context";
import { EdgesProvider } from "./edges.context";
import { NodesProvider } from "./nodes.context";
import { SelectionProvider } from "./selection.context";

export function App() {
  return (
    <DatagraphProvider>
      <LatestPortValueProvider>
        <NodesProvider>
          <EdgesProvider>
            <SelectionProvider>
              <Datagraph />
            </SelectionProvider>
          </EdgesProvider>
        </NodesProvider>
      </LatestPortValueProvider>
    </DatagraphProvider>
  );
}
