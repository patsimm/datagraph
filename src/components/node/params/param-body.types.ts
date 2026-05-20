import type { AnyParamNodeState, ParamNodeState } from "../../../node.types";

export type ParamBodyProps<T extends AnyParamNodeState["kind"]> = {
  nodeId: string;
  settings: ParamNodeState<T>["settings"];
  value: number;
  onChange?: (nodeId: string, value: number) => void;
  onPointerDown?: (ev: React.PointerEvent) => void;
  onPointerUp?: (ev: React.PointerEvent) => void;
};
