import { NodeType } from "@datagraph/core";

export type NodeSpec =
  | { kind: NodeType.Oscillator; sampleRate: number }
  | { kind: NodeType.ADSR; sampleRate: number; attack: number; decay: number; sustain: number; release: number }
  | { kind: NodeType.Gain }
  | { kind: NodeType.Delay }

export type Command =
  | { type: 'add_param'; key: string; value: number }
  | { type: 'add_node'; key: string; node: NodeSpec }
  | { type: 'connect'; from: string; fromPort: number; to: string; toPort: number }
  | { type: 'set_output'; key: string }
  | { type: 'set_param'; key: string; value: number }

