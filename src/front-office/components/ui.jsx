import React, { useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";

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
    "Closed Lead": "bg-gray-100 text-gray-700",
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
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${map[status] || "bg-gray-100 text-gray-700"
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
          wide ? "max-w-5xl" : "max-w-lg"
        }`}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
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
        className="absolute inset-0 bg-black/20 backdrop-blur-[1px]"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative flex h-full w-full max-w-lg flex-col overflow-y-auto bg-white shadow-xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-5 py-4">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 p-5">{children}</div>
      </div>
    </div>
  );
}

export function Field({ label, required, error, hint, children, className }) {
  return (
    <div className={`flex flex-col justify-end ${className || ""}`}>
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

/**
 * Searchable single-select. options: [{ value, label }]
 */
export function SearchSelect({
  value,
  onChange,
  options = [],
  placeholder = "Search…",
  emptyText = "No matches",
  allowClear = true,
}) {
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = options.find((o) => o.value === value) || null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className={`${inputClass} flex w-full items-center justify-between gap-2 text-left`}
        onClick={() => {
          setOpen((v) => !v);
          setQuery("");
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={selected ? "text-gray-900" : "text-gray-400"}>
          {selected ? selected.label : placeholder}
        </span>
        <svg
          className="h-4 w-4 shrink-0 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {open ? (
        <div className="absolute left-0 right-0 z-20 mt-1 overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg">
          <div className="border-b border-gray-100 p-2">
            <input
              className={inputClass}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type to search…"
              autoFocus
            />
          </div>
          <ul className="max-h-48 overflow-y-auto py-1" role="listbox">
            {allowClear && value ? (
              <li>
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm text-gray-500 hover:bg-gray-50"
                  onClick={() => {
                    onChange("");
                    setOpen(false);
                    setQuery("");
                  }}
                >
                  Clear selection
                </button>
              </li>
            ) : null}
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-gray-400">{emptyText}</li>
            ) : (
              filtered.map((o) => (
                <li key={o.value}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={o.value === value}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-[var(--ac-green-light,#e6f4ee)] ${o.value === value
                        ? "bg-[var(--ac-green-light,#e6f4ee)] font-medium text-[var(--ac-green,#1a7a4a)]"
                        : "text-gray-800"
                      }`}
                    onClick={() => {
                      onChange(o.value);
                      setOpen(false);
                      setQuery("");
                    }}
                  >
                    {o.label}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

export const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-green-700 focus:ring-1 focus:ring-green-700 disabled:bg-gray-50";

/** Native select with a clear chevron (see `.fo-select` in index.css). */
export const selectClass = `${inputClass} fo-select cursor-pointer`;

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

export function DateInput({ value, onChange, className = inputClass, required, placeholder = "DD/MM/YYYY", disabled }) {
  const hiddenRef = useRef(null);

  const formatDisplay = (iso) => {
    if (!iso) return "";
    const clean = String(iso).split(" ")[0].split("T")[0];
    const parts = clean.split("-");
    if (parts.length === 3 && parts[0].length === 4) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return iso;
  };

  const [textVal, setTextVal] = useState(() => formatDisplay(value));

  useEffect(() => {
    const formatted = formatDisplay(value);
    if (formatted !== textVal && (value || textVal)) {
      const parts = textVal.split("/");
      if (parts.length === 3 && parts[2] && parts[2].length === 4) {
        const d = parts[0].padStart(2, "0");
        const m = parts[1].padStart(2, "0");
        const y = parts[2];
        if (`${y}-${m}-${d}` === value) return;
      }
      setTextVal(formatted);
    }
  }, [value]);

  const handleTextChange = (e) => {
    const raw = e.target.value;
    let input = raw.replace(/[^\d/]/g, "").slice(0, 10);

    if (input.length > textVal.length) {
      if (input.length === 2 && !input.includes("/")) {
        input = input + "/";
      } else if (input.length === 5 && input.split("/").length === 2) {
        input = input + "/";
      }
    }

    setTextVal(input);

    if (!input.trim()) {
      onChange("");
      return;
    }

    const parts = input.split("/");
    if (parts.length === 3) {
      const d = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      const y = parseInt(parts[2], 10);
      if (
        !isNaN(d) && !isNaN(m) && !isNaN(y) &&
        d >= 1 && d <= 31 &&
        m >= 1 && m <= 12 &&
        y >= 1900 && y <= 2099 &&
        parts[2].length === 4
      ) {
        const iso = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        onChange(iso);
      }
    }
  };

  const handleOpenPicker = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (hiddenRef.current) {
      if (typeof hiddenRef.current.showPicker === "function") {
        try {
          hiddenRef.current.showPicker();
        } catch {
          hiddenRef.current.click();
        }
      } else {
        hiddenRef.current.click();
      }
    }
  };

  return (
    <div className="relative w-full">
      <input
        type="text"
        inputMode="numeric"
        className={`${className} pr-10`}
        value={textVal}
        onChange={handleTextChange}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={10}
      />
      {!disabled && (
        <button
          type="button"
          onClick={handleOpenPicker}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-green-700 transition-colors p-1 cursor-pointer focus:outline-none"
          tabIndex={-1}
          title="Open Calendar"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </button>
      )}
      <input
        ref={hiddenRef}
        type="date"
        value={value || ""}
        onChange={(e) => {
          onChange(e.target.value);
          setTextVal(formatDisplay(e.target.value));
        }}
        className="sr-only absolute pointer-events-none"
        required={required}
        tabIndex={-1}
      />
    </div>
  );
}

export function Pagination({ currentPage, totalPages, onPageChange }) {
  const total = Math.max(1, totalPages || 1);
  const pages = [];
  for (let i = 1; i <= total; i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center justify-end gap-2 border-t border-gray-200/80 bg-white px-6 py-3.5 text-sm">
      <button
        type="button"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="text-sm font-medium text-gray-500 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed px-2.5 py-1 transition-colors"
      >
        Prev
      </button>

      {pages.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onPageChange(p)}
          className={`h-8 min-w-[32px] px-2 rounded-md text-sm font-semibold transition-all flex items-center justify-center ${
            p === currentPage
              ? "bg-[#15803d] text-white shadow-sm"
              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          }`}
        >
          {p}
        </button>
      ))}

      <button
        type="button"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="text-sm font-medium text-gray-500 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed px-2.5 py-1 transition-colors"
      >
        Next
      </button>
    </div>
  );
}

export function RowPerPageSelect({ value, onChange }) {
  return (
    <div className="relative inline-flex items-center">
      <select
        className="appearance-none rounded-xl border border-gray-200 bg-white pl-4 pr-9 py-1.5 text-sm font-bold text-gray-800 outline-none hover:border-gray-300 focus:border-green-700 cursor-pointer shadow-none transition-colors"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      >
        <option value={10}>10</option>
        <option value={25}>25</option>
        <option value={50}>50</option>
        <option value={100}>100</option>
      </select>
      <svg
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2.25}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  );
}

export const COUNTRY_CODES = [
  { code: "+91", label: "🇮🇳 +91", country: "India" },
  { code: "+1",  label: "🇺🇸 +1",  country: "USA/Canada" },
  { code: "+44", label: "🇬🇧 +44", country: "UK" },
  { code: "+971",label: "🇦🇪 +971",country: "UAE" },
  { code: "+61", label: "🇦🇺 +61", country: "Australia" },
  { code: "+65", label: "🇸🇬 +65", country: "Singapore" },
  { code: "+60", label: "🇲🇾 +60", country: "Malaysia" },
  { code: "+92", label: "🇵🇰 +92", country: "Pakistan" },
  { code: "+880",label: "🇧🇩 +880",country: "Bangladesh" },
  { code: "+94", label: "🇱🇰 +94", country: "Sri Lanka" },
  { code: "+977",label: "🇳🇵 +977",country: "Nepal" },
  { code: "+49", label: "🇩🇪 +49", country: "Germany" },
  { code: "+33", label: "🇫🇷 +33", country: "France" },
  { code: "+81", label: "🇯🇵 +81", country: "Japan" },
  { code: "+86", label: "🇨🇳 +86", country: "China" },
];

export function PhoneInput({ value, onChange, placeholder = "Mobile number", required, className = "" }) {
  const parseVal = (val) => {
    if (!val) return { countryCode: "+91", number: "" };
    const str = String(val).trim();
    const match = COUNTRY_CODES.find((c) => str.startsWith(c.code));
    if (match) {
      return { countryCode: match.code, number: str.slice(match.code.length).replace(/\D/g, "") };
    }
    const digits = str.replace(/\D/g, "");
    if (digits.length > 10 && digits.startsWith("91")) {
      return { countryCode: "+91", number: digits.slice(2, 12) };
    }
    return { countryCode: "+91", number: digits.slice(0, 10) };
  };

  const { countryCode, number } = parseVal(value);

  const handleCountryChange = (e) => {
    const newCode = e.target.value;
    onChange(number ? `${newCode}${number}` : "");
  };

  const handleNumberChange = (e) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
    onChange(digits ? `${countryCode}${digits}` : "");
  };

  return (
    <div className="flex rounded-md border border-gray-300 bg-white shadow-xs focus-within:border-green-700 focus-within:ring-1 focus-within:ring-green-700 transition-all overflow-hidden">
      <div className="relative flex items-center border-r border-gray-200 bg-gray-50/70 px-2.5 py-1.5 shrink-0">
        <select
          value={countryCode}
          onChange={handleCountryChange}
          className="appearance-none bg-transparent pr-4 text-xs font-semibold text-gray-700 outline-none cursor-pointer"
        >
          {COUNTRY_CODES.map((c) => (
            <option key={c.code + c.country} value={c.code}>
              {c.label}
            </option>
          ))}
        </select>
        <svg
          className="pointer-events-none absolute right-1.5 h-3 w-3 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      <input
        type="tel"
        inputMode="numeric"
        className={`w-full px-3 py-2 text-sm font-medium text-gray-900 placeholder-gray-400 outline-none bg-transparent ${className}`}
        value={number}
        onChange={handleNumberChange}
        placeholder={placeholder}
        required={required}
      />
    </div>
  );
}

export function formatPhone(raw) {
  if (!raw) return "—";
  const str = String(raw).trim();
  const digits = str.replace(/\D/g, "");

  if (!digits) return str;

  if (digits.length === 12 && digits.startsWith("91")) {
    const code = digits.slice(0, 2);
    const p1 = digits.slice(2, 7);
    const p2 = digits.slice(7, 12);
    return `+${code} ${p1} ${p2}`;
  }

  if (digits.length === 10) {
    const p1 = digits.slice(0, 5);
    const p2 = digits.slice(5, 10);
    return `+91 ${p1} ${p2}`;
  }

  if (digits.length === 11 && digits.startsWith("1")) {
    const code = digits.slice(0, 1);
    const p1 = digits.slice(1, 4);
    const p2 = digits.slice(4, 7);
    const p3 = digits.slice(7, 11);
    return `+${code} ${p1} ${p2} ${p3}`;
  }

  if (str.startsWith("+")) {
    return str;
  }

  return str;
}

export function exportToPdf(title, subtitle, columns, data) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    window.alert("Please allow popups to download/print the PDF.");
    return;
  }

  const tableHeadersHtml = columns
    .map(
      (col) =>
        `<th style="padding: 10px 12px; text-align: left; background-color: #15803d; color: #ffffff; font-size: 12px; font-weight: 600; border: 1px solid #166534;">${col.label}</th>`
    )
    .join("");

  const tableRowsHtml = data
    .map((row, idx) => {
      const bg = idx % 2 === 0 ? "#ffffff" : "#f9fafb";
      const cellsHtml = columns
        .map((col) => {
          let val = "";
          if (col.get) {
            val = col.get(row);
          } else {
            val = row[col.key] || "—";
          }
          return `<td style="padding: 9px 12px; font-size: 12px; color: #1f2937; border: 1px solid #e5e7eb;">${val}</td>`;
        })
        .join("");
      return `<tr style="background-color: ${bg};">${cellsHtml}</tr>`;
    })
    .join("");

  const todayStr = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title} - ${todayStr}</title>
        <style>
          @page { size: A4 landscape; margin: 15mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #111827; margin: 0; padding: 20px; }
          .header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #15803d; padding-bottom: 12px; margin-bottom: 20px; }
          .title { font-size: 22px; font-weight: 700; color: #14532d; margin: 0; }
          .subtitle { font-size: 13px; color: #6b7280; margin-top: 4px; }
          .meta { text-align: right; font-size: 12px; color: #4b5563; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          .footer { margin-top: 24px; text-align: center; font-size: 11px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="title">${title}</h1>
            <div class="subtitle">${subtitle || "Front Office Management System"}</div>
          </div>
          <div class="meta">
            <div><strong>Generated:</strong> ${todayStr}</div>
            <div><strong>Total Records:</strong> ${data.length}</div>
          </div>
        </div>
        <table>
          <thead>
            <tr>${tableHeadersHtml}</tr>
          </thead>
          <tbody>
            ${tableRowsHtml}
          </tbody>
        </table>
        <div class="footer">
          Generated via ERP Front Office Module
        </div>
        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}

export function ExportModal({ open, onClose, totalCount, selectedCount, onExportPdf, onExportCsv }) {
  if (!open) return null;
  const isSelectedOnly = selectedCount > 0;
  const recordText = isSelectedOnly
    ? `${selectedCount} selected record${selectedCount === 1 ? "" : "s"}`
    : `all ${totalCount} record${totalCount === 1 ? "" : "s"}`;

  return (
    <Modal open={open} title="Export Records" onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Choose export format for <strong className="text-gray-900">{recordText}</strong>:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 bg-white hover:border-green-600 hover:bg-green-50/50 transition-all cursor-pointer text-left group shadow-2xs"
            onClick={() => {
              onClose();
              onExportPdf();
            }}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600 group-hover:bg-red-100 transition-colors">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 text-sm">Download PDF</h4>
              <p className="text-xs text-gray-500">Print / save as formatted PDF report</p>
            </div>
          </button>

          <button
            type="button"
            className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 bg-white hover:border-green-600 hover:bg-green-50/50 transition-all cursor-pointer text-left group shadow-2xs"
            onClick={() => {
              onClose();
              onExportCsv();
            }}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-700 group-hover:bg-green-100 transition-colors">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 text-sm">Export CSV / Excel</h4>
              <p className="text-xs text-gray-500">Spreadsheet data format</p>
            </div>
          </button>
        </div>

        <div className="flex justify-end pt-3">
          <button type="button" className={btnSecondary} onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}
