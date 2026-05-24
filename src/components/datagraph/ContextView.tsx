import { useNodes } from "../../nodes.context";
import { useSelection } from "../../selection.context";
import { isParamNodeState, NodeKind, NodeState, ParamKind } from "../../node.types";
import "./ContextView.css";
import { NodeSettings } from "../node/NodeSettings";
import { NodePortsSettings } from "./NodePortsSettings";

import { useCallback } from "react";

export function ContextView() {
  const { getSelectedNode } = useSelection();
  const { getNode, updateNodeSettings, setDefaultInputValue } = useNodes();

  const node = getSelectedNode();

  const rustNodeType = node?.rustNodeType;
  const classname = rustNodeType?.split("::").slice(-1)[0];
  const classpath = rustNodeType?.split("::").slice(0, -1).join("::") + "::" || "";

  const selectedNodeId = node?.nodeId || null;

  const handleNodeSettingChange = useCallback(
    <T extends NodeKind>(
      nodeId: string,
      settingsKey: keyof NodeState<T>["settings"],
      value: NodeState<T>["settings"][keyof NodeState<T>["settings"]]
    ) => {
      const nodeToChange = getNode(nodeId);
      if (!nodeToChange) throw new Error(`Node ${nodeId} not found`);
      if (!nodeToChange.settings)
        throw new Error(`Node ${nodeId} of kind ${nodeToChange.kind} has no settings`);
      updateNodeSettings(nodeToChange.kind, nodeId, (curr) => ({
        ...curr,
        [settingsKey]: value,
      }));
    },
    [getNode, updateNodeSettings]
  );

  return (
    <aside className="contextview">
      {node && selectedNodeId && (
        <>
          <div className="contextview__header">
            <h1 className="contextview__title">{node.kind}</h1>
            <span className="contextview__classpath">{classpath}</span>
            <span className="contextview__classname">{classname}</span>
            <div className="contextview__nodeid">#{selectedNodeId}</div>
          </div>
          <NodePortsSettings
            onDefaultValueChange={(port, value) => setDefaultInputValue(node.nodeId, port, value)}
            node={node}
          />
          {isParamNodeState(node) && (
            <NodeSettings
              node={node}
              onChange={(key, value) =>
                handleNodeSettingChange<ParamKind>(selectedNodeId, key, value)
              }
            />
          )}
        </>
      )}
    </aside>
  );
}
