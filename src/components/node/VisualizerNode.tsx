import { Node } from "./Node";
import type { AnyVisualizerNodeState, NodeInteractionProps } from "../../node.types";
import { OscilloscopeBody } from "./visualizers/OscilloscopeBody";
import { InspectBody } from "./visualizers/InspectBody";

export type VisualizerNodeProps = AnyVisualizerNodeState & NodeInteractionProps;

export function VisualizerNode({ nodeId, ...nodeProps }: VisualizerNodeProps) {
  const body = (() => {
    switch (nodeProps.kind) {
      case "visualizer:oscilloscope":
        return <OscilloscopeBody nodeId={nodeId} />;
      case "visualizer:inspect":
        return <InspectBody nodeId={nodeId} />;
    }
  })();

  return (
    <Node nodeId={nodeId} label={nodeProps.kind.split(":")[1]} {...nodeProps}>
      {body}
    </Node>
  );
}
