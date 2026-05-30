import { PortInfo } from "../node-utils";
import { usePortData } from "../port-data.hook";

import { useCallback, useMemo, useRef } from "react";

function map(value: number, inMin: number, inMax: number, outMin: number, outMax: number) {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}

export function OscilloscopeBody({ nodeId }: { nodeId: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const maxValue = useRef(0);
  const minValue = useRef(0);
  const port = useMemo<PortInfo>(() => ({ nodeId, port: 0, portType: "in" }), [nodeId]);

  const handleChange = useCallback((data: number[]) => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d")!;
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    const maxDataValue = Math.max(...data);
    const minDataValue = Math.min(...data);
    if (maxValue.current < maxDataValue) maxValue.current = maxDataValue;
    if (minValue.current > minDataValue) minValue.current = minDataValue;

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
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }, []);

  usePortData(port, handleChange);

  return <canvas className="datagraph-node__vis-canvas" ref={canvasRef} />;
}
