import { useDatagraph } from "../../datagraph.context";
import { DatagraphNode, DatagraphNodeProps } from "./DatagraphNode";

import { useCallback, useEffect, useRef } from "react";

export type DatagraphVisualizerNodeProps = Omit<
  DatagraphNodeProps,
  "inputPorts" | "outputPorts"
> & {};

const PARAM_OUTPUT_PORTNAMES = ["input"];
const PRAM_INPUT_PORTNAMES = ["output"];

function map(value: number, inMin: number, inMax: number, outMin: number, outMax: number) {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}

export function DatagraphVisualizerNode({
  nodeId,

  ...nodeProps
}: DatagraphVisualizerNodeProps) {
  const { ready, subscribeNode, unsubscribeNode } = useDatagraph();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const maxValue = useRef(0);
  const minValue = useRef(0);

  const handleData = useCallback((data: Float32Array) => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d")!;
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    const maxDataValue = Math.max(...data);
    const minDataValue = Math.min(...data);
    if (maxValue.current < maxDataValue) {
      maxValue.current = maxDataValue;
    }
    if (minValue.current > minDataValue) {
      minValue.current = minDataValue;
    }

    const y0 = map(0, minValue.current - 0.1, maxValue.current + 0.1, canvasRef.current.height, 0);
    ctx.beginPath();
    ctx.strokeStyle = "gray";
    ctx.lineWidth = 0.5;
    ctx.setLineDash([5, 5]);
    ctx.moveTo(0, y0);
    ctx.lineTo(canvasRef.current.width, y0);
    ctx.stroke();

    ctx.beginPath();
    ctx.setLineDash([]);
    ctx.strokeStyle = "black";
    ctx.lineWidth = 1;

    for (let x = 0; x < canvasRef.current.width; x++) {
      const value = data[data.length - canvasRef.current.width + x];

      const y = map(
        value,
        minValue.current - 0.1,
        maxValue.current + 0.1,
        canvasRef.current.height,
        0
      );
      if (x === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
  }, []);

  useEffect(() => {
    if (!ready) return;
    subscribeNode(nodeId, handleData);
    return () => {
      unsubscribeNode(nodeId);
    };
  }, [handleData, nodeId, ready, subscribeNode, unsubscribeNode]);

  return (
    <DatagraphNode
      nodeId={nodeId}
      inputPorts={PRAM_INPUT_PORTNAMES}
      outputPorts={PARAM_OUTPUT_PORTNAMES}
      {...nodeProps}
    >
      <canvas className="datagraph-node__vis-canvas" ref={canvasRef} />
    </DatagraphNode>
  );
}
