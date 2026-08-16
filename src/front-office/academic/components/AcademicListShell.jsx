import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";

export const btnPrimary = "ac-btn ac-btn-primary";
export const btnSecondary = "ac-btn";

export function Breadcrumbs({ items }) {
  return (
    <div className="ac-breadcrumb flex items-center gap-1">
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <React.Fragment key={`${item.label}-${i}`}>
            {i > 0 ? (
              <svg
                className="mx-0.5 h-3 w-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            ) : null}
            {item.to && !isLast ? (
              <Link to={item.to} className="hover:text-[var(--ac-green)]">
                {item.label}
              </Link>
            ) : (
              <span
                className={isLast ? "text-[var(--ac-green)]" : undefined}
              >
                {item.label}
              </span>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export function DotStatus({ status }) {
  const key = String(status || "")
    .toLowerCase()
    .replace(/\s+/g, "");
  const map = {
    active: "active",
    inactive: "inactive",
    available: "available",
    occupied: "occupied",
    maintenance: "maintenance",
  };
  const cls = map[key] || "active";
  return (
    <span className={`ac-badge ${cls}`}>
      <span className="ac-badge-dot" />
      {status}
    </span>
  );
}

export function CapacityBar({ enrolled, capacity }) {
  if (enrolled == null || !capacity) {
    return <span className="text-[12px] text-[var(--ac-hint)]">N/A</span>;
  }
  const pct = Math.min(100, Math.round((enrolled / capacity) * 100));
  const over = enrolled > capacity;
  const fill =
    over || pct >= 95 ? "danger" : pct >= 80 ? "warn" : "ok";
  const colors = {
    ok: "bg-[var(--ac-green)]",
    warn: "bg-[var(--ac-warn)]",
    danger: "bg-[var(--ac-danger)]",
  };
  return (
    <div className="flex items-center gap-2.5">
      <div className="h-[5px] w-16 shrink-0 overflow-hidden rounded-[3px] bg-[#e5e7eb]">
        <div
          className={`h-full rounded-[3px] ${colors[fill]}`}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
      <span className="whitespace-nowrap text-[12px] text-[var(--ac-muted)]">
        {enrolled}/{capacity}
      </span>
    </div>
  );
}

export function SectionBadge({ name }) {
  return (
    <span className="inline-flex h-6 min-w-7 items-center justify-center rounded-md bg-[var(--ac-green-light)] px-2 text-[11px] font-semibold text-[var(--ac-green)]">
      {name}
    </span>
  );
}

export function RoomBadge({ children }) {
  return (
    <span className="inline-flex h-7 min-w-9 items-center justify-center rounded-md bg-[var(--ac-blue-light)] px-2 text-[12px] font-semibold text-[var(--ac-blue)]">
      {children}
    </span>
  );
}

export function SubjectTypeBadge({ type }) {
  const practical = String(type).toLowerCase() === "practical";
  return (
    <span className={`ac-type-badge ${practical ? "practical" : "theory"}`}>
      {type}
    </span>
  );
}

export function SortLabel({ children }) {
  return (
    <span className="inline-flex items-center gap-1">
      {children}
      <svg
        className="h-3 w-3 text-[var(--ac-hint)]"
        viewBox="0 0 16 16"
        fill="currentColor"
        aria-hidden
      >
        <path d="M8 3l3 4H5l3-4zm0 10l-3-4h6l-3 4z" />
      </svg>
    </span>
  );
}

export function RowMenu({ items }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative flex justify-center">
      <button
        type="button"
        className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--ac-muted)] hover:bg-[#f4f6f8]"
        aria-label="Actions"
        onClick={() => setOpen((v) => !v)}
      >
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>
      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-10 cursor-default"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-20 mt-1 w-36 rounded-lg border border-[var(--ac-border)] bg-white py-1 shadow-md">
            {items.map((item) => (
              <button
                key={item.label}
                type="button"
                className={`block w-full px-3 py-1.5 text-left text-[12.5px] hover:bg-[#f4f6f8] ${
                  item.danger
                    ? "text-[var(--ac-danger)]"
                    : "text-[var(--ac-text)]"
                }`}
                onClick={() => {
                  setOpen(false);
                  item.onClick?.();
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

export function AcademicListShell({
  title,
  breadcrumbs,
  cardTitle,
  primaryAction,
  secondaryAction,
  search,
  onSearchChange,
  pageSize,
  onPageSizeChange,
  sort,
  onSortChange,
  onFilterClick,
  page,
  onPageChange,
  total,
  children,
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);
  const safePage = Math.min(page, totalPages);
  const heading = cardTitle || title;

  return (
    <div className="space-y-5">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="ac-page-title">{title}</h1>
          <Breadcrumbs items={breadcrumbs} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {secondaryAction}
          {primaryAction}
        </div>
      </div>

      <div className="overflow-hidden rounded-[var(--ac-radius-lg)] border border-[var(--ac-border)] bg-white">
        {/* Toolbar: title + Filter / Sort */}
        <div className="flex flex-wrap items-center gap-2.5 border-b border-[var(--ac-border)] px-[18px] py-3.5">
          <span className="ac-card-title flex-1">{heading}</span>
          <button type="button" className="ac-toolbar-btn" onClick={onFilterClick}>
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
            Filter
          </button>
          <div className="relative">
            <select
              className="ac-select min-w-[7.5rem] py-1.5 pl-3"
              value={sort}
              onChange={(e) => onSortChange(e.target.value)}
              aria-label="Sort"
            >
              <option value="az">Sort By A-Z</option>
              <option value="za">Sort By Z-A</option>
            </select>
          </div>
        </div>

        {/* Controls: page size + search */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--ac-border)] bg-[#fafbfc] px-[18px] py-2.5">
          <div className="flex items-center gap-2 text-[12px] text-[var(--ac-muted)]">
            <span>Row Per Page</span>
            <select
              className="ac-select"
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
            >
              {[10, 25, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <span>Entries</span>
          </div>
          <div className="flex items-center gap-[7px] rounded-[var(--ac-radius)] border border-[var(--ac-border)] bg-white px-3 py-1.5">
            <svg
              className="h-3.5 w-3.5 shrink-0 text-[var(--ac-hint)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z"
              />
            </svg>
            <input
              type="search"
              className="w-40 border-0 bg-transparent text-[12px] text-[var(--ac-text)] outline-none placeholder:text-[var(--ac-hint)]"
              placeholder="Search"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">{children}</div>

        <div className="flex items-center justify-end gap-1 border-t border-[var(--ac-border)] bg-[#fafbfc] px-[18px] py-3">
          <button
            type="button"
            className="ac-pg-btn"
            disabled={safePage <= 1}
            onClick={() => onPageChange(safePage - 1)}
          >
            ← Pre
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .slice(0, 5)
            .map((n) => (
              <button
                key={n}
                type="button"
                className={`ac-pg-btn ${n === safePage ? "active" : ""}`}
                onClick={() => onPageChange(n)}
              >
                {n}
              </button>
            ))}
          <button
            type="button"
            className="ac-pg-btn"
            disabled={safePage >= totalPages}
            onClick={() => onPageChange(safePage + 1)}
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}

export function useListControls(rows, getSortKey) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("az");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState([]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = rows;
    if (q) {
      list = rows.filter((row) =>
        Object.values(row).join(" ").toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => {
      const ka = String(getSortKey(a) || "").toLowerCase();
      const kb = String(getSortKey(b) || "").toLowerCase();
      return sort === "az" ? ka.localeCompare(kb) : kb.localeCompare(ka);
    });
  }, [rows, search, sort, getSortKey]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize
  );

  return {
    search,
    setSearch: (v) => {
      setSearch(v);
      setPage(1);
    },
    sort,
    setSort,
    pageSize,
    setPageSize: (n) => {
      setPageSize(n);
      setPage(1);
    },
    page: safePage,
    setPage,
    total,
    pageRows,
    selected,
    setSelected,
    toggleAll: (checked) =>
      setSelected(checked ? pageRows.map((r) => r.id) : []),
    toggleOne: (id, checked) =>
      setSelected((prev) =>
        checked ? [...new Set([...prev, id])] : prev.filter((x) => x !== id)
      ),
    allSelected:
      pageRows.length > 0 && pageRows.every((r) => selected.includes(r.id)),
  };
}
