import { NodeKind, NodeState } from "../../node.types";
import { allUnits, Unit } from "../../unit-conversion";
import { DataField } from "../DataField";
import "./NodeSettings.css";

export type NodeSettingsProps<T extends NodeKind> = {
  node: NodeState<T>;
  onChange: <K extends keyof NodeState<T>["settings"]>(
    settingsKey: K,
    value: NodeState<T>["settings"][K]
  ) => void;
};

type NodeSettingsComponentProps<T extends NodeKind> = {
  settings: NodeState<T>["settings"];
  onChange: <K extends keyof NodeState<T>["settings"]>(
    settingsKey: K,
    value: NodeState<T>["settings"][K]
  ) => void;
};

export function NodeSettings<T extends NodeKind>(props: NodeSettingsProps<T>) {
  switch (props.node.kind) {
    case "param:slider":
      return (
        <SliderParamNodeSettings
          settings={props.node.settings as NodeSettingsComponentProps<"param:slider">["settings"]}
          onChange={props.onChange as NodeSettingsComponentProps<"param:slider">["onChange"]}
        />
      );
    case "param:button":
      return (
        <ButtonParamNodeSettings
          settings={props.node.settings as NodeSettingsComponentProps<"param:button">["settings"]}
          onChange={props.onChange as NodeSettingsComponentProps<"param:button">["onChange"]}
        />
      );
    case "param:input":
      return (
        <InputParamNodeSettings
          settings={props.node.settings as NodeSettingsComponentProps<"param:input">["settings"]}
          onChange={props.onChange as NodeSettingsComponentProps<"param:input">["onChange"]}
        />
      );
  }
}

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
            onChange={(ev) => props.onChange("unit", ev.target.value as Unit)}
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
            onChange={(ev) => props.onChange("min", parseFloat(ev.target.value))}
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
            onChange={(ev) => props.onChange("max", parseFloat(ev.target.value))}
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
            onChange={(ev) => props.onChange("step", parseFloat(ev.target.value))}
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
            onChange={(ev) => props.onChange("unit", ev.target.value as Unit)}
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
            onChange={(ev) => props.onChange("unit", ev.target.value as Unit)}
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
