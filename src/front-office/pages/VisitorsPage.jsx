import React, { useEffect, useMemo, useRef, useState } from "react";
import { useFrontOffice } from "../context/FrontOfficeContext";
import { VISITOR_PURPOSES, VISITOR_RELATIONS, todayISO, formatStudentLabel, smartSearchMatch, formatDateTimeDMY } from "../data/seed";
import {
  EmptyState,
  Field,
  Modal,
  Pagination,
  PhoneInput,
  RowPerPageSelect,
  SlideOver,
  ExportModal,
  exportToPdf,
  formatPhone,
  btnPrimary,
  btnSecondary,
  inputClass,
  selectClass,
} from "../components/ui";
import ImportExportButtons from "../components/ImportExportButtons";
import BulkActionBar from "../components/BulkActionBar";
import ConfirmModal from "../components/ConfirmModal";
import { downloadCsv, pickFile, readCsvFile, toCsv } from "../utils/csv";

function SuggestSearch({
  value,
  onChange,
  suggestions,
  placeholder,
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const filtered = useMemo(() => {
    const q = value.trim().toLowerCase();
    const unique = [...new Set(suggestions.filter(Boolean))];
    if (!q) return unique.slice(0, 8);
    return unique
      .filter((s) => s.toLowerCase().includes(q))
      .slice(0, 8);
  }, [suggestions, value]);

  return (
    <div className="relative" ref={ref}>
      <input
        className={inputClass}
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        autoComplete="off"
      />
      {open && filtered.length > 0 ? (
        <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg">
          {filtered.map((name) => (
            <li key={name}>
              <button
                type="button"
                className={`flex w-full px-3 py-2 text-left text-sm hover:bg-gray-50 ${
                  name === value ? "bg-green-50 text-green-800" : "text-gray-800"
                }`}
                onClick={() => {
                  onChange(name);
                  setOpen(false);
                }}
              >
                {name}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function nowLocal() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toISODate(d) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function rangeForPreset(preset, customFrom, customTo) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = toISODate(today);

  if (preset === "all") {
    return { from: "1970-01-01", to: "2099-12-31" };
  }
  if (preset === "today") {
    return { from: end, to: end };
  }
  if (preset === "week") {
    const from = new Date(today);
    from.setDate(from.getDate() - 6);
    return { from: toISODate(from), to: end };
  }
  if (preset === "month") {
    const from = new Date(today);
    from.setMonth(from.getMonth() - 1);
    return { from: toISODate(from), to: end };
  }
  if (preset === "year") {
    const from = new Date(today);
    from.setFullYear(from.getFullYear() - 1);
    return { from: toISODate(from), to: end };
  }
  // custom range
  let from = customFrom || todayISO();
  let to = customTo || todayISO();
  if (from > to) [from, to] = [to, from];
  return { from, to };
}

const RANGE_PRESETS = [
  { id: "all", label: "All" },
  { id: "today", label: "Today" },
  { id: "week", label: "Last week" },
  { id: "month", label: "Last month" },
  { id: "year", label: "Last year" },
  { id: "custom", label: "Custom range" },
];

const emptyForm = () => ({
  name: "",
  purpose: VISITOR_PURPOSES[0],
  relation: "",
  contact: "",
  studentId: "",
  studentName: "",
  className: "",
  section: "",
  scholarNumber: "",
  whomToMeet: "",
  checkIn: nowLocal(),
  remarks: "",
});

function formatVisitDateTime(value) {
  if (!value) return "—";
  const [day, time] = value.split("T");
  return time ? `${day} ${time}` : day || value;
}

function VisitorDetail({ visitor, onClose, onCheckOut, onEdit, onDelete }) {
  return (
    <div className="space-y-4 text-sm">
      <dl className="grid grid-cols-2 gap-3">
        <div>
          <dt className="text-gray-500">Visitor Name</dt>
          <dd className="font-medium">{visitor.name}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Contact Number</dt>
          <dd className="font-medium">{visitor.contact || "—"}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Purpose of Visit</dt>
          <dd className="font-medium">{visitor.purpose}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Relation to Student</dt>
          <dd className="font-medium">{visitor.relation || "—"}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-gray-500">Student</dt>
          <dd className="font-medium">
            {visitor.studentName ? formatStudentLabel(visitor) : "—"}
          </dd>
        </div>
        <div className="col-span-2">
          <dt className="text-gray-500">Whom to Meet</dt>
          <dd className="font-medium">
            {visitor.purpose === "Meet Student"
              ? "—"
              : visitor.whomToMeet || "—"}
          </dd>
        </div>
        <div>
          <dt className="text-gray-500">Check-in</dt>
          <dd className="font-medium">{formatVisitDateTime(visitor.checkIn)}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Check-out</dt>
          <dd className="font-medium">
            {visitor.checkOut
              ? formatVisitDateTime(visitor.checkOut)
              : "Still in campus"}
          </dd>
        </div>
      </dl>

      <div>
        <p className="text-gray-500">Remarks</p>
        <p className="mt-1 rounded-md bg-gray-50 p-3 text-gray-700">
          {visitor.remarks?.trim() ? visitor.remarks : "—"}
        </p>
      </div>

      <div className="flex flex-wrap justify-end gap-2 border-t border-gray-100 pt-4">
        <button
          type="button"
          className="rounded-md border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
          onClick={() => onDelete(visitor.id)}
        >
          Delete
        </button>
        <button type="button" className={btnSecondary} onClick={onEdit}>
          Edit
        </button>
        {!visitor.checkOut ? (
          <button
            type="button"
            className={btnPrimary}
            onClick={() => onCheckOut(visitor.id, nowLocal())}
          >
            Check Out
          </button>
        ) : (
          <button type="button" className={btnSecondary} onClick={onClose}>
            Close
          </button>
        )}
      </div>
    </div>
  );
}

export default function VisitorsPage() {
  const {
    visitors,
    staff,
    students,
    addVisitor,
    updateVisitor,
    deleteVisitor,
    deleteVisitors,
    checkOutVisitor,
  } = useFrontOffice();
  const [rangePreset, setRangePreset] = useState("all");
  const [customFrom, setCustomFrom] = useState(todayISO());
  const [customTo, setCustomTo] = useState(todayISO());
  const [searchName, setSearchName] = useState("");
  const [filterPurpose, setFilterPurpose] = useState("");
  const [filterWhomToMeet, setFilterWhomToMeet] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [studentQuery, setStudentQuery] = useState("");
  const [errors, setErrors] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showExportModal, setShowExportModal] = useState(false);

  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds([]);
  }, [rangePreset, customFrom, customTo, searchName, filterPurpose, filterWhomToMeet]);

  const selected = visitors.find((v) => v.id === selectedId) || null;
  const editing = visitors.find((v) => v.id === editingId) || null;

  const needsStudent = form.purpose === "Meet Student";
  const showStudentFields =
    form.purpose === "Meet Student" || form.purpose === "Meet Staff";
  const showWhomToMeet = form.purpose !== "Meet Student";

  const { from, to } = useMemo(
    () => rangeForPreset(rangePreset, customFrom, customTo),
    [rangePreset, customFrom, customTo]
  );

  const visitorNameSuggestions = useMemo(
    () => [...new Set([...visitors.map((v) => v.name), ...visitors.map((v) => v.studentName)].filter(Boolean))],
    [visitors]
  );

  const whomToMeetSuggestions = useMemo(() => {
    const fromVisitors = visitors.map((v) => v.whomToMeet).filter(Boolean);
    const fromStaff = staff.map((s) => s.name).filter(Boolean);
    return [...new Set([...fromStaff, ...fromVisitors])];
  }, [visitors, staff]);

  const studentMatches = useMemo(() => {
    const q = studentQuery.trim().toLowerCase();
    if (q.length < 1 || form.studentId) return [];
    return students
      .filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.scholarNumber.toLowerCase().includes(q)
      )
      .slice(0, 6);
  }, [studentQuery, students, form.studentId]);

  const list = useMemo(() => {
    const nameQ = searchName.trim().toLowerCase();
    const whomQ = filterWhomToMeet.trim().toLowerCase();

    return visitors
      .filter((v) => {
        const day = (v.checkIn || "").slice(0, 10);
        if (!day) return false;
        if (day < from || day > to) return false;
        if (nameQ && !smartSearchMatch(v, nameQ, ["name", "contact", "studentName", "scholarNumber", "className"])) return false;
        if (filterPurpose && v.purpose !== filterPurpose) return false;
        if (whomQ && !String(v.whomToMeet || "").toLowerCase().includes(whomQ)) {
          return false;
        }
        return true;
      })
      .sort((a, b) => (b.checkIn || "").localeCompare(a.checkIn || ""));
  }, [visitors, from, to, searchName, filterPurpose, filterWhomToMeet]);

  const totalItems = list.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedList = useMemo(
    () => list.slice(startIndex, startIndex + pageSize),
    [list, startIndex, pageSize]
  );

  const visibleIds = list.map((v) => v.id);
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAllVisible = () => {
    if (allVisibleSelected) {
      setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedIds((prev) => [...new Set([...prev, ...visibleIds])]);
    }
  };

  const handleBulkDelete = () => {
    if (!selectedIds.length) return;
    if (selectedId && selectedIds.includes(selectedId)) setSelectedId(null);
    deleteVisitors(selectedIds);
    setSelectedIds([]);
    setConfirmBulkDelete(false);
  };

  const handleSingleDelete = () => {
    if (!confirmDeleteId) return;
    deleteVisitor(confirmDeleteId);
    if (selectedId === confirmDeleteId) setSelectedId(null);
    setSelectedIds((prev) => prev.filter((id) => id !== confirmDeleteId));
    setConfirmDeleteId(null);
  };

  const visitorCsvColumns = [
    { key: "name", label: "Visitor Name" },
    { key: "contact", label: "Contact" },
    { key: "purpose", label: "Purpose" },
    { key: "relation", label: "Relation" },
    { key: "studentName", label: "Student Name" },
    { key: "scholarNumber", label: "Scholar Number" },
    { key: "className", label: "Class" },
    { key: "section", label: "Section" },
    { key: "whomToMeet", label: "Whom to Meet" },
    { key: "checkIn", label: "Check In" },
    { key: "checkOut", label: "Check Out" },
    { key: "remarks", label: "Remarks" },
  ];

  const handleExportVisitors = () => {
    setShowExportModal(true);
  };

  const getExportRecords = () => {
    if (selectedIds.length > 0) {
      return visitors.filter((v) => selectedIds.includes(v.id));
    }
    return list;
  };

  const handleExportCsv = () => {
    const dataToExport = getExportRecords();
    downloadCsv(`visitors-${todayISO()}.csv`, toCsv(dataToExport, visitorCsvColumns));
  };

  const handleExportPdf = () => {
    const dataToExport = getExportRecords();
    exportToPdf(
      "Visitor Log Report",
      "School Front Office Management System",
      visitorCsvColumns,
      dataToExport
    );
  };

  const handleImportVisitors = async () => {
    const file = await pickFile();
    if (!file) return;
    try {
      const { rows } = await readCsvFile(file);
      if (!rows.length) {
        window.alert("No rows found in the CSV.");
        return;
      }
      let added = 0;
      rows.forEach((row) => {
        const name = row["Visitor Name"] || row.name || row.Name || "";
        if (!name.trim()) return;
        addVisitor({
          name: name.trim(),
          contact: row.Contact || row.contact || "",
          purpose: row.Purpose || row.purpose || "General Inquiry",
          relation: row.Relation || row.relation || "",
          studentId: "",
          studentName: row["Student Name"] || row.studentName || "",
          scholarNumber: row["Scholar Number"] || row.scholarNumber || "",
          className: row.Class || row.className || "",
          section: row.Section || row.section || "",
          whomToMeet: row["Whom to Meet"] || row.whomToMeet || "",
          checkIn: row["Check In"] || row.checkIn || nowLocal(),
          checkOut: row["Check Out"] || row.checkOut || null,
          remarks: row.Remarks || row.remarks || "",
        });
        added += 1;
      });
      window.alert(
        added
          ? `Imported ${added} visitor${added === 1 ? "" : "s"}.`
          : "No valid rows to import. Need Visitor Name."
      );
    } catch {
      window.alert("Could not read the CSV file.");
    }
  };

  const set = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  const clearStudent = () => {
    setStudentQuery("");
    setForm((prev) => ({
      ...prev,
      studentId: "",
      studentName: "",
      className: "",
      section: "",
      scholarNumber: "",
    }));
  };

  const selectStudent = (s) => {
    setStudentQuery(`${s.name} (${s.scholarNumber})`);
    setForm((prev) => ({
      ...prev,
      studentId: s.id,
      studentName: s.name,
      className: s.className,
      section: s.section || "",
      scholarNumber: s.scholarNumber,
    }));
  };

  const setPurpose = (purpose) => {
    const keepStudent = purpose === "Meet Student" || purpose === "Meet Staff";
    setForm((prev) => ({
      ...prev,
      purpose,
      ...(purpose === "Meet Student" ? { whomToMeet: "" } : {}),
      ...(!keepStudent
        ? {
            relation: "",
            studentId: "",
            studentName: "",
            className: "",
            section: "",
            scholarNumber: "",
          }
        : {}),
    }));
    if (!keepStudent) setStudentQuery("");
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm());
    setStudentQuery("");
    setErrors({});
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setStudentQuery("");
    setErrors({});
    setShowForm(true);
  };

  const openEdit = (v) => {
    setEditingId(v.id);
    const sName = v.studentName || v.student || "";
    const match = students.find(
      (s) => s.name.toLowerCase() === sName.toLowerCase() || (v.studentId && s.id === v.studentId)
    );

    setForm({
      name: v.name || "",
      purpose: v.purpose || VISITOR_PURPOSES[0],
      relation: v.relation || "",
      contact: v.contact || "",
      studentId: match?.id || v.studentId || (sName ? `student-${sName}` : ""),
      studentName: match?.name || sName,
      className: match?.className || v.className || "",
      section: match?.section || v.section || "",
      scholarNumber: match?.scholarNumber || v.scholarNumber || "",
      whomToMeet: v.whomToMeet || "",
      checkIn: v.checkIn || nowLocal(),
      remarks: v.remarks || "",
    });
    setStudentQuery(
      sName
        ? `${sName}${match?.scholarNumber ? ` (${match.scholarNumber})` : ""}`
        : ""
    );
    setErrors({});
    setSelectedId(null);
    setShowForm(true);
  };

  const submit = (e) => {
    e.preventDefault();

    let currentStudentId = form.studentId;
    let currentStudentName = form.studentName;
    let currentStudent = null;

    if (studentQuery.trim()) {
      const q = studentQuery.trim().toLowerCase();
      const match = students.find(
        (s) =>
          s.name.toLowerCase() === q ||
          s.scholarNumber?.toLowerCase() === q ||
          q.startsWith(s.name.toLowerCase())
      );
      if (match) {
        currentStudentId = match.id;
        currentStudentName = match.name;
        currentStudent = match;
      } else {
        currentStudentName = studentQuery.trim();
        if (!currentStudentId) currentStudentId = `student-${currentStudentName}`;
      }
    }

    const next = {};
    if (!form.name.trim()) next.name = "Required";
    if (!form.purpose) next.purpose = "Required";
    if (needsStudent && !currentStudentId && !currentStudentName) {
      next.student = "Please select or enter student name";
    }
    if (needsStudent && !form.relation) next.relation = "Required";
    if (
      form.purpose === "Meet Staff" &&
      (currentStudentId || currentStudentName) &&
      !form.relation
    ) {
      next.relation = "Required";
    }
    if (form.purpose === "Meet Staff" && !form.whomToMeet.trim()) {
      next.whomToMeet = "Required";
    }
    setErrors(next);
    if (Object.keys(next).length) return;

    const payload = {
      ...form,
      studentName: currentStudentName || form.studentName,
      studentId: currentStudentId || form.studentId,
      ...(currentStudent
        ? {
            studentId: currentStudent.id,
            studentName: currentStudent.name,
            className: currentStudent.className,
            section: currentStudent.section || "",
            scholarNumber: currentStudent.scholarNumber,
          }
        : {}),
      whomToMeet: form.purpose === "Meet Student" ? "" : form.whomToMeet,
    };
    if (editingId) {
      updateVisitor({
        ...payload,
        id: editingId,
        checkOut: editing?.checkOut ?? null,
      });
      setSelectedId(editingId);
    } else {
      addVisitor({ ...payload, checkOut: null });
    }
    closeForm();
  };

  const formatCheckInOut = (value) => {
    if (!value) return "—";
    return formatDateTimeDMY(value);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Visitor Log</h2>
          <p className="text-sm text-gray-500">
            Record walk-in visitors and manage check-in / check-out.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ImportExportButtons
            onImport={handleImportVisitors}
            onExport={handleExportVisitors}
          />
          <button type="button" className={btnPrimary} onClick={openCreate}>
            + Log Visitor
          </button>
        </div>
      </div>

      <div className="rounded-lg bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Field label="Period">
            <select
              className={selectClass}
              value={rangePreset}
              onChange={(e) => setRangePreset(e.target.value)}
            >
              {RANGE_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Search Name / Student">
            <SuggestSearch
              value={searchName}
              onChange={setSearchName}
              suggestions={visitorNameSuggestions}
              placeholder="Search visitor or student..."
            />
          </Field>
          <Field label="Purpose">
            <select
              className={selectClass}
              value={filterPurpose}
              onChange={(e) => setFilterPurpose(e.target.value)}
            >
              <option value="">All Purposes</option>
              {VISITOR_PURPOSES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Whom to Meet">
            <SuggestSearch
              value={filterWhomToMeet}
              onChange={setFilterWhomToMeet}
              suggestions={whomToMeetSuggestions}
              placeholder="Person or office..."
            />
          </Field>
          {rangePreset === "custom" ? (
            <>
              <Field label="From">
                <input
                  type="date"
                  className={inputClass}
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                />
              </Field>
              <Field label="To">
                <input
                  type="date"
                  className={inputClass}
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                />
              </Field>
            </>
          ) : null}
        </div>
      </div>

      <BulkActionBar
        count={selectedIds.length}
        label={selectedIds.length === 1 ? "visitor selected" : "visitors selected"}
        onClear={() => setSelectedIds([])}
        onDelete={() => setConfirmBulkDelete(true)}
      />

      <div className="overflow-hidden rounded-lg bg-white shadow-sm border border-gray-200">
        <div className="border-b border-gray-100 bg-white px-5 py-3 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <span className="text-gray-500 font-medium">Row Per Page</span>
            <RowPerPageSelect
              value={pageSize}
              onChange={(sz) => {
                setPageSize(sz);
                setCurrentPage(1);
              }}
            />
            <span className="text-gray-500 font-medium">Entries</span>
          </div>
        </div>
        {list.length === 0 ? (
          <div className="p-6">
            <EmptyState message="No visitors match your filters." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="w-10 px-3 py-3">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleSelectAllVisible}
                      aria-label="Select all"
                    />
                  </th>
                  <th className="px-3 py-3">Name</th>
                  <th className="px-3 py-3">Relation</th>
                  <th className="px-3 py-3">Purpose</th>
                  <th className="px-3 py-3">Student</th>
                  <th className="px-3 py-3">Whom to Meet</th>
                  <th className="px-3 py-3">Check-in</th>
                  <th className="px-3 py-3">Check-out</th>
                </tr>
              </thead>
              <tbody>
                {paginatedList.map((v) => {
                  const checked = selectedIds.includes(v.id);
                  return (
                    <tr
                      key={v.id}
                      className={`cursor-pointer border-t border-gray-100 hover:bg-gray-50 ${
                        checked ? "bg-green-50/50" : ""
                      }`}
                      onClick={() => setSelectedId(v.id)}
                    >
                      <td
                        className="px-3 py-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleSelect(v.id)}
                          aria-label={`Select ${v.name}`}
                        />
                      </td>
                      <td className="px-3 py-3 font-medium">
                        {v.name}
                        {v.contact ? <span className="block text-xs font-normal text-gray-500">{formatPhone(v.contact)}</span> : null}
                      </td>
                      <td className="px-3 py-3">{v.relation || "—"}</td>
                      <td className="px-3 py-3">{v.purpose}</td>
                      <td className="px-3 py-3">
                        {v.studentName ? (
                          <span>
                            {v.studentName}
                            <span className="block text-xs text-gray-500">
                              {[
                                v.className,
                                v.section ? `Sec ${v.section}` : "",
                                v.scholarNumber,
                              ]
                                .filter(Boolean)
                                .join(" · ")}
                            </span>
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-3 py-3">
                        {v.purpose === "Meet Student"
                          ? "—"
                          : v.whomToMeet || "—"}
                      </td>
                      <td className="px-3 py-3">{formatCheckInOut(v.checkIn)}</td>
                      <td className="px-3 py-3">
                        {v.checkOut ? (
                          formatCheckInOut(v.checkOut)
                        ) : (
                          <button
                            type="button"
                            className="text-sm font-medium text-green-700 hover:underline"
                            onClick={(e) => {
                              e.stopPropagation();
                              checkOutVisitor(v.id, nowLocal());
                            }}
                          >
                            Check Out
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>

      <Modal
        open={showForm}
        title={editingId ? "Edit Visitor" : "Log Visitor"}
        onClose={closeForm}
      >
        <form className="space-y-4" onSubmit={submit}>
          <Field label="Visitor Name" required error={errors.name}>
            <input
              className={inputClass}
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
            />
          </Field>

          <Field label="Contact Number">
            <PhoneInput
              value={form.contact}
              onChange={(val) => set("contact", val)}
              placeholder="Enter contact number"
            />
          </Field>

          <Field label="Purpose of Visit" required>
            <select
              className={selectClass}
              value={form.purpose}
              onChange={(e) => setPurpose(e.target.value)}
            >
              {VISITOR_PURPOSES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </Field>

          {showStudentFields ? (
            <>
              <Field
                label="Relation to Student"
                required={needsStudent || !!form.studentId}
                error={errors.relation}
              >
                <select
                  className={selectClass}
                  value={form.relation}
                  onChange={(e) => set("relation", e.target.value)}
                >
                  <option value="">— Select —</option>
                  {VISITOR_RELATIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </Field>

              <Field
                label="Student"
                required={needsStudent}
                error={errors.student}
              >
                {form.studentId || form.studentName ? (
                  <div className="flex items-center justify-between rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
                    <span className="font-semibold text-gray-900">{form.studentName || formatStudentLabel(form)}</span>
                    <button
                      type="button"
                      className="text-sm font-medium text-red-600 hover:underline"
                      onClick={clearStudent}
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <>
                    <input
                      className={inputClass}
                      value={studentQuery}
                      onChange={(e) => setStudentQuery(e.target.value)}
                      placeholder={
                        needsStudent
                          ? "Search name or scholar number"
                          : "Optional — search if about a student"
                      }
                    />
                    {studentMatches.length > 0 ? (
                      <ul className="mt-1 overflow-hidden rounded-md border border-gray-200 bg-white">
                        {studentMatches.map((s) => (
                          <li key={s.id}>
                            <button
                              type="button"
                              className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                              onClick={() => selectStudent(s)}
                            >
                              {formatStudentLabel(s)}
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </>
                )}
              </Field>
            </>
          ) : null}

          {showWhomToMeet ? (
            <Field
              label="Whom to Meet"
              required={form.purpose === "Meet Staff"}
              error={errors.whomToMeet}
            >
              <input
                className={inputClass}
                list="staff-meet"
                value={form.whomToMeet}
                onChange={(e) => set("whomToMeet", e.target.value)}
                placeholder="Teacher, staff, or office"
              />
              <datalist id="staff-meet">
                {staff.map((s) => (
                  <option key={s.id} value={s.name} />
                ))}
              </datalist>
            </Field>
          ) : null}

          {!editingId ? (
            <Field label="Check-in Time">
              <input
                type="datetime-local"
                className={inputClass}
                value={form.checkIn}
                onChange={(e) => set("checkIn", e.target.value)}
              />
            </Field>
          ) : (
            <>
              <Field label="Check-in Time">
                <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700 cursor-not-allowed">
                  {formatCheckInOut(form.checkIn)}
                </div>
              </Field>
              {editing?.checkOut ? (
                <Field label="Check-out Time">
                  <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700 cursor-not-allowed">
                    {formatCheckInOut(editing.checkOut)}
                  </div>
                </Field>
              ) : null}
            </>
          )}

          <Field label="Remarks">
            <textarea
              className={inputClass}
              rows={2}
              value={form.remarks}
              onChange={(e) => set("remarks", e.target.value)}
            />
          </Field>

          <div className="flex justify-end gap-2">
            <button type="button" className={btnSecondary} onClick={closeForm}>
              Cancel
            </button>
            <button type="submit" className={btnPrimary}>
              {editingId ? "Update" : "Save"}
            </button>
          </div>
        </form>
      </Modal>

      <SlideOver
        open={!!selected}
        title="Visitor Detail"
        onClose={() => setSelectedId(null)}
      >
        {selected ? (
          <VisitorDetail
            visitor={selected}
            onClose={() => setSelectedId(null)}
            onEdit={() => openEdit(selected)}
            onDelete={(id) => setConfirmDeleteId(id)}
            onCheckOut={(id, time) => {
              checkOutVisitor(id, time);
            }}
          />
        ) : null}
      </SlideOver>

      <ConfirmModal
        open={confirmBulkDelete}
        title="Delete visitors"
        message={`Delete ${selectedIds.length} visitor${
          selectedIds.length === 1 ? "" : "s"
        }? This cannot be undone.`}
        confirmLabel="Delete"
        onClose={() => setConfirmBulkDelete(false)}
        onConfirm={handleBulkDelete}
      />

      <ConfirmModal
        open={!!confirmDeleteId}
        title="Delete visitor"
        message="Delete this visitor record? This cannot be undone."
        confirmLabel="Delete"
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={handleSingleDelete}
      />

      <ExportModal
        open={showExportModal}
        onClose={() => setShowExportModal(false)}
        totalCount={list.length}
        selectedCount={selectedIds.length}
        onExportCsv={handleExportCsv}
        onExportPdf={handleExportPdf}
      />
    </div>
  );
}
