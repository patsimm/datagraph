import { useDatagraph } from "../../datagraph.context";
import "./Datagraph.css";
import { PortInfo } from "../node/node-utils";
import { useClipboard } from "../../persistence/use-clipboard";
import { ContextView } from "./ContextView";
import { useSelection } from "../../selection.context";
import { useNodes } from "../../nodes.context";
import { Nodes } from "./Nodes";
import { usePortConnections } from "../../edges.context";
import {
  PanZoomCanvas,
  PanZoomCanvasContext,
  PanZoomCanvasPointerEvent,
  PanZoomCanvasProvider,
} from "../canvas/PanZoomCanvas";
import { NodeInfo } from "../../audio-worklet/datagraph-audio-worklet-commands";
import { Toolbar } from "../toolbar/Toolbar";
import { Edges } from "../edge/Edges";
import { GhostEdgeProvider } from "../edge/ghost-edge.context";
import { NodeCreationMenu } from "../toolbar/NodeCreationMenu";
import { Modal } from "../Modal";
import { NodeSelection, NodeSelectionHandle } from "./NodeSelection";
import { ConfirmationDialog } from "../ConfirmationDialog";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { IconTrash } from "@tabler/icons-react";

export function Datagraph() {
  const ref = useRef<HTMLDivElement>(null);
  const datagraph = useDatagraph();
  const { ready } = datagraph;
  const { removeNode, injectOutputNode } = useNodes();
  const [outputNode, setOutputNode] = useState<NodeInfo | null>(null);
  const { disconnectPorts, disconnectNodes } = usePortConnections();
  const { handleNodeSelected, selectedNodes } = useSelection();
  const { copy, paste } = useClipboard();
  const nodeSelectionHandleRef = useRef<NodeSelectionHandle>(null);
  const canvasHandle = useRef<PanZoomCanvasContext | null>(null);
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number } | null>(
    null
  );
  const [isDeleteConfirmModalOpen, setDeleteConfirmModalOpen] = useState(false);
  const [nodesToDelete, setNodesToDelete] = useState(0);

  const handlePointerDown = useCallback((e: PanZoomCanvasPointerEvent) => {
    nodeSelectionHandleRef.current?.nodeSelectionPointerDown(e);
  }, []);

  const handleEdgeClick = useCallback(
    (edge: { from: PortInfo; to: PortInfo }, ev: React.MouseEvent) => {
      if (ev.button !== 0) return;
      ev.stopPropagation();
      disconnectPorts([edge.from, edge.to]);
    },
    [disconnectPorts]
  );

  useEffect(() => {
    if (ready) return;
    datagraph.start().then(({ outputNode }) => {
      setOutputNode(outputNode);
      injectOutputNode(outputNode, { canvasX: 0, canvasY: 0 });
    });
  }, [ready, datagraph, injectOutputNode]);

  const handleNodeClick = useCallback(
    (nodeId: string, ev: React.MouseEvent) => {
      ev.stopPropagation();
      handleNodeSelected(nodeId);
    },
    [handleNodeSelected]
  );

  const handleKeyDown = useCallback(
    (ev: React.KeyboardEvent) => {
      if ((ev.metaKey || ev.ctrlKey) && ev.key === "c") {
        ev.preventDefault();
        copy();
        return;
      }
      if ((ev.metaKey || ev.ctrlKey) && ev.key === "v") {
        ev.preventDefault();
        paste();
        return;
      }
      if (ev.key === "Backspace" || ev.key === "Delete") {
        const deletableNodes = selectedNodes.filter((id) => id !== outputNode?.nodeId);
        if (deletableNodes.length === 0) return;
        setNodesToDelete(deletableNodes.length);
        setDeleteConfirmModalOpen(true);
      }
    },
    [copy, paste, outputNode?.nodeId, selectedNodes]
  );

  const handleDeleteSelectedNodes = useCallback(() => {
    const nodesToDelete = selectedNodes.filter((id) => id !== outputNode?.nodeId);
    if (nodesToDelete.length === 0) return;
    disconnectNodes(...nodesToDelete);
    nodesToDelete.forEach(removeNode);
    handleNodeSelected(null);
    setDeleteConfirmModalOpen(false);
  }, [disconnectNodes, handleNodeSelected, outputNode?.nodeId, removeNode, selectedNodes]);

  const handleContextMenu = useCallback((ev: React.MouseEvent) => {
    ev.preventDefault();
    setContextMenuPosition({ x: ev.clientX, y: ev.clientY });
  }, []);

  return (
    <PanZoomCanvasProvider canvasHandle={canvasHandle}>
      <GhostEdgeProvider>
        <div ref={ref} onKeyDown={handleKeyDown} className="datagraph" tabIndex={-1}>
          {outputNode && <Toolbar outputNode={outputNode} />}
          <ContextView />
          <div className="datagraph__canvas" onContextMenu={handleContextMenu}>
            <NodeSelection ref={nodeSelectionHandleRef} />
            <PanZoomCanvas
              ref={canvasHandle}
              onPointerDown={handlePointerDown}
              onClick={() => {
                handleNodeSelected(null);
                ref.current?.focus();
              }}
            >
              <Nodes onNodeClick={handleNodeClick} />
              <Edges onEdgeClick={handleEdgeClick} />
            </PanZoomCanvas>
          </div>
          {contextMenuPosition && (
            <Modal onClose={() => setContextMenuPosition(null)}>
              <div
                className="datagraph__context-menu-container"
                style={{ left: contextMenuPosition.x, top: contextMenuPosition.y }}
              >
                <NodeCreationMenu onClose={() => setContextMenuPosition(null)} />
              </div>
            </Modal>
          )}
          {isDeleteConfirmModalOpen && (
            <ConfirmationDialog
              title={`Delete ${nodesToDelete} node${nodesToDelete > 1 ? "s" : ""}?`}
              text={`Do you want to delete the selected node${nodesToDelete > 1 ? "s" : ""}? This action cannot be undone.`}
              confirmText={
                <>
                  <IconTrash size={15} /> Delete
                </>
              }
              declineText="Cancel"
              onConfirm={handleDeleteSelectedNodes}
              onDecline={() => setDeleteConfirmModalOpen(false)}
              onClose={() => setDeleteConfirmModalOpen(false)}
            />
          )}
        </div>
      </GhostEdgeProvider>
    </PanZoomCanvasProvider>
  );
}
