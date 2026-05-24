import { AnyNodeState } from "../../node.types";
import { portKey } from "../node/node-utils";
import { useLatestPortValues } from "../node/latest-port-values.hook";
import { DataField } from "../DataField";
import "./NodePortsSettings.css";
import { NumberInput } from "../NumberInput";

import { Fragment, useMemo } from "react";
import { IconArrowBackUp } from "@tabler/icons-react";
import classNames from "classnames";

export type NodeInputViewProps = {
  node: AnyNodeState;
  onDefaultValueChange: (port: number, value: number) => void;
  onDefaultValueReset: (port: number) => void;
};

export function NodePortsSettings({
  node,
  onDefaultValueChange,
  onDefaultValueReset,
}: NodeInputViewProps) {
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

  return (
    <>
      <div
        className={classNames("node-ports-settings contextview__section", {
          "node-ports-settings--empty": node.inputPorts.length === 0,
        })}
      >
        <h2>Inputs</h2>
        {node.inputPorts.map((port, i) => (
          <Fragment key={portKey({ nodeId: node.nodeId, port: i, portType: "in" })}>
            <h3>{port.name}</h3>
            <DataField
              label="default"
              value={
                <div
                  className={classNames("node-ports-settings__default-field", {
                    "node-ports-settings__default-field--unmodified": !port.isDefaultModified,
                  })}
                >
                  <NumberInput
                    value={port.defaultValue}
                    onChange={(value) => onDefaultValueChange(i, value)}
                  />
                  <button
                    className="node-ports-settings__reset-btn"
                    onClick={() => onDefaultValueReset(i)}
                    title="Reset to default"
                    disabled={!port.isDefaultModified}
                  >
                    <IconArrowBackUp className="node-ports-settings__reset-btn-icon" />
                  </button>
                </div>
              }
            />
            <DataField label="live" value={values[i].toFixed(4)} />
          </Fragment>
        ))}
        {node.inputPorts.length === 0 && (
          <div className="node-ports-settings__absent-text">No input ports</div>
        )}
      </div>
      <div
        className={classNames("node-ports-settings contextview__section", {
          "node-ports-settings--empty": node.outputPorts.length === 0,
        })}
      >
        <h2>Outputs</h2>
        {node.outputPorts.map((port, i) => (
          <Fragment key={portKey({ nodeId: node.nodeId, port: i, portType: "out" })}>
            <h3>{port.name}</h3>
            <DataField label="live" value={values[node.inputPorts.length + i].toFixed(4)} />
          </Fragment>
        ))}
        {node.outputPorts.length === 0 && (
          <div className="node-ports-settings__absent-text">No output ports</div>
        )}
      </div>
    </>
  );
}
