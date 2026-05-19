import "./DataField.css";

export function DataField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="datafield">
      <div className="datafield__label">{label}:</div>
      <div className="datafield__value">{value}</div>
    </div>
  );
}
