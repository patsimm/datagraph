import { DatagraphNodeBase } from "./DatagraphNodeBase";

export type DatagraphOutputNodeProps = { nodeId: string; position?: { x: number; y: number } };

const PARAM_OUTPUT_PORTNAMES: string[] = [];
const PRAM_INPUT_PORTNAMES: string[] = ["input"];

export function DatagraphOutputNodeNode({ nodeId, position }: DatagraphOutputNodeProps) {
  return (
    <DatagraphNodeBase
      nodeId={nodeId}
      inputPorts={PRAM_INPUT_PORTNAMES}
      outputPorts={PARAM_OUTPUT_PORTNAMES}
      position={position}
    >
      output
    </DatagraphNodeBase>
  );
}
