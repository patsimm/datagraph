import { NodeInfo } from "../../audio-worklet/datagraph-audio-worklet-commands";
import { useGraphPersistence } from "../../use-graph-persistence";
import "./Toolbar.css";

import { IconDeviceFloppy, IconFileUpload } from "@tabler/icons-react";

export type ToolbarProps = {
  outputNode: NodeInfo;
};

export function Toolbar({ outputNode }: ToolbarProps) {
  const { saveGraph, loadGraph } = useGraphPersistence(outputNode);

  return (
    <div className="toolbar">
      <button className="toolbar__button" onClick={saveGraph}>
        <IconDeviceFloppy className="toolbar__button-icon" />
      </button>
      <button className="toolbar__button" onClick={loadGraph}>
        <IconFileUpload className="toolbar__button-icon" />
      </button>
    </div>
  );
}
