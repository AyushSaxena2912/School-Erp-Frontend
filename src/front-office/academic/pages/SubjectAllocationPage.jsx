import React, { useMemo, useRef, useState } from "react";
import { Field, Modal, inputClass, selectClass } from "../../components/ui";
import { useAcademic } from "../context/AcademicContext";
import {
  AcademicListShell,
  RowMenu,
  SortLabel,
  SubjectTypeBadge,
  btnPrimary,
  btnSecondary,
} from "../components/AcademicListShell";

export default function SubjectAllocationPage() {
  const {
    classes,
    subjects,
    classSubjects,
    setClassSubjects,
    clearClassSubjects,
  } = useAcademic();

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("az");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState([]);
  const [statusFilter, setStatusFilter] = useState("All");
  const [assignFilter, setAssignFilter] = useState("All");
  const [subjectFilter, setSubjectFilter] = useState("All");
  const [modalOpen, setModalOpen] = useState(false);
  const [formClassId, setFormClassId] = useState("");
  const [formSubjectIds, setFormSubjectIds] = useState([]);
  const [subjectQuery, setSubjectQuery] = useState("");
  const [error, setError] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [viewingRow, setViewingRow] = useState(null);
  const importRef = useRef(null);

  const subjectMap = useMemo(
    () => Object.fromEntries(subjects.map((s) => [s.id, s])),
    [subjects]
  );

  const byClass = useMemo(() => {
    const map = {};
    for (const row of classSubjects) {
      if (!map[row.classId]) map[row.classId] = [];
      map[row.classId].push(row.subjectId);
    }
    return map;
  }, [classSubjects]);

  const enriched = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = classes.map((cls) => {
      const ids = byClass[cls.id] || [];
      const assigned = ids
        .map((id) => subjectMap[id])
        .filter(Boolean)
        .sort((a, b) => a.name.localeCompare(b.name));
      return {
        id: cls.id,
        className: cls.name,
        classStatus: cls.status,
        subjectIds: ids,
        subjects: assigned,
        count: assigned.length,
      };
    });

    list = list.filter((r) => {
      if (statusFilter !== "All" && r.classStatus !== statusFilter) {
        return false;
      }
      if (assignFilter === "Assigned" && r.count === 0) return false;
      if (assignFilter === "Unassigned" && r.count > 0) return false;
      if (
        subjectFilter !== "All" &&
        !r.subjectIds.includes(subjectFilter)
      ) {
        return false;
      }
      if (q) {
        const match =
          r.className.toLowerCase().includes(q) ||
          r.subjects.some((s) => s.name.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });

    list = [...list].sort((a, b) => {
      const cmp = a.className.localeCompare(b.className);
      return sort === "az" ? cmp : -cmp;
    });
    return list;
  }, [
    classes,
    byClass,
    subjectMap,
    search,
    sort,
    statusFilter,
    assignFilter,
    subjectFilter,
  ]);

  const total = enriched.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRows = enriched.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize
  );
  const allSelected =
    pageRows.length > 0 && pageRows.every((r) => selected.includes(r.id));

  const activeSubjects = useMemo(
    () => subjects.filter((s) => s.status === "Active"),
    [subjects]
  );

  const checklistSubjects = useMemo(() => {
    const activeIds = new Set(activeSubjects.map((s) => s.id));
    const extras = subjects.filter(
      (s) => formSubjectIds.includes(s.id) && !activeIds.has(s.id)
    );
    return [...activeSubjects, ...extras].sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [activeSubjects, subjects, formSubjectIds]);

  const filteredSubjects = useMemo(() => {
    const q = subjectQuery.trim().toLowerCase();
    if (!q) return checklistSubjects;
    return checklistSubjects.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.type.toLowerCase().includes(q)
    );
  }, [checklistSubjects, subjectQuery]);

  const openAssign = (row) => {
    const classId =
      row?.id || classes.find((c) => c.status === "Active")?.id || "";
    setFormClassId(classId);
    setFormSubjectIds(
      row ? [...row.subjectIds] : [...(byClass[classId] || [])]
    );
    setSubjectQuery("");
    setError("");
    setModalOpen(true);
  };

  const openAdd = () => openAssign(null);

  const toggleSubject = (id) => {
    setFormSubjectIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const save = (e) => {
    e.preventDefault();
    if (!formClassId) {
      setError("Please select a class.");
      return;
    }
    if (formSubjectIds.length === 0) {
      setError("Select at least one subject.");
      return;
    }
    setClassSubjects(formClassId, formSubjectIds);
    setModalOpen(false);
  };

  // ── Export ──────────────────────────────────────────────────────────────
  const handleExport = () => {
    const header = ["Class", "Subjects (semicolon-separated)"];
    const rows = enriched.map((r) =>
      [
        r.className,
        r.subjects.map((s) => s.name).join(";"),
      ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")
    );
    const csv = [header.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "subject_allocation.csv";
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
      const classByName = Object.fromEntries(
        classes.map((c) => [c.name.trim().toLowerCase(), c])
      );
      const subjectByName = Object.fromEntries(
        subjects.map((s) => [s.name.trim().toLowerCase(), s])
      );
      let imported = 0, skipped = 0;
      const errors = [];
      lines.slice(1).forEach((line, idx) => {
        const cols = line.replace(/^"|"|"$/g, "").split(/","/).map((v) => v.trim());
        const [className, subjectsRaw = ""] = cols;
        const cls = classByName[className?.toLowerCase()];
        if (!cls) {
          errors.push(`Row ${idx + 2}: Class "${className}" not found.`);
          skipped++;
          return;
        }
        const ids = subjectsRaw
          .split(";")
          .map((n) => n.trim())
          .filter(Boolean)
          .map((n) => subjectByName[n.toLowerCase()]?.id)
          .filter(Boolean);
        if (ids.length === 0) { skipped++; return; }
        setClassSubjects(cls.id, ids);
        imported++;
      });
      setImportResult({ imported, skipped, errors });
    };
    reader.readAsText(file);
  };

  return (
    <div className="academic-page">
      <AcademicListShell
        title="Subject Allocation"
        cardTitle="Class Subjects"
        breadcrumbs={[
          { label: "Dashboard", to: "/front-office" },
          { label: "Academic" },
          { label: "Subject Allocation" },
        ]}
        primaryAction={
          <div className="flex flex-wrap items-center gap-2">
            <input ref={importRef} type="file" accept=".csv" className="hidden" id="subject-alloc-import" onChange={handleImportFile} />
            <button type="button" className={btnSecondary} onClick={() => importRef.current?.click()} title="Import allocations from CSV">
              <svg className="h-[15px] w-[15px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
              </svg>
              Import
            </button>
            <button type="button" className={btnSecondary} onClick={handleExport} title="Export allocations to CSV">
              <svg className="h-[15px] w-[15px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M17 8l-5-5-5 5M12 3v12" />
              </svg>
              Export
            </button>
            <button type="button" className={btnPrimary} onClick={openAdd}>
              <svg className="h-[15px] w-[15px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
              </svg>
              Assign Subjects
            </button>
          </div>
        }
        search={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        pageSize={pageSize}
        onPageSizeChange={(n) => {
          setPageSize(n);
          setPage(1);
        }}
        sort={sort}
        onSortChange={setSort}
        onFilterClick={() => setFilterOpen(true)}
        page={safePage}
        onPageChange={setPage}
        total={total}
      >
        <table className="ac-table">
          <thead>
            <tr>
              <th style={{ width: 44 }}>
                <input
                  type="checkbox"
                  className="h-[15px] w-[15px] rounded accent-[var(--ac-green)]"
                  checked={allSelected}
                  onChange={(e) =>
                    setSelected(
                      e.target.checked ? pageRows.map((r) => r.id) : []
                    )
                  }
                />
              </th>
              <th>
                <SortLabel>Class</SortLabel>
              </th>
              <th>Assigned Subjects</th>
              <th>Total</th>
              <th style={{ width: 100, textAlign: "center" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="py-10 text-center text-[var(--ac-muted)]"
                >
                  No classes found.
                </td>
              </tr>
            ) : (
              pageRows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <input
                      type="checkbox"
                      className="h-[15px] w-[15px] rounded accent-[var(--ac-green)]"
                      checked={selected.includes(row.id)}
                      onChange={(e) =>
                        setSelected((prev) =>
                          e.target.checked
                            ? [...new Set([...prev, row.id])]
                            : prev.filter((x) => x !== row.id)
                        )
                      }
                    />
                  </td>
                  <td>
                    <span className="ac-name">{row.className}</span>
                  </td>
                  <td>
                    {row.subjects.length === 0 ? (
                      <span className="text-[var(--ac-muted)]">
                        No subjects assigned
                      </span>
                    ) : (
                      <div 
                        className="flex flex-wrap items-center gap-1"
                        title={row.subjects.map(s => s.name).join(', ')}
                      >
                        {row.subjects.slice(0, 3).map((s, idx, arr) => (
                          <span key={s.id} className="text-[13px] font-medium text-[var(--ac-text)]">
                            {s.name}{idx < arr.length - 1 || row.subjects.length > 3 ? "," : ""}
                          </span>
                        ))}
                        {row.subjects.length > 3 && (
                          <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded-md bg-gray-100 text-[11px] font-bold text-gray-600 border border-gray-200">
                            +{row.subjects.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                  <td>
                    <span className="text-[12px] text-[var(--ac-muted)]">
                      {row.count}
                    </span>
                  </td>
                  <td>
                    <RowMenu
                      items={[
                        {
                          label: "View subjects",
                          onClick: () => setViewingRow(row),
                        },
                        {
                          label: "Assign / Edit",
                          onClick: () => openAssign(row),
                        },
                        {
                          label: "Clear subjects",
                          danger: true,
                          onClick: () => {
                            if (row.count === 0) return;
                            if (
                              window.confirm(
                                `Clear all subjects from "${row.className}"?`
                              )
                            ) {
                              clearClassSubjects(row.id);
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
        title="Assign Subjects to Class"
        onClose={() => setModalOpen(false)}
      >
        <form onSubmit={save} className="space-y-4">
          {error ? (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}
          <Field label="Select Class" required>
            <select
              className={selectClass}
              value={formClassId}
              onChange={(e) => {
                const id = e.target.value;
                setFormClassId(id);
                setFormSubjectIds([...(byClass[id] || [])]);
                setError("");
              }}
            >
              <option value="">Select Class</option>
              {classes
                .filter(
                  (c) => c.status === "Active" || c.id === formClassId
                )
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>
          </Field>

          <Field
            label="Subjects"
            required
            hint={`${formSubjectIds.length} selected`}
          >
            <input
              className={`${inputClass} mb-2`}
              value={subjectQuery}
              onChange={(e) => setSubjectQuery(e.target.value)}
              placeholder="Search subjects…"
            />
            <div className="ac-subject-checklist">
              {filteredSubjects.length === 0 ? (
                <p className="px-2 py-3 text-sm text-[var(--ac-muted)]">
                  No subjects match.
                </p>
              ) : (
                filteredSubjects.map((s) => {
                  const checked = formSubjectIds.includes(s.id);
                  return (
                    <label key={s.id} className="ac-subject-check-row">
                      <input
                        type="checkbox"
                        className="h-[15px] w-[15px] rounded accent-[var(--ac-green)]"
                        checked={checked}
                        onChange={() => toggleSubject(s.id)}
                      />
                      <span className="flex-1 text-sm text-[var(--ac-text)]">
                        {s.name} {s.code && <span className="ml-1.5 text-xs text-[var(--ac-muted)] font-medium bg-gray-50 border border-gray-200 px-1.5 py-0.5 rounded">{s.code}</span>}
                      </span>
                      <SubjectTypeBadge type={s.type} />
                    </label>
                  );
                })
              )}
            </div>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                className={btnSecondary}
                onClick={() =>
                  setFormSubjectIds(filteredSubjects.map((s) => s.id))
                }
              >
                Select all
              </button>
              <button
                type="button"
                className={btnSecondary}
                onClick={() => setFormSubjectIds([])}
              >
                Clear
              </button>
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
              Save Subjects
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={filterOpen}
        title="Filter subject allocation"
        onClose={() => setFilterOpen(false)}
      >
        <div className="space-y-4">
          <Field label="Class status">
            <select
              className={selectClass}
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="All">All</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </Field>
          <Field label="Assignment">
            <select
              className={selectClass}
              value={assignFilter}
              onChange={(e) => {
                setAssignFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="All">All</option>
              <option value="Assigned">Has subjects</option>
              <option value="Unassigned">No subjects</option>
            </select>
          </Field>
          <Field label="Subject">
            <select
              className={selectClass}
              value={subjectFilter}
              onChange={(e) => {
                setSubjectFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="All">All subjects</option>
              {subjects
                .slice()
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                    {s.status === "Inactive" ? " (Inactive)" : ""}
                  </option>
                ))}
            </select>
          </Field>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            className={btnSecondary}
            onClick={() => {
              setStatusFilter("All");
              setAssignFilter("All");
              setSubjectFilter("All");
              setPage(1);
            }}
          >
            Reset
          </button>
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
            <p className="text-[var(--ac-muted)]">CSV format: <code>Class, Subjects (semicolon-separated)</code></p>
            <div className="flex justify-end pt-1">
              <button type="button" className={btnPrimary} onClick={() => setImportResult(null)}>Done</button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!viewingRow} title={`Assigned Subjects - ${viewingRow?.className}`} onClose={() => setViewingRow(null)}>
        {viewingRow && (
          <div className="space-y-4">
            {viewingRow.subjects.length === 0 ? (
              <p className="text-[var(--ac-muted)] text-sm">No subjects assigned.</p>
            ) : (
              <div className="ac-subject-checklist max-h-60 overflow-y-auto">
                {viewingRow.subjects.map((s) => (
                  <div key={s.id} className="ac-subject-check-row pointer-events-none">
                    <span className="flex-1 text-sm text-[var(--ac-text)]">
                      {s.name} {s.code && <span className="ml-1.5 text-xs text-[var(--ac-muted)] font-medium bg-gray-50 border border-gray-200 px-1.5 py-0.5 rounded">{s.code}</span>}
                    </span>
                    <SubjectTypeBadge type={s.type} />
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-end pt-2">
              <button type="button" className={btnPrimary} onClick={() => setViewingRow(null)}>Close</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
