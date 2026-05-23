import { PortInfo } from "./components/node/node-utils";
import { useDatagraph } from "./datagraph.context";
import { useNodes } from "./nodes.context";

import { createContext, useState, useCallback, useContext } from "react";

const edgesContext = createContext<{
  edges: { from: PortInfo; to: PortInfo }[];
  connect: (from: PortInfo, to: PortInfo) => Promise<void>;
  disconnectPorts: (port: [PortInfo, PortInfo]) => Promise<void>;
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
  const { updateNodeState } = useNodes();
  const [edges, setConnection] = useState<{ from: PortInfo; to: PortInfo }[]>([]);

  const connect = useCallback(
    async (port1: PortInfo, port2: PortInfo) => {
      if (!ready) return;
      if (port1.portType === port2.portType) {
        throw new Error(`Cannot connect ${port1.portType} to ${port2.portType}`);
      }
      const from = port1.portType === "out" ? port1 : port2;
      const to = port1.portType === "in" ? port1 : port2;

      await addDatagraphConnection(from.nodeId, from.port, to.nodeId, to.port);
      setConnection((edges) => [...edges, { from, to }]);

      updateNodeState(from.nodeId, (current) => ({
        ...current,
        outputPorts: current.outputPorts.map((p, i) =>
          i === from.port ? { ...p, connectedTo: [...p.connectedTo, to] } : p
        ),
      }));
      updateNodeState(to.nodeId, (current) => ({
        ...current,
        inputPorts: current.inputPorts.map((p, i) =>
          i === to.port ? { ...p, connectedTo: [...p.connectedTo, from] } : p
        ),
      }));
    },
    [addDatagraphConnection, ready, updateNodeState]
  );

  const removeConnection = useCallback(
    async (connection: { from: PortInfo; to: PortInfo }) => {
      if (!ready) return;
      await removeDatagraphConnection(
        connection.from.nodeId,
        connection.from.port,
        connection.to.nodeId,
        connection.to.port
      );
      setConnection((edges) =>
        edges.filter((e) => e.from !== connection.from || e.to !== connection.to)
      );

      updateNodeState(connection.from.nodeId, (current) => ({
        ...current,
        outputPorts: current.outputPorts.map((p, i) =>
          i === connection.from.port
            ? {
                ...p,
                connectedTo: p.connectedTo.filter(
                  (c) =>
                    !(
                      c.nodeId === connection.to.nodeId &&
                      c.port === connection.to.port &&
                      c.portType === connection.to.portType
                    )
                ),
              }
            : p
        ),
      }));
      updateNodeState(connection.to.nodeId, (current) => ({
        ...current,
        inputPorts: current.inputPorts.map((p, i) =>
          i === connection.to.port
            ? {
                ...p,
                connectedTo: p.connectedTo.filter(
                  (c) =>
                    !(
                      c.nodeId === connection.from.nodeId &&
                      c.port === connection.from.port &&
                      c.portType === connection.from.portType
                    )
                ),
              }
            : p
        ),
      }));
    },
    [ready, removeDatagraphConnection, updateNodeState]
  );

  const disconnectPorts = useCallback(
    async (port: [PortInfo, PortInfo]) => {
      const fromPort = port.find((p) => p.portType === "out");
      const toPort = port.find((p) => p.portType === "in");
      if (!fromPort || !toPort) return;

      const connectionsToRemove = edges.filter(
        (edge) =>
          edge.from.nodeId === fromPort.nodeId &&
          edge.from.port === fromPort.port &&
          edge.from.portType === fromPort.portType &&
          edge.to.nodeId === toPort.nodeId &&
          edge.to.port === toPort.port &&
          edge.to.portType === toPort.portType
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
          (edge.from.nodeId && nodeIds.some((id) => id === edge.from.nodeId)) ||
          (edge.to.nodeId && nodeIds.some((id) => id === edge.to.nodeId))
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
