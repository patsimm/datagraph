import { useDatagraph } from "./datagraph.context";
import {
  DatagraphNode,
  getDatagraphNodeElement,
  getDatagraphNodeKeyFromElement,
  getDatagraphNodePortFromElement,
  parsePortKey,
  PortInfo,
  portKey,
} from "./DatagraphNode";
import { DatagraphParamNode } from "./DatagraphParamNode";
import "./Datagraph.css";
import { DatagraphEdge } from "./DatagraphEdge";

import { useCallback, useEffect, useRef, useState } from "react";

type DraggingState = {
  draggingKey: string;
  dragStartX: number;
  dragStartY: number;
  elemOffsetX: number;
  elemOffsetY: number;
};

function useNodeDragging() {
  const draggingStateRef = useRef<DraggingState | null>(null);

  const handlePointerDown = useCallback(
    (event: PointerEvent) => {
      if (event.target instanceof HTMLElement) {
        const nodeKey = getDatagraphNodeKeyFromElement(event.target);
        if (!nodeKey) return;

        const nodeElem = event.target as HTMLElement;
        const offsetX = event.clientX - nodeElem.getBoundingClientRect().left;
        const offsetY = event.clientY - nodeElem.getBoundingClientRect().top;
        draggingStateRef.current = {
          draggingKey: nodeKey,
          dragStartX: event.clientX,
          dragStartY: event.clientY,
          elemOffsetX: offsetX,
          elemOffsetY: offsetY,
        };
      }
    },
    [draggingStateRef]
  );

  const handlePointerUp = useCallback(() => {
    draggingStateRef.current = null;
  }, [draggingStateRef]);

  const handlePointerMove = useCallback(
    (event: PointerEvent) => {
      if (!draggingStateRef.current) return;

      const draggingNodeElem = getDatagraphNodeElement(draggingStateRef.current.draggingKey);
      const containerElem = document.querySelector(".datagraph") as HTMLElement;

      // Calculate new position
      const x =
        event.clientX -
        draggingStateRef.current.elemOffsetX -
        containerElem.getBoundingClientRect().left;
      const y =
        event.clientY -
        draggingStateRef.current.elemOffsetY -
        containerElem.getBoundingClientRect().top;

      // Update element position
      draggingNodeElem.style.left = `${x}px`;
      draggingNodeElem.style.top = `${y}px`;
    },
    [draggingStateRef]
  );

  useEffect(() => {
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("pointerup", handlePointerUp);
    document.addEventListener("pointermove", handlePointerMove);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("pointerup", handlePointerUp);
      document.removeEventListener("pointermove", handlePointerMove);
    };
  }, [handlePointerDown, handlePointerMove, handlePointerUp]);
}

type EdgeDraggingState = {
  onDragStart: (port: PortInfo) => void;
  onDragEnd: (port: PortInfo | null) => void;
};

function useEdgeDragging({ onDragStart, onDragEnd }: EdgeDraggingState) {
  const draggingStateRef = useRef<DraggingState | null>(null);
  const edgeRef = useRef<SVGSVGElement | null>(null);

  const handlePointerDown = useCallback(
    (event: PointerEvent) => {
      if (!(event.target instanceof HTMLElement)) return;
      const portKey = getDatagraphNodePortFromElement(event.target);
      if (!portKey) return;

      onDragStart(parsePortKey(portKey));

      const nodeElem = event.target as HTMLElement;
      const containerElem = document.querySelector(".datagraph") as HTMLElement;

      const offsetX = event.clientX - nodeElem.getBoundingClientRect().left;
      const offsetY = event.clientY - nodeElem.getBoundingClientRect().top;

      const startPosX =
        nodeElem.getBoundingClientRect().left -
        containerElem.getBoundingClientRect().left +
        0.5 * nodeElem.getBoundingClientRect().width;
      const startPosY =
        nodeElem.getBoundingClientRect().top -
        containerElem.getBoundingClientRect().top +
        0.5 * nodeElem.getBoundingClientRect().height;

      draggingStateRef.current = {
        draggingKey: portKey,
        dragStartX: startPosX,
        dragStartY: startPosY,
        elemOffsetX: offsetX,
        elemOffsetY: offsetY,
      };
      edgeRef.current!.style.left = `${startPosX}px`;
      edgeRef.current!.style.top = `${startPosY}px`;
      edgeRef.current!.style.width = `0px`;
      edgeRef.current!.style.height = `0px`;
    },
    [onDragStart]
  );

  const handlePointerUp = useCallback(
    (event: PointerEvent) => {
      draggingStateRef.current = null;
      edgeRef.current!.style.left = `0px`;
      edgeRef.current!.style.top = `0px`;
      edgeRef.current!.style.width = `0px`;
      edgeRef.current!.style.height = `0px`;
      edgeRef.current!.innerHTML = ``;

      const portKey =
        event.target instanceof HTMLElement ? getDatagraphNodePortFromElement(event.target) : null;
      onDragEnd(portKey ? parsePortKey(portKey) : null);
    },
    [onDragEnd]
  );

  const handlePointerMove = useCallback(
    (event: PointerEvent) => {
      if (!draggingStateRef.current) return;

      const containerElem = document.querySelector(".datagraph") as HTMLElement;

      // Calculate new position
      const x = event.clientX - containerElem.getBoundingClientRect().left;
      const y = event.clientY - containerElem.getBoundingClientRect().top;

      const startPosX = draggingStateRef.current.dragStartX;
      const startPosY = draggingStateRef.current.dragStartY;

      // Update element position
      edgeRef.current!.style.left = `${Math.min(startPosX, x)}px`;
      edgeRef.current!.style.top = `${Math.min(startPosY, y)}px`;
      edgeRef.current!.style.width = `${Math.abs(x - draggingStateRef.current.dragStartX)}px`;
      edgeRef.current!.style.height = `${Math.abs(y - draggingStateRef.current.dragStartY)}px`;
      edgeRef.current!.innerHTML = `<line x1="${startPosX - Math.min(startPosX, x)}" y1="${startPosY - Math.min(startPosY, y)}" x2="${x - Math.min(startPosX, x)}" y2="${y - Math.min(startPosY, y)}" stroke="black" />`;
    },
    [draggingStateRef]
  );

  useEffect(() => {
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("pointerup", handlePointerUp);
    document.addEventListener("pointermove", handlePointerMove);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("pointerup", handlePointerUp);
      document.removeEventListener("pointermove", handlePointerMove);
    };
  }, [handlePointerDown, handlePointerMove, handlePointerUp]);

  return {
    DraggingLine: () => <svg className="datagraph-edge" ref={edgeRef}></svg>,
  };
}

const PARAM_NODES = [
  { paramKey: "frequency", value: 1.0, position: { x: 350, y: 100 } },
  { paramKey: "adsr_gate", value: 0.0, position: { x: 600, y: 100 } },
  { paramKey: "gain", value: 0.5, position: { x: 100, y: 100 } },
] as const;

const GRAPH_NODES = [
  {
    nodeKey: "oscillator",
    kind: "oscillator",
    sampleRate: 44100,
    position: { x: 350, y: 200 },
  },
  {
    nodeKey: "adsr",
    kind: "adsr",
    sampleRate: 44100,
    attack: 0.1,
    decay: 0.1,
    sustain: 0.5,
    release: 0.2,
    position: { x: 600, y: 200 },
  },
  { nodeKey: "adsr_gain", kind: "gain", position: { x: 600, y: 300 } },
  { nodeKey: "delay", kind: "delay", position: { x: 600, y: 400 } },
  { nodeKey: "output", kind: "gain", output: true, position: { x: 200, y: 500 } },
  { nodeKey: "one_pole", kind: "one-pole", position: { x: 350, y: 300 } },
] as const;

export function Datagraph() {
  const { ready, addConnection, removeConnection } = useDatagraph();
  const [edges, setEdges] = useState<{ from: PortInfo; to: PortInfo }[]>([]);
  useNodeDragging();
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

  const { DraggingLine } = useEdgeDragging({
    onDragStart: handleEdgeDragStart,
    onDragEnd: handleEdgeDragEnd,
  });

  return (
    <div className="datagraph">
      <DraggingLine />
      {ready && (
        <>
          {PARAM_NODES.map((p) => (
            <DatagraphParamNode key={p.paramKey} {...p} />
          ))}
          {GRAPH_NODES.map((n) => (
            <DatagraphNode key={n.nodeKey} {...n} />
          ))}
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
          {/* <DatagraphEdge from='oscillator' fromPort={0} to='output' toPort={0} /> */}
        </>
      )}
    </div>
  );
}
