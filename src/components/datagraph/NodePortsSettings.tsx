import { AnyNodeState } from "../../node.types";
import { PortInfo, portKey } from "../node/node-utils";
import { useLatestPortValues } from "../node/latest-port-value.context";
import { DataField } from "../DataField";
import "./NodePortsSettings.css";
import { NumberInput } from "../NumberInput";

import { useMemo, useState } from "react";
import classNames from "classnames";
import { PortType } from "@patsimm/datagraph-core";

export type NodeInputPortSettingsProps = {
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

export function NodeInputPortsSettings({
  node,
  onDefaultValueChange,
  onDefaultValueReset,
}: NodeInputPortSettingsProps) {
  const portInfos = useMemo(
    () => [
      ...Array.from({ length: node.inputPorts.length }, (_, i) => ({
        nodeId: node.nodeId,
        port: i,
        portType: "in" as PortType,
      })),
    ],
    [node.inputPorts.length, node.nodeId]
  );

  return (
    <div
      className={classNames("node-ports-settings", {
        "node-ports-settings--empty": node.inputPorts.length === 0,
      })}
    >
      {portInfos.map((port, i) => (
        <div className="node-ports-settings__port" key={portKey(port)}>
          <h3>{node.inputPorts[i].name}</h3>
          <div className="node-ports-settings__datafields">
            <DataField
              label="Fallback"
              disabled={node.inputPorts[i].connectedTo.length != 0}
              value={
                <NumberInput
                  value={
                    node.inputPorts[i].isDefaultModified
                      ? node.inputPorts[i].defaultValue
                      : undefined
                  }
                  placeholder={
                    !node.inputPorts[i].isDefaultModified
                      ? node.inputPorts[i].defaultValue.toString()
                      : undefined
                  }
                  onChange={(value) => onDefaultValueChange(i, value)}
                  onReset={() => onDefaultValueReset(i)}
                  resetable
                  dirty={node.inputPorts[i].isDefaultModified}
                  disabled={node.inputPorts[i].connectedTo.length != 0}
                />
              }
            />
            <DataField
              className="node-ports-settings__live-data"
              label="Live"
              value={<LiveValue portInfo={port} />}
            />
          </div>
        </div>
      ))}
      {node.inputPorts.length === 0 && (
        <div className="node-ports-settings__absent-text">No input ports</div>
      )}
    </div>
  );
}

export type NodeOutputPortsSettingsProps = {
  node: AnyNodeState;
};

export function NodeOutputPortsSettings({ node }: NodeOutputPortsSettingsProps) {
  const portInfos = useMemo(
    () => [
      ...Array.from({ length: node.outputPorts.length }, (_, i) => ({
        nodeId: node.nodeId,
        port: i,
        portType: "out" as PortType,
      })),
    ],
    [node.outputPorts.length, node.nodeId]
  );

  return (
    <div
      className={classNames("node-ports-settings", {
        "node-ports-settings--empty": node.outputPorts.length === 0,
      })}
    >
      {portInfos.map((port, i) => (
        <div className="node-ports-settings__port" key={portKey(port)}>
          <h3>{node.outputPorts[i].name}</h3>
          <DataField
            className="node-ports-settings__live-data"
            label="Live"
            value={<LiveValue portInfo={port} />}
          />
        </div>
      ))}
      {node.outputPorts.length === 0 && (
        <div className="node-ports-settings__absent-text">No output ports</div>
      )}
    </div>
  );
}
