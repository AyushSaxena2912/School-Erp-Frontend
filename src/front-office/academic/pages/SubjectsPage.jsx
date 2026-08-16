import React, { useMemo, useState } from "react";
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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = rows.filter((r) => {
      const hay = `${r.name} ${r.type} ${r.status}`.toLowerCase();
      const matchQ = !q || hay.includes(q);
      const matchStatus =
        statusFilter === "All" || r.status === statusFilter;
      const matchType = typeFilter === "All" || r.type === typeFilter;
      return matchQ && matchStatus && matchType;
    });
    list = [...list].sort((a, b) => {
      const cmp = String(a.name).localeCompare(String(b.name));
      return sort === "az" ? cmp : -cmp;
    });
    return list;
  }, [rows, search, sort, statusFilter, typeFilter]);

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
  name: "",
  type: "Theory",
  status: "Active",
};

export default function SubjectsPage() {
  const { subjects, addSubject, updateSubject, deleteSubject } = useAcademic();
  const list = usePagedList(subjects);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setError("");
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      name: row.name,
      type: row.type,
      status: row.status,
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
      name: String(form.name).trim(),
      type: form.type,
      status: form.status,
    };
    if (editing) {
      updateSubject({ id: editing.id, ...payload });
    } else {
      addSubject(payload);
    }
    setModalOpen(false);
  };

  const exportCsv = () => {
    const header = ["Name", "Type", "Status"];
    const lines = subjects.map((r) =>
      [r.name, r.type, r.status]
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
          <button type="button" className={btnSecondary} onClick={exportCsv}>
            <span className="inline-flex items-center gap-1.5">
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3"
                />
              </svg>
              Export
            </span>
          </button>
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
                  colSpan={5}
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
                    <span className="ac-name">{row.name}</span>
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
    </div>
  );
}
