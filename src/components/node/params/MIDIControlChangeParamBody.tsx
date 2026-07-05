import { useMidi } from "../../../midi.context";
import type { ParamBodyProps } from "./param-body.types";

import { useEffect } from "react";

export function MIDIControlChangeParamBody({
  value,
  onChange,
  settings,
}: ParamBodyProps<"param:midicc">) {
  const { registerMIDIMessageCallback } = useMidi();
  useEffect(() => {
    const unregisterPromise = registerMIDIMessageCallback((message) => {
      console.log("MIDI message received:", message);
      if (message.type === "controlchange" && message.ccNumber === settings.ccNumber) {
        onChange?.(message.value);
      }
    });
    return () => {
      unregisterPromise.then((unregister) => unregister());
    };
  }, [onChange, registerMIDIMessageCallback, settings.ccNumber]);

  return <>{value}</>;
}
