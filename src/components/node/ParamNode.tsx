import "./ParamNode.css";
import { Node } from "./Node";
import type { AnyParamNodeState, NodeInteractionProps, ParamNodeState } from "../../node.types";
import { useNodes } from "../../nodes.context";

import classNames from "classnames";

export type ParamNodeProps = AnyParamNodeState & NodeInteractionProps;

export function ParamNode({ nodeId, config, ...nodeProps }: ParamNodeProps) {
  const { setParamValue } = useNodes();
  const value = config?.value;
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
      {renderParamBody({ ...nodeProps, nodeId, config, onChange: setParamValue })}
    </Node>
  );
}

ParamNode.outputPortNames = ["value"];

type ParamBodyProps<T extends AnyParamNodeState["kind"]> = {
  nodeId: string;
  settings: ParamNodeState<T>["settings"];
  value: number;
  onChange?: (nodeId: string, value: number) => void;
};

function SliderParamBody({ nodeId, settings, value, onChange }: ParamBodyProps<"param:slider">) {
  return (
    <input
      className="node__input-slider"
      type="range"
      min={settings.min}
      max={settings.max}
      step={settings.step}
      value={value}
      onChange={(e) => onChange?.(nodeId, parseFloat(e.target.value))}
    />
  );
}

function ButtonParamBody({ nodeId, settings, onChange, value }: ParamBodyProps<"param:button">) {
  return (
    <input
      className={classNames("node__input-button", {
        "node__input--active": value === settings.onValue,
      })}
      type="button"
      onMouseDown={() => onChange?.(nodeId, settings.onValue)}
      onMouseUp={() => onChange?.(nodeId, settings.offValue)}
      onMouseLeave={() => onChange?.(nodeId, settings.offValue)}
      aria-pressed={value === settings.onValue}
    />
  );
}

function InputParamBody({ nodeId, value, onChange }: ParamBodyProps<"param:input">) {
  return (
    <input
      type="number"
      onChange={(e) => onChange?.(nodeId, parseFloat(e.target.value))}
      value={value}
    />
  );
}

function renderParamBody(
  p: AnyParamNodeState & { onChange: (nodeId: string, value: number) => void }
) {
  switch (p.kind) {
    case "param:slider":
      return (
        <SliderParamBody
          nodeId={p.nodeId}
          settings={p.settings}
          onChange={p.onChange}
          value={p.config.value}
        />
      );
    case "param:button":
      return (
        <ButtonParamBody
          nodeId={p.nodeId}
          settings={p.settings}
          onChange={p.onChange}
          value={p.config.value}
        />
      );
    case "param:input":
      return (
        <InputParamBody
          nodeId={p.nodeId}
          settings={p.settings}
          onChange={p.onChange}
          value={p.config.value}
        />
      );
  }
}
