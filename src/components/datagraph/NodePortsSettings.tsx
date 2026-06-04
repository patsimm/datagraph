import { AnyNodeState } from "../../node.types";
import { PortInfo, portKey } from "../node/node-utils";
import { useLatestPortValues } from "../node/latest-port-value.context";
import { DataField } from "../DataField";
import "./NodePortsSettings.css";
import { NumberInput } from "../NumberInput";

import { Fragment, useMemo, useState } from "react";
import { IconArrowBackUp } from "@tabler/icons-react";
import classNames from "classnames";

export type NodeInputViewProps = {
  node: AnyNodeState;
  onDefaultValueChange: (port: number, value: number) => void;
  onDefaultValueReset: (port: number) => void;
};

function LiveValue({ portInfo }: { portInfo: PortInfo }) {
  const [value, setValue] = useState(0);
  useLatestPortValues([portInfo], (values) => {
    setValue(values[0] ?? 0);
  });
  return <>{value.toFixed(4)}</>;
}

export function NodePortsSettings({
  node,
  onDefaultValueChange,
  onDefaultValueReset,
}: NodeInputViewProps) {
  const inputPortInfos = useMemo(
    () => [
      ...Array.from({ length: node.inputPorts.length }, (_, i) => ({
        nodeId: node.nodeId,
        port: i,
        portType: "in" as const,
      })),
    ],
    [node.inputPorts.length, node.nodeId]
  );

  const outputPortInfos = useMemo(
    () => [
      ...Array.from({ length: node.outputPorts.length }, (_, i) => ({
        nodeId: node.nodeId,
        port: i,
        portType: "out" as const,
      })),
    ],
    [node.nodeId, node.outputPorts.length]
  );

  return (
    <>
      <div
        className={classNames("node-ports-settings contextview__section", {
          "node-ports-settings--empty": node.inputPorts.length === 0,
        })}
      >
        <h2>Inputs</h2>
        {inputPortInfos.map((port, i) => (
          <Fragment key={portKey(port)}>
            <h3>{node.inputPorts[i].name}</h3>
            <DataField
              label="default"
              value={
                <div
                  className={classNames("node-ports-settings__default-field", {
                    "node-ports-settings__default-field--unmodified":
                      !node.inputPorts[i].isDefaultModified,
                  })}
                >
                  <NumberInput
                    value={node.inputPorts[i].defaultValue}
                    onChange={(value) => onDefaultValueChange(i, value)}
                  />
                  <button
                    className="node-ports-settings__reset-btn"
                    onClick={() => onDefaultValueReset(i)}
                    title="Reset to default"
                    disabled={!node.inputPorts[i].isDefaultModified}
                  >
                    <IconArrowBackUp className="node-ports-settings__reset-btn-icon" />
                  </button>
                </div>
              }
            />
            <DataField label="live" value={<LiveValue portInfo={port} />} />
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
            <DataField label="live" value={<LiveValue portInfo={outputPortInfos[i]} />} />
          </Fragment>
        ))}
        {node.outputPorts.length === 0 && (
          <div className="node-ports-settings__absent-text">No output ports</div>
        )}
      </div>
    </>
  );
}
