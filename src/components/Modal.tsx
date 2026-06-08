import "./Modal.css";

import { createPortal } from "react-dom";

export type ModalProps = {
  onClose?: () => void;
};

export function Modal({ children, onClose }: React.PropsWithChildren<ModalProps>) {
  return createPortal(
    <div className="modal">
      <div
        className="modal__backdrop"
        onClick={onClose}
        onContextMenu={(ev) => {
          ev.preventDefault();
          onClose?.();
        }}
      />
      <div className="modal__content-wrapper">
        <div className="modal__content">{children}</div>
      </div>
    </div>,
    document.body
  );
}
