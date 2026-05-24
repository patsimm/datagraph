import { AnyNodeState } from "../../node.types";
import { portKey } from "../node/node-utils";
import { useLatestPortValues } from "../node/latest-port-values.hook";
import { DataField } from "../DataField";
import "./NodePortsSettings.css";
import { NumberInput } from "../NumberInput";

import { Fragment, useMemo } from "react";

export type NodeInputViewProps = {
  node: AnyNodeState;
  onDefaultValueChange: (port: number, value: number) => void;
};

export function NodePortsSettings({ node, onDefaultValueChange }: NodeInputViewProps) {
  const ports = useMemo(
    () => [
      ...Array.from({ length: node.inputPorts.length }, (_, i) => ({
        nodeId: node.nodeId,
        port: i,
        portType: "in" as const,
      })),
      ...Array.from({ length: node.outputPorts.length }, (_, i) => ({
        nodeId: node.nodeId,
        port: i,
        portType: "out" as const,
      })),
    ],
    [node.inputPorts.length, node.outputPorts.length, node.nodeId]
  );
  const values = useLatestPortValues(ports);

  const handleDefaultValueInputChange = (port: number, value: number) => {
    onDefaultValueChange(port, value);
  };

  return (
    <>
      <div className="contextview__section">
        <h2>Inputs</h2>
        {node.inputPorts.map((port, i) => (
          <Fragment key={portKey({ nodeId: node.nodeId, port: i, portType: "in" })}>
            <h3>{port.name}</h3>
            <DataField
              label="default"
              value={
                <NumberInput
                  value={node.inputPorts[i].defaultValue}
                  onChange={(value) => handleDefaultValueInputChange(i, value)}
                />
              }
            />
            <DataField label="current" value={values[i].toFixed(4)} />
          </Fragment>
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
