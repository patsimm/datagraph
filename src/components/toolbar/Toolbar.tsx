import { NodeInfo } from "../../audio-worklet/datagraph-audio-worklet-commands";
import { useGraphPersistence } from "../../persistence/use-graph-persistence";
import "./Toolbar.css";
import { useDatagraph } from "../../datagraph.context";
import { useLinkGeneration } from "../../persistence/use-link-generation";
import { NodeCreationMenu } from "./NodeCreationMenu";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  IconBrandGithub,
  IconDeviceFloppy,
  IconFileUpload,
  IconPlayerPause,
  IconPlayerPlay,
  IconShare,
  IconSquarePlus,
} from "@tabler/icons-react";
import classNames from "classnames";

export type ToolbarProps = {
  outputNode: NodeInfo;
};

export function Toolbar({ outputNode }: ToolbarProps) {
  const { saveGraph, loadGraph } = useGraphPersistence(outputNode);
  const { shareGraph } = useLinkGeneration(outputNode);
  const [newNodeMenuOpen, setNewNodeMenuOpen] = useState(false);
  const datagraph = useDatagraph();

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

  return (
    <div role="toolbar" className="toolbar">
      <div role="group" className="toolbar__section">
        {datagraph.ready && (
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
            <NodeCreationMenu
              className="toolbar__menu toolbar__menu--new-node"
              onClose={() => setNewNodeMenuOpen(false)}
            />
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
        <button className="toolbar__button" onClick={shareGraph}>
          <IconShare stroke={1.25} className="toolbar__button-icon" />
        </button>
        <div className="toolbar__divider" />
        <a
          className="toolbar__button"
          href="https://github.com/patsimm/datagraph"
          target="_blank"
          rel="noreferrer"
          aria-label="View source on GitHub"
        >
          <IconBrandGithub stroke={1.25} className="toolbar__button-icon" />
        </a>
      </div>
    </div>
  );
}
