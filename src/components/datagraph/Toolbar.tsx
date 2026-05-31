import { NodeInfo } from "../../audio-worklet/datagraph-audio-worklet-commands";
import { useGraphPersistence } from "../../use-graph-persistence";
import "./Toolbar.css";
import { useDatagraph } from "../../datagraph.context";
import { useNodes } from "../../nodes.context";
import { NodeKind, NodeState } from "../../node.types";
import { getNodeElement } from "../node/node-utils";
import { useSelection } from "../../selection.context";
import { usePanZoomCanvas } from "../canvas/PanZoomCanvas";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  IconDeviceFloppy,
  IconFileUpload,
  IconPlayerPause,
  IconPlayerPlay,
  IconSquarePlus,
} from "@tabler/icons-react";
import classNames from "classnames";

export type ToolbarProps = {
  outputNode: NodeInfo;
};

export function Toolbar({ outputNode }: ToolbarProps) {
  const { saveGraph, loadGraph } = useGraphPersistence(outputNode);
  const [newNodeMenuOpen, setNewNodeMenuOpen] = useState(false);
  const datagraph = useDatagraph();
  const { ready, nodeTypes } = datagraph;
  const { addNode, updateNodeState } = useNodes();
  const { handleNodeSelected } = useSelection();
  const panZoomCanvas = usePanZoomCanvas();

  const menuTriggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!newNodeMenuOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuTriggerRef.current && !menuTriggerRef.current.contains(e.target as Node)) {
        setNewNodeMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [newNodeMenuOpen]);

  const handleNewNode = useCallback(() => {
    setNewNodeMenuOpen((open) => !open);
  }, []);

  const handleAddNodePointerDown = useCallback(
    async <T extends NodeKind>(
      kind: T,
      config: NodeState<T>["config"],
      settings: NodeState<T>["settings"],
      ev: React.PointerEvent
    ) => {
      ev.currentTarget.setPointerCapture(ev.pointerId);
      document.body.classList.add("dragging");
      const position = panZoomCanvas.clientToCanvasPos(ev);
      const info = await addNode(kind, position, config, settings);
      if (!info) {
        document.body.classList.remove("dragging");
        return;
      }
      const element = await waitForElement(info.nodeId);
      handleNodeSelected(info.nodeId);
      // Transfer capture from the button (which may be unmounting) to the new node element.
      // This must happen before setNewNodeMenuOpen(false) unmounts the button.
      element.setPointerCapture(ev.pointerId);
      element.classList.add("node--dragging");
      setNewNodeMenuOpen(false);

      const pointerMoveHandler = (ev: PointerEvent) => {
        const newPos = panZoomCanvas.clientToCanvasPos(ev);
        element.style.left = `${newPos.x}px`;
        element.style.top = `${newPos.y}px`;
      };
      const pointerUpHandler = (ev: PointerEvent) => {
        element.removeEventListener("pointermove", pointerMoveHandler);
        element.removeEventListener("pointerup", pointerUpHandler);
        element.classList.remove("node--dragging");
        document.body.classList.remove("dragging");
        const newPos = panZoomCanvas.clientToCanvasPos(ev);
        updateNodeState(info.nodeId, (prev) => ({ ...prev, ...newPos }));
      };

      element.addEventListener("pointermove", pointerMoveHandler);
      element.addEventListener("pointerup", pointerUpHandler);
    },
    [addNode, handleNodeSelected, panZoomCanvas, updateNodeState]
  );
  return (
    <div role="toolbar" className="toolbar">
      <div role="group" className="toolbar__section">
        {" "}
        {ready && (
          <button
            className={classNames("toolbar__button", {
              "toolbar__button--play": datagraph.audioContextState !== "running",
            })}
            onClick={
              datagraph.audioContextState === "running" ? datagraph.suspend : datagraph.resume
            }
          >
            {datagraph.audioContextState === "running" ? (
              <IconPlayerPause stroke={1.25} className="toolbar__button-icon" />
            ) : (
              <IconPlayerPlay stroke={1.25} className="toolbar__button-icon" />
            )}
          </button>
        )}
        <div className="toolbar__divider" />
        <div
          ref={menuTriggerRef}
          className={classNames("toolbar__menu-trigger", {
            "toolbar__menu-trigger--open": newNodeMenuOpen,
          })}
        >
          <button className="toolbar__button" onClick={handleNewNode}>
            <IconSquarePlus stroke={1.25} className="toolbar__button-icon" />
          </button>
          {newNodeMenuOpen && (
            <div role="menu" className="toolbar__menu toolbar__menu--new-node">
              {ready && nodeTypes.length > 0 && (
                <div role="group" className="toolbar__menu-section toolbar__menu-section--audio">
                  <div role="presentation" className="toolbar__menu-label">
                    Audio
                  </div>
                  <div className="toolbar__menu-items">
                    {nodeTypes.map((typename) => (
                      <button
                        key={typename}
                        role="menuitem"
                        className="toolbar__add-node-button"
                        onPointerDown={(ev) =>
                          handleAddNodePointerDown("datagraph", { typename }, undefined, ev)
                        }
                      >
                        {typename.split("::").at(-1)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div role="group" className="toolbar__menu-section toolbar__menu-section--controls">
                <div role="presentation" className="toolbar__menu-label">
                  Controls
                </div>
                <div className="toolbar__menu-items">
                  <button
                    role="menuitem"
                    className="toolbar__add-node-button"
                    onPointerDown={(ev) =>
                      handleAddNodePointerDown(
                        "param:slider",
                        { value: 0 },
                        { unit: "raw", min: 0, max: 1, step: 0.01 },
                        ev
                      )
                    }
                  >
                    slider
                  </button>
                  <button
                    role="menuitem"
                    className="toolbar__add-node-button"
                    onPointerDown={(ev) =>
                      handleAddNodePointerDown(
                        "param:button",
                        { value: 0 },
                        { unit: "raw", onValue: 1, offValue: 0 },
                        ev
                      )
                    }
                  >
                    button
                  </button>
                  <button
                    role="menuitem"
                    className="toolbar__add-node-button"
                    onPointerDown={(ev) =>
                      handleAddNodePointerDown("param:input", { value: 0 }, { unit: "raw" }, ev)
                    }
                  >
                    input
                  </button>
                </div>
              </div>
              <div
                role="group"
                className="toolbar__menu-section toolbar__menu-section--visualizers"
              >
                <div role="presentation" className="toolbar__menu-label">
                  Visualizers
                </div>
                <div className="toolbar__menu-items">
                  <button
                    role="menuitem"
                    className="toolbar__add-node-button"
                    onPointerDown={(ev) =>
                      handleAddNodePointerDown("visualizer:oscilloscope", undefined, undefined, ev)
                    }
                  >
                    oscilloscope
                  </button>
                  <button
                    role="menuitem"
                    className="toolbar__add-node-button"
                    onPointerDown={(ev) =>
                      handleAddNodePointerDown("visualizer:inspect", undefined, undefined, ev)
                    }
                  >
                    inspect
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <div role="group" className="toolbar__section">
        <button className="toolbar__button" onClick={saveGraph}>
          <IconDeviceFloppy stroke={1.25} className="toolbar__button-icon" />
        </button>
        <button className="toolbar__button" onClick={loadGraph}>
          <IconFileUpload stroke={1.25} className="toolbar__button-icon" />
        </button>
      </div>
    </div>
  );
}

function waitForElement(nodeId: string): Promise<HTMLElement> {
  let count = 0;
  return new Promise((resolve, reject) => {
    const check = () => {
      count++;
      try {
        const el = getNodeElement(nodeId);
        resolve(el);
      } catch (e: unknown) {
        if (count > 50) reject(e);
        requestAnimationFrame(check);
      }
    };
    requestAnimationFrame(check);
  });
}
