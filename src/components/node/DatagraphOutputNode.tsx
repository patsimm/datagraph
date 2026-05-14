import { DatagraphNode, DatagraphNodeProps } from "./DatagraphNode";

export type DatagraphOutputNodeProps = Omit<
  DatagraphNodeProps,
  "inputPorts" | "outputPorts" | "kind"
>;

const PARAM_OUTPUT_PORTNAMES: string[] = [];
const PRAM_INPUT_PORTNAMES: string[] = ["input"];

export function DatagraphOutputNodeNode(props: DatagraphOutputNodeProps) {
  return (
    <DatagraphNode
      kind="output"
      inputPorts={PRAM_INPUT_PORTNAMES}
      outputPorts={PARAM_OUTPUT_PORTNAMES}
      {...props}
    ></DatagraphNode>
  );
}
