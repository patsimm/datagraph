import { Modal } from "./Modal";
import "./ConfirmationDialog.css";
import { Button } from "./Button";

export type ConfirmationDialogProps = {
  title: string;
  text: string;
  confirmText?: React.ReactNode;
  declineText?: React.ReactNode;
  onConfirm?: () => void;
  onDecline?: () => void;
  onClose?: () => void;
};

export function ConfirmationDialog({
  title,
  text,
  declineText,
  confirmText,
  onDecline,
  onConfirm,
  onClose,
}: ConfirmationDialogProps) {
  return (
    <Modal onClose={onClose}>
      <div className="confirmation-dialog">
        <h1 className="confirmation-dialog__title">{title}</h1>
        <div className="confirmation-dialog__text">{text}</div>
        <div className="confirmation-dialog__buttons">
          <Button onClick={onDecline}>{declineText}</Button>
          <Button onClick={onConfirm} color="red">
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
