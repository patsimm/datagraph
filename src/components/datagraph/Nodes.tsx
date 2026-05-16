import { useNodes } from "../../nodes.context";
import { useSelection } from "../../selection.context";
import { NodeRenderer } from "../node/NodeRenderer";

export type NodesProps = {
  onNodeClick: (nodeId: string, ev: React.MouseEvent) => void;
};

export function Nodes({ onNodeClick }: NodesProps) {
  const { selectedNodeId } = useSelection();
  const { nodes } = useNodes();
  return (
    <>
      {Object.values(nodes).map((node) => (
        <NodeRenderer
          key={node.nodeId}
          node={node}
          selected={selectedNodeId === node.nodeId}
          onClick={onNodeClick}
        />
      ))}
    </>
  );
}
