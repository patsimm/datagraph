import { Node, NodeProps } from "./Node";

export type OutputNodeProps = Omit<NodeProps, "inputPorts" | "outputPorts" | "kind">;

const PARAM_OUTPUT_PORTNAMES: string[] = [];
const PRAM_INPUT_PORTNAMES: string[] = ["input"];

export function OutputNode(props: OutputNodeProps) {
  return (
    <Node
      kind="output"
      inputPorts={PRAM_INPUT_PORTNAMES}
      outputPorts={PARAM_OUTPUT_PORTNAMES}
      {...props}
    ></Node>
  );
}
