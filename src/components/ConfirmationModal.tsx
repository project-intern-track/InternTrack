import { AlertCircle, Loader2, Trash } from 'lucide-react';
import ModalPortal from './ModalPortal';

type ConfirmationVariant = 'warning' | 'danger';

interface ConfirmationModalProps {
  open: boolean;
  title: string;
  message: string;
  note?: string;
  confirmLabel: string;
  cancelLabel?: string;
  variant?: ConfirmationVariant;
  isLoading?: boolean;
  loadingLabel?: string;
  disabled?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

const ConfirmationModal = ({
  open,
  title,
  message,
  note,
  confirmLabel,
  cancelLabel = 'Cancel',
  variant = 'warning',
  isLoading = false,
  loadingLabel,
  disabled = false,
  onCancel,
  onConfirm,
}: ConfirmationModalProps) => {
  if (!open) return null;

  const confirmDisabled = disabled || isLoading;
  const Icon = variant === 'danger' ? Trash : AlertCircle;
  const iconSize = variant === 'danger' ? 20 : 22;

  return (
    <ModalPortal>
      <div
        className="confirmation-modal-overlay"
        onClick={() => {
          if (!isLoading) onCancel();
        }}
      >
        <div
          className="confirmation-modal"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="confirmation-modal-header">
            <div className={`confirmation-modal-icon ${variant === 'danger' ? 'danger' : 'warning'}`} aria-hidden="true">
              <Icon size={iconSize} />
            </div>
            <div className="confirmation-modal-copy">
              <h2 className="confirmation-modal-title">{title}</h2>
              <p className="confirmation-modal-message">{message}</p>
              {note ? <p className="confirmation-modal-note">{note}</p> : null}
            </div>
          </div>

          <div className="confirmation-modal-actions">
            <button
              type="button"
              className="btn confirmation-modal-cancel"
              onClick={onCancel}
              disabled={isLoading}
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              className={`btn confirmation-modal-confirm ${variant === 'danger' ? 'danger' : 'warning'}`}
              onClick={onConfirm}
              disabled={confirmDisabled}
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : null}
              {isLoading ? (loadingLabel ?? confirmLabel) : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};

export default ConfirmationModal;
