import { ComponentProps, PropsWithChildren, useState } from "react";

export type NumberInputProps = Omit<ComponentProps<"input">, "onChange" | "value" | "type"> & {
  onChange?: (value: number) => void;
  value: number;
};

export function NumberInput({
  onChange,
  value,
  children,
  ...props
}: PropsWithChildren<NumberInputProps>) {
  const [displayValue, setDisplayValue] = useState<string>(value.toString());
  const [prevValue, setPrevValue] = useState(value);

  if (value !== prevValue) {
    setPrevValue(value);
    setDisplayValue(value.toString());
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDisplayValue(e.target.value);
    const parsedValue = parseFloat(e.target.value);
    if (Number.isNaN(parsedValue) || !Number.isFinite(parsedValue)) return;
    onChange?.(parsedValue);
  };

  return (
    <input type="number" onChange={handleChange} value={displayValue} {...props}>
      {children}
    </input>
  );
}
