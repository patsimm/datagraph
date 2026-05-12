import { useDatagraph } from "./datagraph.context";
import { DatagraphNodeBase } from "./DatagraphNodeBase";

import { memo, useEffect, useState } from "react";

export type DatagraphParamNodeProps = {
  paramKey: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  position?: { x: number; y: number };
};

export const DatagraphParamNode = memo(function DatagraphParamNode({
  paramKey,
  value,
  min = 0,
  max = 1,
  step = 0.01,
  position,
}: DatagraphParamNodeProps) {
  const datagraph = useDatagraph();
  const [currentValue, setCurrentValue] = useState(value);

  useEffect(() => {
    if (!datagraph.ready) return;
    datagraph.addParam(paramKey, value);
  }, [datagraph, paramKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!datagraph.ready) return;
    const next = parseFloat(e.target.value);
    setCurrentValue(next);
    datagraph.setParam(paramKey, next);
  };

  return (
    <DatagraphNodeBase nodeKey={paramKey} inputPorts={0} outputPorts={1} position={position}>
      <div className="datagraph-node__label">
        {paramKey}: {currentValue}
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={currentValue}
        onChange={handleChange}
      />
    </DatagraphNodeBase>
  );
});
