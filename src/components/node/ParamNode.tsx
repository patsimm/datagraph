import "./ParamNode.css";
import { Node } from "./Node";
import type {
  SliderParamNodeState,
  ButtonParamNodeState,
  AnyParamNodeState,
  NodeInteractionProps,
} from "../../node.types";

import classNames from "classnames";

export type ParamNodeProps = AnyParamNodeState & NodeInteractionProps;

export function ParamNode({ nodeId, value, onChange, ...nodeProps }: ParamNodeProps) {
  return (
    <Node
      nodeId={nodeId}
      label={
        <>
          {nodeProps.kind.split(":")[1]} <span className="node__value">: {value}</span>
        </>
      }
      {...nodeProps}
    >
      {renderParamBody({ ...nodeProps, nodeId, value, onChange })}
    </Node>
  );
}

ParamNode.outputPortNames = ["value"];

function SliderParamBody({ nodeId, min, max, step, value, onChange }: SliderParamNodeState) {
  return (
    <input
      className="node__input-slider"
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(nodeId, parseFloat(e.target.value))}
    />
  );
}

function ButtonParamBody({ nodeId, onValue, offValue, value, onChange }: ButtonParamNodeState) {
  return (
    <input
      className={classNames("node__input-button", {
        "node__input--active": value === onValue,
      })}
      type="button"
      onMouseDown={() => onChange(nodeId, onValue)}
      onMouseUp={() => onChange(nodeId, offValue)}
      onMouseLeave={() => onChange(nodeId, offValue)}
      aria-pressed={value === onValue}
    />
  );
}

function renderParamBody(p: AnyParamNodeState) {
  switch (p.kind) {
    case "param:slider":
      return <SliderParamBody {...p} />;
    case "param:button":
      return <ButtonParamBody {...p} />;
  }
}
