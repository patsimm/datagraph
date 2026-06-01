import {
  OUTPUT_SENTINEL,
  SerializedGraphState,
  SerializedNodeState,
  normalizePortInfo,
  retrieveGraphState,
} from "./utils";
import { PortInfo } from "../components/node/node-utils";
import { NodeInfo } from "../audio-worklet/datagraph-audio-worklet-commands";
import { usePortConnections } from "../edges.context";
import { useNodes } from "../nodes.context";
import { useRestoreNodes } from "./restore-nodes.hook";

import LZString from "lz-string";
import { useCallback, useRef, useEffect } from "react";

type CompactNode = {
  k: string;
  x: number;
  y: number;
  c?: unknown;
  s?: unknown;
  d: number[];
};

type CompactGraphState = {
  v: 1;
  n: CompactNode[];
  e: [number, number, number, number][];
};

function serializeToHash(state: SerializedGraphState): string {
  const indexMap = new Map(state.nodes.map((n, i) => [n.originalNodeId, i]));

  const compact: CompactGraphState = {
    v: 1,
    n: state.nodes.map((n) => ({
      k: n.kind,
      x: Math.round(n.canvasX),
      y: Math.round(n.canvasY),
      ...(n.config != null && { c: n.config }),
      ...(n.settings != null && { s: n.settings }),
      d: n.defaultInputValues,
    })),
    e: state.edges.flatMap((edge) => {
      const fi = indexMap.get(edge.from.nodeId);
      const ti = indexMap.get(edge.to.nodeId);
      if (fi === undefined || ti === undefined) return [];
      return [[fi, edge.from.port, ti, edge.to.port] as [number, number, number, number]];
    }),
  };

  return LZString.compressToEncodedURIComponent(JSON.stringify(compact));
}

function deserializeFromHash(hash: string): SerializedGraphState | null {
  const json = LZString.decompressFromEncodedURIComponent(hash);
  if (!json) return null;
  let compact: CompactGraphState;
  try {
    compact = JSON.parse(json);
  } catch {
    return null;
  }
  if (compact.v !== 1) return null;

  const idAtIndex = (i: number) => (compact.n[i]?.k === "output" ? OUTPUT_SENTINEL : String(i));

  return {
    version: 1,
    nodes: compact.n.map(
      (cn, i) =>
        ({
          originalNodeId: cn.k === "output" ? OUTPUT_SENTINEL : String(i),
          kind: cn.k,
          canvasX: cn.x,
          canvasY: cn.y,
          config: cn.c,
          settings: cn.s,
          defaultInputValues: cn.d,
        }) as SerializedNodeState
    ),
    edges: compact.e.map(([fi, fp, ti, tp]) => ({
      from: { nodeId: idAtIndex(fi), port: fp, portType: "out" as PortInfo["portType"] },
      to: { nodeId: idAtIndex(ti), port: tp, portType: "in" as PortInfo["portType"] },
    })),
  };
}
export function useLinkGeneration(outputNodeInfo: NodeInfo | null) {
  const { nodes, updateNodePosition } = useNodes();
  const { edges } = usePortConnections();
  const restoreNodes = useRestoreNodes();

  const shareGraph = useCallback(async () => {
    const normalizedEdges = edges.map((edge) => ({
      from: normalizePortInfo(edge.from, outputNodeInfo?.nodeId ?? null),
      to: normalizePortInfo(edge.to, outputNodeInfo?.nodeId ?? null),
    }));
    const normalizedNodes = outputNodeInfo
      ? Object.fromEntries(
          Object.entries(nodes).map(([id, state]) =>
            id === outputNodeInfo.nodeId ? [OUTPUT_SENTINEL, state] : [id, state]
          )
        )
      : nodes;
    const state = retrieveGraphState(normalizedNodes, normalizedEdges);
    const compressed = serializeToHash(state);
    window.location.hash = compressed;
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch {
      // non-secure context or permission denied — hash is still set
    }
  }, [edges, nodes, outputNodeInfo]);

  const hashLoadedRef = useRef(false);

  useEffect(() => {
    if (hashLoadedRef.current || !outputNodeInfo) return;
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    hashLoadedRef.current = true;

    const result = deserializeFromHash(hash);
    if (!result) return;

    const outputState = result.nodes.find((n) => n.originalNodeId === OUTPUT_SENTINEL);
    if (outputState) {
      updateNodePosition(outputNodeInfo.nodeId, {
        canvasX: outputState.canvasX,
        canvasY: outputState.canvasY,
      });
    }

    const preSeedMap = new Map<string, NodeInfo>();
    preSeedMap.set(OUTPUT_SENTINEL, outputNodeInfo);
    void restoreNodes(result, preSeedMap);
  }, [outputNodeInfo, updateNodePosition, restoreNodes]);

  return { shareGraph };
}
