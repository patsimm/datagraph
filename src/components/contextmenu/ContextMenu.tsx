import "./ContextMenu.css";

import { createPortal } from "react-dom";

export type ContextMenuProps = React.PropsWithChildren<{
  x: number;
  y: number;
  onClose?: (ev: React.MouseEvent) => void;
}>;

export function ContextMenu({ x, y, onClose, children }: ContextMenuProps) {
  return createPortal(
    <>
      <div className="backdrop" onClick={onClose}></div>
      <div className="contextmenu" style={{ left: x, top: y }}>
        {children}
      </div>
    </>,
    document.body
  );
}
