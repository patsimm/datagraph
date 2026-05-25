import processorUrl from "./audio-worklet/datagraph-audio-worklet-processor.ts?worker&url";
import { DatagraphAudioWorkletNode } from "./audio-worklet/datagraph-audio-worklet-node";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

export type DatagraphContext = {
  ready: boolean;
  nodeTypes: string[];
  initialize: () => Promise<{ workletNode: DatagraphAudioWorkletNode; outputNodeId: string; nodeTypes: string[] }>;
  getNode: () => DatagraphAudioWorkletNode;
};

const datagraphContext = createContext<DatagraphContext>({
  ready: false,
  nodeTypes: [],
  initialize: () => {
    throw new Error("Datagraph node not initialized yet");
  },
  getNode: (): DatagraphAudioWorkletNode => {
    throw new Error("Datagraph node not initialized yet");
  },
});

async function initializeDatagraphAudioWorkletNode() {
  const audioContext = new AudioContext();
  await audioContext.audioWorklet.addModule(processorUrl);
  const workletNode = new DatagraphAudioWorkletNode(audioContext, "datagraph-processor");
  workletNode.connect(audioContext.destination);
  const { outputNodeId, nodeTypes } = await workletNode.initialize();
  return { workletNode, outputNodeId, nodeTypes };
}

export function DatagraphProvider({ children }: { children: React.ReactNode }) {
  const [node, setNode] = useState<DatagraphAudioWorkletNode | null>(null);
  const [nodeTypes, setNodeTypes] = useState<string[]>([]);

  const initialize = useCallback(async () => {
    const { workletNode, outputNodeId, nodeTypes } = await initializeDatagraphAudioWorkletNode();
    setNode(workletNode);
    setNodeTypes(nodeTypes);
    return { workletNode, outputNodeId, nodeTypes };
  }, []);

  const getNode = useCallback(() => {
    if (!node) {
      throw new Error("Datagraph node not initialized yet");
    }

    return node;
  }, [node]);

  return (
    <datagraphContext.Provider value={{ getNode, initialize, ready: !!node, nodeTypes }}>
      {children}
    </datagraphContext.Provider>
  );
}

export const useDatagraph = () => {
  const { getNode, ready, initialize, nodeTypes } = useContext(datagraphContext);

  return useMemo(() => {
    return ready
      ? {
          ready: true as const,
          nodeTypes,
          addParam: getNode().addParam.bind(getNode()),
          setParam: getNode().setParam.bind(getNode()),
          addNode: getNode().addNode.bind(getNode()),
          removeNode: getNode().removeNode.bind(getNode()),
          addConnection: getNode().addConnection.bind(getNode()),
          removeConnection: getNode().removeConnection.bind(getNode()),
          subscribeNodeData: getNode().addNodeDataSubscription.bind(getNode()),
          unsubscribeNodeData: getNode().removeNodeDataSubscription.bind(getNode()),
          subscribeLatestValue: getNode().addLatestValueSubscription.bind(getNode()),
          unsubscribeLatestValue: getNode().removeLatestValueSubscription.bind(getNode()),
          readLatestValue: getNode().readLatestValue.bind(getNode()),
          nodeInfo: getNode().nodeInfo.bind(getNode()),
          setDefaultInputValue: getNode().setDefaultInputValue.bind(getNode()),
          resetDefaultInputValue: getNode().resetDefaultInputValue.bind(getNode()),
        }
      : { ready: false as const, start: initialize };
  }, [getNode, initialize, nodeTypes, ready]);
};
