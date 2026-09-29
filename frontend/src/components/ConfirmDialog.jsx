import Modal from './Modal';

export default function ConfirmDialog({ title, children, confirmLabel, onConfirm, onClose, busy }) {
  return (
    <Modal
      title={title}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn btn--primary" onClick={onConfirm} disabled={busy}>
            {busy ? 'Saving…' : confirmLabel}
          </button>
        </>
      }
    >
      <div className="stack">{children}</div>
    </Modal>
  );
}
