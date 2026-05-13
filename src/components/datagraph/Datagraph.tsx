import { useDatagraph } from "../../datagraph.context";
import "./Datagraph.css";
import { useNodeDragging } from "./node-dragging.hook";
import { useEdgeDragging } from "./edge-dragging.hook";
import { DatagraphEdge } from "../edge/DatagraphEdge";
import { PortInfo, DatagraphNode, portKey, DatagraphNodeProps } from "../node/DatagraphNode";
import { DatagraphParamNode } from "../node/DatagraphParamNode";
import { ContextMenu } from "../contextmenu/ContextMenu";
import { NodeSpec } from "../../audio-worklet/datagraph-audio-worklet-commands";
import { DatagraphOutputNodeNode } from "../node/DatagraphOutputNode";

import { useCallback, useState } from "react";

function useEdges() {
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

  return { edges, addEdge, removeEdge };
}

function Edges() {
  const { edges, addEdge, removeEdge } = useEdges();
  const [draggedPort, setDraggedPort] = useState<PortInfo | null>(null);

  const handleEdgeDragStart = useCallback((port: PortInfo) => {
    setDraggedPort(port);
  }, []);

  const handleEdgeDragEnd = useCallback(
    async (port: PortInfo | null) => {
      if (!draggedPort || !port) {
        setDraggedPort(null);
        return;
      }
      if (draggedPort.portType === port.portType) {
        setDraggedPort(null);
        throw new Error(`Cannot connect ${draggedPort.portType} to ${port.portType}`);
      }
      const from = draggedPort.portType === "out" ? draggedPort : port;
      const to = draggedPort.portType === "in" ? draggedPort : port;
      await addEdge(from, to);
      setDraggedPort(null);
    },
    [addEdge, draggedPort]
  );

  const handleEdgeClick = useCallback(
    (edge: { from: PortInfo; to: PortInfo }) => removeEdge(edge.from, edge.to),
    [removeEdge]
  );

  const { ghostRef } = useEdgeDragging({
    onDragStart: handleEdgeDragStart,
    onDragEnd: handleEdgeDragEnd,
  });

  return (
    <>
      <svg className="datagraph-edge" ref={ghostRef}>
        <line className="datagraph-edge__line datagraph-edge__line--ghost" />
      </svg>
      {edges.map((edge) => (
        <DatagraphEdge
          key={`${portKey(edge.from)}->${portKey(edge.to)}`}
          from={edge.from.node}
          fromPort={edge.from.port}
          to={edge.to.node}
          toPort={edge.to.port}
          onClick={() => handleEdgeClick(edge)}
        />
      ))}
    </>
  );
}

function useNodes() {
  const { ready, addNode: addNodeToGraph } = useDatagraph();
  const [nodes, setNodes] = useState<DatagraphNodeProps[]>([]);

  const addNode = useCallback(
    async (spec: NodeSpec, position: { x: number; y: number }) => {
      if (!ready) return;
      const info = await addNodeToGraph(spec);
      setNodes((nodes) => [...nodes, { nodeId: info.nodeId, position, info }]);
    },
    [addNodeToGraph, ready]
  );

  return {
    addNode,
    nodes,
  };
}

function useParams() {
  const { ready, addParam: addParamToGraph } = useDatagraph();
  const [params, setParams] = useState<
    { nodeId: string; value: number; position: { x: number; y: number } }[]
  >([]);

  const addParam = useCallback(
    async (value: number, position: { x: number; y: number }) => {
      if (!ready) return;
      const nodeId = await addParamToGraph(value);
      setParams((params) => [...params, { nodeId, value: value, position }]);
    },
    [addParamToGraph, ready]
  );

  return {
    params,
    addParam,
  };
}

export function Datagraph() {
  const { ready, start } = useDatagraph();
  const { nodes, addNode } = useNodes();
  const { params, addParam } = useParams();
  const [outputNode, setOutputNode] = useState<string | null>(null);
  useNodeDragging();
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);

  const handleClickStart = useCallback(async () => {
    if (ready) return;
    const audioworkletnode = await start();
    const nodeInfo = await audioworkletnode.addNode({ kind: "passthrough" }, true);
    setOutputNode(nodeInfo.nodeId);
  }, [ready, start]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setMenu({ x: e.clientX, y: e.clientY });
  }, []);

  const handleCloseContextMenu = useCallback(() => {
    setMenu(null);
  }, []);

  const handleClickAdd = useCallback(
    async (spec: NodeSpec) => {
      if (!menu) return;
      await addNode(spec, { x: menu!.x, y: menu!.y });
      setMenu(null);
    },
    [addNode, menu]
  );

  const handleClickAddParam = useCallback(async () => {
    if (!menu || !ready) return;
    await addParam(0, { x: menu!.x, y: menu!.y });
    setMenu(null);
  }, [addParam, menu, ready]);

  return ready ? (
    <div onContextMenu={handleContextMenu} className="datagraph">
      {menu && (
        <ContextMenu x={menu.x} y={menu.y} onClose={handleCloseContextMenu}>
          <div className="contextmenu__title">add Node</div>
          <button onClick={() => handleClickAdd({ kind: "oscillator" })}>oscillator</button>
          <button onClick={() => handleClickAdd({ kind: "multiply" })}>multiply</button>
          <button onClick={() => handleClickAdd({ kind: "add" })}>add</button>
          <button onClick={() => handleClickAdd({ kind: "delay" })}>delay</button>
          <button onClick={() => handleClickAdd({ kind: "one-pole" })}>one-pole lowpass</button>
          <button
            onClick={() =>
              handleClickAdd({ kind: "adsr", attack: 0.1, decay: 0.1, sustain: 0.7, release: 0.2 })
            }
          >
            adsr
          </button>
          <button onClick={() => handleClickAdd({ kind: "passthrough" })}>passthrough</button>
          <button onClick={handleClickAddParam}>param</button>
        </ContextMenu>
      )}

      <Edges />
      {params.map((p) => (
        <DatagraphParamNode key={p.nodeId} {...p} />
      ))}
      {nodes.map((n) => (
        <DatagraphNode key={n.nodeId} {...n} />
      ))}
      {outputNode && <DatagraphOutputNodeNode nodeId={outputNode} position={{ x: 200, y: 500 }} />}
    </div>
  ) : (
    <button onClick={handleClickStart}>Start Datagraph</button>
  );
}
