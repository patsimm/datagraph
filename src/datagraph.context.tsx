import processorUrl from "./audio-worklet/datagraph-audio-worklet-processor.ts?worker&url";
import { AudioGraphWrapper } from "./audio-worklet/datagraph-audio-worklet-node";
import {
  GraphEventHandler,
  GraphEventType,
  NodeInfo,
} from "./audio-worklet/datagraph-audio-worklet-commands";
import { PortInfo } from "./components/node/node-utils";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import init, { startAudio } from "@patsimm/datagraph-core";
import wasmUrl from "@patsimm/datagraph-core/pkg/datagraph_bg.wasm?url";

export type DatagraphContext = {
  ready: boolean;
  nodeTypes: string[];
  audioContextState: AudioContextState | null;
  initialize: () => Promise<{
    workletNode: AudioGraphWrapper;
    outputNode: NodeInfo;
    nodeTypes: string[];
  }>;
  getNode: () => AudioGraphWrapper;
  getAudioContext: () => AudioContext;
};

const datagraphContext = createContext<DatagraphContext>({
  ready: false,
  nodeTypes: [],
  audioContextState: null,
  initialize: () => {
    throw new Error("Datagraph node not initialized yet");
  },
  getNode: (): AudioGraphWrapper => {
    throw new Error("Datagraph node not initialized yet");
  },
  getAudioContext: (): AudioContext => {
    throw new Error("Datagraph node not initialized yet");
  },
});

async function initializeDatagraphAudioWorkletNode() {
  const wasmBytes = await (await fetch(wasmUrl)).arrayBuffer();
  await init(wasmBytes);
  const audioContext = new AudioContext();
  audioContext.suspend(); // Start suspended until the user explicitly starts it, to comply with browser autoplay policies
  await audioContext.audioWorklet.addModule(processorUrl);
  const audioGraph = await startAudio(audioContext);
  const outputNodeInfo = audioGraph.outputNode();
  const outputNode: NodeInfo = {
    nodeId: outputNodeInfo.nodeId,
    nodeType: outputNodeInfo.nodeType,
    inputNames: outputNodeInfo.inputNames as string[],
    outputNames: outputNodeInfo.outputNames as string[],
    defaultInputValues: [...outputNodeInfo.defaultInputValues] as number[],
  };
  // audioGraph.workletNode.connect(audioContext.destination);
  return {
    audioGraph: new AudioGraphWrapper(audioGraph),
    outputNode,
    nodeTypes: audioGraph.nodeTypes(),
    context: audioContext,
  };
}

export function DatagraphProvider({ children }: { children: React.ReactNode }) {
  const [node, setNode] = useState<AudioGraphWrapper | null>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [audioContextState, setAudioContextState] = useState<AudioContextState | null>(null);
  const [nodeTypes, setNodeTypes] = useState<string[]>([]);
  const initializeRef = useRef<ReturnType<DatagraphContext["initialize"]> | null>(null);

  const initialize = useCallback(async () => {
    if (initializeRef.current) return await initializeRef.current;
    initializeRef.current = (async () => {
      const {
        audioGraph: workletNode,
        outputNode,
        nodeTypes,
        context,
      } = await initializeDatagraphAudioWorkletNode();
      context.addEventListener("statechange", () => setAudioContextState(context.state));
      setNode(workletNode);
      setAudioContext(context);
      setAudioContextState(context.state);
      setNodeTypes(nodeTypes);
      return { workletNode, outputNode, nodeTypes };
    })();
    return await initializeRef.current;
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
          addParam: (value: number) => getNode().addParam(value),
          setParam: (nodeId: string, value: number) => getNode().setParam(nodeId, value),
          addNode: (spec: Parameters<AudioGraphWrapper["addNode"]>[0]) => getNode().addNode(spec),
          removeNode: (nodeId: string) => getNode().removeNode(nodeId),
          addConnection: (from: string, fromPort: number, to: string, toPort: number) =>
            getNode().addConnection(from, fromPort, to, toPort),
          removeConnection: (from: string, fromPort: number, to: string, toPort: number) =>
            getNode().removeConnection(from, fromPort, to, toPort),
          on: <T extends GraphEventType>(type: T, handler: GraphEventHandler<T>) =>
            getNode().on(type, handler),
          off: <T extends GraphEventType>(type: T, handler: GraphEventHandler<T>) =>
            getNode().off(type, handler),
          subscribePortData: (port: PortInfo) => getNode().addPortDataSubscription(port),
          unsubscribePortData: (port: PortInfo) => getNode().removePortDataSubscription(port),
          readPortData: (port: PortInfo) => getNode().readPortData(port),
          subscribeLatestValue: (port: PortInfo) => getNode().addLatestValueSubscription(port),
          unsubscribeLatestValue: (port: PortInfo) => getNode().removeLatestValueSubscription(port),
          readLatestValue: (port: PortInfo) => getNode().readLatestValue(port),
          setDefaultInputValue: (nodeId: string, port: number, value: number) =>
            getNode().setDefaultInputValue(nodeId, port, value),
          resetDefaultInputValue: (nodeId: string, port: number) =>
            getNode().resetDefaultInputValue(nodeId, port),
        }
      : { ready: false as const, start: initialize };
  }, [getNode, getAudioContext, initialize, nodeTypes, audioContextState, ready]);
};
