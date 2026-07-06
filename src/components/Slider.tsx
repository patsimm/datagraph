import { useRef } from "react";
import "./Slider.css";

export type SliderProps = {
  value: number;
  min: number;
  max: number;
  step: number;
  horizontal?: boolean;
  onChange?: (value: number) => void;
  onPointerDown?: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerUp?: (e: React.PointerEvent<HTMLDivElement>) => void;
};

export function Slider(props: SliderProps) {
  const sliderRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLSpanElement>(null);
  const clampedValue = Math.min(props.max, Math.max(props.min, props.value));
  const percentValue = (clampedValue - props.min) / (props.max - props.min);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    props.onChange?.(parseFloat(e.target.value));
  };

  const updateValueFromPointer = (clientX: number, clientY: number) => {
    const slider = sliderRef.current;
    const thumb = thumbRef.current;
    if (!slider || !thumb) return;

    const rect = slider.getBoundingClientRect();
    // Measure the thumb live rather than caching it: a stale/oversized thumb size
    // makes `travel` collapse to 0 and snaps every click to the minimum value.
    // The thumb's center only travels within [thumbSize/2, size - thumbSize/2],
    // so map the pointer against that inset range to keep it aligned with the thumb.
    // Horizontal grows left→right; vertical grows bottom→top.
    const thumbSize = props.horizontal ? thumb.offsetWidth : thumb.offsetHeight;
    const travel = (props.horizontal ? rect.width : rect.height) - thumbSize;
    const offset = props.horizontal
      ? clientX - rect.left - thumbSize / 2
      : rect.bottom - clientY - thumbSize / 2;
    const percent = travel > 0 ? Math.min(1, Math.max(0, offset / travel)) : 0;

    const range = props.max - props.min;
    const rawValue = props.min + percent * range;
    const steppedValue = Math.round((rawValue - props.min) / props.step) * props.step + props.min;
    const clampedValue = Math.min(props.max, Math.max(props.min, steppedValue));

    props.onChange?.(clampedValue);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    props.onPointerDown?.(e);
    const target = e.currentTarget as HTMLDivElement;
    target.setPointerCapture(e.pointerId);

    const handlePointerMove = (e: PointerEvent) => {
      updateValueFromPointer(e.clientX, e.clientY);
    };

    const handlePointerUp = () => {
      target.removeEventListener("pointermove", handlePointerMove);
      target.removeEventListener("pointerup", handlePointerUp);
    };

    target.addEventListener("pointermove", handlePointerMove);
    target.addEventListener("pointerup", handlePointerUp);
  };

  return (
    <div className={props.horizontal ? "slider slider--horizontal" : "slider"} ref={sliderRef}>
      <span className="slider__track"></span>
      <span
        ref={thumbRef}
        className="slider__thumb"
        style={{ "--percentage": percentValue } as React.CSSProperties}
        onPointerDown={handlePointerDown}
        onPointerUp={props.onPointerUp}
      >
        <input
          type="range"
          max={props.max}
          min={props.min}
          step={props.step}
          value={props.value}
          onChange={handleChange}
        ></input>
      </span>
    </div>
  );
}
