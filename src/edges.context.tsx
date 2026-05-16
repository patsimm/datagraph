import { PortInfo } from "./components/node/node-utils";
import { useDatagraph } from "./datagraph.context";

import { createContext, useState, useCallback, useContext } from "react";

const edgesContext = createContext<{
  edges: { from: PortInfo; to: PortInfo }[];
  connect: (from: PortInfo, to: PortInfo) => Promise<void>;
  disconnectPorts: (...ports: PortInfo[]) => Promise<void>;
  disconnectNodes: (...nodeIds: string[]) => Promise<void>;
}>({
  edges: [],
  connect: () => {
    throw new Error("Edges context not initialized yet");
  },
  disconnectPorts: () => {
    throw new Error("Edges context not initialized yet");
  },
  disconnectNodes: () => {
    throw new Error("Edges context not initialized yet");
  },
});

function useEdgesList() {
  const {
    ready,
    addConnection: addDatagraphConnection,
    removeConnection: removeDatagraphConnection,
  } = useDatagraph();
  const [edges, setConnection] = useState<{ from: PortInfo; to: PortInfo }[]>([]);

  const connect = useCallback(
    async (port1: PortInfo, port2: PortInfo) => {
      if (!ready) return;
      if (port1.portType === port2.portType) {
        throw new Error(`Cannot connect ${port1.portType} to ${port2.portType}`);
      }
      const from = port1.portType === "out" ? port1 : port2;
      const to = port1.portType === "in" ? port1 : port2;

      await addDatagraphConnection(from.node, from.port, to.node, to.port);
      setConnection((edges) => [...edges, { from, to }]);
    },
    [addDatagraphConnection, ready]
  );

  const removeConnection = useCallback(
    async (connection: { from: PortInfo; to: PortInfo }) => {
      if (!ready) return;
      await removeDatagraphConnection(
        connection.from.node,
        connection.from.port,
        connection.to.node,
        connection.to.port
      );
      setConnection((edges) =>
        edges.filter((e) => e.from !== connection.from || e.to !== connection.to)
      );
    },
    [ready, removeDatagraphConnection]
  );

  const disconnectPorts = useCallback(
    async (...ports: PortInfo[]) => {
      const connectionsToRemove = edges.filter((edge) =>
        ports.some(
          (port) =>
            (port.node === edge.from.node &&
              port.port === edge.from.port &&
              port.portType === edge.from.portType) ||
            (port.node === edge.to.node &&
              port.port === edge.to.port &&
              port.portType === edge.to.portType)
        )
      );
      for (const connection of connectionsToRemove) {
        await removeConnection(connection);
      }
    },
    [edges, removeConnection]
  );

  const disconnectNodes = useCallback(
    async (...nodeIds: string[]) => {
      const connectionsToRemove = edges.filter(
        (edge) =>
          (edge.from.node && nodeIds.some((id) => id === edge.from.node)) ||
          (edge.to.node && nodeIds.some((id) => id === edge.to.node))
      );

      for (const connection of connectionsToRemove) {
        removeConnection(connection);
      }
    },
    [edges, removeConnection]
  );

  return {
    edges,
    connect,
    disconnectPorts,
    disconnectNodes,
  };
}

export function EdgesProvider({ children }: { children: React.ReactNode }) {
  return <edgesContext.Provider value={useEdgesList()}>{children}</edgesContext.Provider>;
}

export function usePortConnections() {
  return useContext(edgesContext);
}
