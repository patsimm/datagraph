import type { AnyParamNodeState, ParamNodeState } from "../../../node.types";
import { SliderParamBody } from "./SliderParamBody";
import { ButtonParamBody } from "./ButtonParamBody";
import { InputParamBody } from "./InputParamBody";

export function ParamBody({
  onChange,
  ...node
}: AnyParamNodeState & { onChange: (nodeId: string, value: number) => void }) {
  const getProps = <K extends AnyParamNodeState["kind"]>(nodeState: ParamNodeState<K>) => ({
    onChange,
    onPointerDown: (ev: React.PointerEvent) => ev.stopPropagation(),
    onPointerUp: (ev: React.PointerEvent) => ev.stopPropagation(),
    nodeId: nodeState.nodeId,
    settings: nodeState.settings as ParamNodeState<K>["settings"],
    value: nodeState.config.value as ParamNodeState<K>["config"]["value"],
  });

  switch (node.kind) {
    case "param:slider":
      return <SliderParamBody {...getProps(node)} />;
    case "param:button":
      return <ButtonParamBody {...getProps(node)} />;
    case "param:input":
      return <InputParamBody {...getProps(node)} />;
  }
}
