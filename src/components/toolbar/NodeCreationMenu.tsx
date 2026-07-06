import { useDatagraph } from "../../datagraph.context";
import { NodeKind, NodeState } from "../../node.types";
import { useNodes } from "../../nodes.context";
import { useSelection } from "../../selection.context";
import { usePanZoomCanvas } from "../canvas/PanZoomCanvas";
import { waitForNode } from "../node/node-utils";
import "./NodeCreationMenu.css";

import { IconChevronRight } from "@tabler/icons-react";
import classNames from "classnames";
import { useCallback, useLayoutEffect, useMemo, useRef } from "react";

function reposition(el: HTMLElement) {
  el.style.transform = "";
  const { top, left, bottom, right } = el.getBoundingClientRect();
  const tx = right > window.innerWidth ? window.innerWidth - right : left < 0 ? -left : 0;
  const ty = bottom > window.innerHeight ? window.innerHeight - bottom : top < 0 ? -top : 0;
  if (tx !== 0 || ty !== 0) el.style.transform = `translate(${tx}px, ${ty}px)`;
}

const visualizerNodes = [
  {
    category: "visualizers",
    label: "Oscilloscope",
    kind: "visualizer:oscilloscope" as const,
    config: undefined,
    settings: undefined,
  },
  {
    category: "visualizers",
    label: "Inspect",
    kind: "visualizer:inspect" as const,
    config: undefined,
    settings: undefined,
  },
];

const paramNodes = [
  {
    category: "controls",
    label: "Slider",
    kind: "param:slider" as const,
    config: { value: 0 },
    settings: { unit: "raw" as const, min: 0, max: 1, step: 0.01 },
  },
  {
    category: "controls",
    label: "Button",
    kind: "param:button" as const,
    config: { value: 0 },
    settings: { unit: "raw" as const, onValue: 1, offValue: 0 },
  },
  {
    category: "controls",
    label: "MIDI Note",
    kind: "param:midinote" as const,
    config: { value: 60 },
    settings: { unit: "frequency:midiNote" as const, channel: 0 },
  },
  {
    category: "controls",
    label: "MIDI Gate",
    kind: "param:midigate" as const,
    config: { value: 0 },
    settings: { unit: "raw" as const, channel: 0 },
  },
  {
    category: "controls",
    label: "MIDI CC",
    kind: "param:midicc" as const,
    config: { value: 0 },
    settings: { unit: "raw" as const, channel: 0, ccNumber: 1 },
  },
];

function useRepositionIntoViewport(ref: React.RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    if (ref.current) reposition(ref.current);
  });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(() => reposition(el));
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);
}

function repositionSubMenuItems(el: HTMLElement, rightBoundary: number) {
  el.style.transform = "";
  el.style.left = "";
  el.style.right = "";

  const { top, bottom, right } = el.getBoundingClientRect();

  if (right > rightBoundary) {
    el.style.left = "auto";
    el.style.right = "100%";
    const newRect = el.getBoundingClientRect();
    const ty =
      newRect.bottom > window.innerHeight
        ? window.innerHeight - newRect.bottom
        : newRect.top < 0
          ? -newRect.top
          : 0;
    if (ty !== 0) el.style.transform = `translateY(${ty}px)`;
  } else {
    const ty = bottom > window.innerHeight ? window.innerHeight - bottom : top < 0 ? -top : 0;
    if (ty !== 0) el.style.transform = `translateY(${ty}px)`;
  }
}

function useRepositionSubMenuItems(
  ref: React.RefObject<HTMLElement | null>,
  getRightBoundary: () => number
) {
  useLayoutEffect(() => {
    if (ref.current) repositionSubMenuItems(ref.current, getRightBoundary());
  });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(() => repositionSubMenuItems(el, getRightBoundary()));
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, getRightBoundary]);
}

export type NodeCreationMenuProps = {
  onClose?: () => void;
  className?: string;
};

export function NodeCreationMenu({ onClose, className }: NodeCreationMenuProps) {
  const { ready, nodeTypes } = useDatagraph();
  const { addNode } = useNodes();
  const { handleNodeSelected } = useSelection();
  const panZoomCanvas = usePanZoomCanvas();
  const ref = useRef<HTMLDivElement>(null);
  useRepositionIntoViewport(ref);

  const handleAddNodePointerDown = useCallback(
    async <T extends NodeKind>(
      name: string,
      kind: T,
      config: NodeState<T>["config"],
      settings: NodeState<T>["settings"],
      ev: React.PointerEvent
    ) => {
      ev.currentTarget.setPointerCapture(ev.pointerId);
      const position = panZoomCanvas.clientToCanvasPos(ev);
      const info = await addNode(name, kind, position, config, settings);
      if (!info) return;

      onClose?.();
      const element = await waitForNode(info.nodeId);
      handleNodeSelected(info.nodeId);
      element.setPointerCapture(ev.pointerId);
      element.dispatchEvent(new PointerEvent("pointerdown", ev.nativeEvent));
    },
    [addNode, handleNodeSelected, onClose, panZoomCanvas]
  );

  const allNodes = useMemo(
    () =>
      ready
        ? [
            ...nodeTypes.map(({ nodeType: typename, category }) => ({
              category,
              label: typename.split("::").at(-1) ?? typename,
              kind: "datagraph" as const,
              config: { typename },
              settings: undefined,
            })),
            ...paramNodes,
            ...visualizerNodes,
          ]
        : [],
    [nodeTypes, ready]
  );

  const categorys = useMemo(
    () =>
      [...allNodes.reduce((acc, { category }) => acc.add(category), new Set<string>())].toSorted(
        (a, b) => a.localeCompare(b)
      ),
    [allNodes]
  );

  return (
    <div ref={ref} role="menu" className={classNames("node-creation-menu", className)}>
      {allNodes.length > 0 &&
        categorys &&
        categorys.map((category) => (
          <NodeCreationMenuSection
            key={category}
            category={category}
            types={allNodes.filter(({ category: c }) => category === c)}
            onAddNodePointerDown={handleAddNodePointerDown}
          />
        ))}
    </div>
  );
}

type NodeCreationMenuSectionProps<T extends NodeKind> = {
  category: string;
  types: {
    label: string;
    kind: T;
    config: NodeState<T>["config"];
    settings: NodeState<T>["settings"];
  }[];
  onAddNodePointerDown: (
    name: string,
    kind: T,
    config: NodeState<T>["config"],
    settings: NodeState<T>["settings"],
    ev: React.PointerEvent
  ) => void;
};

function NodeCreationMenuSection<T extends NodeKind>({
  category,
  types,
  onAddNodePointerDown,
}: NodeCreationMenuSectionProps<T>) {
  const ref = useRef<HTMLDivElement>(null);
  const { canvasBoundingClientRect } = usePanZoomCanvas();
  const getRightBoundary = useCallback(
    () => canvasBoundingClientRect()?.right ?? window.innerWidth,
    [canvasBoundingClientRect]
  );

  useRepositionSubMenuItems(ref, getRightBoundary);

  return (
    <div
      role="group"
      className={classNames(`node-creation-menu__section node-creation-menu__section--${category}`)}
    >
      <div role="presentation" className="node-creation-menu__label">
        {category.charAt(0).toUpperCase() + category.slice(1)}
        <IconChevronRight size={16} />
      </div>
      <div className="node-creation-menu__items-wrapper" ref={ref}>
        <div className="node-creation-menu__items">
          {types
            .toSorted((a, b) => a.label.localeCompare(b.label))
            .map(({ label, kind, config, settings }) => (
              <button
                key={label}
                role="menuitem"
                className="node-creation-menu__add-node-button"
                onPointerDown={(ev) => onAddNodePointerDown(label, kind, config, settings, ev)}
              >
                {label}
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}
