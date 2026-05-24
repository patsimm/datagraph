import processorUrl from "./audio-worklet/datagraph-audio-worklet-processor.ts?worker&url";
import { DatagraphAudioWorkletNode } from "./audio-worklet/datagraph-audio-worklet-node";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

export type DatagraphContext = {
  ready: boolean;
  initialize: () => Promise<{ workletNode: DatagraphAudioWorkletNode; outputNodeId: string }>;
  getNode: () => DatagraphAudioWorkletNode;
};

const datagraphContext = createContext<DatagraphContext>({
  ready: false,
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
  const { outputNodeId } = await workletNode.initialize();
  return { workletNode, outputNodeId };
}

export function DatagraphProvider({ children }: { children: React.ReactNode }) {
  const [node, setNode] = useState<DatagraphAudioWorkletNode | null>(null);

  const initialize = useCallback(async () => {
    const { workletNode, outputNodeId } = await initializeDatagraphAudioWorkletNode();
    setNode(workletNode);
    return { workletNode, outputNodeId };
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

  return useMemo(() => {
    return ready
      ? {
          ready: true as const,
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
  }, [getNode, initialize, ready]);
};
