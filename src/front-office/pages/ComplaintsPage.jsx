import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useFrontOffice } from "../context/FrontOfficeContext";
import {
  COMPLAINT_NATURES,
  COMPLAINT_STATUSES,
  COMPLAINT_SOURCES,
  complaintSourceLabel,
  complaintRelationLabel,
  parseComplaintSource,
  formatStudentLabel,
  formatDateDMY,
  todayISO,
  smartSearchMatch,
} from "../data/seed";
import {
  EmptyState,
  Field,
  SlideOver,
  StatusBadge,
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

function ComplaintDetail({ complaint, onClose, onSave, onEdit, onDelete }) {
  const [status, setStatus] = useState(complaint.status);
  const [notes, setNotes] = useState(complaint.resolutionNotes || "");
  const [saved, setSaved] = useState(false);

  const dirty =
    status !== complaint.status ||
    notes !== (complaint.resolutionNotes || "");

  return (
    <div className="space-y-4 text-sm">
      <div className="flex flex-wrap gap-2">
        <StatusBadge status={status} />
        <StatusBadge status={complaintSourceLabel(complaint)} />
      </div>

      <dl className="grid grid-cols-2 gap-3">
        <div>
          <dt className="text-gray-500">Complainant Name</dt>
          <dd className="font-medium">{complaint.complainantName}</dd>
        </div>
        {complaintRelationLabel(complaint) ? (
          <div>
            <dt className="text-gray-500">Relation to student</dt>
            <dd className="font-medium">{complaintRelationLabel(complaint)}</dd>
          </div>
        ) : null}
        <div>
          <dt className="text-gray-500">Mobile Number</dt>
          <dd className="font-medium">{complaint.contact || "—"}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Student</dt>
          <dd className="font-medium">
            {complaint.studentName
              ? formatStudentLabel(complaint)
              : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-gray-500">Source</dt>
          <dd className="font-medium">{complaintSourceLabel(complaint)}</dd>
        </div>
        {complaint.mode === "Offline" && complaint.recordedBy ? (
          <div>
            <dt className="text-gray-500">Recorded by</dt>
            <dd className="font-medium">{complaint.recordedBy}</dd>
          </div>
        ) : null}
        <div className="col-span-2">
          <dt className="text-gray-500">Nature of Complaint</dt>
          <dd className="font-medium">
            {complaint.nature === "Others"
              ? complaint.natureOther || "Others"
              : complaint.nature}
          </dd>
        </div>
      </dl>

      <div>
        <p className="text-gray-500">Brief Discussion</p>
        <p className="mt-1 rounded-md bg-gray-50 p-3 text-gray-700">
          {complaint.description}
        </p>
      </div>

      <Field label="Status">
        <select
          className={selectClass}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setSaved(false);
          }}
        >
          {COMPLAINT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Resolution Notes">
        <textarea
          className={inputClass}
          rows={3}
          value={notes}
          onChange={(e) => {
            setNotes(e.target.value);
            setSaved(false);
          }}
        />
      </Field>

      {saved ? <p className="text-sm text-green-700">Saved.</p> : null}

      <div className="flex flex-wrap justify-end gap-2 border-t border-gray-100 pt-4">
        <button
          type="button"
          className="rounded-md border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
          onClick={() => onDelete(complaint.id)}
        >
          Delete
        </button>
        <button type="button" className={btnSecondary} onClick={onEdit}>
          Edit
        </button>
        <button type="button" className={btnSecondary} onClick={onClose}>
          Close
        </button>
        <button
          type="button"
          className={`${btnPrimary} disabled:cursor-not-allowed disabled:opacity-50`}
          disabled={!dirty}
          onClick={() => {
            onSave({ id: complaint.id, status, resolutionNotes: notes });
            setSaved(true);
          }}
        >
          Update
        </button>
      </div>
    </div>
  );
}

export default function ComplaintsPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { complaints, addComplaint, updateComplaint, deleteComplaint, deleteComplaints } =
    useFrontOffice();
  const selectedId = params.get("open");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterNature, setFilterNature] = useState("");
  const [filterSource, setFilterSource] = useState("");
  const [search, setSearch] = useState("");
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  useEffect(() => {
    setSelectedIds([]);
  }, [filterStatus, filterNature, filterSource, search]);

  const selected = complaints.find((c) => c.id === selectedId) || null;

  const openDetail = (id) => {
    const next = new URLSearchParams(params);
    next.set("open", id);
    setParams(next, { replace: true });
  };

  const closeDetail = () => {
    if (!params.get("open")) return;
    const next = new URLSearchParams(params);
    next.delete("open");
    setParams(next, { replace: true });
  };

  const list = useMemo(() => {
    return complaints.filter((c) => {
      if (filterStatus && c.status !== filterStatus) return false;
      if (filterNature && c.nature !== filterNature) return false;
      if (filterSource && complaintSourceLabel(c) !== filterSource) return false;
      if (search.trim()) {
        const isMatch = smartSearchMatch(c, search, [
          "complainantName",
          "contact",
          "studentName",
          "scholarNumber",
          "description",
          (item) => complaintSourceLabel(item),
        ]);
        if (!isMatch) return false;
      }
      return true;
    });
  }, [complaints, filterStatus, filterNature, filterSource, search]);

  const complaintCsvColumns = [
    { key: "complainantName", label: "Complainant Name" },
    {
      key: "relation",
      label: "Relation to Student",
      get: (c) => complaintRelationLabel(c),
    },
    { key: "contact", label: "Contact" },
    { key: "studentName", label: "Student Name" },
    { key: "scholarNumber", label: "Scholar Number" },
    { key: "className", label: "Class" },
    { key: "section", label: "Section" },
    { key: "nature", label: "Nature" },
    { key: "natureOther", label: "Nature Other" },
    { key: "description", label: "Brief Discussion" },
    {
      key: "source",
      label: "Source",
      get: (c) => complaintSourceLabel(c),
    },
    { key: "mode", label: "Mode" },
    { key: "raisedBy", label: "Raised By" },
    { key: "recordedBy", label: "Recorded By" },
    { key: "status", label: "Status" },
    { key: "resolutionNotes", label: "Resolution Notes" },
    { key: "createdAt", label: "Date" },
  ];

  const handleExportComplaints = () => {
    setShowExportModal(true);
  };

  const getExportRecords = () => {
    if (selectedIds.length > 0) {
      return complaints.filter((c) => selectedIds.includes(c.id));
    }
    return list;
  };

  const handleExportCsv = () => {
    const dataToExport = getExportRecords();
    downloadCsv(
      `complaints-${todayISO()}.csv`,
      toCsv(dataToExport, complaintCsvColumns)
    );
  };

  const handleExportPdf = () => {
    const dataToExport = getExportRecords();
    exportToPdf(
      "Complaints Register Report",
      "School Front Office Management System",
      complaintCsvColumns,
      dataToExport
    );
  };

  const handleImportComplaints = async () => {
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
        const complainantName =
          row["Complainant Name"] || row.complainantName || "";
        const description =
          row["Brief Discussion"] || row.description || row.Description || "";
        if (!complainantName.trim() || !description.trim()) return;
        addComplaint({
          complainantName: complainantName.trim(),
          relation: row.Relation || row.relation || "Father",
          contact: row.Contact || row.contact || "",
          studentId: "",
          studentName: row["Student Name"] || row.studentName || "",
          scholarNumber: row["Scholar Number"] || row.scholarNumber || "",
          className: row.Class || row.className || "",
          section: row.Section || row.section || "",
          nature: row.Nature || row.nature || "Others",
          natureOther: row["Nature Other"] || row.natureOther || "",
          description: description.trim(),
          ...(() => {
            const source =
              row.Source || row.source || row.Mode || row.mode || "Offline";
            if (
              COMPLAINT_SOURCES.includes(source) ||
              source === "Offline · Guardian" ||
              source === "Offline · Parent" ||
              source === "Online · Parent"
            ) {
              const normalized =
                source === "Offline · Guardian" || source === "Offline · Parent"
                  ? "Offline · Parent / Guardian"
                  : source === "Online · Parent"
                    ? "Online · Parent / Guardian"
                    : source;
              return parseComplaintSource(normalized);
            }
            if (String(source).toLowerCase() === "offline") {
              const rel = row.Relation || row.relation || "";
              return {
                mode: "Offline",
                raisedBy: "Front Office",
                ...(rel === "Student" ? { relation: "Student" } : {}),
              };
            }
            if (String(source).toLowerCase().includes("online")) {
              const raised =
                row["Raised By"] || row.raisedBy || "Parent";
              return {
                mode: "Online",
                raisedBy: raised === "Student" ? "Student" : "Parent",
              };
            }
            return { mode: "Offline", raisedBy: "Front Office" };
          })(),
          recordedBy: row["Recorded By"] || row.recordedBy || "",
          status: row.Status || row.status || "New",
          resolutionNotes:
            row["Resolution Notes"] || row.resolutionNotes || "",
          createdAt: row.Date || row.createdAt || todayISO(),
        });
        added += 1;
      });
      window.alert(
        added
          ? `Imported ${added} complaint${added === 1 ? "" : "s"}.`
          : "No valid rows to import. Need Complainant Name and Brief Discussion."
      );
    } catch {
      window.alert("Could not read the CSV file.");
    }
  };

  const visibleIds = list.map((c) => c.id);
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
    if (selectedId && selectedIds.includes(selectedId)) closeDetail();
    deleteComplaints(selectedIds);
    setSelectedIds([]);
    setConfirmBulkDelete(false);
  };

  const handleSingleDelete = () => {
    if (!confirmDeleteId) return;
    deleteComplaint(confirmDeleteId);
    if (selectedId === confirmDeleteId) closeDetail();
    setSelectedIds((prev) => prev.filter((id) => id !== confirmDeleteId));
    setConfirmDeleteId(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Complaint Register</h2>
          <p className="text-sm text-gray-500">
            Desk entries plus complaints from Student and Parent ERP.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ImportExportButtons
            onImport={handleImportComplaints}
            onExport={handleExportComplaints}
          />
          <button
            type="button"
            className={btnPrimary}
            onClick={() => navigate("/front-office/complaints/new")}
          >
            + Register Offline
          </button>
        </div>
      </div>

      <div className="rounded-lg bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Field label="Search">
            <input
              className={inputClass}
              placeholder="Name, phone, or student..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </Field>
          <Field label="Status">
            <select
              className={selectClass}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">All</option>
              {COMPLAINT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Nature">
            <select
              className={selectClass}
              value={filterNature}
              onChange={(e) => setFilterNature(e.target.value)}
            >
              <option value="">All</option>
              {COMPLAINT_NATURES.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Source">
            <select
              className={selectClass}
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value)}
            >
              <option value="">All</option>
              {COMPLAINT_SOURCES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </div>

      <BulkActionBar
        count={selectedIds.length}
        label={
          selectedIds.length === 1 ? "complaint selected" : "complaints selected"
        }
        onClear={() => setSelectedIds([])}
        onDelete={() => setConfirmBulkDelete(true)}
      />

      <div className="overflow-hidden rounded-lg bg-white shadow-sm">
        {list.length === 0 ? (
          <div className="p-6">
            <EmptyState message="No complaints found." />
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
                  <th className="px-3 py-3">Complainant Name</th>
                  <th className="px-3 py-3">Relation to student</th>
                  <th className="px-3 py-3">Student</th>
                  <th className="px-3 py-3">Nature of Complaint</th>
                  <th className="px-3 py-3">Source</th>
                  <th className="px-3 py-3">Date</th>
                  <th className="px-3 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {list.map((c) => {
                  const checked = selectedIds.includes(c.id);
                  const relation = complaintRelationLabel(c);
                  return (
                    <tr
                      key={c.id}
                      className={`cursor-pointer border-t border-gray-100 hover:bg-gray-50 ${
                        checked ? "bg-green-50/50" : ""
                      }`}
                      onClick={() => openDetail(c.id)}
                    >
                      <td
                        className="px-3 py-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleSelect(c.id)}
                          aria-label={`Select ${c.complainantName}`}
                        />
                      </td>
                      <td className="px-3 py-3 font-medium text-gray-900">
                        {c.complainantName}
                        {c.contact ? <span className="block text-xs font-normal text-gray-500">{formatPhone(c.contact)}</span> : null}
                      </td>
                      <td className="px-3 py-3">{relation || "—"}</td>
                      <td className="px-3 py-3">
                        {c.studentName ? (
                          <span>
                            {c.studentName}
                            <span className="block text-xs text-gray-500">
                              {[
                                c.scholarNumber,
                                c.className,
                                c.section ? `Sec ${c.section}` : "",
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
                        {c.nature === "Others"
                          ? c.natureOther || "Others"
                          : c.nature}
                      </td>
                      <td className="px-3 py-3">
                        <StatusBadge status={complaintSourceLabel(c)} />
                      </td>
                      <td className="px-3 py-3">{formatDateDMY(c.createdAt)}</td>
                      <td className="px-3 py-3">
                        <StatusBadge status={c.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <SlideOver
        open={!!selected}
        title="Complaint Detail"
        onClose={closeDetail}
      >
        {selected ? (
          <ComplaintDetail
            key={selected.id}
            complaint={selected}
            onClose={closeDetail}
            onSave={updateComplaint}
            onEdit={() =>
              navigate(`/front-office/complaints/${selected.id}/edit`)
            }
            onDelete={(id) => setConfirmDeleteId(id)}
          />
        ) : null}
      </SlideOver>

      <ConfirmModal
        open={confirmBulkDelete}
        title="Delete complaints"
        message={`Delete ${selectedIds.length} complaint${
          selectedIds.length === 1 ? "" : "s"
        }? This cannot be undone.`}
        confirmLabel="Delete"
        onClose={() => setConfirmBulkDelete(false)}
        onConfirm={handleBulkDelete}
      />

      <ConfirmModal
        open={!!confirmDeleteId}
        title="Delete complaint"
        message="Delete this complaint? This cannot be undone."
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
