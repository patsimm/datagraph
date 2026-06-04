import { AnyAudioNodeState, NodeInteractionProps } from "../../../node.types";
import { useLatestPortValues } from "../latest-port-value.context";
import { Node } from "../Node";
import { NodePort, NodePortProps } from "../NodePort";
import { PortInfo } from "../node-utils";

import { useCallback, useMemo, useState } from "react";
import "./SequencerNode.css";
import classNames from "classnames";
import { PortType } from "@patsimm/datagraph-core";

export type SequencerNodeProps = AnyAudioNodeState & NodeInteractionProps;

function SequencerNodePort({
  i,
  indexPort,
  ...props
}: NodePortProps & { i: number; indexPort: PortInfo[] }) {
  const [isActive, setIsActive] = useState(false);
  useLatestPortValues(indexPort, (values) => setIsActive(values[0] === i - 1));

  return (
    <NodePort
      {...props}
      className={classNames("sequencer-node__port", props.className, {
        "sequencer-node__port--active": isActive,
      })}
    />
  );
}

export function SequencerNode({ nodeId, outputPorts, ...nodeProps }: SequencerNodeProps) {
  const outputPort = useMemo(() => [outputPorts[1]], [outputPorts]);

  const renderPort = useCallback(
    (props: NodePortProps, portType: PortType, i: number) => {
      return portType === "in" ? (
        <SequencerNodePort i={i} indexPort={[{ nodeId, port: 1, portType: "out" }]} {...props} />
      ) : (
        <NodePort {...props} />
      );
    },
    [nodeId]
  );

  return (
    <Node
      className="sequencer-node"
      nodeId={nodeId}
      label="Sequencer"
      outputPorts={outputPort}
      renderPort={renderPort}
      {...nodeProps}
    ></Node>
  );
}
