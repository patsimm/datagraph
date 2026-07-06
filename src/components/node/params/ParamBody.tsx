import type { AnyParamNodeState, ParamNodeState } from "../../../node.types";
import { SliderParamBody } from "./SliderParamBody";
import { ButtonParamBody } from "./ButtonParamBody";
import { MIDINoteParamBody } from "./MIDINoteParamBody";
import { MIDIGateParamBody } from "./MIDIGateParamBody";
import { MIDIControlChangeParamBody } from "./MIDIControlChangeParamBody";

export function ParamBody({
  onChange,
  ...node
}: AnyParamNodeState & { onChange: (nodeId: string, value: number) => void }) {
  const getProps = <K extends AnyParamNodeState["kind"]>(nodeState: ParamNodeState<K>) => ({
    onChange: (value: number) => onChange(nodeState.nodeId, value),
    onPointerDown: (ev: React.PointerEvent) => {
      ev.stopPropagation();
    },
    onPointerUp: (ev: React.PointerEvent) => {
      ev.stopPropagation();
    },
    settings: nodeState.settings as ParamNodeState<K>["settings"],
    value: nodeState.config.value as ParamNodeState<K>["config"]["value"],
  });

  const Component = (() => {
    switch (node.kind) {
      case "param:slider":
        return <SliderParamBody {...getProps(node)} />;
      case "param:button":
        return <ButtonParamBody {...getProps(node)} />;
      case "param:midinote":
        return <MIDINoteParamBody {...getProps(node)} />;
      case "param:midigate":
        return <MIDIGateParamBody {...getProps(node)} />;
      case "param:midicc":
        return <MIDIControlChangeParamBody {...getProps(node)} />;
    }
  })();

  return <>{Component}</>;
}
