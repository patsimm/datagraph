import { NodeKind, NodeState } from "../../node.types";
import { useNodes } from "../../nodes.context";
import { allUnits } from "../../unit-conversion";
import { DataField } from "../DataField";
import "./NodeSettings.css";

export type NodeSettingsProps = {
  nodeId: string;
  onChange: (settingsKey: string, value: unknown) => void;
};

export function NodeSettings(props: NodeSettingsProps) {
  const { getNode } = useNodes();

  const { kind, settings } = getNode(props.nodeId)!;

  switch (kind) {
    case "param:slider":
      return <SliderParamNodeSettings settings={settings} onChange={props.onChange} />;
    case "param:button":
      return <ButtonParamNodeSettings settings={settings} onChange={props.onChange} />;
    case "param:input":
      return <InputParamNodeSettings settings={settings} onChange={props.onChange} />;
  }
}

type NodeSettingsComponentProps<T extends NodeKind> = {
  settings: NodeState<T>["settings"];
  onChange: (settingsKey: string, value: unknown) => void;
};

function SliderParamNodeSettings(props: NodeSettingsComponentProps<"param:slider">) {
  return (
    <div className="nodesettings">
      <DataField
        label="unit"
        value={
          <select
            name="unit"
            id="pet-select"
            value={props.settings.unit}
            onChange={(ev) => props.onChange("unit", ev.target.value)}
          >
            {allUnits.map((unit) => (
              <option key={unit} value={unit}>
                {unit}
              </option>
            ))}
          </select>
        }
      />
      <DataField
        label="min"
        value={
          <input
            type="number"
            step={1}
            value={props.settings.min}
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
            value={props.settings.max}
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
            value={props.settings.step}
            onChange={(ev) => {
              props.onChange("step", parseFloat(ev.target.value));
            }}
          />
        }
      />
    </div>
  );
}

function ButtonParamNodeSettings(props: NodeSettingsComponentProps<"param:button">) {
  return (
    <div className="nodesettings">
      <DataField
        label="unit"
        value={
          <select
            name="unit"
            id="pet-select"
            value={props.settings.unit}
            onChange={(ev) => props.onChange("unit", ev.target.value)}
          >
            {allUnits.map((unit) => (
              <option key={unit} value={unit}>
                {unit}
              </option>
            ))}
          </select>
        }
      />
    </div>
  );
}

function InputParamNodeSettings(props: NodeSettingsComponentProps<"param:input">) {
  return (
    <div className="nodesettings">
      <DataField
        label="unit"
        value={
          <select
            name="unit"
            id="pet-select"
            value={props.settings.unit}
            onChange={(ev) => props.onChange("unit", ev.target.value)}
          >
            {allUnits.map((unit) => (
              <option key={unit} value={unit}>
                {unit}
              </option>
            ))}
          </select>
        }
      />
    </div>
  );
}
