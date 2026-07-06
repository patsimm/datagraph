import { createContext, useCallback, useContext, useRef } from "react";

export type MIDINoteMessage = {
  type: "noteon" | "noteoff";
  channel: number;
  note: number;
};

export type MIDIControlChangeMessage = {
  type: "controlchange";
  channel: number;
  ccNumber: number;
  value: number;
};

export type MIDIChannelMessage = MIDINoteMessage | MIDIControlChangeMessage;

const context = createContext<{
  registerMIDIMessageCallback: (
    cb: (channelMessage: MIDIChannelMessage) => void
  ) => Promise<() => void>;
}>({
  registerMIDIMessageCallback: () => {
    throw new Error("MIDI context not initialized");
  },
});

export function MIDIProvider({ children }: { children: React.ReactNode }) {
  const accessRef = useRef<MIDIAccess | null>(null);
  const getMidiRef = useCallback(async () => {
    if (!accessRef.current) {
      const access = await navigator.requestMIDIAccess();
      accessRef.current = access;
    }
    return accessRef.current;
  }, []);

  const registerMIDIMessageCallback = useCallback(
    async (cb: (channelMessage: MIDIChannelMessage) => void) => {
      const midiAccess = await getMidiRef();
      const handler = (event: MIDIMessageEvent) => {
        if (!event.data) return;
        const parsedMessage = parseMidiMessage(event.data);
        if (!parsedMessage) return;
        cb(parsedMessage);
      };
      midiAccess.inputs.forEach((input) => {
        input.addEventListener("midimessage", handler);
      });
      return () => {
        midiAccess.inputs.forEach((input) => {
          input.removeEventListener("midimessage", handler);
        });
      };
    },
    [getMidiRef]
  );

  return <context.Provider value={{ registerMIDIMessageCallback }}>{children}</context.Provider>;
}

export const useMidi = () => {
  return useContext(context);
};

const parseMidiMessage = (message: Uint8Array): MIDIChannelMessage | null => {
  const statusByte = message[0];
  if (statusByte === undefined) return null;
  if (statusByte >= 240) return null;

  const command = statusByte >> 4;
  const channel = (statusByte & 0x0f) + 1;

  switch (command) {
    case 0x9: // Note On
      return {
        type: "noteon",
        channel,
        note: message[1],
      };
    case 0x8: // Note Off
      return {
        type: "noteoff",
        channel,
        note: message[1],
      };
    case 0xb: // Control Change
      return {
        type: "controlchange",
        channel,
        ccNumber: message[1],
        value: message[2],
      };
  }
  return null;
};
