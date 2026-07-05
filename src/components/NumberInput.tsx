import "./NumberInput.css";

import { IconArrowBackUp } from "@tabler/icons-react";
import classNames from "classnames";
import { ComponentProps, PropsWithChildren, useRef, useState } from "react";

export type NumberInputProps = Omit<ComponentProps<"input">, "onChange" | "value" | "type"> & {
  onChange?: (value: number) => void;
  value: number;
  resetable?: boolean;
  onReset?: () => void;
  dirty?: boolean;
};

export function NumberInput({
  onChange,
  value,
  children,
  resetable,
  onReset,
  dirty,
  disabled,
  ...props
}: PropsWithChildren<NumberInputProps>) {
  const [displayValue, setDisplayValue] = useState<string>(value.toString());
  const [prevValue, setPrevValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  if (value !== prevValue) {
    setPrevValue(value);
    if (parseFloat(displayValue) !== value) {
      setDisplayValue(value.toString());
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDisplayValue(e.target.value);
    const parsedValue = parseFloat(e.target.value);
    if (Number.isNaN(parsedValue) || !Number.isFinite(parsedValue)) return;
    onChange?.(parsedValue);
  };

  const handleReset = () => {
    setDisplayValue(value.toString());
    onReset?.();
    inputRef.current?.focus();
  };

  return (
    <div className={classNames("number-input", { "number-input--disabled": disabled })}>
      <input
        className="number-input__input"
        type="number"
        onChange={handleChange}
        value={displayValue}
        disabled={disabled}
        onFocus={(e) => e.target.select()}
        ref={inputRef}
        {...props}
      >
        {children}
      </input>
      {resetable && (
        <button
          className="number-input__reset-btn"
          onClick={handleReset}
          title="Reset to default"
          disabled={!(dirty || value != parseFloat(displayValue)) || disabled}
        >
          <IconArrowBackUp size={20} className="node-ports-settings__reset-btn-icon" />
        </button>
      )}
    </div>
  );
}
