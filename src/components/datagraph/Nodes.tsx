import { usePortConnections } from "../../edges.context";
import { useNodes } from "../../nodes.context";
import { useSelection } from "../../selection.context";
import { NodeRenderer } from "../node/NodeRenderer";

export type NodesProps = {
  onNodeClick: (nodeId: string, ev: React.MouseEvent<HTMLDivElement>) => void;
};

export function Nodes({ onNodeClick }: NodesProps) {
  const { getSelectedNode } = useSelection();
  const { nodes, updateNodePosition } = useNodes();
  const { connect } = usePortConnections();

  return (
    <>
      {Object.values(nodes).map((node) => (
        <NodeRenderer
          key={node.nodeId}
          node={node}
          selected={getSelectedNode()?.nodeId === node.nodeId}
          onClick={onNodeClick}
          onPortConnectionCompleted={connect}
          onCanvasPositionChanged={updateNodePosition}
        />
      ))}
    </>
  );
}
