import { useGhostEdge } from "./ghost-edge.context";
import { PortConnectionEdge } from "./PortConnectionEdge";
import { PortInfo, portKey } from "../node/node-utils";
import { usePortConnections } from "../../edges.context";
import { Edge } from "./Edge";

export type EdgesProps = {
  onEdgeClick: (edge: { from: PortInfo; to: PortInfo }, ev: React.MouseEvent) => void;
};

export function Edges({ onEdgeClick }: EdgesProps) {
  const { position: ghostPosition } = useGhostEdge();
  const { edges } = usePortConnections();

  return (
    <>
      {ghostPosition && <Edge ghost {...ghostPosition} />}
      {edges.map((edge) => (
        <PortConnectionEdge
          key={`${portKey(edge.from)}->${portKey(edge.to)}`}
          from={edge.from.nodeId}
          fromPort={edge.from.port}
          to={edge.to.nodeId}
          toPort={edge.to.port}
          onClick={(ev) => onEdgeClick?.(edge, ev)}
        />
      ))}
    </>
  );
}
