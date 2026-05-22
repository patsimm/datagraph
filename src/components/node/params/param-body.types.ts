import type { AnyParamNodeState, ParamNodeState } from "../../../node.types";

export type ParamBodyProps<T extends AnyParamNodeState["kind"]> = {
  settings: ParamNodeState<T>["settings"];
  value: number;
  onChange?: (value: number) => void;
  onPointerDown?: (ev: React.PointerEvent) => void;
  onPointerUp?: (ev: React.PointerEvent) => void;
};
