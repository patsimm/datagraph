import { AnyNodeState, useNodes } from "./nodes.context";

import { createContext, useState, useCallback, useContext } from "react";

const selectionContext = createContext<{
  handleNodeSelected: (nodeId: string | null) => void;
  getSelectedNode: () => AnyNodeState | null;
}>({
  handleNodeSelected: () => {
    throw new Error("handleNodeSelected not implemented");
  },
  getSelectedNode: () => {
    throw new Error("getSelectedNode not implemented");
  },
});

export function SelectionProvider({ children }: { children: React.ReactNode }) {
  const { getNode } = useNodes();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const handleNodeSelected = useCallback(async (nodeId: string | null) => {
    setSelectedNodeId(nodeId);
  }, []);

  const getSelectedNode = useCallback(() => {
    if (!selectedNodeId) return null;
    return getNode(selectedNodeId) || null;
  }, [getNode, selectedNodeId]);

  return (
    <selectionContext.Provider value={{ handleNodeSelected, getSelectedNode }}>
      {children}
    </selectionContext.Provider>
  );
}

export const useSelection = () => {
  return useContext(selectionContext);
};
