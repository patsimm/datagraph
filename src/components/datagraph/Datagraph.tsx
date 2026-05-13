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
  const [draggedPort, setDraggedPort] = useState<PortInfo | null>(null);

  const handleEdgeDragStart = useCallback((port: PortInfo) => {
    setDraggedPort(port);
  }, []);

  const handleEdgeDragEnd = useCallback(
    (port: PortInfo | null) => {
      if (!ready) return;
      if (draggedPort && port) {
        if (draggedPort.portType === port.portType) {
          throw new Error(`Cannot connect ${draggedPort.portType} to ${port.portType}`);
        }
        const from = draggedPort.portType === "out" ? draggedPort : port;
        const to = draggedPort.portType === "in" ? draggedPort : port;
        addConnection(from.node, from.port, to.node, to.port).then(() => {
          setEdges((edges) => [...edges, { from, to }]);
        });
      }
      setDraggedPort(null);
    },
    [addConnection, draggedPort, ready]
  );

  const handleEdgeClick = useCallback(
    (edge: { from: PortInfo; to: PortInfo }) => {
      if (!ready) return;
      removeConnection(edge.from.node, edge.from.port, edge.to.node, edge.to.port).then(() => {
        setEdges((edges) => edges.filter((e) => e !== edge));
      });
    },
    [ready, removeConnection]
  );

  const { lineRef } = useEdgeDragging({
    onDragStart: handleEdgeDragStart,
    onDragEnd: handleEdgeDragEnd,
  });

  return { edges, handleEdgeClick, ghostRef: lineRef };
}

function Edges() {
  const { edges, handleEdgeClick, ghostRef } = useEdges();
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
      const nodeKey = createNodeKey();
      const info = await addNodeToGraph(nodeKey, spec);
      setNodes((nodes) => [...nodes, { nodeKey, position, info }]);
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
    { paramKey: string; value: number; position: { x: number; y: number } }[]
  >([]);

  const addParam = useCallback(
    async (value: number, position: { x: number; y: number }) => {
      if (!ready) return;
      const paramKey = createNodeKey();
      await addParamToGraph(paramKey, value);
      setParams((params) => [...params, { paramKey, value: value, position }]);
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
  useNodeDragging();
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);

  const handleClickStart = useCallback(() => {
    if (ready) return;
    start().then(async (audioworkletnode) => {
      await audioworkletnode.addNode("output", { kind: "passthrough" }, true);
    });
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
        <DatagraphParamNode key={p.paramKey} {...p} />
      ))}
      {nodes.map((n) => (
        <DatagraphNode key={n.nodeKey} {...n} />
      ))}
      <DatagraphOutputNodeNode nodeKey="output" position={{ x: 200, y: 500 }} />
    </div>
  ) : (
    <button onClick={handleClickStart}>Start Datagraph</button>
  );
}

export function createNodeKey() {
  return crypto.randomUUID().slice(0, 8);
}
