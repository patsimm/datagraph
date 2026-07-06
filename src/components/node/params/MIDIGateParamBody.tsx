import { useMidi } from "../../../midi.context";
import type { ParamBodyProps } from "./param-body.types";

import { useEffect } from "react";

export function MIDIGateParamBody({ onChange, settings }: ParamBodyProps<"param:midigate">) {
  const { registerMIDIMessageCallback } = useMidi();
  useEffect(() => {
    const unregisterPromise = registerMIDIMessageCallback((message) => {
      if (!(settings.channel == 0 || message.channel == settings.channel)) return;
      if (message.type === "noteon") {
        onChange?.(1);
      }
      if (message.type === "noteoff") {
        onChange?.(0);
      }
    });
    return () => {
      unregisterPromise.then((unregister) => unregister());
    };
  }, [onChange, registerMIDIMessageCallback]);

  return <></>;
}
