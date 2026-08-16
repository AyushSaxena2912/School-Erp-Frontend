import { btnSecondary } from "./ui";

export default function BulkActionBar({ count, onClear, onDelete, label = "selected" }) {
  if (!count) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5">
      <p className="text-sm font-medium text-gray-800">
        {count} {label}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className={btnSecondary} onClick={onClear}>
          Clear
        </button>
        <button
          type="button"
          className="rounded-md border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
          onClick={onDelete}
        >
          Delete
        </button>
      </div>
    </div>
  );
}
