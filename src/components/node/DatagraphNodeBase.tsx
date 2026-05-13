import { portKey } from "./DatagraphNode";

export type DatagraphNodeBaseProps = {
  nodeId: string;
  inputPorts: string[];
  outputPorts: string[];
  position?: { x: number; y: number };
  children?: React.ReactNode;
};

export function DatagraphNodeBase({
  nodeId,
  inputPorts,
  outputPorts,
  position,
  children,
}: DatagraphNodeBaseProps) {
  return (
    <div
      className="datagraph-node"
      data-datagraph-node={nodeId}
      style={{ left: position?.x, top: position?.y }}
    >
      <div className="datagraph-node__ports datagraph-node__ports--input">
        {inputPorts.map((name, i) => (
          <div
            key={i}
            data-datagraph-port={portKey({ node: nodeId, port: i, portType: "in" })}
            className="datagraph-node__port"
            title={name}
          ></div>
        ))}
      </div>
      {children}
      <div className="datagraph-node__ports datagraph-node__ports--output">
        {outputPorts.map((name, i) => (
          <div
            key={i}
            data-datagraph-port={portKey({ node: nodeId, port: i, portType: "out" })}
            className="datagraph-node__port"
            title={name}
          ></div>
        ))}
      </div>
    </div>
  );
}
