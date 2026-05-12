import processorUrl from "./datagraph-processor?url";
import { NodeSpec } from "./datagraph-commands";

import { createContext, useCallback, useContext, useState } from "react";
import wasmUrl from "@datagraph/core/datagraph_bg.wasm?url";

export type DatagraphContext = {
  ready: boolean;
  initialize: () => Promise<void>;
  getNode: () => AudioWorkletNode;
};

const datagraphContext = createContext<DatagraphContext>({
  ready: false,
  initialize: () => {
    throw new Error("Datagraph node not initialized yet");
  },
  getNode: (): AudioWorkletNode => {
    throw new Error("Datagraph node not initialized yet");
  },
});

export function DatagraphProvider({ children }: { children: React.ReactNode }) {
  const [node, setNode] = useState<AudioWorkletNode | null>(null);

  const initialize = useCallback(async () => {
    const audioContext = new AudioContext();
    await audioContext.audioWorklet.addModule(processorUrl);
    const workletNode = new AudioWorkletNode(audioContext, "datagraph-processor");
    workletNode.connect(audioContext.destination);

    workletNode.port.onmessage = (e) => {
      if (e.data?.type !== "ready") return;

      setNode(workletNode);
    };

    const wasmBytes = await fetch(wasmUrl).then((r) => r.arrayBuffer());
    workletNode.port.postMessage(wasmBytes, [wasmBytes]);
  }, []);

  const getNode = useCallback(() => {
    if (!node) {
      throw new Error("Datagraph node not initialized yet");
    }

    return node;
  }, [node]);

  return (
    <datagraphContext.Provider value={{ getNode, initialize, ready: !!node }}>
      {children}
    </datagraphContext.Provider>
  );
}

export const useDatagraph = () => {
  const { getNode, ready, initialize } = useContext(datagraphContext);

  const addParam = (key: string, value: number) => {
    getNode().port.postMessage({ type: "add_param", key, value });
  };

  const addNode = (key: string, nodeSpec: NodeSpec, output: boolean = false) => {
    getNode().port.postMessage({ type: "add_node", key, node: nodeSpec });
    if (output) {
      getNode().port.postMessage({ type: "set_output", key });
    }
  };

  const setParam = (key: string, value: number) => {
    getNode().port.postMessage({ type: "set_param", key, value });
  };

  const addConnection = (from: string, fromPort: number, to: string, toPort: number) => {
    getNode().port.postMessage({ type: "connect", from, fromPort, to, toPort });
  };

  return {
    ready,
    addParam,
    setParam,
    addNode,
    addConnection,
    start: initialize,
  };
};
