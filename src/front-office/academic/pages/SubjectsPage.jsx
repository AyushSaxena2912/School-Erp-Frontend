import React, { useMemo, useRef, useState } from "react";
import { Field, Modal, inputClass, selectClass } from "../../components/ui";
import { SUBJECT_TYPES } from "../data/academic";
import { useAcademic } from "../context/AcademicContext";
import {
  AcademicListShell,
  DotStatus,
  RowMenu,
  SortLabel,
  SubjectTypeBadge,
  btnPrimary,
  btnSecondary,
} from "../components/AcademicListShell";

function usePagedList(rows) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("az");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState([]);
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = rows.filter((r) => {
      const hay = `${r.code} ${r.name} ${r.type} ${r.status} ${r.isAdditional ? "additional" : "main"}`.toLowerCase();
      const matchQ = !q || hay.includes(q);
      const matchStatus =
        statusFilter === "All" || r.status === statusFilter;
      const matchType = typeFilter === "All" || r.type === typeFilter;
      const matchCat =
        categoryFilter === "All" ||
        (categoryFilter === "Additional" && r.isAdditional) ||
        (categoryFilter === "Main" && !r.isAdditional);
      return matchQ && matchStatus && matchType && matchCat;
    });
    list = [...list].sort((a, b) => {
      const cmp = String(a.name).localeCompare(String(b.name));
      return sort === "az" ? cmp : -cmp;
    });
    return list;
  }, [rows, search, sort, statusFilter, typeFilter, categoryFilter]);

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
    typeFilter,
    setTypeFilter: (v) => {
      setTypeFilter(v);
      setPage(1);
    },
    categoryFilter,
    setCategoryFilter: (v) => {
      setCategoryFilter(v);
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

const emptyForm = {
  code: "",
  name: "",
  type: "Theory",
  status: "Active",
  isAdditional: false,
};

export default function SubjectsPage() {
  const { subjects, addSubject, updateSubject, deleteSubject } = useAcademic();
  const list = usePagedList(subjects);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const importRef = useRef(null);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setError("");
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      code: row.code || "",
      name: row.name,
      type: row.type,
      status: row.status,
      isAdditional: !!row.isAdditional,
    });
    setError("");
    setModalOpen(true);
  };

  const save = (e) => {
    e.preventDefault();
    if (!String(form.name).trim()) {
      setError("Subject name is required.");
      return;
    }
    const payload = {
      code: String(form.code).trim(),
      name: String(form.name).trim(),
      type: form.type,
      status: form.status,
      isAdditional: !!form.isAdditional,
    };
    if (editing) {
      updateSubject({ id: editing.id, ...payload });
    } else {
      addSubject(payload);
    }
    setModalOpen(false);
  };

  const exportCsv = () => {
    const header = ["Code", "Name", "Type", "Status", "Is Additional"];
    const lines = subjects.map((r) =>
      [r.code, r.name, r.type, r.status, r.isAdditional ? "Yes" : "No"]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    );
    const blob = new Blob([[header.join(","), ...lines].join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "subjects.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

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
      const existingNames = new Set(subjects.map((s) => s.name.trim().toLowerCase()));
      let imported = 0, skipped = 0;
      const errors = [];
      lines.slice(1).forEach((line, idx) => {
        const cols = line.replace(/^"|"|"$/g, "").split(/","/).map((v) => v.trim());
        const [sCode = "", sName, sType = "Theory", sStatus = "Active", sAdd = "No"] = cols;
        if (!sName) { errors.push(`Row ${idx + 2}: Name is empty.`); skipped++; return; }
        if (existingNames.has(sName.toLowerCase())) { skipped++; return; }
        addSubject({
          code: sCode,
          name: sName,
          type: SUBJECT_TYPES.includes(sType) ? sType : "Theory",
          status: ["Active","Inactive"].includes(sStatus) ? sStatus : "Active",
          isAdditional: sAdd.toLowerCase() === "yes" || sAdd === "true" || sAdd === "1",
        });
        existingNames.add(sName.toLowerCase());
        imported++;
      });
      setImportResult({ imported, skipped, errors });
    };
    reader.readAsText(file);
  };

  return (
    <div className="academic-page">
      <AcademicListShell
        title="Subject List"
        breadcrumbs={[
          { label: "Dashboard", to: "/front-office" },
          { label: "Academic" },
          { label: "Subject List" },
        ]}
        secondaryAction={
          <div className="flex flex-wrap items-center gap-2">
            <input ref={importRef} type="file" accept=".csv" className="hidden" id="subjects-import" onChange={handleImportFile} />
            <button type="button" className={btnSecondary} onClick={() => importRef.current?.click()} title="Import subjects from CSV">
              <svg className="h-[15px] w-[15px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
              </svg>
              Import
            </button>
            <button type="button" className={btnSecondary} onClick={exportCsv} title="Export subjects to CSV">
              <svg className="h-[15px] w-[15px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M17 8l-5-5-5 5M12 3v12" />
              </svg>
              Export
            </button>
          </div>
        }
        primaryAction={
          <button type="button" className={btnPrimary} onClick={openAdd}>
            <svg
              className="h-[15px] w-[15px]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 5v14M5 12h14"
              />
            </svg>
            Add Subject
          </button>
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
                <SortLabel>Code</SortLabel>
              </th>
              <th>
                <SortLabel>Name</SortLabel>
              </th>
              <th>Type</th>
              <th>
                <SortLabel>Status</SortLabel>
              </th>
              <th style={{ width: 100, textAlign: "center" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {list.pageRows.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="py-10 text-center text-[var(--ac-muted)]"
                >
                  No subjects found.
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
                    <span className="text-sm font-medium text-[var(--ac-muted)]">{row.code || "—"}</span>
                  </td>
                  <td>
                    <div>
                      <span className="ac-name">{row.name}</span>
                      {row.isAdditional && (
                        <div className="text-[11px] text-amber-600 font-medium mt-0.5">Additional Subject</div>
                      )}
                    </div>
                  </td>
                  <td>
                    <SubjectTypeBadge type={row.type} />
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
                            updateSubject({
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
                              window.confirm(
                                `Delete subject "${row.name}"?`
                              )
                            ) {
                              deleteSubject(row.id);
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
        title={editing ? "Edit Subject" : "Add Subject"}
        onClose={() => setModalOpen(false)}
      >
        <form onSubmit={save} className="space-y-4">
          {error ? (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}
          <Field label="Subject Code">
            <input
              className={inputClass}
              value={form.code}
              onChange={(e) => {
                setForm((p) => ({ ...p, code: e.target.value }));
                setError("");
              }}
              placeholder="e.g. ENG101"
            />
          </Field>
          <Field label="Subject name" required>
            <input
              className={inputClass}
              value={form.name}
              onChange={(e) => {
                setForm((p) => ({ ...p, name: e.target.value }));
                setError("");
              }}
              placeholder="e.g. English"
              autoFocus
            />
          </Field>
          <Field label="Type">
            <select
              className={selectClass}
              value={form.type}
              onChange={(e) =>
                setForm((p) => ({ ...p, type: e.target.value }))
              }
            >
              {SUBJECT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Status">
            <select
              className={selectClass}
              value={form.status}
              onChange={(e) =>
                setForm((p) => ({ ...p, status: e.target.value }))
              }
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </Field>

          {/* ── Additional Subject Toggle ── */}
          <Field label="Additional Subject">
            <div className="flex items-center justify-between rounded-lg border border-[var(--ac-border)] bg-gray-50/60 p-3">
              <div>
                <div className="text-xs font-semibold text-[var(--ac-text)]">
                  Is this an Additional Subject?
                </div>
                <div className="text-[11px] text-[var(--ac-muted)]">
                  Enable if this is an additional subject.
                </div>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={!!form.isAdditional}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, isAdditional: e.target.checked }))
                  }
                />
                <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-[var(--ac-green)] peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none"></div>
              </label>
            </div>
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
              {editing ? "Save changes" : "Add Subject"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={filterOpen}
        title="Filter subjects"
        onClose={() => setFilterOpen(false)}
      >
        <div className="space-y-4">
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
          <Field label="Type">
            <select
              className={selectClass}
              value={list.typeFilter}
              onChange={(e) => list.setTypeFilter(e.target.value)}
            >
              <option value="All">All</option>
              {SUBJECT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Category">
            <select
              className={selectClass}
              value={list.categoryFilter}
              onChange={(e) => list.setCategoryFilter(e.target.value)}
            >
              <option value="All">All Categories</option>
              <option value="Main">Main Only</option>
              <option value="Additional">Additional Only</option>
            </select>
          </Field>
        </div>
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
            <p className="text-[var(--ac-muted)]">CSV format: <code>Code, Name, Type, Status</code></p>
            <div className="flex justify-end pt-1">
              <button type="button" className={btnPrimary} onClick={() => setImportResult(null)}>Done</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
