import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';

export default function ConfirmDialog({
  open,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'danger',
  loading = false,
  onConfirm,
  onClose,
}) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={loading ? undefined : onClose}
      closeOnBackdrop={!loading}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={tone} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="row gap-12" style={{ alignItems: 'flex-start' }}>
        <div className={`stat-icon ${tone === 'danger' ? 'red' : 'amber'}`} style={{ position: 'static' }}>
          <AlertTriangle size={19} />
        </div>
        <p style={{ color: 'var(--ink-600)', lineHeight: 1.6 }}>{message}</p>
      </div>
    </Modal>
  );
}
