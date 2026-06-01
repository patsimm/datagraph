import { PanZoomCanvasRect } from "./components/canvas/utils";
import { AnyNodeState, useNodes } from "./nodes.context";

import { NodeId } from "@patsimm/datagraph-core";
import { createContext, useState, useCallback, useContext } from "react";

const selectionContext = createContext<{
  handleSelectionRangeChanged: (range: PanZoomCanvasRect | null) => void;
  handleRangeSelectionCompleted: (range: PanZoomCanvasRect) => void;
  handleNodeSelected: (nodeId: string | null) => void;
  selectNodes: (nodeIds: NodeId[]) => void;
  getSelectedNodeStates: () => AnyNodeState[];
  nodesInSelectionRange: NodeId[];
  selectedNodes: NodeId[];
}>({
  handleSelectionRangeChanged: () => {
    throw new Error("handleSelectionRangeChanged not implemented");
  },
  handleRangeSelectionCompleted: () => {
    throw new Error("handleRangeSelectionCompleted not implemented");
  },
  handleNodeSelected: () => {
    throw new Error("handleNodeSelected not implemented");
  },
  selectNodes: () => {
    throw new Error("selectNodes not implemented");
  },
  getSelectedNodeStates: () => {
    throw new Error("getSelectedNode not implemented");
  },
  nodesInSelectionRange: [],
  selectedNodes: [],
});

export function SelectionProvider({ children }: { children: React.ReactNode }) {
  const { getNode, getNodesInRange } = useNodes();
  const [selectedNodes, setSelectedNodes] = useState<NodeId[]>([]);
  const [nodesInSelectionRange, setNodesInSelectionRange] = useState<NodeId[]>([]);

  const handleNodeSelected = useCallback(async (nodeId: NodeId | null) => {
    if (!nodeId) {
      setSelectedNodes([]);
      return;
    }
    setSelectedNodes([nodeId]);
  }, []);

  const selectNodes = useCallback((nodeIds: NodeId[]) => {
    setSelectedNodes(nodeIds);
  }, []);

  const handleSelectionRangeChanged = useCallback(
    (range: PanZoomCanvasRect | null) => {
      if (!range) {
        setNodesInSelectionRange([]);
        return;
      }
      setNodesInSelectionRange(getNodesInRange(range).map((node) => node.nodeId));
    },
    [getNodesInRange]
  );

  const handleRangeSelectionCompleted = useCallback(
    (range: PanZoomCanvasRect) => {
      setSelectedNodes(getNodesInRange(range).map((node) => node.nodeId));
      setNodesInSelectionRange([]);
    },
    [getNodesInRange]
  );

  const getSelectedNodeStates = useCallback(() => {
    return selectedNodes
      .map((nodeId) => getNode(nodeId))
      .filter((node): node is AnyNodeState => !!node);
  }, [getNode, selectedNodes]);

  return (
    <selectionContext.Provider
      value={{
        handleNodeSelected,
        selectNodes,
        handleRangeSelectionCompleted,
        handleSelectionRangeChanged,
        getSelectedNodeStates,
        nodesInSelectionRange,
        selectedNodes,
      }}
    >
      {children}
    </selectionContext.Provider>
  );
}

export const useSelection = () => {
  return useContext(selectionContext);
};
