import { useNodes, AnyNodeState } from "../../nodes.context";
import { useSelection } from "../../selection.context";
import "./ContextView.css";
import { NodeSettings } from "../node/NodeSettings";

import { useCallback } from "react";

export function ContextView() {
  const { getSelectedNode } = useSelection();
  const { getNode, updateNodeState } = useNodes();

  const node = getSelectedNode();

  const rustNodeType = node?.rustNodeType;
  const classname = rustNodeType?.split("::").slice(-1)[0];
  const classpath = rustNodeType?.split("::").slice(0, -1).join("::") + "::" || "";

  const selectedNodeId = node?.nodeId || null;

  const handleNodeSettingChange = useCallback(
    (nodeId: string, settingsKey: string, value: unknown) => {
      const nodeToChange = getNode(nodeId);
      if (!nodeToChange) return;
      updateNodeState(
        nodeId,
        (curr) =>
          ({
            ...curr,
            settings: { ...curr.settings, [settingsKey]: value },
          }) as AnyNodeState
      );
    },
    [getNode, updateNodeState]
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
          <div>
            <div>
              <span className="contextview__datalabel">inputs:</span> [
              {node.inputPorts.map((port) => port.name).join(", ")}]
            </div>
            <div>
              <span className="contextview__datalabel">outputs:</span> [
              {node.outputPorts.map((port) => port.name).join(", ")}]
            </div>
          </div>
          <NodeSettings
            nodeId={selectedNodeId}
            onChange={(...args) => handleNodeSettingChange(selectedNodeId, ...args)}
          />
        </>
      )}
    </aside>
  );
}
