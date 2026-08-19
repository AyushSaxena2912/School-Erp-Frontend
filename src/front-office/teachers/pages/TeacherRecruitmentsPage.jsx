import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronDown, Eye, Link2, UserCheck, UserPlus, X } from "lucide-react";
import { useTeachers } from "../context/TeachersContext";
import { TEACHER_CLASSES, TEACHER_SUBJECTS, TEACHER_SUBJECTS_LIST } from "../data/teachers";

export default function TeacherRecruitmentsPage() {
  const navigate = useNavigate();
  const {
    teachers,
    sendRecruitmentForm,
    requestTeacherCorrections,
    markTeacherHired,
    createTeacherAccount,
    deleteTeacher,
  } = useTeachers();

  // Filters & Views
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [subjectDropdownOpen, setSubjectDropdownOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [viewMode, setViewMode] = useState("table"); // "table" | "pipeline"

  // Modals state
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendEmail, setSendEmail] = useState("");
  const [sendPhone, setSendPhone] = useState("");
  const [sendName, setSendName] = useState("");
  const [sendSubject, setSendSubject] = useState("Physics");
  const [sendMsg, setSendMsg] = useState("Dear Candidate, Please fill out your teacher recruitment and onboarding profile along with educational certificates using the link below.");
  const [generatedLink, setGeneratedLink] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);

  // Correction Modal
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [correctionTarget, setCorrectionTarget] = useState(null);
  const [correctionNotes, setCorrectionNotes] = useState("");
  const [correctionError, setCorrectionError] = useState("");

  // Account Creation Modal
  const [accountTarget, setAccountTarget] = useState(null);
  const [accountClass, setAccountClass] = useState("Class I-A");
  const [accountSubject, setAccountSubject] = useState("Physics");
  const [createdAccountResult, setCreatedAccountResult] = useState(null);
  const [copiedCredentials, setCopiedCredentials] = useState(false);

  // Toast
  const [toast, setToast] = useState("");
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  // Filter candidates (all candidates that have recruitment statuses or flag)
  const recruitmentCandidates = useMemo(() => {
    return teachers.filter((t) => {
      const isRecruitment =
        t.isRecruitmentCandidate ||
        ["Form Sent", "Form Submitted", "Corrections Requested", "Corrections Submitted", "Hired"].includes(t.status) ||
        t.recruitmentToken;
      return isRecruitment;
    });
  }, [teachers]);

  // Counts
  const stats = useMemo(() => {
    const total = recruitmentCandidates.length;
    const sent = recruitmentCandidates.filter((c) => c.status === "Form Sent").length;
    const submitted = recruitmentCandidates.filter((c) => c.status === "Form Submitted").length;
    const corrections = recruitmentCandidates.filter(
      (c) => c.status === "Corrections Requested" || c.status === "Corrections Submitted"
    ).length;
    const hired = recruitmentCandidates.filter((c) => c.status === "Hired").length;
    const active = recruitmentCandidates.filter((c) => c.status === "Active").length;
    return { total, sent, submitted, corrections, hired, active };
  }, [recruitmentCandidates]);

  // Filtered List
  const filteredCandidates = useMemo(() => {
    return recruitmentCandidates.filter((c) => {
      const matchSearch =
        !search.trim() ||
        (c.name || "").toLowerCase().includes(search.toLowerCase()) ||
        (c.email || "").toLowerCase().includes(search.toLowerCase()) ||
        (c.phone || c.primaryContact || "").includes(search) ||
        (c.teacherId || "").toLowerCase().includes(search.toLowerCase()) ||
        (c.subject || "").toLowerCase().includes(search.toLowerCase()) ||
        (c.subjects && c.subjects.some((s) => s.toLowerCase().includes(search.toLowerCase())));

      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "corrections"
          ? c.status === "Corrections Requested" || c.status === "Corrections Submitted"
          : c.status === statusFilter);

      const matchSubject =
        selectedSubjects.length === 0 ||
        selectedSubjects.includes(c.subject) ||
        (c.subjects && c.subjects.some((s) => selectedSubjects.includes(s)));

      return matchSearch && matchStatus && matchSubject;
    });
  }, [recruitmentCandidates, search, statusFilter, selectedSubjects]);

  const getStatusBadge = (status) => {
    switch (status) {
      case "Form Sent":
        return (
          <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200">
            Form Sent
          </span>
        );
      case "Form Submitted":
        return (
          <span className="inline-flex items-center rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-purple-700 border border-purple-200">
            Form Submitted
          </span>
        );
      case "Corrections Requested":
        return (
          <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800 border border-amber-200">
            Corrections Requested
          </span>
        );
      case "Corrections Submitted":
        return (
          <span className="inline-flex items-center rounded-full bg-cyan-50 px-2.5 py-0.5 text-xs font-semibold text-cyan-800 border border-cyan-200">
            Corrections Resubmitted
          </span>
        );
      case "Hired":
        return (
          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-[var(--ac-green)] border border-emerald-200">
            Hired / Selected
          </span>
        );
      case "Active":
        return (
          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-[var(--ac-green)] border border-emerald-200">
            ERP Active
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
            {status || "Pending"}
          </span>
        );
    }
  };

  return (
    <div className="academic-page pb-12">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-xs text-white shadow-xl">
          <svg className="h-4 w-4 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[var(--ac-text)]">
            Teacher Recruitments
          </h1>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-[var(--ac-hint)]">
            <Link to="/front-office" className="hover:text-[var(--ac-green)]">Dashboard</Link>
            <span>/</span>
            <Link to="/front-office/teachers" className="hover:text-[var(--ac-green)]">Teachers</Link>
            <span>/</span>
            <span className="text-[var(--ac-green)] font-medium">Recruitments</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              setSendEmail("");
              setSendPhone("");
              setSendName("");
              setSendSubject("Physics");
              setGeneratedLink("");
              setCopiedLink(false);
              setShowSendModal(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--ac-green)] px-4 py-2 text-xs font-semibold text-white hover:bg-[var(--ac-green-dark)] transition-colors shadow-2xs"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Send Form to Candidate
          </button>
        </div>
      </div>

      {/* Module Navigation Tabs */}
      <div className="mb-6 flex border-b border-[var(--ac-border)] text-xs font-semibold text-gray-500">
        <Link
          to="/front-office/teachers"
          className="border-b-2 border-transparent px-4 py-2.5 hover:text-gray-900 transition-colors"
        >
          All Teachers ({teachers.filter((t) => t.status === "Active" || !t.isRecruitmentCandidate).length})
        </Link>
        <Link
          to="/front-office/teachers/recruitments"
          className="border-b-2 border-[var(--ac-green)] px-4 py-2.5 text-[var(--ac-green)] font-bold"
        >
          Recruitment Pipeline ({recruitmentCandidates.length})
        </Link>
      </div>

      {/* Clean Status Filter Tabs */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setStatusFilter("all")}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
            statusFilter === "all"
              ? "bg-[var(--ac-green)] text-white shadow-2xs"
              : "bg-white text-gray-700 border border-[var(--ac-border)] hover:bg-gray-50"
          }`}
        >
          All Candidates ({stats.total})
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("Form Sent")}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
            statusFilter === "Form Sent"
              ? "bg-[var(--ac-green)] text-white shadow-2xs"
              : "bg-white text-gray-700 border border-[var(--ac-border)] hover:bg-gray-50"
          }`}
        >
          Form Sent ({stats.sent})
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("Form Submitted")}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
            statusFilter === "Form Submitted"
              ? "bg-[var(--ac-green)] text-white shadow-2xs"
              : "bg-white text-gray-700 border border-[var(--ac-border)] hover:bg-gray-50"
          }`}
        >
          Form Submitted ({stats.submitted})
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("corrections")}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
            statusFilter === "corrections"
              ? "bg-[var(--ac-green)] text-white shadow-2xs"
              : "bg-white text-gray-700 border border-[var(--ac-border)] hover:bg-gray-50"
          }`}
        >
          Corrections ({stats.corrections})
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("Hired")}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
            statusFilter === "Hired"
              ? "bg-[var(--ac-green)] text-white shadow-2xs"
              : "bg-white text-gray-700 border border-[var(--ac-border)] hover:bg-gray-50"
          }`}
        >
          Hired / Selected ({stats.hired})
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("Active")}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
            statusFilter === "Active"
              ? "bg-[var(--ac-green)] text-white shadow-2xs"
              : "bg-white text-gray-700 border border-[var(--ac-border)] hover:bg-gray-50"
          }`}
        >
          ERP Active ({stats.active})
        </button>
      </div>

      {/* Main Container */}
      <div className="rounded-xl border border-[var(--ac-border)] bg-white shadow-xs">
        {/* Simple Inline Toolbar */}
        <div className="p-3.5 border-b border-[var(--ac-border)] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative w-64 sm:w-72">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                className="ac-input !pl-9 text-xs py-1.5"
                placeholder="Search candidate..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Multi-Select Subject Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setSubjectDropdownOpen((prev) => !prev)}
                className={`inline-flex items-center justify-between gap-2 rounded-lg border bg-white px-3 py-1.5 text-xs font-medium transition-colors shadow-2xs ${
                  selectedSubjects.length > 0
                    ? "border-[var(--ac-green)] text-[var(--ac-green)] font-semibold"
                    : "border-[var(--ac-border)] text-gray-700 hover:border-gray-400"
                }`}
              >
                <span>
                  {selectedSubjects.length === 0
                    ? "All Subjects"
                    : selectedSubjects.length === 1
                    ? selectedSubjects[0]
                    : `${selectedSubjects.length} Subjects`}
                </span>
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${subjectDropdownOpen ? "rotate-180 text-[var(--ac-green)]" : "text-gray-400"}`} />
              </button>

              {subjectDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setSubjectDropdownOpen(false)}
                  />
                  <div className="absolute left-0 top-full mt-1 z-30 w-52 rounded-xl border border-[var(--ac-border)] bg-white p-2 shadow-xl animate-in fade-in zoom-in-95 duration-100">
                    <div className="flex items-center justify-between px-2 py-1 border-b border-gray-100 mb-1 text-[11px]">
                      <span className="font-semibold text-gray-500">Select Subjects</span>
                      {selectedSubjects.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setSelectedSubjects([])}
                          className="text-[var(--ac-green)] hover:underline font-semibold"
                        >
                          Clear ({selectedSubjects.length})
                        </button>
                      )}
                    </div>
                    <div className="max-h-48 overflow-y-auto space-y-0.5 py-1">
                      {TEACHER_SUBJECTS.map((sub) => {
                        const isChecked = selectedSubjects.includes(sub);
                        return (
                          <label
                            key={sub}
                            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 cursor-pointer text-xs transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                if (isChecked) {
                                  setSelectedSubjects((prev) => prev.filter((s) => s !== sub));
                                } else {
                                  setSelectedSubjects((prev) => [...prev, sub]);
                                }
                              }}
                              className="rounded border-gray-300 text-[var(--ac-green)] focus:ring-[var(--ac-green)]"
                            />
                            <span className={isChecked ? "font-semibold text-gray-900" : "text-gray-700"}>
                              {sub}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="text-xs text-[var(--ac-muted)] shrink-0">
            Showing <strong className="text-gray-900">{filteredCandidates.length}</strong> candidates
          </div>
        </div>

        {/* Candidate List Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[var(--ac-border)] bg-gray-50/70 font-semibold text-[var(--ac-muted)]">
              <tr>
                <th className="py-3 px-4">Candidate Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Phone Number</th>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Recruitment Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--ac-border)]">
              {filteredCandidates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[var(--ac-hint)]">
                    <svg className="mx-auto h-9 w-9 text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    No recruitment candidates match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredCandidates.map((candidate) => {
                  return (
                    <tr key={candidate.id} className="hover:bg-gray-50/80 transition-colors">
                      {/* Candidate Name */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-[var(--ac-green)] font-bold text-xs shrink-0 border border-emerald-200">
                            {candidate.avatarPreview ? (
                              <img src={candidate.avatarPreview} alt="" className="h-full w-full rounded-full object-cover" />
                            ) : (
                              `${candidate.firstName?.[0] || ""}${candidate.lastName?.[0] || "T"}`
                            )}
                          </div>
                          <div>
                            <button
                              type="button"
                              onClick={() => setSelectedCandidate(candidate)}
                              className="font-bold text-[var(--ac-text)] hover:text-[var(--ac-green)] text-left truncate max-w-[180px] block"
                            >
                              {candidate.name || `${candidate.firstName || ""} ${candidate.lastName || ""}`.trim() || "Candidate"}
                            </button>
                            <div className="text-[11px] text-[var(--ac-hint)] font-mono">
                              Ref: {candidate.teacherId || candidate.id}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-3 px-4 text-gray-700 font-medium">
                        {candidate.email || "—"}
                      </td>

                      {/* Phone Number */}
                      <td className="py-3 px-4 text-gray-700">
                        {candidate.phone || candidate.primaryContact || "—"}
                      </td>

                      {/* Subject(s) */}
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap items-center gap-1">
                          {(() => {
                            let subjectsList = [];
                            if (Array.isArray(candidate.subjects) && candidate.subjects.length > 0) {
                              subjectsList = candidate.subjects;
                            } else if (candidate.subject) {
                              subjectsList = candidate.subject.split(",").map((s) => s.trim()).filter(Boolean);
                            }
                            if (subjectsList.length === 0) subjectsList = ["General"];

                            return subjectsList.map((subj, idx) => (
                              <span
                                key={idx}
                                className="inline-block rounded-md bg-gray-100 px-2 py-0.5 font-medium text-gray-700 text-[11px]"
                              >
                                {subj}
                              </span>
                            ));
                          })()}
                        </div>
                      </td>

                      {/* Recruitment Status */}
                      <td className="py-3 px-4">
                        {getStatusBadge(candidate.status)}
                        {candidate.formSentAt && (
                          <div className="text-[10px] text-[var(--ac-hint)] mt-1">
                            Sent: {candidate.formSentAt}
                          </div>
                        )}
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Candidate details slideover button */}
                          <button
                            type="button"
                            onClick={() => setSelectedCandidate(candidate)}
                            className="rounded-lg border border-[var(--ac-border)] bg-white px-2.5 py-1 text-[11px] font-medium text-[var(--ac-text)] hover:bg-gray-50"
                            title="View Profile & Documents"
                          >
                            View
                          </button>

                          {/* Request Corrections Button */}
                          {(candidate.status === "Form Submitted" || candidate.status === "Corrections Submitted" || candidate.status === "Corrections Requested") && (
                            <button
                              type="button"
                              onClick={() => {
                                setCorrectionTarget(candidate);
                                setCorrectionNotes(candidate.correctionNotes || "");
                                setCorrectionError("");
                                setShowCorrectionModal(true);
                              }}
                              className="rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-800 hover:bg-amber-100"
                              title="Request Corrections"
                            >
                              Fix
                            </button>
                          )}

                          {/* Mark as Hired / Selected */}
                          {(candidate.status === "Form Submitted" || candidate.status === "Corrections Submitted") && (
                            <button
                              type="button"
                              onClick={() => {
                                markTeacherHired(candidate.id);
                                showToast(`${candidate.name || "Candidate"} marked as Hired!`);
                              }}
                              className="rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 hover:bg-emerald-100"
                              title="Mark as Selected / Hired"
                            >
                              Hire
                            </button>
                          )}

                          {/* Create ERP Account Button (Hired / Ready) */}
                          {candidate.status === "Hired" && (
                            <button
                              type="button"
                              onClick={() => {
                                const res = createTeacherAccount(candidate.id, {
                                  classAssigned: candidate.classAssigned && candidate.classAssigned !== "—" ? candidate.classAssigned : "Class I-A",
                                  primarySubject: candidate.subject || "General",
                                  email: candidate.email || `${(candidate.firstName || "teacher").toLowerCase()}.${(candidate.lastName || "staff").toLowerCase()}@bodhyamarg.com`,
                                });
                                setAccountTarget(candidate);
                                setCreatedAccountResult(res);
                                showToast(`ERP Account created for ${res.name}!`);
                              }}
                              className="rounded-lg bg-[var(--ac-green)] px-3 py-1 text-[11px] font-semibold text-white hover:bg-[var(--ac-green-dark)] shadow-xs"
                              title="Create ERP Account"
                            >
                              Create Account
                            </button>
                          )}

                          {/* If already active */}
                          {candidate.status === "Active" && (
                            <Link
                              to={`/front-office/teachers/${candidate.id}/edit`}
                              className="rounded-lg border border-[var(--ac-border)] bg-white px-2.5 py-1 text-[11px] font-medium text-[var(--ac-text)] hover:bg-gray-50 hover:text-[var(--ac-green)] transition-colors"
                            >
                              Active Profile →
                            </Link>
                          )}

                          {/* Copy Link */}
                          {candidate.recruitmentToken && (
                            <button
                              type="button"
                              onClick={() => {
                                const link = `${window.location.origin}/teacher-recruitment/${candidate.recruitmentToken}`;
                                navigator.clipboard.writeText(link);
                                showToast("Candidate recruitment form link copied!");
                              }}
                              className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                              title="Copy Candidate Form Link"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODAL 1: Send Recruitment Form to Candidate ── */}
      {showSendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-[1px] transition-opacity"
            onClick={() => setShowSendModal(false)}
          />
          <div className="relative z-10 w-full max-w-lg rounded-2xl border border-[var(--ac-border)] bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--ac-border)] pb-4 mb-4">
              <div className="flex items-center gap-2 text-sm font-bold text-[var(--ac-green)]">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-[var(--ac-green)]">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </span>
                <span>Send Recruitment Form to Candidate</span>
              </div>
              <button
                type="button"
                onClick={() => setShowSendModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <p className="text-gray-600">
                Send a direct onboarding & credentials submission link to the candidate. They can fill in their profile, upload educational certificates, and submit directly for HR review.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[var(--ac-muted)] mb-1">
                    Candidate Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    className="ac-input"
                    value={sendEmail}
                    onChange={(e) => setSendEmail(e.target.value)}
                    placeholder="candidate@email.com"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[var(--ac-muted)] mb-1">
                    Candidate Contact Number (10 Digits)
                  </label>
                  <input
                    type="tel"
                    className="ac-input"
                    value={sendPhone}
                    onChange={(e) => setSendPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    maxLength={10}
                    placeholder="e.g. 9876543210"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[var(--ac-muted)] mb-1">Candidate Name</label>
                  <input
                    type="text"
                    className="ac-input"
                    value={sendName}
                    onChange={(e) => setSendName(e.target.value)}
                    placeholder="Candidate full name"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[var(--ac-muted)] mb-1">Subject</label>
                  <select
                    className="ac-select w-full"
                    value={sendSubject}
                    onChange={(e) => setSendSubject(e.target.value)}
                  >
                    {TEACHER_SUBJECTS_LIST.map((sub) => (
                      <option key={sub.code} value={sub.name}>
                        {sub.name} ({sub.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-[var(--ac-muted)] mb-1">Email Invitation Message</label>
                <textarea
                  rows={3}
                  className="ac-textarea text-xs"
                  value={sendMsg}
                  onChange={(e) => setSendMsg(e.target.value)}
                  placeholder="Invitation note..."
                />
              </div>

              {generatedLink ? (
                <div className="rounded-xl border border-[var(--ac-border)] bg-white p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-gray-800">Recruitment Link Generated</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(generatedLink);
                        setCopiedLink(true);
                        setTimeout(() => setCopiedLink(false), 2500);
                      }}
                      className="inline-flex items-center gap-1 rounded bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 border border-[var(--ac-border)] hover:bg-gray-50 transition-colors shadow-2xs"
                    >
                      {copiedLink ? "✓ Copied!" : "Copy Link"}
                    </button>
                  </div>
                  <input
                    type="text"
                    readOnly
                    value={generatedLink}
                    className="w-full rounded bg-gray-50 px-2.5 py-1.5 text-[11px] text-gray-700 border border-[var(--ac-border)] font-mono select-all"
                  />

                  {/* Clean Minimalist Quick Actions */}
                  <div className="pt-2 border-t border-[var(--ac-border)] grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <a
                      href={generatedLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--ac-border)] bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:text-gray-900 hover:border-gray-400 transition-all shadow-2xs group"
                    >
                      <svg className="h-3.5 w-3.5 text-gray-500 group-hover:text-gray-900 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>Open Candidate Form</span>
                      <span className="text-[11px] text-gray-400 group-hover:text-gray-700">↗</span>
                    </a>

                    <a
                      href={`${generatedLink}?faculty=1`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--ac-border)] bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:text-gray-900 hover:border-gray-400 transition-all shadow-2xs group"
                    >
                      <svg className="h-3.5 w-3.5 text-gray-500 group-hover:text-gray-900 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>Open Faculty Review</span>
                      <span className="text-[11px] text-gray-400 group-hover:text-gray-700">↗</span>
                    </a>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5 border-t border-[var(--ac-border)] pt-4">
              <button
                type="button"
                onClick={() => setShowSendModal(false)}
                className="rounded-lg border border-[var(--ac-border)] bg-white px-4 py-2 text-xs font-medium text-[var(--ac-text)] hover:bg-gray-50"
              >
                Close
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!sendEmail.trim()) {
                    showToast("Please enter candidate email address.");
                    return;
                  }
                  const sanitizedPhone = sendPhone.replace(/\D/g, "").trim();
                  if (sanitizedPhone && sanitizedPhone.length !== 10) {
                    showToast("Candidate contact number must be exactly 10 digits.");
                    return;
                  }
                  const res = sendRecruitmentForm({
                    email: sendEmail.trim(),
                    phone: sanitizedPhone,
                    primaryContact: sanitizedPhone,
                    name: sendName.trim(),
                    firstName: sendName.split(" ")[0] || "",
                    lastName: sendName.split(" ").slice(1).join(" ") || "",
                    subject: sendSubject,
                    message: sendMsg,
                  });
                  setGeneratedLink(res.link);
                  showToast(`Recruitment form email sent to ${sendEmail}!`);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--ac-green)] px-5 py-2 text-xs font-semibold text-white hover:bg-[var(--ac-green-dark)] transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Send Email & Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 2: Request Corrections ── */}
      {showCorrectionModal && correctionTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-[1px] transition-opacity"
            onClick={() => {
              setShowCorrectionModal(false);
              setCorrectionTarget(null);
            }}
          />
          <div className="relative z-10 w-full max-w-lg rounded-2xl border border-[var(--ac-border)] bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--ac-border)] pb-4 mb-4">
              <div className="flex items-center gap-2 text-sm font-bold text-[var(--ac-green)]">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-[var(--ac-green)]">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </span>
                <span>Request Corrections: {correctionTarget.name}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowCorrectionModal(false);
                  setCorrectionTarget(null);
                }}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-gray-600">
                Candidate will see these correction notes highlighted on their recruitment form link and can update details and re-upload documents.
              </p>

              <div>
                <label className="block font-medium text-[var(--ac-muted)] mb-1">
                  What should the candidate fix? <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  className={`ac-textarea ${correctionError ? "border-red-400" : ""}`}
                  value={correctionNotes}
                  onChange={(e) => {
                    setCorrectionNotes(e.target.value);
                    if (e.target.value.trim()) setCorrectionError("");
                  }}
                  placeholder="e.g. Please re-upload a clear copy of your Master's Degree certificate and verify your permanent address."
                />
                {correctionError && (
                  <p className="mt-1 text-[11px] text-red-500 font-medium">{correctionError}</p>
                )}
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5 border-t border-[var(--ac-border)] pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowCorrectionModal(false);
                  setCorrectionTarget(null);
                }}
                className="rounded-lg border border-[var(--ac-border)] bg-white px-4 py-2 text-xs font-medium text-[var(--ac-text)] hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!correctionNotes.trim()) {
                    setCorrectionError("Please describe what needs to be corrected.");
                    return;
                  }
                  requestTeacherCorrections(correctionTarget.id, correctionNotes.trim());
                  setShowCorrectionModal(false);
                  setCorrectionTarget(null);
                  showToast("Correction request sent to candidate!");
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--ac-green)] px-5 py-2 text-xs font-semibold text-white hover:bg-[var(--ac-green-dark,#005b38)] transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Send Correction Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 3: Create ERP Account for Hired Candidate ── */}
      {accountTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-[1px] transition-opacity"
            onClick={() => {
              setAccountTarget(null);
              setCreatedAccountResult(null);
            }}
          />
          <div className="relative z-10 w-full max-w-lg rounded-2xl border border-[var(--ac-border)] bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--ac-border)] pb-4 mb-4">
              <div className="flex items-center gap-2 text-sm font-bold text-[var(--ac-green)]">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-[var(--ac-green)]">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </span>
                <span>Create ERP Account: {accountTarget.name}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAccountTarget(null);
                  setCreatedAccountResult(null);
                }}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {!createdAccountResult ? (
              <div className="space-y-4 text-xs">
                <p className="text-gray-600">
                  Assign teaching class and subject. This will generate official Teacher ID credentials and activate their BodhyaMarg ERP portal account.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-[var(--ac-muted)] mb-1">Class Assigned</label>
                    <select
                      className="ac-select"
                      value={accountClass}
                      onChange={(e) => setAccountClass(e.target.value)}
                    >
                      {TEACHER_CLASSES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-medium text-[var(--ac-muted)] mb-1">Primary Subject</label>
                    <select
                      className="ac-select"
                      value={accountSubject}
                      onChange={(e) => setAccountSubject(e.target.value)}
                    >
                      {TEACHER_SUBJECTS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-[var(--ac-muted)] mb-1">Official School Email</label>
                  <input
                    type="email"
                    className="ac-input"
                    defaultValue={accountTarget.email || `${accountTarget.firstName?.toLowerCase() || "teacher"}.${accountTarget.lastName?.toLowerCase() || "staff"}@bodhyamarg.com`}
                    id="officialTeacherEmailInput"
                  />
                </div>

                <div className="mt-6 flex items-center justify-end gap-2.5 border-t border-[var(--ac-border)] pt-4">
                  <button
                    type="button"
                    onClick={() => setAccountTarget(null)}
                    className="rounded-lg border border-[var(--ac-border)] bg-white px-4 py-2 text-xs font-medium text-[var(--ac-text)] hover:bg-gray-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const emailVal = document.getElementById("officialTeacherEmailInput")?.value;
                      const res = createTeacherAccount(accountTarget.id, {
                        classAssigned: accountClass,
                        primarySubject: accountSubject,
                        email: emailVal,
                      });
                      setCreatedAccountResult(res);
                      showToast(`ERP Account created for ${res.name}!`);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--ac-green)] px-5 py-2 text-xs font-semibold text-white hover:bg-[var(--ac-green-dark)] transition-colors"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Generate Credentials & Activate
                  </button>
                </div>
              </div>
            ) : (
              /* Sleek, Clean Credentials Slip */
              <div className="space-y-4 text-xs">
                <div className="space-y-2.5 rounded-xl border border-[var(--ac-border)] p-4 bg-white">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                    <span className="text-gray-500">Teacher Name</span>
                    <span className="font-semibold text-gray-900">{createdAccountResult.name}</span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                    <span className="text-gray-500">Teacher ID</span>
                    <span className="font-semibold font-mono text-[var(--ac-green)]">{createdAccountResult.teacherId}</span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                    <span className="text-gray-500">Login Email</span>
                    <span className="font-semibold text-gray-900 font-mono">{createdAccountResult.email}</span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                    <span className="text-gray-500">Temporary Password</span>
                    <span className="font-bold font-mono text-gray-900 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">{createdAccountResult.tempPassword}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Class & Subject</span>
                    <span className="font-semibold text-gray-900">{createdAccountResult.classAssigned} · {createdAccountResult.subject}</span>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between gap-2 border-t border-[var(--ac-border)] pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      const slipText = `BodhyaMarg ERP Teacher Credentials:\nName: ${createdAccountResult.name}\nTeacher ID: ${createdAccountResult.teacherId}\nLogin Email: ${createdAccountResult.email}\nPassword: ${createdAccountResult.tempPassword}\nPortal: ${window.location.origin}/login`;
                      navigator.clipboard.writeText(slipText);
                      setCopiedCredentials(true);
                      setTimeout(() => setCopiedCredentials(false), 2500);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--ac-border)] bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-2xs"
                  >
                    {copiedCredentials ? "✓ Copied!" : "Copy Credentials"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAccountTarget(null);
                      setCreatedAccountResult(null);
                    }}
                    className="rounded-lg bg-[var(--ac-green)] px-6 py-2 text-xs font-semibold text-white hover:bg-[var(--ac-green-dark)] transition-colors shadow-2xs"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── SLIDEOVER DRAWER: Candidate Profile & Document Review ── */}
      {selectedCandidate && (
        <div className="fixed inset-0 z-40 overflow-hidden">
          {/* Backdrop overlay - clicking outside closes drawer */}
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-[1px] transition-opacity cursor-pointer"
            onClick={() => setSelectedCandidate(null)}
          />
          <div className="fixed inset-y-0 right-0 z-10 flex max-w-full pl-10 pointer-events-none">
            <div className="w-screen max-w-xl bg-white shadow-2xl flex flex-col justify-between overflow-y-auto pointer-events-auto">
              {/* Drawer Header */}
              <div>
                <div className="flex items-center justify-between border-b border-[var(--ac-border)] p-6 bg-gray-50/70">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm border border-emerald-300">
                      {selectedCandidate.avatarPreview ? (
                        <img src={selectedCandidate.avatarPreview} alt="" className="h-full w-full rounded-full object-cover" />
                      ) : (
                        `${selectedCandidate.firstName?.[0] || ""}${selectedCandidate.lastName?.[0] || "T"}`
                      )}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[var(--ac-text)]">
                        {selectedCandidate.name || `${selectedCandidate.firstName || ""} ${selectedCandidate.lastName || ""}`.trim()}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-[var(--ac-hint)] font-mono">Ref: {selectedCandidate.teacherId}</span>
                        {getStatusBadge(selectedCandidate.status)}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedCandidate(null)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-colors"
                    aria-label="Close"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

              {/* Drawer Content Body */}
              <div className="p-6 space-y-6 text-xs">
                {/* Contact & Professional Info */}
                <div className="grid grid-cols-2 gap-4 rounded-xl border border-[var(--ac-border)] bg-gray-50/50 p-4">
                  <div>
                    <span className="text-[11px] text-gray-400 font-medium">Email:</span>
                    <p className="font-semibold text-gray-800 mt-0.5">{selectedCandidate.email || "—"}</p>
                  </div>
                  <div>
                    <span className="text-[11px] text-gray-400 font-medium">Phone:</span>
                    <p className="font-semibold text-gray-800 mt-0.5">{selectedCandidate.phone || selectedCandidate.primaryContact || "—"}</p>
                  </div>
                  <div>
                    <span className="text-[11px] text-gray-400 font-medium">Subject(s):</span>
                    <div className="flex flex-wrap items-center gap-1 mt-0.5">
                      {(() => {
                        let subjectsList = [];
                        if (Array.isArray(selectedCandidate.subjects) && selectedCandidate.subjects.length > 0) {
                          subjectsList = selectedCandidate.subjects;
                        } else if (selectedCandidate.subject) {
                          subjectsList = selectedCandidate.subject.split(",").map((s) => s.trim()).filter(Boolean);
                        }
                        if (subjectsList.length === 0) subjectsList = ["General"];

                        return subjectsList.map((subj, idx) => (
                          <span
                            key={idx}
                            className="inline-block rounded-md bg-gray-100 px-2.5 py-0.5 font-medium text-gray-700 text-[11px]"
                          >
                            {subj}
                          </span>
                        ));
                      })()}
                    </div>
                  </div>
                  <div>
                    <span className="text-[11px] text-gray-400 font-medium">Qualification:</span>
                    <p className="font-semibold text-gray-800 mt-0.5">{selectedCandidate.qualification || "—"}</p>
                  </div>
                  <div>
                    <span className="text-[11px] text-gray-400 font-medium">Experience:</span>
                    <p className="font-semibold text-gray-800 mt-0.5">{selectedCandidate.workExperience || "—"}</p>
                  </div>
                  <div>
                    <span className="text-[11px] text-gray-400 font-medium">Aadhar / PAN:</span>
                    <p className="font-semibold font-mono text-gray-800 mt-0.5">
                      {selectedCandidate.aadharNumber || "—"} · {selectedCandidate.panNumber || selectedCandidate.panId || "—"}
                    </p>
                  </div>
                </div>

                {/* Address */}
                {(selectedCandidate.address || selectedCandidate.permanentAddress) && (
                  <div>
                    <h4 className="font-bold text-gray-700 uppercase tracking-wider text-[11px] mb-2">Address Details</h4>
                    <div className="rounded-xl border border-[var(--ac-border)] p-3.5 space-y-2 bg-white">
                      <p><strong className="text-gray-600">Current:</strong> {selectedCandidate.address || "—"}</p>
                      <p><strong className="text-gray-600">Permanent:</strong> {selectedCandidate.permanentAddress || "—"}</p>
                    </div>
                  </div>
                )}

                {/* Uploaded Documents List */}
                <div>
                  <h4 className="font-bold text-gray-700 uppercase tracking-wider text-[11px] mb-2">
                    Submitted Educational & Identity Documents
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {[
                      { label: "Graduation Degree", file: selectedCandidate.degreeCertificateName },
                      { label: "Post-Graduation", file: selectedCandidate.pgCertificateName },
                      { label: "B.Ed / Teaching", file: selectedCandidate.bedCertificateName },
                      { label: "Experience Letter", file: selectedCandidate.experienceCertificateName },
                      { label: "Resume / CV", file: selectedCandidate.resumeName },
                      { label: "Aadhar Copy", file: selectedCandidate.aadharDocName },
                      { label: "PAN Copy", file: selectedCandidate.panDocName },
                    ].map((doc) => (
                      <div
                        key={doc.label}
                        className={`rounded-lg border p-2.5 flex items-center justify-between gap-2 ${
                          doc.file ? "border-emerald-200 bg-emerald-50/50" : "border-gray-200 bg-gray-50/50 text-gray-400"
                        }`}
                      >
                        <div>
                          <div className="font-semibold text-gray-800 text-[11px]">{doc.label}</div>
                          <div className="text-[10px] text-gray-500 truncate max-w-[150px]">
                            {doc.file ? `✓ ${doc.file}` : "Not uploaded"}
                          </div>
                        </div>
                        {doc.file && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-300">
                            View ↗
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Correction Status & Notes in Drawer (Bottom) */}
                {selectedCandidate.correctionNotes && (
                  <div className="rounded-xl border border-[var(--ac-border)] bg-white p-3.5">
                    {selectedCandidate.status === "Corrections Submitted" ? (
                      <div className="flex items-start gap-3">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-50 text-teal-700 font-bold text-xs shrink-0 mt-0.5 border border-teal-200">
                          ✓
                        </span>
                        <div className="text-xs space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-gray-900">Corrections Resubmitted by Candidate</span>
                            {selectedCandidate.correctionsSubmittedAt && (
                              <span className="text-[10px] text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full font-medium">
                                Resubmitted: {selectedCandidate.correctionsSubmittedAt}
                              </span>
                            )}
                          </div>
                          <div className="text-gray-600 leading-relaxed">
                            <strong className="text-gray-800">Requested Correction:</strong> {selectedCandidate.correctionNotes}
                          </div>
                        </div>
                      </div>
                    ) : selectedCandidate.status === "Corrections Requested" ? (
                      <div className="flex items-start gap-3">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-50 text-amber-600 font-bold text-xs shrink-0 mt-0.5 border border-amber-200">
                          !
                        </span>
                        <div className="text-xs space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-gray-900">Corrections Pending from Candidate</span>
                            {selectedCandidate.correctionsRequestedAt && (
                              <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-medium">
                                Requested: {selectedCandidate.correctionsRequestedAt}
                              </span>
                            )}
                          </div>
                          <div className="text-gray-600 leading-relaxed">
                            <strong className="text-gray-800">Correction Note:</strong> {selectedCandidate.correctionNotes}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-2.5 text-xs text-gray-600">
                        <span className="font-semibold text-gray-800 shrink-0">Previous Correction:</span>
                        <span>{selectedCandidate.correctionNotes}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-6 border-t border-[var(--ac-border)] bg-gray-50/90 flex flex-wrap items-center justify-between gap-2">
              {selectedCandidate.status === "Active" ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCandidate(null);
                      navigate(`/front-office/teachers/${selectedCandidate.id}/edit`);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--ac-green)] px-4 py-2 text-xs font-semibold text-white hover:bg-[var(--ac-green-dark)] transition-colors shadow-2xs"
                  >
                    <span>View Active Profile in ERP ↗</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedCandidate(null)}
                    className="rounded-lg border border-[var(--ac-border)] bg-white px-4 py-2 text-xs font-medium text-[var(--ac-text)] hover:bg-gray-50"
                  >
                    Close
                  </button>
                </>
              ) : (
                <>
                  {selectedCandidate.recruitmentToken && selectedCandidate.status !== "Hired" && (
                    <button
                      type="button"
                      onClick={() => {
                        window.open(`/teacher-recruitment/${selectedCandidate.recruitmentToken}`, "_blank");
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-300 bg-indigo-50 px-3.5 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 hover:border-indigo-400 transition-colors shadow-2xs"
                      title="Open candidate form in new tab to view requested corrections and submit fixes"
                    >
                      <svg className="h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>Open as Candidate (Do Corrections) ↗</span>
                    </button>
                  )}

                  <div className="flex items-center gap-2">
                    {selectedCandidate.status !== "Hired" && (
                      <button
                        type="button"
                        onClick={() => {
                          setCorrectionTarget(selectedCandidate);
                          setCorrectionNotes(selectedCandidate.correctionNotes || "");
                          setCorrectionError("");
                          setShowCorrectionModal(true);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--ac-border)] bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:text-gray-900 hover:border-gray-400 transition-colors shadow-2xs"
                      >
                        <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span>Request Corrections</span>
                      </button>
                    )}

                    {selectedCandidate.status !== "Hired" && (
                      <button
                        type="button"
                        onClick={() => {
                          markTeacherHired(selectedCandidate.id);
                          setSelectedCandidate((p) => ({ ...p, status: "Hired" }));
                          showToast(`${selectedCandidate.name} marked as Hired!`);
                        }}
                        className="rounded-lg bg-[var(--ac-green)] px-4 py-2 text-xs font-semibold text-white hover:bg-[var(--ac-green-dark)] shadow-sm transition-colors"
                      >
                        Mark as Hired
                      </button>
                    )}

                    {selectedCandidate.status === "Hired" && (
                      <button
                        type="button"
                        onClick={() => {
                          const res = createTeacherAccount(selectedCandidate.id, {
                            classAssigned: selectedCandidate.classAssigned && selectedCandidate.classAssigned !== "—" ? selectedCandidate.classAssigned : "Class I-A",
                            primarySubject: selectedCandidate.subject || "General",
                            email: selectedCandidate.email || `${(selectedCandidate.firstName || "teacher").toLowerCase()}.${(selectedCandidate.lastName || "staff").toLowerCase()}@bodhyamarg.com`,
                          });
                          setAccountTarget(selectedCandidate);
                          setCreatedAccountResult(res);
                          setSelectedCandidate((p) => ({ ...p, status: "Active", teacherId: res.teacherId }));
                          showToast(`ERP Account created for ${res.name}!`);
                        }}
                        className="rounded-lg bg-[var(--ac-green)] px-4 py-2 text-xs font-semibold text-white hover:bg-[var(--ac-green-dark)] shadow-sm"
                      >
                        Create ERP Account
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    )}
  </div>
);
}
