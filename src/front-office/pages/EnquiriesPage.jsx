import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useFrontOffice } from "../context/FrontOfficeContext";
import {
  LEAD_TYPES,
  ADMISSION_STATUSES,
  CALL_OUTCOMES,
  formatFollowUpWhen,
  getNextFollowUpDate,
  formatDateDMY,
  todayISO,
  smartSearchMatch,
} from "../data/seed";
import {
  EmptyState,
  Field,
  Modal,
  Pagination,
  RowPerPageSelect,
  SlideOver,
  StatusBadge,
  DateInput,
  ExportModal,
  exportToPdf,
  formatPhone,
  btnPrimary,
  btnSecondary,
  inputClass,
  selectClass,
} from "../components/ui";
import BulkActionBar from "../components/BulkActionBar";
import ConfirmModal from "../components/ConfirmModal";
import ImportExportButtons from "../components/ImportExportButtons";
import { downloadCsv, pickFile, readCsvFile, toCsv } from "../utils/csv";
import {
  CallTimePicker,
  emptyCallTime,
  validateCallTime,
} from "../components/CallTimePicker";

function addDays(isoDate, days) {
  const d = new Date(isoDate + "T12:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function FollowUpForm({ onSubmit, initial }) {
  const [decisionDays, setDecisionDays] = useState(initial?.decisionDays || 3);
  const [custom, setCustom] = useState(false);
  const [dateToCall, setDateToCall] = useState(
    initial?.dateToCall || addDays(todayISO(), 3)
  );
  const [callTime, setCallTime] = useState(() =>
    initial ? { ...emptyCallTime(), ...initial } : emptyCallTime()
  );
  const [notes, setNotes] = useState(initial?.notes || "");
  const [outcome, setOutcome] = useState(initial?.outcome || "Not Called Yet");
  const [nextDate, setNextDate] = useState(addDays(todayISO(), 3));
  const [error, setError] = useState("");

  const pickDays = (n) => {
    setCustom(false);
    setDecisionDays(n);
    setDateToCall(addDays(todayISO(), n));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!dateToCall) {
      setError("Date to call is required.");
      return;
    }
    const timeErr = validateCallTime(callTime);
    if (timeErr) {
      setError(timeErr);
      return;
    }
    if (outcome === "Needs Another Follow-up" && !nextDate) {
      setError("Set the next follow-up date.");
      return;
    }
    onSubmit({
      decisionDays: custom ? null : decisionDays,
      dateToCall,
      ...callTime,
      notes,
      outcome,
      nextFollowUpDate:
        outcome === "Needs Another Follow-up" ? nextDate : null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <p className="mb-2 text-sm font-medium text-gray-800">
          Decision timeframe
        </p>
        <div className="flex flex-wrap gap-2">
          {[3, 4, 5, 7].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => pickDays(n)}
              className={`rounded-md px-3 py-1.5 text-sm ${
                !custom && decisionDays === n
                  ? "bg-green-700 text-white"
                  : "border border-gray-300 bg-white text-gray-700"
              }`}
            >
              {n} days
            </button>
          ))}
          <button
            type="button"
            onClick={() => setCustom(true)}
            className={`rounded-md px-3 py-1.5 text-sm ${
              custom
                ? "bg-green-700 text-white"
                : "border border-gray-300 bg-white text-gray-700"
            }`}
          >
            Custom
          </button>
        </div>
      </div>

      <Field label="Date to call" required>
        <DateInput
          value={dateToCall}
          onChange={(val) => {
            setCustom(true);
            setDateToCall(val);
          }}
        />
      </Field>

      <CallTimePicker value={callTime} onChange={setCallTime} />

      <Field label="Follow-up notes">
        <textarea
          className={inputClass}
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="What was discussed?"
        />
      </Field>

      <Field label="Call outcome" required>
        <select
          className={selectClass}
          value={outcome}
          onChange={(e) => setOutcome(e.target.value)}
        >
          {CALL_OUTCOMES.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </Field>

      {outcome === "Needs Another Follow-up" ? (
        <Field label="Next follow-up date" required>
          <DateInput
            value={nextDate}
            onChange={(val) => setNextDate(val)}
          />
        </Field>
      ) : null}

      {error ? <p className="text-sm text-red-500">{error}</p> : null}

      <button type="submit" className={btnPrimary}>
        Save follow-up
      </button>
    </form>
  );
}

function GuardianLines({ enquiry }) {
  const primary = enquiry.guardianName || enquiry.parentName || "";
  if (!primary) return <span className="text-gray-400">—</span>;
  return (
    <p className="leading-snug text-gray-900">
      <span className="font-medium">{primary}</span>
      {enquiry.guardianRelation ? (
        <span className="text-gray-500"> · {enquiry.guardianRelation}</span>
      ) : null}
    </p>
  );
}

function admissionLink(token) {
  if (!token || typeof window === "undefined") return "";
  return `${window.location.origin}/admission/${token}`;
}

export default function EnquiriesPage() {
  const navigate = useNavigate();
  const {
    enquiries,
    classes,
    deleteEnquiries,
    addEnquiry,
    addFollowUp,
    approveAdmission,
    sendAdmissionForm,
    requestAdmissionCorrections,
    verifyAdmission,
    createAdmissionAccounts,
    customFields,
  } = useFrontOffice();
  const [params, setParams] = useSearchParams();
  const [selectedId, setSelectedId] = useState(params.get("open") || null);
  const [followUpFor, setFollowUpFor] = useState(params.get("followUp") || null);
  const [approveId, setApproveId] = useState(null);
  const [correctionNotes, setCorrectionNotes] = useState("");
  const [showCorrections, setShowCorrections] = useState(false);
  const [correctionForId, setCorrectionForId] = useState(null);
  const [correctionError, setCorrectionError] = useState("");
  const [showCorrectionSent, setShowCorrectionSent] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCredentials, setCopiedCredentials] = useState(false);
  const [accountInfo, setAccountInfo] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [search, setSearch] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterLeadType, setFilterLeadType] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showExportModal, setShowExportModal] = useState(false);

  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds([]);
  }, [search, filterClass, filterStatus, filterLeadType]);

  useEffect(() => {
    const open = params.get("open");
    if (open) setSelectedId(open);
    const fu = params.get("followUp");
    if (fu) setFollowUpFor(fu);
  }, [params]);

  const className = (id) => {
    if (!id) return "—";
    const found = classes.find(
      (c) => c.id === id || c.name === id || c.id === `class-${id}`.toLowerCase() || c.name.toLowerCase() === String(id).toLowerCase()
    );
    return found?.name || id || "—";
  };

  const closeFollowUp = () => {
    setFollowUpFor(null);
    const nextParams = new URLSearchParams(params);
    nextParams.delete("followUp");
    setParams(nextParams);
  };

  const handleFollowUpSave = (data) => {
    if (!followUpFor) return;
    addFollowUp(followUpFor, {
      decisionDays: data.decisionDays,
      dateToCall: data.dateToCall,
      timeType: data.timeType || "",
      timeToCall: data.timeToCall || "",
      timeToCallEnd: data.timeToCallEnd || "",
      notes: data.notes,
      outcome: data.outcome,
    });
    if (data.nextFollowUpDate) {
      addFollowUp(followUpFor, {
        decisionDays: null,
        dateToCall: data.nextFollowUpDate,
        notes: "Chained follow-up",
        outcome: "Not Called Yet",
      });
    }
    closeFollowUp();
  };

  const filtered = useMemo(() => {
    return enquiries.filter((e) => {
      if (search.trim()) {
        const isMatch = smartSearchMatch(e, search, [
          "studentName",
          "parentName",
          "guardianName",
          "contact",
          "parentMobile",
          "parentEmail",
          "studentMobile",
          "admissionNumber",
          "className",
          "classId",
        ]);
        if (!isMatch) return false;
      }
      if (filterClass && filterClass !== "all" && filterClass !== "All") {
        const matchClass = classes.find((c) => c.id === filterClass || c.name === filterClass);
        const targetName = matchClass?.name || filterClass;
        const targetId = matchClass?.id || filterClass;
        const eClass = e.className || e.classId;
        if (e.classId !== targetId && e.className !== targetName && eClass !== targetName && eClass !== targetId) {
          return false;
        }
      }
      if (filterStatus && filterStatus !== "all" && filterStatus !== "All" && e.status !== filterStatus) return false;
      if (
        filterLeadType &&
        filterLeadType !== "all" &&
        filterLeadType !== "All" &&
        e.leadType !== filterLeadType &&
        e.lead_temperature !== filterLeadType
      )
        return false;
      return true;
    });
  }, [enquiries, search, filterClass, filterStatus, filterLeadType, classes]);

  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedEnquiries = useMemo(
    () => filtered.slice(startIndex, startIndex + pageSize),
    [filtered, startIndex, pageSize]
  );

  const selected = useMemo(() => {
    if (!selectedId) return null;
    return enquiries.find((e) => e.id === selectedId || e.name === selectedId) || null;
  }, [selectedId, enquiries]);


  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filtered.length) setSelectedIds([]);
    else setSelectedIds(filtered.map((e) => e.id));
  };

  const handleBulkDelete = () => {
    deleteEnquiries(selectedIds);
    setSelectedIds([]);
    setConfirmBulkDelete(false);
    if (selectedIds.includes(selectedId)) {
      setSelectedId(null);
      setParams({});
    }
  };

  const copyLink = async (token) => {
    const url = admissionLink(token);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      window.prompt("Copy admission form link:", url);
    }
  };

  const getParentMobile = (e) => {
    const raw = e.parentMobile || e.contact || e.studentMobile || "";
    return formatPhone(raw);
  };

  const getParentEmail = (e) => {
    const email = String(e.parentEmail || "").trim();
    if (email) return email;
    const contact = String(e.contact || "").trim();
    if (contact.includes("@")) return contact;
    return "";
  };

  const enquiryCsvColumns = [
    { key: "studentName", label: "Student Name" },
    { key: "studentMobile", label: "Student Mobile" },
    { key: "parentName", label: "Parent Name" },
    { key: "guardianRelation", label: "Relation" },
    {
      key: "parentMobile",
      label: "Parent Mobile",
      get: (e) => getParentMobile(e),
    },
    {
      key: "parentEmail",
      label: "Parent Email",
      get: (e) => getParentEmail(e),
    },
    {
      key: "className",
      label: "Class",
      get: (e) => className(e.classId),
    },
    { key: "leadType", label: "Lead Type" },
    { key: "status", label: "Status" },
    { key: "createdAt", label: "Inquiry Date", get: (e) => formatDateDMY(e.createdAt) },
  ];

  const handleExportEnquiries = () => {
    setShowExportModal(true);
  };

  const getExportRecords = () => {
    if (selectedIds.length > 0) {
      return enquiries.filter((e) => selectedIds.includes(e.id));
    }
    return filtered;
  };

  const handleExportCsv = () => {
    const dataToExport = getExportRecords();
    downloadCsv(
      `admission-inquiries-${todayISO()}.csv`,
      toCsv(dataToExport, enquiryCsvColumns)
    );
  };

  const handleExportPdf = () => {
    const dataToExport = getExportRecords();
    exportToPdf(
      "Admission Inquiry Report",
      "School Front Office Management System",
      enquiryCsvColumns,
      dataToExport
    );
  };

  const handleImportEnquiries = async () => {
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
        const studentName = (
          row["Student Name"] ||
          row.studentName ||
          row.Student ||
          ""
        ).trim();
        if (!studentName) return;

        const classLabel = (
          row.Class ||
          row.className ||
          row["Class Name"] ||
          ""
        ).trim();
        const matchedClass = classes.find(
          (c) => c.name.toLowerCase() === classLabel.toLowerCase()
        );

        const parentMobile = String(
          row["Parent Mobile"] || row.parentMobile || row.Mobile || ""
        ).replace(/\D/g, "");
        const parentEmail = String(
          row["Parent Email"] || row.parentEmail || row.Email || ""
        ).trim();
        const studentMobile = String(
          row["Student Mobile"] || row.studentMobile || ""
        ).replace(/\D/g, "");

        addEnquiry({
          studentName,
          studentMobile: studentMobile.slice(0, 10),
          parentName: (
            row["Parent Name"] ||
            row.parentName ||
            row.Parent ||
            ""
          ).trim(),
          guardianRelation: (
            row.Relation ||
            row.guardianRelation ||
            row["Guardian Relation"] ||
            ""
          ).trim(),
          parentMobile: parentMobile.slice(0, 10),
          parentEmail,
          contact: parentMobile.slice(0, 10) || parentEmail,
          classId: matchedClass?.id || classes[0]?.id || "",
          leadType: row["Lead Type"] || row.leadType || "Warm Lead",
          status: row.Status || row.status || "Inquiry",
          referral: "Walk-in",
          followUps: [],
          customValues: {},
          converted: false,
        });
        added += 1;
      });
      window.alert(
        added
          ? `Imported ${added} inquir${added === 1 ? "y" : "ies"}.`
          : "No valid rows to import. Need Student Name."
      );
    } catch {
      window.alert("Could not read the CSV file.");
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Admission Inquiry</h2>
          <p className="mt-1 text-sm text-gray-500">
            Track and manage student admission inquiries and application status.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ImportExportButtons
            onImport={handleImportEnquiries}
            onExport={handleExportEnquiries}
          />
          <button
            type="button"
            className={btnPrimary}
            onClick={() => navigate("/front-office/enquiries/new")}
          >
            + New Inquiry
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-4">
        <div className="min-w-[200px] flex-1">
          <Field label="Search">
            <input
              className={inputClass}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Student, parent, mobile, email…"
            />
          </Field>
        </div>
        <div className="w-40">
          <Field label="Class">
            <select
              className={selectClass}
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
            >
              <option value="">All</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="w-40">
          <Field label="Lead Type">
            <select
              className={selectClass}
              value={filterLeadType}
              onChange={(e) => setFilterLeadType(e.target.value)}
            >
              <option value="">All</option>
              {LEAD_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="w-48">
          <Field label="Status">
            <select
              className={selectClass}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">All</option>
              {ADMISSION_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </div>

      {selectedIds.length > 0 ? (
        <BulkActionBar
          count={selectedIds.length}
          label={selectedIds.length === 1 ? "inquiry selected" : "inquiries selected"}
          onClear={() => setSelectedIds([])}
          onDelete={() => setConfirmBulkDelete(true)}
        />
      ) : null}

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
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
        {filtered.length === 0 ? (
          <EmptyState message="No inquiries found." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-xs font-medium uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-3 py-3">
                    <input
                      type="checkbox"
                      checked={
                        filtered.length > 0 &&
                        selectedIds.length === filtered.length
                      }
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="px-3 py-3">Student</th>
                  <th className="px-3 py-3">Class</th>
                  <th className="px-3 py-3">Parent</th>
                  <th className="px-3 py-3">Mobile</th>
                  <th className="px-3 py-3">Lead</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedEnquiries.map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50/80">
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(e.id)}
                        onChange={() => toggleSelect(e.id)}
                      />
                    </td>
                    <td className="px-3 py-3 font-medium text-gray-900">
                      {e.studentName}
                    </td>
                    <td className="px-3 py-3 text-gray-700">
                      {className(e.classId)}
                    </td>
                    <td className="px-3 py-3">
                      <GuardianLines enquiry={e} />
                    </td>
                    <td className="px-3 py-3 text-gray-600">
                      {getParentMobile(e) || "—"}
                    </td>
                    <td className="px-3 py-3">
                      {e.leadType ? (
                        <StatusBadge status={e.leadType} />
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge status={e.status || "Inquiry"} />
                    </td>
                    <td className="px-3 py-3 text-right">
                      <button
                        type="button"
                        className={btnSecondary}
                        onClick={() => {
                          setSelectedId(e.id);
                          setParams({ open: e.id });
                        }}
                      >
                        Open
                      </button>
                    </td>
                  </tr>
                ))}
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
        open={!!approveId}
        title="Approve Admission"
        onClose={() => setApproveId(null)}
      >
        <p className="mb-4 text-sm text-gray-600">
          Step 2 — mark this inquiry as <strong>Admission Approved</strong>. You
          can then send the parent the secure admission form link.
        </p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            className={btnSecondary}
            onClick={() => setApproveId(null)}
          >
            Cancel
          </button>
          <button
            type="button"
            className={btnPrimary}
            onClick={() => {
              approveAdmission(approveId);
              setApproveId(null);
            }}
          >
            Approve Admission
          </button>
        </div>
      </Modal>

      <Modal
        open={showCorrections}
        title="Request corrections"
        onClose={() => {
          setShowCorrections(false);
          setCorrectionForId(null);
          setCorrectionError("");
          setCorrectionNotes("");
        }}
      >
        <p className="mb-3 text-sm text-gray-600">
          Parent will see these notes on their admission form link and can
          resubmit.
        </p>
        <Field label="What should the parent fix?" error={correctionError}>
          <textarea
            className={`${inputClass} min-h-[90px]`}
            value={correctionNotes}
            onChange={(e) => {
              setCorrectionNotes(e.target.value);
              if (e.target.value.trim()) setCorrectionError("");
            }}
            placeholder="e.g. Upload clearer birth certificate"
          />
        </Field>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            className={btnSecondary}
            onClick={() => {
              setShowCorrections(false);
              setCorrectionForId(null);
              setCorrectionError("");
              setCorrectionNotes("");
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            className={btnPrimary}
            onClick={() => {
              const id = correctionForId || selected?.id;
              if (!id) {
                setCorrectionError("Inquiry not found. Close and try again.");
                return;
              }
              if (!correctionNotes.trim()) {
                setCorrectionError("Please write what needs to be fixed.");
                return;
              }
              requestAdmissionCorrections(id, correctionNotes.trim());
              setShowCorrections(false);
              setCorrectionForId(null);
              setCorrectionError("");
              setCorrectionNotes("");
              setSelectedId(id);
              setShowCorrectionSent(true);
            }}
          >
            Send request
          </button>
        </div>
      </Modal>

      <Modal
        open={showCorrectionSent}
        title="Correction request sent"
        onClose={() => setShowCorrectionSent(false)}
      >
        <p className="text-sm text-gray-600">
          Status is now <strong>Corrections Requested</strong>. The parent can
          open the admission form link, fix the details, and resubmit.
        </p>
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          {selected?.admissionToken ? (
            <button
              type="button"
              className={btnSecondary}
              onClick={() => {
                window.open(
                  admissionLink(selected.admissionToken),
                  "_blank"
                );
              }}
            >
              Open parent form
            </button>
          ) : null}
          <button
            type="button"
            className={btnPrimary}
            onClick={() => setShowCorrectionSent(false)}
          >
            Done
          </button>
        </div>
      </Modal>

      <Modal
        open={!!accountInfo}
        title="Account Credentials"
        onClose={() => setAccountInfo(null)}
      >
        {accountInfo ? (
          <div className="space-y-4 text-sm">
            <p className="text-xs text-gray-500">
              Student and parent login credentials generated successfully.
            </p>

            <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3.5 text-xs">
              <div>
                <h4 className="font-semibold text-gray-900 text-xs mb-2">Student Account</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-gray-500 block font-medium">User ID</span>
                    <span className="font-semibold text-gray-900">{accountInfo.admissionNumber}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block font-medium">Password</span>
                    <span className="font-mono text-gray-900">{accountInfo.studentPassword || "Stud@2026#"}</span>
                  </div>
                </div>
              </div>

              <hr className="border-gray-100" />

              <div>
                <h4 className="font-semibold text-gray-900 text-xs mb-2">Parent Account</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-gray-500 block font-medium">User ID</span>
                    <span className="font-semibold text-gray-900">{accountInfo.parentUsername || accountInfo.parentMobile || accountInfo.parentEmail || "—"}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block font-medium">Password</span>
                    <span className="font-mono text-gray-900">{accountInfo.parentPassword || accountInfo.parentActivationToken || "Parent@2026#"}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                className={btnSecondary}
                onClick={() => {
                  const text = `Student ID: ${accountInfo.admissionNumber}\nPassword: ${accountInfo.studentPassword || "Stud@2026#"}\n\nParent ID: ${accountInfo.parentUsername || "—"}\nPassword: ${accountInfo.parentPassword || "Parent@2026#"}`;
                  navigator.clipboard.writeText(text);
                  alert("Credentials copied to clipboard!");
                }}
              >
                Copy credentials
              </button>
              <button
                type="button"
                className={btnPrimary}
                onClick={() => setAccountInfo(null)}
              >
                Done
              </button>
            </div>
          </div>
        ) : null}
      </Modal>

      <SlideOver
        open={!!selected}
        title={selected ? selected.studentName : ""}
        onClose={() => {
          setSelectedId(null);
          setParams({});
          setCopiedLink(false);
        }}
      >
        {selected ? (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={selected.status || "Inquiry"} />
              {selected.leadType ? (
                <StatusBadge status={selected.leadType} />
              ) : null}
            </div>

            <div className="text-sm">
              <p className="mb-1.5 text-gray-500">Parent / Guardian</p>
              <GuardianLines enquiry={selected} />
            </div>

            <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-gray-500">Class</dt>
                <dd className="font-medium">{className(selected.classId)}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Student mobile</dt>
                <dd className="font-medium">
                  {selected.studentMobile || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Parent mobile</dt>
                <dd className="font-medium">{getParentMobile(selected) || "—"}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Parent email</dt>
                <dd className="font-medium break-all">
                  {getParentEmail(selected) || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Inquiry date</dt>
                <dd className="font-medium">{formatDateDMY(selected.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Next follow-up</dt>
                <dd className="font-medium">
                  {formatDateDMY(getNextFollowUpDate(selected))}
                </dd>
              </div>
              {selected.admissionNumber ? (
                <div>
                  <dt className="text-gray-500">Admission no.</dt>
                  <dd className="font-medium">{selected.admissionNumber}</dd>
                </div>
              ) : null}
              {customFields && customFields.length > 0 ? (
                customFields.map((field) => {
                  const val =
                    selected.customValues?.[field.id] ||
                    selected.customValues?.[field.label] ||
                    (field.id === "cf-garam" ? selected.customValues?.garam : null) ||
                    (field.id === "cf-paani" ? selected.customValues?.paani : null) ||
                    "";
                  if (val === undefined || val === null || val === "") return null;
                  return (
                    <div key={field.id || field.label}>
                      <dt className="text-gray-500">{field.label}</dt>
                      <dd className="font-medium">{String(val)}</dd>
                    </div>
                  );
                })
              ) : selected.customValues && typeof selected.customValues === "object" ? (
                Object.entries(selected.customValues).map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-gray-500">{k}</dt>
                    <dd className="font-medium">{String(v || "—")}</dd>
                  </div>
                ))
              ) : null}
            </dl>

            {(selected.status === "Form Sent" ||
            selected.status === "Corrections Requested" ||
            selected.status === "Corrections Submitted" ||
            selected.status === "Form Submitted" ||
            selected.status === "Verified" ||
            selected.status === "Accounts Created" ||
            selected.admissionToken) ? (
              (() => {
                const token = selected.admissionToken || sendAdmissionForm(selected.id);
                return (
                  <div className="rounded-md border border-gray-200 bg-gray-50 p-3 text-sm">
                    <p className="font-medium text-gray-900">Parent form link</p>
                    <p className="mt-1 break-all text-xs text-gray-600">
                      {admissionLink(token)}
                    </p>
                    <button
                      type="button"
                      className={`${btnSecondary} mt-2`}
                      onClick={() => copyLink(token)}
                    >
                      {copiedLink ? "Copied" : "Copy link"}
                    </button>
                  </div>
                );
              })()
            ) : null}

            {selected.correctionNotes ? (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                <p className="font-medium">Corrections requested</p>
                <p className="mt-1 whitespace-pre-wrap">
                  {selected.correctionNotes}
                </p>
              </div>
            ) : null}

            {selected.status === "Corrections Submitted" ? (
              <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
                <p className="font-medium">Parent submitted corrections</p>
                {selected.correctionsSubmittedAt ? (
                  <p className="mt-1 text-emerald-800">
                    Resubmitted on {selected.correctionsSubmittedAt}
                  </p>
                ) : null}
                {selected.lastCorrectionNotes ? (
                  <p className="mt-2 whitespace-pre-wrap text-emerald-900/80">
                    Previously requested: {selected.lastCorrectionNotes}
                  </p>
                ) : null}
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2">
              {selected.status === "Inquiry" ||
              selected.status === "New" ||
              selected.status === "Follow-up Pending" ? (
                <>
                  <button
                    type="button"
                    className={btnSecondary}
                    onClick={() =>
                      navigate(`/front-office/enquiries/${selected.id}/edit`)
                    }
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className={btnSecondary}
                    onClick={() => setFollowUpFor(selected.id)}
                  >
                    Add follow-up
                  </button>
                  <button
                    type="button"
                    className={btnPrimary}
                    onClick={() => setApproveId(selected.id)}
                  >
                    Approve Admission
                  </button>
                </>
              ) : null}

              {selected.status === "Admission Approved" ? (
                <button
                  type="button"
                  className={btnPrimary}
                  onClick={() => {
                    const token = sendAdmissionForm(selected.id);
                    copyLink(token);
                  }}
                >
                  Send admission form
                </button>
              ) : null}

              {(selected.status === "Form Sent" ||
              selected.status === "Corrections Requested" ||
              selected.status === "Corrections Submitted" ||
              selected.status === "Form Submitted" ||
              selected.status === "Verified" ||
              selected.status === "Accounts Created" ||
              selected.admissionToken) ? (
                (() => {
                  const token = selected.admissionToken || sendAdmissionForm(selected.id);
                  return (
                    <>
                      <button
                        type="button"
                        className={btnSecondary}
                        onClick={() => navigate(`/admission/${token}`)}
                      >
                        Open as parent
                      </button>
                      <button
                        type="button"
                        className={btnSecondary}
                        onClick={() => navigate(`/admission/${token}?preview=1`)}
                      >
                        Open as faculty
                      </button>
                    </>
                  );
                })()
              ) : null}

              {selected.status === "Form Submitted" ||
              selected.status === "Corrections Submitted" ? (
                <>
                  <button
                    type="button"
                    className={btnPrimary}
                    onClick={() => verifyAdmission(selected.id || selected.name)}
                  >
                    Verify & approve
                  </button>
                  <button
                    type="button"
                    className={btnSecondary}
                    onClick={() => {
                      setCorrectionNotes("");
                      setCorrectionError("");
                      setCorrectionForId(selected.id);
                      setShowCorrections(true);
                    }}
                  >
                    Request corrections
                  </button>
                </>
              ) : null}

              {selected.status === "Verified" ? (
                <button
                  type="button"
                  className={btnPrimary}
                  onClick={() => {
                    const enquiryTargetId = selected.id || selected.name;
                    const info = createAdmissionAccounts(enquiryTargetId);
                    setAccountInfo(info);
                  }}
                >
                  Create accounts
                </button>
              ) : null}

              {selected.status === "Accounts Created" ? (
                <button
                  type="button"
                  className={btnPrimary}
                  onClick={() => {
                    const sid = selected.admissionNumber?.startsWith("STU-")
                      ? selected.admissionNumber
                      : `STU-2026-${String(selected.admissionNumber || selected.id).split("-").pop()}`;
                    setAccountInfo({
                      admissionNumber: sid,
                      studentPassword: selected.studentPassword || "Stud@2026#",
                      parentUsername: getParentEmail(selected) || getParentMobile(selected) || "parent@school.edu",
                      parentPassword: selected.parentActivationToken || selected.parentPassword || "Parent@2026#",
                    });
                  }}
                >
                  View credentials
                </button>
              ) : null}
            </div>

            {selected.status === "Accounts Created" ? (
              <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm space-y-3">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                  <h3 className="font-semibold text-gray-900">Account Credentials</h3>
                  <button
                    type="button"
                    className="text-xs font-medium text-green-700 hover:underline"
                    onClick={() => {
                      const sid = selected.admissionNumber?.startsWith("STU-")
                        ? selected.admissionNumber
                        : `STU-2026-${String(selected.admissionNumber || selected.id).split("-").pop()}`;
                      const text = `Student ID: ${sid}\nPassword: ${selected.studentPassword || "Stud@2026#"}\n\nParent ID: ${getParentEmail(selected) || getParentMobile(selected)}\nPassword: ${selected.parentActivationToken || selected.parentPassword || "Parent@2026#"}`;
                      navigator.clipboard.writeText(text);
                      setCopiedCredentials(true);
                      setTimeout(() => setCopiedCredentials(false), 2000);
                    }}
                  >
                    {copiedCredentials ? "Copied!" : "Copy"}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-gray-500 block font-medium">Student ID</span>
                    <span className="font-semibold text-gray-900">
                      {selected.admissionNumber?.startsWith("STU-")
                        ? selected.admissionNumber
                        : `STU-2026-${String(selected.admissionNumber || selected.id).split("-").pop()}`}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 block font-medium">Student Password</span>
                    <span className="font-mono text-gray-900">{selected.studentPassword || "Stud@2026#"}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block font-medium">Parent ID</span>
                    <span className="font-semibold text-gray-900">{getParentEmail(selected) || getParentMobile(selected) || "—"}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block font-medium">Parent Password</span>
                    <span className="font-mono text-gray-900">{selected.parentActivationToken || selected.parentPassword || "Parent@2026#"}</span>
                  </div>
                </div>
              </div>
            ) : null}

            <div>
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-500">
                Follow-up timeline
              </h3>
              {(selected.followUps || []).length === 0 ? (
                <p className="text-sm text-gray-500">No follow-ups yet.</p>
              ) : (
                <ol className="space-y-3 border-l-2 border-green-200 pl-4">
                  {[...selected.followUps]
                    .sort((a, b) =>
                      String(b.createdAt || "").localeCompare(
                        String(a.createdAt || "")
                      )
                    )
                    .map((fu) => (
                      <li key={fu.id} className="relative">
                        <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-green-700" />
                        <p className="text-sm font-medium text-gray-900">
                          {fu.outcome} · {formatFollowUpWhen(fu)}
                        </p>
                        {fu.notes ? (
                          <p className="mt-1 text-sm text-gray-600">{fu.notes}</p>
                        ) : null}
                      </li>
                    ))}
                </ol>
              )}
            </div>
          </div>
        ) : null}
      </SlideOver>

      <Modal
        open={!!followUpFor}
        title="Add follow-up"
        onClose={closeFollowUp}
      >
        <FollowUpForm onSubmit={handleFollowUpSave} />
      </Modal>

      <ConfirmModal
        open={confirmBulkDelete}
        title="Delete inquiries"
        message={`Delete ${selectedIds.length} inquir${
          selectedIds.length === 1 ? "y" : "ies"
        }? This cannot be undone.`}
        confirmLabel="Delete"
        onClose={() => setConfirmBulkDelete(false)}
        onConfirm={handleBulkDelete}
      />

      <ExportModal
        open={showExportModal}
        onClose={() => setShowExportModal(false)}
        totalCount={filtered.length}
        selectedCount={selectedIds.length}
        onExportCsv={handleExportCsv}
        onExportPdf={handleExportPdf}
      />
    </div>
  );
}
