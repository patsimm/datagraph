import { useDatagraph } from "./datagraph.context";
import {
  DatagraphNode,
  getDatagraphNodeElement,
  getDatagraphNodeKeyFromElement,
  getDatagraphNodePortElement,
  getDatagraphNodePortFromElement,
} from "./DatagraphNode";
import { DatagraphParamNode } from "./DatagraphParamNode";
import "./Datagraph.css";
import { DatagraphEdge } from "./DatagraphEdge";

import { useCallback, useEffect, useRef } from "react";
import { NodeType } from "@datagraph/core";

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
      console.log("pointer down", event.target);
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
        console.log(draggingStateRef.current);
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

function useEdgeDragging() {
  const draggingStateRef = useRef<DraggingState | null>(null);
  const edgeRef = useRef<SVGSVGElement | null>(null);

  const handlePointerDown = useCallback((event: PointerEvent) => {
    console.log("pointer down", event.currentTarget);
    if (event.target instanceof HTMLElement) {
      const portKey = getDatagraphNodePortFromElement(event.target);
      if (!portKey) return;

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
    }
  }, []);

  const handlePointerUp = useCallback(() => {
    draggingStateRef.current = null;
    edgeRef.current!.style.left = `0px`;
    edgeRef.current!.style.top = `0px`;
    edgeRef.current!.style.width = `0px`;
    edgeRef.current!.style.height = `0px`;
    edgeRef.current!.innerHTML = ``;
  }, []);

  const handlePointerMove = useCallback(
    (event: PointerEvent) => {
      if (!draggingStateRef.current) return;

      const draggingNodeElem = getDatagraphNodePortElement(draggingStateRef.current.draggingKey);
      console.log("pointer move", event.clientX, event.clientY, draggingNodeElem);

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

  return <svg className="datagraph-edge" ref={edgeRef}></svg>;
}

export function Datagraph() {
  const { ready, setParam } = useDatagraph();
  useNodeDragging();
  const svg = useEdgeDragging();

  useEffect(() => {
    if (!ready) return;
    setTimeout(() => {
      setParam("adsr_gate", 1);
    }, 100);
    setTimeout(() => {
      setParam("adsr_gate", 0);
    }, 300);
  }, [ready, setParam]);

  return (
    <div className="datagraph">
      {svg}
      {ready && (
        <>
          <DatagraphParamNode paramKey="frequency" value={1.0} position={{ x: 350, y: 100 }} />
          <DatagraphParamNode paramKey="adsr_gate" value={0.0} position={{ x: 600, y: 100 }} />
          <DatagraphParamNode paramKey="gain" value={0.5} position={{ x: 100, y: 100 }} />
          <DatagraphNode
            nodeKey="oscillator"
            spec={{ kind: NodeType.Oscillator, sampleRate: 44100 }}
            position={{ x: 350, y: 200 }}
          />
          <DatagraphNode
            nodeKey="adsr"
            spec={{
              kind: NodeType.ADSR,
              sampleRate: 44100,
              attack: 0.1,
              decay: 0.1,
              sustain: 0.5,
              release: 0.2,
            }}
            position={{ x: 600, y: 200 }}
          />
          <DatagraphNode
            nodeKey="adsr_gain"
            spec={{ kind: NodeType.Gain }}
            position={{ x: 600, y: 300 }}
          />
          <DatagraphNode
            nodeKey="delay"
            spec={{ kind: NodeType.Delay }}
            position={{ x: 600, y: 400 }}
          />
          <DatagraphNode
            output
            nodeKey="output"
            spec={{ kind: NodeType.Gain }}
            position={{ x: 200, y: 500 }}
          />
          <DatagraphEdge from="frequency" fromPort={0} to="oscillator" toPort={0} />
          <DatagraphEdge from="adsr_gate" fromPort={0} to="adsr" toPort={0} />
          <DatagraphEdge from="oscillator" fromPort={0} to="adsr_gain" toPort={0} />
          <DatagraphEdge from="adsr" fromPort={0} to="adsr_gain" toPort={1} />
          <DatagraphEdge from="adsr_gain" fromPort={0} to="delay" toPort={0} />
          <DatagraphEdge from="gain" fromPort={0} to="output" toPort={1} />
          <DatagraphEdge from="delay" fromPort={0} to="output" toPort={0} />
          {/* <DatagraphEdge from='oscillator' fromPort={0} to='output' toPort={0} /> */}
        </>
      )}
    </div>
  );
}
