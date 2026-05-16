import { useNodes } from "../../nodes.context";
import { useSelection } from "../../selection.context";
import "./ContextView.css";

export function ContextView() {
  const { selectedNodeInfo, selectedNodeId } = useSelection();
  const { nodes, updateNodeState: updateNodeSettings } = useNodes();

  const classname = selectedNodeInfo?.nodeType.split("::").slice(-1)[0];
  const classpath = selectedNodeInfo?.nodeType.split("::").slice(0, -1).join("::") + "::" || "";

  const selectedParam = selectedNodeId ? nodes[selectedNodeId] : null;

  return (
    <div className="contextview">
      {selectedNodeInfo && selectedNodeId && (
        <>
          <div className="contextview__title">
            <span className="contextview__classpath">{classpath}</span>
            <span className="contextview__classname">{classname}</span>
            <div className="contextview__nodeid">#{selectedNodeId}</div>
          </div>
          <div>
            <div>
              <span className="contextview__datalabel">inputs:</span> [
              {selectedNodeInfo.inputNames.join(", ")}]
            </div>
            <div>
              <span className="contextview__datalabel">outputs:</span> [
              {selectedNodeInfo.outputNames.join(", ")}]
            </div>
          </div>
        </>
      )}
      {selectedParam && selectedParam.kind === "param:slider" && (
        <div>
          <div>
            <span className="contextview__datalabel">min:</span>{" "}
            <input
              type="number"
              value={selectedParam.min}
              onChange={(ev) => {
                updateNodeSettings(selectedNodeId!, {
                  ...selectedParam,
                  min: parseFloat(ev.target.value),
                });
              }}
            />
          </div>
          <div>
            <span className="contextview__datalabel">max:</span>
            <input
              type="number"
              value={selectedParam.max}
              onChange={(ev) => {
                updateNodeSettings(selectedNodeId!, {
                  ...selectedParam,
                  max: parseFloat(ev.target.value),
                });
              }}
            />
          </div>
          <div>
            <span className="contextview__datalabel">step:</span>
            <input
              type="number"
              value={selectedParam.step}
              onChange={(ev) => {
                updateNodeSettings(selectedNodeId!, {
                  ...selectedParam,
                  step: parseFloat(ev.target.value),
                });
              }}
            />
          </div>
          <div>
            <span className="contextview__datalabel">value:</span>
          </div>
        </div>
      )}
    </div>
  );
}
