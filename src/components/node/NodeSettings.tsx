import { AnyNodeState } from "../../node.types";
import { DataField } from "../DataField";
import "./NodeSettings.css";

export type NodeSettingsProps = {
  node: AnyNodeState;
  onChange: (settingsKey: string, value: number) => void;
};

export function NodeSettings(props: NodeSettingsProps) {
  const node = props.node as AnyNodeState;

  return (
    node.kind === "param:slider" && (
      <div className="nodesettings">
        <DataField
          label="min"
          value={
            <input
              type="number"
              step={1}
              value={node.min}
              onChange={(ev) => {
                props.onChange("min", parseFloat(ev.target.value));
              }}
            />
          }
        />
        <DataField
          label="max"
          value={
            <input
              type="number"
              step={1}
              value={node.max}
              onChange={(ev) => {
                props.onChange("max", parseFloat(ev.target.value));
              }}
            />
          }
        />
        <DataField
          label="step"
          value={
            <input
              type="number"
              step={0.01}
              value={node.step}
              onChange={(ev) => {
                props.onChange("step", parseFloat(ev.target.value));
              }}
            />
          }
        />
      </div>
    )
  );
}
