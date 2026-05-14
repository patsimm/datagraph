import "./ParamNode.css";
import { useDatagraph } from "../../datagraph.context";
import { Node, NodeProps } from "./Node";

import { useState } from "react";
import classNames from "classnames";

export type ParamNodeProps = Omit<NodeProps, "inputPorts" | "outputPorts" | "kind"> & {
  defaultValue: number;
} & AnyParamBodyProps;

const PARAM_OUTPUT_PORTNAMES = ["value"];
const PRAM_INPUT_PORTNAMES: string[] = [];

export function ParamNode({ nodeId, defaultValue, ...nodeProps }: ParamNodeProps) {
  const datagraph = useDatagraph();
  const [currentValue, setCurrentValue] = useState(defaultValue);

  const handleChange = (next: number) => {
    if (!datagraph.ready) return;
    setCurrentValue(next);
    datagraph.setParam(nodeId, next);
  };

  return (
    <Node
      nodeId={nodeId}
      inputPorts={PRAM_INPUT_PORTNAMES}
      outputPorts={PARAM_OUTPUT_PORTNAMES}
      label={nodeProps.label || nodeProps.kind.split(":")[1]}
      {...nodeProps}
    >
      <div className="datagraph-node__value">{currentValue}</div>
      {renderParamBody({ ...nodeProps, currentValue, handleChange })}
    </Node>
  );
}

type BaseParamBodyProps = {
  currentValue: number;
  handleChange: (value: number) => void;
};

type SliderParamBodyProps = {
  kind: "param:slider";
  min?: number;
  max?: number;
  step?: number;
};

function SliderParamBody({
  min,
  max,
  step,
  currentValue,
  handleChange,
}: SliderParamBodyProps & BaseParamBodyProps) {
  return (
    <input
      className="datagraph-node__input-slider"
      type="range"
      min={min}
      max={max}
      step={step}
      value={currentValue}
      onChange={(e) => handleChange(parseFloat(e.target.value))}
    />
  );
}

type ButtonParamBodyProps = {
  kind: "param:button";
  onValue: number;
  offValue: number;
};

function ButtonParamBody({
  onValue,
  offValue,
  currentValue,
  handleChange,
}: ButtonParamBodyProps & BaseParamBodyProps) {
  return (
    <input
      className={classNames("datagraph-node__input-button", {
        "datagraph-node__input--active": currentValue === onValue,
      })}
      type="button"
      onMouseDown={() => handleChange(onValue)}
      onMouseUp={() => handleChange(offValue)}
      onMouseLeave={() => handleChange(offValue)}
      aria-pressed={currentValue === onValue}
    />
  );
}

type AnyParamBodyProps = SliderParamBodyProps | ButtonParamBodyProps;

function renderParamBody(p: AnyParamBodyProps & BaseParamBodyProps) {
  switch (p.kind) {
    case "param:slider":
      return <SliderParamBody {...p} />;
    case "param:button":
      return <ButtonParamBody {...p} />;
  }
}
