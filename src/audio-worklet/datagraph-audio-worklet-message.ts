import { Command } from "./datagraph-audio-worklet-commands";
import { DatagraphError } from "../DatagraphError";

export type DatagraphAudioWorkletMessage = {
  id: string;
  command: Command;
};

export type DatagraphAudioWorkletResponse =
  | { id: string; status: "ok" }
  | { id: string; status: "error"; error: DatagraphError | unknown };
