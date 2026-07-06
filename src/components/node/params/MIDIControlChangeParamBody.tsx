import { useMidi } from "../../../midi.context";
import { Slider } from "../../Slider";
import type { ParamBodyProps } from "./param-body.types";

import { useEffect } from "react";

export function MIDIControlChangeParamBody({
  value,
  onChange,
  settings,
  ...rest
}: ParamBodyProps<"param:midicc">) {
  const { registerMIDIMessageCallback } = useMidi();
  useEffect(() => {
    const unregisterPromise = registerMIDIMessageCallback((message) => {
      if (!(settings.channel == 0 || message.channel == settings.channel)) return;
      if (message.type === "controlchange" && message.ccNumber === settings.ccNumber) {
        onChange?.(message.value);
      }
    });
    return () => {
      unregisterPromise.then((unregister) => unregister());
    };
  }, [onChange, registerMIDIMessageCallback, settings.ccNumber, settings.channel]);

  return (
    <div className="node__body">
      <Slider value={value} min={0} max={127} step={1} onChange={onChange} {...rest}></Slider>
    </div>
  );
}
