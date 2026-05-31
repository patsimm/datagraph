import { usePortConnecting } from "./port-connecting.hook";
import { PortConnectionEdge } from "./PortConnectionEdge";
import { PortInfo, portKey } from "../node/node-utils";
import { usePortConnections } from "../../edges.context";
import { Edge } from "./Edge";

import { useImperativeHandle } from "react";

export type EdgesHandle = {
  portConnectPointerDown: (e: React.PointerEvent) => void;
  portConnectPointerUp: (e: React.PointerEvent) => void;
};

export type EdgesProps = {
  onEdgeClick: (edge: { from: PortInfo; to: PortInfo }, ev: React.MouseEvent) => void;
  ref: React.Ref<EdgesHandle>;
};

export function Edges({ ref, onEdgeClick }: EdgesProps) {
  const {
    handlePointerDown: portConnectPointerDown,
    handlePointerUp: portConnectPointerUp,
    position: ghostPosition,
  } = usePortConnecting();
  const { edges } = usePortConnections();

  useImperativeHandle(ref, () => ({
    portConnectPointerDown,
    portConnectPointerUp,
  }));

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
