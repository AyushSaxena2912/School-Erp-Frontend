export function StatusBadge({ status }) {
  const map = {
    New: "bg-blue-50 text-blue-700",
    Inquiry: "bg-blue-50 text-blue-700",
    "Admission Approved": "bg-emerald-50 text-emerald-700",
    "Form Sent": "bg-indigo-50 text-indigo-700",
    "Form Submitted": "bg-violet-50 text-violet-700",
    "Corrections Requested": "bg-amber-50 text-amber-800",
    "Corrections Submitted": "bg-emerald-50 text-emerald-800",
    Verified: "bg-teal-50 text-teal-800",
    "Accounts Created": "bg-green-100 text-green-800",
    "Follow-up Pending": "bg-amber-50 text-amber-700",
    Interested: "bg-emerald-50 text-emerald-700",
    Admitted: "bg-green-100 text-green-800",
    Lost: "bg-red-50 text-red-700",
    In: "bg-emerald-50 text-emerald-700",
    Out: "bg-gray-100 text-gray-600",
    "In Progress": "bg-amber-50 text-amber-700",
    Resolved: "bg-green-100 text-green-800",
    Closed: "bg-gray-100 text-gray-600",
    Overdue: "bg-red-100 text-red-700",
    Today: "bg-amber-100 text-amber-800",
    Upcoming: "bg-blue-50 text-blue-700",
    "Not Called Yet": "bg-blue-50 text-blue-700",
    "Call Not Picked": "bg-violet-50 text-violet-700",
    "Needs Another Follow-up": "bg-amber-50 text-amber-700",
    "Not Interested": "bg-red-50 text-red-700",
    "Hot Lead": "bg-red-50 text-red-700",
    "Warm Lead": "bg-orange-50 text-orange-700",
    "Cold Lead": "bg-sky-50 text-sky-700",
    Offline: "bg-gray-100 text-gray-700",
    "Offline · Student": "bg-gray-100 text-gray-800",
    "Offline · Parent": "bg-stone-100 text-stone-800",
    "Offline · Parent / Guardian": "bg-stone-100 text-stone-800",
    "Offline · Guardian": "bg-stone-100 text-stone-800",
    Online: "bg-indigo-50 text-indigo-700",
    "Online · Student": "bg-sky-50 text-sky-800",
    "Online · Parent": "bg-violet-50 text-violet-800",
    "Online · Parent / Guardian": "bg-violet-50 text-violet-800",
    Active: "bg-emerald-50 text-emerald-700",
    Inactive: "bg-gray-100 text-gray-600",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
        map[status] || "bg-gray-100 text-gray-700"
      }`}
    >
      {status}
    </span>
  );
}

export function Modal({ open, title, onClose, children, wide }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        className={`relative max-h-[90vh] w-full overflow-y-auto rounded-lg bg-white p-6 shadow-lg ${
          wide ? "max-w-3xl" : "max-w-lg"
        }`}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function SlideOver({ open, title, onClose, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative flex h-full w-full max-w-lg flex-col overflow-y-auto bg-white shadow-xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-5 py-4">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 p-5">{children}</div>
      </div>
    </div>
  );
}

export function Field({ label, required, error, hint, children, className }) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-sm font-medium text-gray-800">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </label>
      {hint ? <p className="mb-1.5 text-xs text-gray-500">{hint}</p> : null}
      {children}
      {error ? <p className="mt-1 text-sm text-red-500">{error}</p> : null}
    </div>
  );
}

export const inputClass =
  "w-full rounded-md border border-gray-300 p-2 outline-none focus:border-green-700";

/** Native select with a clear chevron (see `.fo-select` in index.css). */
export const selectClass = `${inputClass} fo-select`;

export const btnPrimary =
  "rounded-md bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800 disabled:opacity-60";

export const btnSecondary =
  "rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50";

export function EmptyState({ message }) {
  return (
    <div className="rounded-lg border border-dashed border-gray-300 bg-white px-4 py-10 text-center text-sm text-gray-500">
      {message}
    </div>
  );
}
