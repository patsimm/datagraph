import { createContext, useCallback, useContext, useRef } from "react";

export type MIDIChannelMessage = {
  message: "noteon" | "noteoff";
  channel: number;
  note: number;
};

const context = createContext<{
  registerMIDIMessageCallback: (cb: (channelMessage: MIDIChannelMessage) => void) => Promise<() => void>;
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
  console.log(`MIDI command: ${command}, channel: ${channel}`);

  let commandName: "noteon" | "noteoff" | null = null;
  switch (command) {
    case 0x9: // Note On
      commandName = "noteon";
      break;
    case 0x8: // Note Off
      commandName = "noteoff";
      break;
  }

  if (!commandName) return null;
  const note = message[1];
  if (note === undefined) return null;
  return { message: commandName, channel, note };
};
