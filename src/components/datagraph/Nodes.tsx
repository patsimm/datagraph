import { useNodes } from "../../nodes.context";
import { useSelection } from "../../selection.context";
import { Node } from "../node/Node";
import { ParamNode } from "../node/ParamNode";
import { VisualizerNode } from "../node/VisualizerNode";

export type NodesProps = {
  onNodeClick: (nodeId: string, ev: React.MouseEvent) => void;
};

export function Nodes({ onNodeClick }: NodesProps) {
  const { selectedNodeId } = useSelection();
  const { params, visualizers, nodes } = useNodes();
  return (
    <>
      {Object.values(params).map((p) => {
        return (
          <ParamNode
            key={p.nodeId}
            onClick={onNodeClick}
            selected={selectedNodeId === p.nodeId}
            {...p}
          />
        );
      })}
      {visualizers.map((v) => (
        <VisualizerNode
          key={v.nodeId}
          onClick={onNodeClick}
          selected={selectedNodeId === v.nodeId}
          {...v}
        />
      ))}
      {Object.values(nodes).map((n) => (
        <Node key={n.nodeId} onClick={onNodeClick} selected={selectedNodeId === n.nodeId} {...n} />
      ))}
    </>
  );
}
