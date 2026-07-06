import { useMidi } from "../../../midi.context";
import type { ParamBodyProps } from "./param-body.types";

import { useEffect } from "react";

export function MIDINoteParamBody({ onChange, settings }: ParamBodyProps<"param:midinote">) {
  const { registerMIDIMessageCallback } = useMidi();
  useEffect(() => {
    const unregisterPromise = registerMIDIMessageCallback((message) => {
      if (!(settings.channel == 0 || message.channel == settings.channel)) return;
      if (message.type === "noteon") {
        onChange?.(message.note);
      }
    });
    return () => {
      unregisterPromise.then((unregister) => unregister());
    };
  }, [onChange, registerMIDIMessageCallback, settings.channel]);

  return <></>;
}
