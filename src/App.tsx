import { Datagraph } from "./components/datagraph/Datagraph";
import { DatagraphProvider } from "./datagraph.context";
import { LatestPortValueProvider } from "./components/node/latest-port-value.context";
import { EdgesProvider } from "./edges.context";
import { NodesProvider } from "./nodes.context";
import { SelectionProvider } from "./selection.context";
import { MIDIProvider } from "./midi.context";

export function App() {
  return (
    <DatagraphProvider>
      <LatestPortValueProvider>
        <NodesProvider>
          <EdgesProvider>
            <SelectionProvider>
              <MIDIProvider>
                <Datagraph />
              </MIDIProvider>
            </SelectionProvider>
          </EdgesProvider>
        </NodesProvider>
      </LatestPortValueProvider>
    </DatagraphProvider>
  );
}
