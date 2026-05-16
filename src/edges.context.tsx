import { PortInfo } from "./components/node/node-utils";
import { useDatagraph } from "./datagraph.context";

import { createContext, useState, useCallback, useContext } from "react";

const edgesContext = createContext<{
  edges: { from: PortInfo; to: PortInfo }[];
  addEdge: (from: PortInfo, to: PortInfo) => Promise<void>;
  removeEdge: (from: PortInfo, to: PortInfo) => Promise<void>;
  removeEdgesForNodes: (...nodeIds: string[]) => Promise<void>;
}>({
  edges: [],
  addEdge: () => {
    throw new Error("Edges context not initialized yet");
  },
  removeEdge: () => {
    throw new Error("Edges context not initialized yet");
  },
  removeEdgesForNodes: () => {
    throw new Error("Edges context not initialized yet");
  },
});

function useEdgesList() {
  const { ready, addConnection, removeConnection } = useDatagraph();
  const [edges, setEdges] = useState<{ from: PortInfo; to: PortInfo }[]>([]);

  const addEdge = useCallback(
    async (from: PortInfo, to: PortInfo) => {
      if (!ready) return;
      await addConnection(from.node, from.port, to.node, to.port);
      setEdges((edges) => [...edges, { from, to }]);
    },
    [addConnection, ready]
  );

  const removeEdge = useCallback(
    async (from: PortInfo, to: PortInfo) => {
      if (!ready) return;
      await removeConnection(from.node, from.port, to.node, to.port);
      setEdges((edges) => edges.filter((e) => e.from !== from || e.to !== to));
    },
    [ready, removeConnection]
  );

  const removeEdgesForNodes = useCallback(
    async (...nodeIds: string[]) => {
      const edgesToRemove = edges.filter(
        (edge) =>
          (edge.from.node && nodeIds.some((id) => id === edge.from.node)) ||
          (edge.to.node && nodeIds.some((id) => id === edge.to.node))
      );
      for (const edge of edgesToRemove) {
        await removeEdge(edge.from, edge.to);
      }
    },
    [edges, removeEdge]
  );

  return { edges, addEdge, removeEdge, removeEdgesForNodes };
}

export function EdgesProvider({ children }: { children: React.ReactNode }) {
  return <edgesContext.Provider value={useEdgesList()}>{children}</edgesContext.Provider>;
}

export function useEdges() {
  return useContext(edgesContext);
}
