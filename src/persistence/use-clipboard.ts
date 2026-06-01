import { useSelection } from "../selection.context";
import { usePortConnections } from "../edges.context";
import { useRestoreNodes } from "./restore-nodes.hook";
import {
  SerializedGraphState,
  SerializedNodeState,
  mapNodeStateToSerializedNodeState,
} from "./utils";

import { useRef, useCallback } from "react";

const PASTE_OFFSET = 20;

export function useClipboard() {
  const { getSelectedNodeStates, selectNodes } = useSelection();
  const { edges } = usePortConnections();
  const restoreNodes = useRestoreNodes();
  const clipboardRef = useRef<SerializedGraphState | null>(null);
  const isPasting = useRef(false);

  const copy = useCallback(() => {
    const selectedStates = getSelectedNodeStates().filter((n) => n.kind !== "output");
    if (selectedStates.length === 0) return;

    const selectedIds = new Set(selectedStates.map((n) => n.nodeId));

    const nodes: SerializedNodeState[] = selectedStates.map((n) => ({
      ...mapNodeStateToSerializedNodeState(n),
      originalNodeId: n.nodeId,
    }));

    const internalEdges = edges.filter(
      (e) => selectedIds.has(e.from.nodeId) && selectedIds.has(e.to.nodeId)
    );

    clipboardRef.current = { version: 1, nodes, edges: internalEdges };
  }, [getSelectedNodeStates, edges]);

  const paste = useCallback(async () => {
    if (!clipboardRef.current || isPasting.current) return;
    const { version, nodes: clipNodes, edges: clipEdges } = clipboardRef.current;
    if (clipNodes.length === 0) return;

    isPasting.current = true;
    try {
      const nodesWithOffset = clipNodes.map((n) => ({
        ...n,
        canvasX: n.canvasX + PASTE_OFFSET,
        canvasY: n.canvasY + PASTE_OFFSET,
      }));
      const idMap = await restoreNodes({ version, nodes: nodesWithOffset, edges: clipEdges });
      selectNodes([...idMap.values()].map((info) => info.nodeId));
    } finally {
      isPasting.current = false;
    }
  }, [restoreNodes, selectNodes]);

  return { copy, paste };
}
