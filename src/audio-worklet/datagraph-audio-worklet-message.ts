import { CommandPayload, CommandResult, CommandType } from "./datagraph-audio-worklet-commands";
import { DatagraphError } from "../DatagraphError";

export type DatagraphAudioWorkletMessage<T extends CommandType> = {
  id: string;
  command: { type: T; payload: CommandPayload<T> };
};

export type DatagraphAudioWorkletResponse<T extends CommandType> =
  | { id: string; status: "ok"; result: CommandResult<T> }
  | { id: string; status: "error"; error: DatagraphError | unknown };
