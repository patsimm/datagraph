import { DatagraphNodeBase } from "./DatagraphNodeBase";

export type DatagraphOutputNodeProps = { nodeKey: string; position?: { x: number; y: number } };

const PARAM_OUTPUT_PORTNAMES: string[] = [];
const PRAM_INPUT_PORTNAMES: string[] = ["input"];

export function DatagraphOutputNodeNode({ nodeKey, position }: DatagraphOutputNodeProps) {
  return (
    <DatagraphNodeBase
      nodeKey={nodeKey}
      inputPorts={PRAM_INPUT_PORTNAMES}
      outputPorts={PARAM_OUTPUT_PORTNAMES}
      position={position}
    >
      output
    </DatagraphNodeBase>
  );
}
