import { useMidi } from "../../../midi.context";
import type { ParamBodyProps } from "./param-body.types";

import { useEffect } from "react";

export function MIDIGateParamBody({ value, onChange }: ParamBodyProps<"param:midigate">) {
  const { registerMIDIMessageCallback } = useMidi();
  useEffect(() => {
    const unregisterPromise = registerMIDIMessageCallback((message) => {
      console.log("MIDI message received:", message);
      if (message.message === "noteon") {
        onChange?.(1);
      }
      if (message.message === "noteoff") {
        onChange?.(0);
      }
    });
    return () => {
      unregisterPromise.then((unregister) => unregister());
    };
  }, [onChange, registerMIDIMessageCallback]);

  return <>{value}</>;
}
