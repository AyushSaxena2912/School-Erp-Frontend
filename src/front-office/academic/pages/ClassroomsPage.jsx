import React, { useMemo, useState } from "react";
import { Field, Modal, inputClass, selectClass } from "../../components/ui";
import { ROOM_TYPES } from "../data/academic";
import { useAcademic } from "../context/AcademicContext";
import {
  AcademicListShell,
  DotStatus,
  RoomBadge,
  RowMenu,
  SortLabel,
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
      const hay = `${r.roomNo} ${r.roomType} ${r.capacity} ${r.status}`.toLowerCase();
      const matchQ = !q || hay.includes(q);
      const matchStatus =
        statusFilter === "All" || r.status === statusFilter;
      const matchType = typeFilter === "All" || r.roomType === typeFilter;
      return matchQ && matchStatus && matchType;
    });
    list = [...list].sort((a, b) => {
      const cmp = String(a.roomNo).localeCompare(String(b.roomNo), undefined, {
        numeric: true,
      });
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
  roomNo: "",
  roomType: "Classroom",
  capacity: 40,
  status: "Available",
};

export default function ClassroomsPage() {
  const { classrooms, addRoom, updateRoom, deleteRoom } = useAcademic();
  const list = usePagedList(classrooms);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [roomTypeChoice, setRoomTypeChoice] = useState("Classroom");
  const [customRoomType, setCustomRoomType] = useState("");
  const [error, setError] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setRoomTypeChoice("Classroom");
    setCustomRoomType("");
    setError("");
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      roomNo: row.roomNo,
      roomType: row.roomType,
      capacity: row.capacity,
      status: row.status,
    });
    if (ROOM_TYPES.includes(row.roomType)) {
      setRoomTypeChoice(row.roomType);
      setCustomRoomType("");
    } else {
      setRoomTypeChoice("__other__");
      setCustomRoomType(row.roomType);
    }
    setError("");
    setModalOpen(true);
  };

  const save = (e) => {
    e.preventDefault();
    if (!String(form.roomNo).trim()) {
      setError("Room number is required.");
      return;
    }
    const roomType =
      roomTypeChoice === "__other__"
        ? customRoomType.trim()
        : roomTypeChoice;
    if (!roomType) {
      setError("Please enter a room type.");
      return;
    }
    const payload = {
      roomNo: String(form.roomNo).trim(),
      roomType,
      capacity: Number(form.capacity) || 0,
      status: form.status,
    };
    if (editing) {
      updateRoom({ id: editing.id, ...payload });
    } else {
      addRoom(payload);
    }
    setModalOpen(false);
  };

  const exportCsv = () => {
    const header = ["Room No", "Room Type", "Capacity", "Status"];
    const lines = classrooms.map((r) =>
      [r.roomNo, r.roomType, r.capacity, r.status]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    );
    const blob = new Blob([[header.join(","), ...lines].join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "classrooms.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="academic-page">
      <AcademicListShell
        title="Classrooms"
        breadcrumbs={[
          { label: "Dashboard", to: "/front-office" },
          { label: "Academic" },
          { label: "Classrooms" },
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
            Add Room
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
                <SortLabel>Room No</SortLabel>
              </th>
              <th>Room Type</th>
              <th>Capacity</th>
              <th>
                <SortLabel>Status</SortLabel>
              </th>
              <th style={{ width: 100, textAlign: "center" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {list.pageRows.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-[var(--ac-muted)]">
                  No classrooms found.
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
                    <RoomBadge>{row.roomNo}</RoomBadge>
                  </td>
                  <td>
                    <span className="ac-name">
                      {row.roomType}
                    </span>
                  </td>
                  <td>{row.capacity} seats</td>
                  <td>
                    <DotStatus status={row.status} />
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
                              window.confirm(`Delete room ${row.roomNo}?`)
                            ) {
                              deleteRoom(row.id);
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
        title={editing ? "Edit Room" : "Add Room"}
        onClose={() => setModalOpen(false)}
      >
        <form onSubmit={save} className="space-y-4">
          {error ? (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}
          <Field label="Room No" required>
            <input
              className={inputClass}
              value={form.roomNo}
              onChange={(e) => {
                setForm((p) => ({ ...p, roomNo: e.target.value }));
                setError("");
              }}
              placeholder="e.g. 106"
              autoFocus={roomTypeChoice !== "__other__"}
            />
          </Field>
          <Field label="Room Type">
            <select
              className={selectClass}
              value={roomTypeChoice}
              onChange={(e) => {
                const v = e.target.value;
                setRoomTypeChoice(v);
                if (v !== "__other__") setCustomRoomType("");
                setError("");
              }}
            >
              {ROOM_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
              <option value="__other__">Other</option>
            </select>
          </Field>
          {roomTypeChoice === "__other__" ? (
            <Field label="Custom type" required>
              <input
                className={inputClass}
                value={customRoomType}
                onChange={(e) => {
                  setCustomRoomType(e.target.value);
                  setError("");
                }}
                placeholder="e.g. Music Room"
                autoFocus
              />
            </Field>
          ) : null}
          <Field label="Capacity">
            <input
              type="number"
              min={1}
              className={inputClass}
              value={form.capacity}
              onChange={(e) =>
                setForm((p) => ({ ...p, capacity: e.target.value }))
              }
            />
          </Field>
          <Field label="Status">
            <select
              className={selectClass}
              value={form.status}
              onChange={(e) =>
                setForm((p) => ({ ...p, status: e.target.value }))
              }
            >
              <option value="Available">Available</option>
              <option value="Occupied">Occupied</option>
              <option value="Maintenance">Maintenance</option>
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
              {editing ? "Save changes" : "Add Room"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={filterOpen}
        title="Filter classrooms"
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
              <option value="Available">Available</option>
              <option value="Occupied">Occupied</option>
              <option value="Maintenance">Maintenance</option>
            </select>
          </Field>
          <Field label="Room Type">
            <select
              className={selectClass}
              value={list.typeFilter}
              onChange={(e) => list.setTypeFilter(e.target.value)}
            >
              <option value="All">All</option>
              {ROOM_TYPES.map((t) => (
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
