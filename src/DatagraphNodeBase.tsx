import { portKey } from "./DatagraphNode";

export type DatagraphNodeBaseProps = {
  nodeKey: string;
  inputPorts: number;
  outputPorts: number;
  position?: { x: number; y: number };
  children?: React.ReactNode;
};

export function DatagraphNodeBase({
  nodeKey,
  inputPorts,
  outputPorts,
  position,
  children,
}: DatagraphNodeBaseProps) {
  return (
    <div
      className="datagraph-node"
      data-datagraph-node={nodeKey}
      style={{ left: position?.x, top: position?.y }}
    >
      <div className="datagraph-node__ports datagraph-node__ports--input">
        {[...new Array(inputPorts)].map((_, i) => (
          <div
            key={i}
            data-datagraph-port={portKey({ node: nodeKey, port: i, portType: "in" })}
            className="datagraph-node__port"
          ></div>
        ))}
      </div>
      {children}
      <div className="datagraph-node__ports datagraph-node__ports--output">
        {[...new Array(outputPorts)].map((_, i) => (
          <div
            key={i}
            data-datagraph-port={portKey({ node: nodeKey, port: i, portType: "out" })}
            className="datagraph-node__port"
          ></div>
        ))}
      </div>
    </div>
  );
}
