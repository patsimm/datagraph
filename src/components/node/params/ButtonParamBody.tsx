import type { ParamBodyProps } from "./param-body.types";

import classNames from "classnames";

export function ButtonParamBody({
  nodeId,
  settings,
  onChange,
  value,
  onPointerDown,
  onPointerUp,
}: ParamBodyProps<"param:button">) {
  const handlePointerDown = (ev: React.PointerEvent) => {
    onPointerDown?.(ev);
    onChange?.(nodeId, settings.onValue);
  };

  const handlePointerUp = (ev: React.PointerEvent) => {
    onPointerUp?.(ev);
    onChange?.(nodeId, settings.offValue);
  };

  return (
    <input
      className={classNames("node__input-button", {
        "node__input--active": value === settings.onValue,
      })}
      type="button"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={() => onChange?.(nodeId, settings.offValue)}
      aria-pressed={value === settings.onValue}
    />
  );
}
