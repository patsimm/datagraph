import { useEffect, useState } from "react"
import { useDatagraph } from "./datagraph.context"
import { DatagraphNodeBase } from "./DatagraphNodeBase"

export type DatagraphParamNodeProps = {
  paramKey: string
  value: number
  min?: number
  max?: number
  step?: number
  position?: { x: number, y: number }
}

export function DatagraphParamNode({ paramKey, value, min = 0, max = 1, step = 0.01, position }: DatagraphParamNodeProps) {
  const { addParam, setParam } = useDatagraph()
  const [currentValue, setCurrentValue] = useState(value)

  useEffect(() => {
    addParam(paramKey, value)
  }, [paramKey, value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = parseFloat(e.target.value)
    setCurrentValue(next)
    setParam(paramKey, next)
  }

  return (
    <DatagraphNodeBase
      nodeKey={paramKey}
      inputPorts={[]}
      outputPorts={[{ node: paramKey, port: 0, portType: "out" }]}
      position={position}
    >
      <div className="datagraph-node__label">{paramKey}: {currentValue}</div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={currentValue}
        onChange={handleChange}
      />
    </DatagraphNodeBase>
  )
}
