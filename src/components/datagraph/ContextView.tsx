import { useNodes } from "../../nodes.context";
import { useSelection } from "../../selection.context";
import { isParamNodeState, NodeKind, NodeState, ParamKind } from "../../node.types";
import "./ContextView.css";
import { NodeSettings } from "../node/NodeSettings";
import { NodeInputPortsSettings, NodeOutputPortsSettings } from "./NodePortsSettings";

import { useCallback } from "react";

export function ContextView() {
  const { getSelectedNodeStates } = useSelection();
  const { getNode, updateNodeSettings, setDefaultInputValue, resetDefaultInputValue } = useNodes();

  const nodes = getSelectedNodeStates();
  const node = nodes.length === 1 ? nodes[0] : null;

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
      {!node && nodes.length > 1 && (
        <>
          <div className="contextview__header">
            <h1 className="contextview__title">{nodes.length} selected</h1>
          </div>
        </>
      )}
      {node && selectedNodeId && (
        <>
          <h1 className="contextview__title">{node.name}</h1>
          {isParamNodeState(node) && (
            <>
              <div className="contextview__divider" />
              <div className="contextview__section">
                <h2 className="contextview__section-title">Settings</h2>
                <NodeSettings
                  node={node}
                  onChange={(key, value) =>
                    handleNodeSettingChange<ParamKind>(selectedNodeId, key, value)
                  }
                />
              </div>
            </>
          )}

          <div className="contextview__divider" />
          <div className="contextview__section">
            <h2 className="contextview__section-title">Input Ports</h2>
            <NodeInputPortsSettings
              onDefaultValueChange={(port, value) => setDefaultInputValue(node.nodeId, port, value)}
              onDefaultValueReset={(port) => resetDefaultInputValue(node.nodeId, port)}
              node={node}
            />
          </div>
          <div className="contextview__divider" />
          <div className="contextview__section">
            <h2 className="contextview__section-title">Output Ports</h2>
            <NodeOutputPortsSettings node={node} />
          </div>
        </>
      )}
    </aside>
  );
}
