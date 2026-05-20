import type { ParamBodyProps } from "./param-body.types";

export function SliderParamBody({
  nodeId,
  settings,
  value,
  onChange,
  ...rest
}: ParamBodyProps<"param:slider">) {
  return (
    <input
      className="node__input-slider"
      type="range"
      min={settings.min}
      max={settings.max}
      step={settings.step}
      value={value}
      onChange={(e) => onChange?.(nodeId, parseFloat(e.target.value))}
      {...rest}
    />
  );
}
