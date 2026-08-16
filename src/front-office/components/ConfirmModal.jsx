import { Modal, btnSecondary } from "./ui";

export default function ConfirmModal({
  open,
  title = "Confirm",
  message,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  onConfirm,
  onClose,
  danger = true,
}) {
  return (
    <Modal open={open} title={title} onClose={onClose}>
      <p className="text-sm text-gray-600">{message}</p>
      <div className="mt-6 flex justify-end gap-2">
        <button type="button" className={btnSecondary} onClick={onClose}>
          {cancelLabel}
        </button>
        <button
          type="button"
          className={
            danger
              ? "rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              : "rounded-md bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800"
          }
          onClick={onConfirm}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
