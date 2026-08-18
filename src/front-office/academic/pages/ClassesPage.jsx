import React, { useMemo, useRef, useState } from "react";
import { Field, Modal, inputClass, selectClass } from "../../components/ui";
import { useAcademic } from "../context/AcademicContext";
import {
  AcademicListShell,
  DotStatus,
  RowMenu,
  SortLabel,
  btnPrimary,
  btnSecondary,
} from "../components/AcademicListShell";

function usePagedList(rows, getKey) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("az");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState([]);
  const [statusFilter, setStatusFilter] = useState("All");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = rows.filter((r) => {
      const matchQ = !q || String(getKey(r)).toLowerCase().includes(q);
      const matchStatus =
        statusFilter === "All" || r.status === statusFilter;
      return matchQ && matchStatus;
    });
    list = [...list].sort((a, b) => {
      const cmp = String(getKey(a)).localeCompare(String(getKey(b)));
      return sort === "az" ? cmp : -cmp;
    });
    return list;
  }, [rows, search, sort, statusFilter, getKey]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
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
    statusFilter,
    setStatusFilter: (v) => {
      setStatusFilter(v);
      setPage(1);
    },
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

export default function ClassesPage() {
  const { classes, addClass, updateClass, deleteClass } = useAcademic();
  const list = usePagedList(classes, (r) => r.name);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState("");
  const [status, setStatus] = useState("Active");
  const [error, setError] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const importRef = useRef(null);

  const openAdd = () => {
    setEditing(null);
    setName("");
    setStatus("Active");
    setError("");
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setName(row.name);
    setStatus(row.status);
    setError("");
    setModalOpen(true);
  };

  const save = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Class name is required.");
      return;
    }
    if (editing) {
      updateClass({ id: editing.id, name: name.trim(), status });
    } else {
      addClass({ name: name.trim(), status });
    }
    setModalOpen(false);
  };

  // ── Export ──────────────────────────────────────────────────────────────
  const handleExport = () => {
    const header = ["Name", "Status"];
    const rows = classes.map((r) =>
      [r.name, r.status]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    );
    const csv = [header.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "classes.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Import ──────────────────────────────────────────────────────────────
  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    if (importRef.current) importRef.current.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const lines = ev.target.result.split(/\r?\n/).filter(Boolean);
      if (lines.length < 2) {
        setImportResult({ imported: 0, skipped: 0, errors: ["File is empty or has no data rows."] });
        return;
      }
      const existingNames = new Set(classes.map((c) => c.name.trim().toLowerCase()));
      let imported = 0, skipped = 0;
      const errors = [];
      lines.slice(1).forEach((line, idx) => {
        const cols = line.replace(/^"|"|"$/g, "").split(/","/).map((v) => v.trim());
        const [cName, cStatus = "Active"] = cols;
        if (!cName) { errors.push(`Row ${idx + 2}: Name is empty.`); skipped++; return; }
        if (existingNames.has(cName.toLowerCase())) { skipped++; return; }
        addClass({ name: cName, status: ["Active", "Inactive"].includes(cStatus) ? cStatus : "Active" });
        existingNames.add(cName.toLowerCase());
        imported++;
      });
      setImportResult({ imported, skipped, errors });
    };
    reader.readAsText(file);
  };

  return (
    <div className="academic-page">
      <AcademicListShell
        title="Classes"
        breadcrumbs={[
          { label: "Dashboard", to: "/front-office" },
          { label: "Academic" },
          { label: "Classes" },
        ]}
        primaryAction={
          <div className="flex flex-wrap items-center gap-2">
            <input ref={importRef} type="file" accept=".csv" className="hidden" id="classes-import" onChange={handleImportFile} />
            <button type="button" className={btnSecondary} onClick={() => importRef.current?.click()} title="Import classes from CSV">
              <svg className="h-[15px] w-[15px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
              </svg>
              Import
            </button>
            <button type="button" className={btnSecondary} onClick={handleExport} title="Export classes to CSV">
              <svg className="h-[15px] w-[15px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M17 8l-5-5-5 5M12 3v12" />
              </svg>
              Export
            </button>
            <button type="button" className={btnPrimary} onClick={openAdd}>
              <svg className="h-[15px] w-[15px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
              </svg>
              Add Class
            </button>
          </div>
        }
        search={list.search}
        onSearchChange={list.setSearch}
        pageSize={list.pageSize}
        onPageSizeChange={list.setPageSize}
        sort={list.sort}
        onSortChange={list.setSort}
        onFilterClick={() => setFilterOpen(true)}
        page={list.page}
        onPageChange={list.setPage}
        total={list.total}
      >
        <table className="ac-table">
          <thead>
            <tr>
              <th style={{ width: 44 }}>
                <input
                  type="checkbox"
                  className="h-[15px] w-[15px] rounded accent-[var(--ac-green)]"
                  checked={list.allSelected}
                  onChange={(e) => list.toggleAll(e.target.checked)}
                />
              </th>
              <th>
                <SortLabel>Class</SortLabel>
              </th>
              <th>
                <SortLabel>Status</SortLabel>
              </th>
              <th style={{ width: 100, textAlign: "center" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {list.pageRows.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-10 text-center text-[var(--ac-muted)]">
                  No classes found.
                </td>
              </tr>
            ) : (
              list.pageRows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <input
                      type="checkbox"
                      className="h-[15px] w-[15px] rounded accent-[var(--ac-green)]"
                      checked={list.selected.includes(row.id)}
                      onChange={(e) =>
                        list.toggleOne(row.id, e.target.checked)
                      }
                    />
                  </td>
                  <td>
                    <span className="ac-name">
                      {row.name}
                    </span>
                  </td>
                  <td>
                    <DotStatus status={row.status} />
                  </td>
                  <td>
                    <RowMenu
                      items={[
                        { label: "Edit", onClick: () => openEdit(row) },
                        {
                          label:
                            row.status === "Active"
                              ? "Mark Inactive"
                              : "Mark Active",
                          onClick: () =>
                            updateClass({
                              id: row.id,
                              status:
                                row.status === "Active" ? "Inactive" : "Active",
                            }),
                        },
                        {
                          label: "Delete",
                          danger: true,
                          onClick: () => {
                            if (
                              window.confirm(`Delete class "${row.name}"?`)
                            ) {
                              deleteClass(row.id);
                            }
                          },
                        },
                      ]}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </AcademicListShell>

      <Modal
        open={modalOpen}
        title={editing ? "Edit Class" : "Add Class"}
        onClose={() => setModalOpen(false)}
      >
        <form onSubmit={save} className="space-y-4">
          <Field label="Class name" required error={error}>
            <input
              className={inputClass}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError("");
              }}
              placeholder="e.g. Class IV"
              autoFocus
            />
          </Field>
          <Field label="Status">
            <select
              className={selectClass}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              className={btnSecondary}
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className={btnPrimary}>
              {editing ? "Save changes" : "Add Class"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={filterOpen}
        title="Filter classes"
        onClose={() => setFilterOpen(false)}
      >
        <Field label="Status">
          <select
            className={selectClass}
            value={list.statusFilter}
            onChange={(e) => list.setStatusFilter(e.target.value)}
          >
            <option value="All">All</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </Field>
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            className={btnPrimary}
            onClick={() => setFilterOpen(false)}
          >
            Apply
          </button>
        </div>
      </Modal>

      <Modal open={!!importResult} title="Import Results" onClose={() => setImportResult(null)}>
        {importResult && (
          <div className="space-y-3 text-sm">
            <div className="flex gap-4">
              <span className="font-semibold text-green-600">✓ {importResult.imported} imported</span>
              <span className="font-semibold text-[var(--ac-muted)]">↷ {importResult.skipped} skipped</span>
            </div>
            {importResult.errors.length > 0 && (
              <ul className="max-h-40 overflow-y-auto rounded-md bg-red-50 px-3 py-2 text-red-700 space-y-1">
                {importResult.errors.map((err, i) => <li key={i}>• {err}</li>)}
              </ul>
            )}
            <p className="text-[var(--ac-muted)]">CSV format: <code>Name, Status</code></p>
            <div className="flex justify-end pt-1">
              <button type="button" className={btnPrimary} onClick={() => setImportResult(null)}>Done</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
