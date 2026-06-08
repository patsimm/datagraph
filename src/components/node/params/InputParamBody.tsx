import { NumberInput } from "../../NumberInput";
import type { ParamBodyProps } from "./param-body.types";

export function InputParamBody(props: ParamBodyProps<"param:input">) {
  return (
    <NumberInput
      onKeyDown={(ev) => {
        ev.stopPropagation();
      }}
      {...props}
    />
  );
}
