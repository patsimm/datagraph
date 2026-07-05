import classNames from "classnames";
import "./DataField.css";

export type DataFieldProps = {
  label: string;
  value: React.ReactNode;
  className?: string;
};

export function DataField({ label, value, className }: DataFieldProps) {
  return (
    <div className={classNames("datafield", className)}>
      <div className="datafield__label">{label}</div>
      <div className="datafield__value">{value}</div>
    </div>
  );
}
