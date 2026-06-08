import classNames from "classnames";
import "./Button.css";

export type ButtonProps = { color?: "red" | "default" } & React.ComponentPropsWithRef<"button">;

export function Button({ ref, children, color, ...props }: ButtonProps) {
  return (
    <button
      className={classNames("button", {
        [`button--color-${color}`]: color !== "default",
      })}
      ref={ref}
      {...props}
    >
      {children}
    </button>
  );
}
