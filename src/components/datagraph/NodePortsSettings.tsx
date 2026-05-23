import { AnyNodeState } from "../../node.types";
import { portKey } from "../node/node-utils";
import { useLatestPortValues } from "../node/latest-port-values.hook";
import { DataField } from "../DataField";
import "./NodePortsSettings.css";

import { useMemo } from "react";

export type NodeInputViewProps = {
  node: AnyNodeState;
};

export function NodePortsSettings({ node }: NodeInputViewProps) {
  const ports = useMemo(
    () => [
      ...node.inputPorts.map((_, i) => ({ nodeId: node.nodeId, port: i, portType: "in" as const })),
      ...node.outputPorts.map((_, i) => ({
        nodeId: node.nodeId,
        port: i,
        portType: "out" as const,
      })),
    ],
    [node.inputPorts, node.outputPorts, node.nodeId]
  );
  const values = useLatestPortValues(ports);

  return (
    <>
      <div className="contextview__section">
        <h2>Inputs</h2>
        {node.inputPorts.map((port, i) => (
          <DataField
            key={portKey({ nodeId: node.nodeId, port: i, portType: "in" })}
            label={port.name}
            value={values[i].toFixed(4)}
          />
        ))}
        {node.inputPorts.length === 0 && (
          <div className="node-ports-settings__absent-text">No input ports</div>
        )}
      </div>
      <div className="contextview__section">
        <h2>Outputs</h2>
        <div>
          {node.outputPorts.map((port, i) => (
            <DataField
              key={portKey({ nodeId: node.nodeId, port: i, portType: "out" })}
              label={port.name}
              value={values[node.inputPorts.length + i].toFixed(4)}
            />
          ))}
          {node.outputPorts.length === 0 && (
            <div className="node-ports-settings__absent-text">No output ports</div>
          )}
        </div>
      </div>
    </>
  );
}
