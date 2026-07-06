import { Slider } from "../../Slider";
import type { ParamBodyProps } from "./param-body.types";

import { useState } from "react";

export function SliderParamBody({
  settings,
  value,
  onChange,
  ...rest
}: ParamBodyProps<"param:slider">) {
  const [displayValue, setDisplayValue] = useState<number>(value);
  const [prevValue, setPrevValue] = useState(value);

  if (value !== prevValue) {
    setPrevValue(value);
    setDisplayValue(value);
  }

  const handleChange = (newValue: number) => {
    setDisplayValue(newValue);
    onChange?.(newValue);
  };

  return (
    <div className="node__body">
      <Slider
        min={settings.min}
        max={settings.max}
        step={settings.step}
        value={displayValue}
        onChange={handleChange}
        {...rest}
      />
    </div>
  );
}
