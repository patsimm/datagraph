import classNames from "classnames";
import "./DataField.css";

export type DataFieldProps = {
  label: string;
  value: React.ReactNode;
  disabled?: boolean;
  className?: string;
};

export function DataField({ label, value, className, disabled }: DataFieldProps) {
  return (
    <div className={classNames("datafield", className, { "datafield--disabled": disabled })}>
      <div className="datafield__label">{label}</div>
      <div className="datafield__value">{value}</div>
    </div>
  );
}
