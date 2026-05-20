import type { ParamBodyProps } from "./param-body.types";

export function InputParamBody({ nodeId, value, onChange, ...rest }: ParamBodyProps<"param:input">) {
  return (
    <input
      type="number"
      onChange={(e) => onChange?.(nodeId, parseFloat(e.target.value))}
      value={value}
      {...rest}
    />
  );
}
