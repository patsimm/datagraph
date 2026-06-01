import { useSelection } from "./selection.context";
import { usePortConnections } from "./edges.context";
import type { PortInfo } from "./components/node/node-utils";
import {
  type SerializedNodeState,
  mapNodeStateToSerializedNodeState,
  useRestoreNodes,
} from "./use-graph-persistence";

import { useRef, useCallback } from "react";

const PASTE_OFFSET = 20;

type ClipboardEntry = SerializedNodeState & { originalNodeId: string };

type ClipboardData = {
  nodes: ClipboardEntry[];
  edges: { from: PortInfo; to: PortInfo }[];
};

export function useClipboard() {
  const { getSelectedNodeStates, selectNodes } = useSelection();
  const { edges } = usePortConnections();
  const restoreNodes = useRestoreNodes();
  const clipboardRef = useRef<ClipboardData | null>(null);
  const isPasting = useRef(false);

  const copy = useCallback(() => {
    const selectedStates = getSelectedNodeStates().filter((n) => n.kind !== "output");
    if (selectedStates.length === 0) return;

    const selectedIds = new Set(selectedStates.map((n) => n.nodeId));

    const nodes: ClipboardEntry[] = selectedStates.map((n) => ({
      ...mapNodeStateToSerializedNodeState(n),
      originalNodeId: n.nodeId,
    }));

    const internalEdges = edges.filter(
      (e) => selectedIds.has(e.from.nodeId) && selectedIds.has(e.to.nodeId)
    );

    clipboardRef.current = { nodes, edges: internalEdges };
  }, [getSelectedNodeStates, edges]);

  const paste = useCallback(async () => {
    if (!clipboardRef.current || isPasting.current) return;
    const { nodes: clipNodes, edges: clipEdges } = clipboardRef.current;
    if (clipNodes.length === 0) return;

    isPasting.current = true;
    try {
      const nodesWithOffset = Object.fromEntries(
        clipNodes.map((n) => [
          n.originalNodeId,
          { ...n, canvasX: n.canvasX + PASTE_OFFSET, canvasY: n.canvasY + PASTE_OFFSET },
        ])
      );
      const idMap = await restoreNodes(nodesWithOffset, clipEdges);
      selectNodes([...idMap.values()].map((info) => info.nodeId));
    } finally {
      isPasting.current = false;
    }
  }, [restoreNodes, selectNodes]);

  return { copy, paste };
}
