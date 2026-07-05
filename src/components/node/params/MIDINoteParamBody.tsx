import { useMidi } from "../../../midi.context";
import type { ParamBodyProps } from "./param-body.types";

import { useEffect } from "react";

export function MIDINoteParamBody({ value, onChange }: ParamBodyProps<"param:midinote">) {
  const { registerMIDIMessageCallback } = useMidi();
  useEffect(() => {
    const unregisterPromise = registerMIDIMessageCallback((message) => {
      console.log("MIDI message received:", message);
      onChange?.(message.note);
    });
    return () => {
      unregisterPromise.then((unregister) => unregister());
    };
  }, [onChange, registerMIDIMessageCallback]);

  return <>{value}</>;
}
