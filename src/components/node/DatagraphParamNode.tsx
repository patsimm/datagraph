import "./DatagraphParamNode.css";
import { useDatagraph } from "../../datagraph.context";
import { DatagraphNode, DatagraphNodeProps } from "./DatagraphNode";

import { useState } from "react";

export type DatagraphParamNodeProps = Omit<DatagraphNodeProps, "inputPorts" | "outputPorts"> & {
  value: number;
  min?: number;
  max?: number;
  step?: number;
};

const PARAM_OUTPUT_PORTNAMES = ["value"];
const PRAM_INPUT_PORTNAMES: string[] = [];

export function DatagraphParamNode({
  nodeId,
  value,
  min = 0,
  max = 1,
  step = 0.01,
  ...nodeProps
}: DatagraphParamNodeProps) {
  const datagraph = useDatagraph();
  const [currentValue, setCurrentValue] = useState(value);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!datagraph.ready) return;
    const next = parseFloat(e.target.value);
    setCurrentValue(next);
    datagraph.setParam(nodeId, next);
  };

  return (
    <DatagraphNode
      nodeId={nodeId}
      inputPorts={PRAM_INPUT_PORTNAMES}
      outputPorts={PARAM_OUTPUT_PORTNAMES}
      {...nodeProps}
    >
      <div className="datagraph-node__value">{currentValue}</div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={currentValue}
        onChange={handleChange}
      />
    </DatagraphNode>
  );
}
