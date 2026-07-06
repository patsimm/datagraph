import { AnyAudioNodeState, NodeInputPortState, NodeInteractionProps } from "../../../node.types";
import { useNodes } from "../../../nodes.context";
import { Slider } from "../../Slider";
import { useLatestPortValues } from "../latest-port-value.context";
import { Node } from "../Node";

import { useCallback, useState } from "react";

export type CrossfadeNodeProps = AnyAudioNodeState &
  NodeInteractionProps & { label: React.ReactNode };

function MixSlider({
  nodeId,
  port,
  connected,
}: {
  nodeId: string;
  port: number;
  connected: boolean;
}) {
  const { setDefaultInputValue } = useNodes();
  const [liveValue, setLiveValue] = useState(0);

  useLatestPortValues([{ nodeId, port, portType: "in" }], (values) => {
    setLiveValue(values[0] ?? 0);
  });

  const handleChange = useCallback(
    (value: number) => {
      if (connected) return;
      setDefaultInputValue(nodeId, port, value);
    },
    [connected, nodeId, port, setDefaultInputValue]
  );

  return (
    <Slider
      horizontal
      min={-1}
      max={1}
      step={0.01}
      value={liveValue}
      onChange={handleChange}
      onPointerDown={(e) => {
        e.stopPropagation();
      }}
      onPointerUp={(e) => {
        e.stopPropagation();
      }}
    />
  );
}

export function CrossfadeNode({ nodeId, inputPorts, ...nodeProps }: CrossfadeNodeProps) {
  const namedMixIndex = inputPorts.findIndex((p) => p.name === "mix");
  const mixIndex = namedMixIndex === -1 ? inputPorts.length - 1 : namedMixIndex;
  const mixPort = inputPorts[mixIndex] as NodeInputPortState | undefined;

  return (
    <Node nodeId={nodeId} inputPorts={inputPorts} {...nodeProps}>
      {mixPort && (
        <MixSlider nodeId={nodeId} port={mixIndex} connected={mixPort.connectedTo.length > 0} />
      )}
    </Node>
  );
}
