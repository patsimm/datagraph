import { useNodes } from "../../nodes.context";
import { useSelection } from "../../selection.context";
import { NodeRenderer } from "../node/NodeRenderer";
import { PanZoomCanvasPosition } from "../canvas/utils";

import { useState, useCallback, useRef } from "react";

export type NodesProps = {
  onNodeClick: (nodeId: string, ev: React.MouseEvent<HTMLDivElement>) => void;
};

export function Nodes({ onNodeClick }: NodesProps) {
  const { selectedNodes, nodesInSelectionRange } = useSelection();
  const { nodes, updateNodePosition } = useNodes();

  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [groupDragOffset, setGroupDragOffset] = useState<{ dx: number; dy: number } | null>(null);
  // Ref so handleDragCompleted always reads the offset set by handleDragMove in the same gesture,
  // even though React hasn't re-rendered yet (state update is async, ref write is synchronous).
  const groupDragOffsetRef = useRef<{ dx: number; dy: number } | null>(null);

  const handleDragMove = useCallback(
    (nodeId: string, pos: PanZoomCanvasPosition) => {
      if (!selectedNodes.includes(nodeId) || selectedNodes.length <= 1) return;
      const node = nodes[nodeId];
      const offset = {
        dx: pos.canvasX - node.canvasX,
        dy: pos.canvasY - node.canvasY,
      };
      groupDragOffsetRef.current = offset;
      setDraggingNodeId(nodeId);
      setGroupDragOffset(offset);
    },
    [nodes, selectedNodes]
  );

  const handleDragCompleted = useCallback(
    (nodeId: string, pos: PanZoomCanvasPosition) => {
      const offset = groupDragOffsetRef.current;
      if (selectedNodes.includes(nodeId) && selectedNodes.length > 1 && offset) {
        selectedNodes.forEach((id) => {
          const n = nodes[id];
          updateNodePosition(id, {
            canvasX: n.canvasX + offset.dx,
            canvasY: n.canvasY + offset.dy,
          });
        });
      } else {
        updateNodePosition(nodeId, pos);
      }
      groupDragOffsetRef.current = null;
      setDraggingNodeId(null);
      setGroupDragOffset(null);
    },
    [nodes, selectedNodes, updateNodePosition]
  );

  return (
    <>
      {Object.values(nodes).map((node) => (
        <NodeRenderer
          key={node.nodeId}
          node={node}
          selected={selectedNodes.includes(node.nodeId)}
          inSelectionRange={nodesInSelectionRange.includes(node.nodeId)}
          onClick={onNodeClick}
          onDragCompleted={handleDragCompleted}
          onDragMove={handleDragMove}
          externalDragOffset={
            node.nodeId !== draggingNodeId && selectedNodes.includes(node.nodeId) && groupDragOffset
              ? groupDragOffset
              : undefined
          }
        />
      ))}
    </>
  );
}
