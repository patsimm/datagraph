import { AnyAudioNodeState, NodeInteractionProps } from "../../../node.types";
import { useLatestPortValues } from "../latest-port-value.context";
import { Node } from "../Node";
import { NodePort, NodePortProps } from "../NodePort";
import { PortInfo } from "../node-utils";

import { useCallback, useMemo, useState } from "react";
import "./ActivatableInputPortNode.css";
import classNames from "classnames";
import { PortType } from "@patsimm/datagraph-core";

export type SequencerNodeProps = AnyAudioNodeState &
  NodeInteractionProps & { label: React.ReactNode };

function ActivatableNodePort({
  i,
  indexPort,
  ...props
}: NodePortProps & { i: number; indexPort: PortInfo[] }) {
  const [isActive, setIsActive] = useState(false);
  useLatestPortValues(indexPort, (values) => setIsActive(values[0] === i - 1));

  return (
    <NodePort
      {...props}
      className={classNames(props.className, {
        "node__port--active": isActive,
      })}
    />
  );
}

export function ActivatableInputPortNode({
  nodeId,
  outputPorts,
  ...nodeProps
}: SequencerNodeProps) {
  const outputPort = useMemo(() => [outputPorts[0]], [outputPorts]);

  const renderPort = useCallback(
    (props: NodePortProps, portType: PortType, i: number) => {
      return portType === "in" ? (
        <ActivatableNodePort i={i} indexPort={[{ nodeId, port: 1, portType: "out" }]} {...props} />
      ) : (
        <NodePort {...props} />
      );
    },
    [nodeId]
  );

  return (
    <Node
      className="node--activatable-input-port"
      nodeId={nodeId}
      outputPorts={outputPort}
      renderPort={renderPort}
      {...nodeProps}
    ></Node>
  );
}
