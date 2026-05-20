import "./ContextMenu.css";

import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export type ContextMenuProps = React.PropsWithChildren<{
  x: number;
  y: number;
  onClose?: (ev: React.MouseEvent) => void;
}>;

export function ContextMenu({ x, y, onClose, children }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [positionStyle, setPositionStyle] = useState({ left: x, top: y });

  useLayoutEffect(() => {
    if (!menuRef.current) return;

    const domRect = menuRef.current.getBoundingClientRect();
    if (domRect.right > window.innerWidth) {
      setPositionStyle((prev) => ({ ...prev, left: window.innerWidth - domRect.width }));
    }
    if (domRect.bottom > window.innerHeight) {
      setPositionStyle((prev) => ({ ...prev, top: window.innerHeight - domRect.height }));
    }
    if (domRect.left < 0) {
      setPositionStyle((prev) => ({ ...prev, left: 0 }));
    }
    if (domRect.top < 0) {
      setPositionStyle((prev) => ({ ...prev, top: 0 }));
    }
  }, []);

  return createPortal(
    <>
      <div className="backdrop" onClick={onClose}></div>
      <div className="contextmenu" style={positionStyle} ref={menuRef}>
        {children}
      </div>
    </>,
    document.body
  );
}
