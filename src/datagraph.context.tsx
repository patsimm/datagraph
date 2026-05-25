import processorUrl from "./audio-worklet/datagraph-audio-worklet-processor.ts?worker&url";
import { DatagraphAudioWorkletNode } from "./audio-worklet/datagraph-audio-worklet-node";
import { NodeInfo } from "./audio-worklet/datagraph-audio-worklet-commands";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

export type DatagraphContext = {
  ready: boolean;
  nodeTypes: string[];
  audioContextState: AudioContextState | null;
  initialize: () => Promise<{
    workletNode: DatagraphAudioWorkletNode;
    outputNode: NodeInfo;
    nodeTypes: string[];
  }>;
  getNode: () => DatagraphAudioWorkletNode;
  getAudioContext: () => AudioContext;
};

const datagraphContext = createContext<DatagraphContext>({
  ready: false,
  nodeTypes: [],
  audioContextState: null,
  initialize: () => {
    throw new Error("Datagraph node not initialized yet");
  },
  getNode: (): DatagraphAudioWorkletNode => {
    throw new Error("Datagraph node not initialized yet");
  },
  getAudioContext: (): AudioContext => {
    throw new Error("Datagraph node not initialized yet");
  },
});

async function initializeDatagraphAudioWorkletNode() {
  const audioContext = new AudioContext();
  await audioContext.audioWorklet.addModule(processorUrl);
  const workletNode = new DatagraphAudioWorkletNode(audioContext, "datagraph-processor");
  workletNode.connect(audioContext.destination);
  const { outputNode, nodeTypes } = await workletNode.initialize();
  return { workletNode, outputNode, nodeTypes };
}

export function DatagraphProvider({ children }: { children: React.ReactNode }) {
  const [node, setNode] = useState<DatagraphAudioWorkletNode | null>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [audioContextState, setAudioContextState] = useState<AudioContextState | null>(null);
  const [nodeTypes, setNodeTypes] = useState<string[]>([]);

  const initialize = useCallback(async () => {
    const { workletNode, outputNode, nodeTypes } = await initializeDatagraphAudioWorkletNode();
    const ctx = workletNode.context as AudioContext;
    ctx.addEventListener("statechange", () => setAudioContextState(ctx.state));
    setNode(workletNode);
    setAudioContext(ctx);
    setAudioContextState(ctx.state);
    setNodeTypes(nodeTypes);
    return { workletNode, outputNode, nodeTypes };
  }, []);

  const getNode = useCallback(() => {
    if (!node) {
      throw new Error("Datagraph node not initialized yet");
    }
    return node;
  }, [node]);

  const getAudioContext = useCallback(() => {
    if (!audioContext) {
      throw new Error("Datagraph node not initialized yet");
    }
    return audioContext;
  }, [audioContext]);

  return (
    <datagraphContext.Provider
      value={{ getNode, getAudioContext, initialize, ready: !!node, nodeTypes, audioContextState }}
    >
      {children}
    </datagraphContext.Provider>
  );
}

export const useDatagraph = () => {
  const { getNode, getAudioContext, ready, initialize, nodeTypes, audioContextState } =
    useContext(datagraphContext);

  return useMemo(() => {
    return ready
      ? {
          ready: true as const,
          nodeTypes,
          audioContextState,
          suspend: () => getAudioContext().suspend(),
          resume: () => getAudioContext().resume(),
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
  }, [getNode, getAudioContext, initialize, nodeTypes, audioContextState, ready]);
};
