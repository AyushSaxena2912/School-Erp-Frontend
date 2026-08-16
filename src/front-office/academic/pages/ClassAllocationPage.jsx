import React, { useMemo, useState } from "react";
import { Field, Modal, SearchSelect, selectClass } from "../../components/ui";
import { useAcademic } from "../context/AcademicContext";
import {
  AcademicListShell,
  CapacityBar,
  RowMenu,
  SectionBadge,
  SortLabel,
  btnPrimary,
  btnSecondary,
} from "../components/AcademicListShell";

export default function ClassAllocationPage() {
  const {
    classes,
    sections,
    classrooms,
    teachers,
    mappings,
    addMapping,
    updateMapping,
    deleteMapping,
  } = useAcademic();

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("az");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    classId: "",
    sectionId: "",
    roomId: "",
    teacherId: "",
  });
  const [error, setError] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);

  const classMap = useMemo(
    () => Object.fromEntries(classes.map((c) => [c.id, c])),
    [classes]
  );
  const sectionMap = useMemo(
    () => Object.fromEntries(sections.map((s) => [s.id, s])),
    [sections]
  );
  const roomMap = useMemo(
    () => Object.fromEntries(classrooms.map((r) => [r.id, r])),
    [classrooms]
  );
  const teacherMap = useMemo(
    () => Object.fromEntries(teachers.map((t) => [t.id, t])),
    [teachers]
  );

  const enriched = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = mappings.map((m) => {
      const cls = classMap[m.classId];
      const sec = sectionMap[m.sectionId];
      const room = roomMap[m.roomId];
      const teacher = teacherMap[m.teacherId];
      return {
        ...m,
        className: cls?.name || "—",
        sectionName: sec?.name || "—",
        roomLabel: room ? `Room ${room.roomNo} · ${room.roomType}` : "",
        teacherName: teacher?.name || "",
        capacity: room?.capacity ?? null,
      };
    });

    if (q) {
      list = list.filter((r) =>
        `${r.className} ${r.sectionName} ${r.roomLabel} ${r.teacherName}`
          .toLowerCase()
          .includes(q)
      );
    }

    list = [...list].sort((a, b) => {
      const cmp = `${a.className} ${a.sectionName}`.localeCompare(
        `${b.className} ${b.sectionName}`
      );
      return sort === "az" ? cmp : -cmp;
    });
    return list;
  }, [
    mappings,
    classMap,
    sectionMap,
    roomMap,
    teacherMap,
    search,
    sort,
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

  const openAdd = () => {
    setEditing(null);
    setForm({
      classId: classes.find((c) => c.status === "Active")?.id || "",
      sectionId: sections.find((s) => s.status === "Active")?.id || "",
      roomId: "",
      teacherId: "",
    });
    setError("");
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      classId: row.classId,
      sectionId: row.sectionId,
      roomId: row.roomId || "",
      teacherId: row.teacherId || "",
    });
    setError("");
    setModalOpen(true);
  };

  const save = (e) => {
    e.preventDefault();
    if (!form.classId || !form.sectionId) {
      setError("Class and section are required.");
      return;
    }
    const duplicate = mappings.some(
      (m) =>
        m.classId === form.classId &&
        m.sectionId === form.sectionId &&
        m.id !== editing?.id
    );
    if (duplicate) {
      setError("This class–section mapping already exists.");
      return;
    }
    const payload = {
      classId: form.classId,
      sectionId: form.sectionId,
      roomId: form.roomId,
      teacherId: form.teacherId,
    };
    if (editing) {
      updateMapping({ id: editing.id, ...payload });
    } else {
      addMapping({ ...payload, enrolled: 0 });
    }
    setModalOpen(false);
  };

  return (
    <div className="academic-page">
      <AcademicListShell
        title="Class Allocation"
        cardTitle="Mapped Classes"
        breadcrumbs={[
          { label: "Dashboard", to: "/front-office" },
          { label: "Academic" },
          { label: "Class Allocation" },
        ]}
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
            New Mapping
          </button>
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
              <th>
                <SortLabel>Section</SortLabel>
              </th>
              <th>Assigned Room</th>
              <th>Class Teacher</th>
              <th>Capacity &amp; Status</th>
              <th style={{ width: 100, textAlign: "center" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-[var(--ac-muted)]">
                  No mappings yet. Click New Mapping to create one.
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
                    <span className="ac-name">
                      {row.className}
                    </span>
                  </td>
                  <td>
                    <SectionBadge name={row.sectionName} />
                  </td>
                  <td>
                    {row.roomLabel ? (
                      <span className="ac-name">
                        {row.roomLabel}
                      </span>
                    ) : (
                      <span className="text-[var(--ac-muted)]">Unassigned</span>
                    )}
                  </td>
                  <td>
                    {row.teacherName ? (
                      <span className="ac-name">
                        {row.teacherName}
                      </span>
                    ) : (
                      <span className="text-[var(--ac-muted)]">Unassigned</span>
                    )}
                  </td>
                  <td>
                    <CapacityBar
                      enrolled={row.enrolled}
                      capacity={row.capacity}
                    />
                  </td>
                  <td>
                    <RowMenu
                      items={[
                        { label: "Edit", onClick: () => openEdit(row) },
                        {
                          label: "Delete",
                          danger: true,
                          onClick: () => {
                            if (
                              window.confirm(
                                `Delete mapping ${row.className}-${row.sectionName}?`
                              )
                            ) {
                              deleteMapping(row.id);
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
        title={editing ? "Edit Class-Section Mapping" : "New Class-Section Mapping"}
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
              value={form.classId}
              onChange={(e) =>
                setForm((p) => ({ ...p, classId: e.target.value }))
              }
            >
              <option value="">Select Class</option>
              {classes
                .filter((c) => c.status === "Active")
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>
          </Field>
          <Field label="Select Section" required>
            <select
              className={selectClass}
              value={form.sectionId}
              onChange={(e) =>
                setForm((p) => ({ ...p, sectionId: e.target.value }))
              }
            >
              <option value="">Select Section</option>
              {sections
                .filter((s) => s.status === "Active")
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
            </select>
          </Field>
          <Field label="Assign Room">
            <select
              className={selectClass}
              value={form.roomId}
              onChange={(e) =>
                setForm((p) => ({ ...p, roomId: e.target.value }))
              }
            >
              <option value="">Select Room</option>
              {classrooms.map((r) => (
                <option key={r.id} value={r.id}>
                  Room {r.roomNo} · {r.roomType} ({r.capacity})
                </option>
              ))}
            </select>
          </Field>
          <Field label="Assign Class Teacher">
            <SearchSelect
              value={form.teacherId}
              onChange={(teacherId) =>
                setForm((p) => ({ ...p, teacherId }))
              }
              options={teachers.map((t) => ({
                value: t.id,
                label: t.name,
              }))}
              placeholder="Select Teacher"
              emptyText="No teacher found"
            />
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
              Save Mapping
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={filterOpen}
        title="Filter mappings"
        onClose={() => setFilterOpen(false)}
      >
        <p className="text-sm text-[var(--ac-muted)]">
          Use the search box to filter by class, section, room, or teacher.
          Status filters will expand when connected to live academic data.
        </p>
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            className={btnPrimary}
            onClick={() => setFilterOpen(false)}
          >
            Close
          </button>
        </div>
      </Modal>
    </div>
  );
}
