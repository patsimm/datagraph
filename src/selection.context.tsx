import { useDatagraph } from "./datagraph.context";
import { NodeInfo } from "./audio-worklet/datagraph-audio-worklet-commands";

import { createContext, useState, useCallback, useContext } from "react";

const selectionContext = createContext<{
  setSelectedNodeId: (id: string | null) => Promise<void>;
  selectedNodeId: string | null;
  selectedNodeInfo: NodeInfo | null;
}>({
  setSelectedNodeId: () => {
    throw new Error("Selection context not initialized yet");
  },
  selectedNodeId: null,
  selectedNodeInfo: null,
});

export function SelectionProvider({ children }: { children: React.ReactNode }) {
  const datagraph = useDatagraph();
  const [selectedNodeInfo, setSelectedNodeInfo] = useState<NodeInfo | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const handleNodeSelected = useCallback(
    async (nodeId: string | null) => {
      console.log("Node selected", nodeId);
      if (nodeId === null) {
        setSelectedNodeInfo(null);
        return;
      }
      if (!datagraph.ready) {
        return;
      }
      console.log("Fetching node info for", nodeId);

      const nodeInfo = await datagraph.nodeInfo(nodeId);
      console.log("Node info", nodeInfo);
      setSelectedNodeInfo(nodeInfo);
      setSelectedNodeId(nodeId);
    },
    [datagraph]
  );

  return (
    <selectionContext.Provider
      value={{ selectedNodeId, selectedNodeInfo, setSelectedNodeId: handleNodeSelected }}
    >
      {children}
    </selectionContext.Provider>
  );
}

export const useSelection = () => {
  return useContext(selectionContext);
};
