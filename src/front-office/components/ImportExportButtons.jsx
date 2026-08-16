import { btnSecondary } from "./ui";

export default function ImportExportButtons({ onImport, onExport, disabled }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        className={btnSecondary}
        disabled={disabled}
        onClick={onImport}
      >
        Import
      </button>
      <button
        type="button"
        className={btnSecondary}
        disabled={disabled}
        onClick={onExport}
      >
        Export
      </button>
    </div>
  );
}
