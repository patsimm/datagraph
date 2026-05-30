import { parsePortKey, PortInfo } from "./components/node/node-utils";
import { useDatagraph } from "./datagraph.context";
import { useNodes } from "./nodes.context";
import {
  ConnectedEvent,
  DisconnectedEvent,
} from "./audio-worklet/datagraph-audio-worklet-commands";

import { createContext, useState, useCallback, useEffect, useContext } from "react";

const edgesContext = createContext<{
  edges: { from: PortInfo; to: PortInfo }[];
  connect: (from: PortInfo, to: PortInfo) => void;
  disconnectPorts: (port: [PortInfo, PortInfo]) => void;
  disconnectNodes: (...nodeIds: string[]) => void;
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
    on,
    off,
  } = useDatagraph();
  const { updateNodeState } = useNodes();
  const [edges, setEdges] = useState<{ from: PortInfo; to: PortInfo }[]>([]);

  useEffect(() => {
    if (!ready) return;

    const handleConnected = ({ fromPort, toPort }: ConnectedEvent) => {
      const parsedFromKey = parsePortKey(fromPort.portkey);
      const parsedToKey = parsePortKey(toPort.portkey);
      const from: PortInfo = {
        nodeId: parsedFromKey.nodeId,
        port: parsedFromKey.port,
        portType: parsedFromKey.portType,
      };
      const to: PortInfo = {
        nodeId: parsedToKey.nodeId,
        port: parsedToKey.port,
        portType: parsedToKey.portType,
      };
      setEdges((prev) => [...prev, { from, to }]);
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
    };

    const handleDisconnected = ({ fromPort, toPort }: DisconnectedEvent) => {
      const parsedFromKey = parsePortKey(fromPort.portkey);
      const parsedToKey = parsePortKey(toPort.portkey);
      const fromId = parsedFromKey.nodeId;
      const fromPortIndex = parsedFromKey.port;
      const toId = parsedToKey.nodeId;
      const toPortIndex = parsedToKey.port;
      setEdges((prev) =>
        prev.filter(
          (e) =>
            !(
              e.from.nodeId === fromId &&
              e.from.port === fromPortIndex &&
              e.to.nodeId === toId &&
              e.to.port === toPortIndex
            )
        )
      );
      updateNodeState(fromId, (current) => ({
        ...current,
        outputPorts: current.outputPorts.map((p, i) =>
          i === fromPortIndex
            ? {
                ...p,
                connectedTo: p.connectedTo.filter(
                  (c) => !(c.nodeId === toId && c.port === toPortIndex && c.portType === "in")
                ),
              }
            : p
        ),
      }));
      updateNodeState(toId, (current) => ({
        ...current,
        inputPorts: current.inputPorts.map((p, i) =>
          i === toPortIndex
            ? {
                ...p,
                connectedTo: p.connectedTo.filter(
                  (c) => !(c.nodeId === fromId && c.port === fromPortIndex && c.portType === "out")
                ),
              }
            : p
        ),
      }));
    };

    on("connected", handleConnected);
    on("disconnected", handleDisconnected);
    return () => {
      off("connected", handleConnected);
      off("disconnected", handleDisconnected);
    };
  }, [ready, on, off, updateNodeState]);

  const connect = useCallback(
    (port1: PortInfo, port2: PortInfo) => {
      if (!ready) return;
      if (port1.portType === port2.portType) {
        throw new Error(`Cannot connect ${port1.portType} to ${port2.portType}`);
      }
      const from = port1.portType === "out" ? port1 : port2;
      const to = port1.portType === "in" ? port1 : port2;
      addDatagraphConnection(from.nodeId, from.port, to.nodeId, to.port);
    },
    [addDatagraphConnection, ready]
  );

  const disconnectPorts = useCallback(
    (port: [PortInfo, PortInfo]) => {
      if (!ready) return;
      const fromPort = port.find((p) => p.portType === "out");
      const toPort = port.find((p) => p.portType === "in");
      if (!fromPort || !toPort) return;

      const connectionsToRemove = edges.filter(
        (edge) =>
          edge.from.nodeId === fromPort.nodeId &&
          edge.from.port === fromPort.port &&
          edge.to.nodeId === toPort.nodeId &&
          edge.to.port === toPort.port
      );
      for (const connection of connectionsToRemove) {
        removeDatagraphConnection(
          connection.from.nodeId,
          connection.from.port,
          connection.to.nodeId,
          connection.to.port
        );
      }
    },
    [edges, removeDatagraphConnection, ready]
  );

  const disconnectNodes = useCallback(
    (...nodeIds: string[]) => {
      if (!ready) return;
      const connectionsToRemove = edges.filter(
        (edge) =>
          nodeIds.some((id) => id === edge.from.nodeId) ||
          nodeIds.some((id) => id === edge.to.nodeId)
      );
      for (const connection of connectionsToRemove) {
        removeDatagraphConnection(
          connection.from.nodeId,
          connection.from.port,
          connection.to.nodeId,
          connection.to.port
        );
      }
    },
    [edges, removeDatagraphConnection, ready]
  );

  return { edges, connect, disconnectPorts, disconnectNodes };
}

export function EdgesProvider({ children }: { children: React.ReactNode }) {
  return <edgesContext.Provider value={useEdgesList()}>{children}</edgesContext.Provider>;
}

export function usePortConnections() {
  return useContext(edgesContext);
}
