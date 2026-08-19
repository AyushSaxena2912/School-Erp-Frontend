import React from "react";
import { Link } from "react-router-dom";
import { Trash2, UserCheck, UserX, X } from "lucide-react";

export default function TeacherDetailsModal({ teacher, open, onClose, onEdit, onToggleStatus, onDelete }) {
  if (!open || !teacher) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-[1px] transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative z-10 w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-2xl border border-[var(--ac-border)]">
        {/* Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-[var(--ac-border)] bg-white px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--ac-green-light)] text-[var(--ac-green)] font-bold text-base">
              {teacher.firstName ? teacher.firstName[0] : teacher.name?.[0] || "T"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-[var(--ac-text)]">{teacher.name}</h2>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    teacher.status === "Active"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      teacher.status === "Active" ? "bg-emerald-500" : "bg-red-500"
                    }`}
                  />
                  {teacher.status}
                </span>
              </div>
              <div className="text-xs text-[var(--ac-muted)]">
                Teacher ID: <span className="font-medium text-[var(--ac-green)]">{teacher.teacherId || teacher.id}</span>
                {teacher.classAssigned && teacher.classAssigned !== "—" && (
                  <span className="ml-2 font-medium">· Class: {teacher.classAssigned}</span>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Corrections Banner if school requested corrections */}
        {teacher.status === "Corrections Requested" && teacher.correctionNotes && (
          <div className="mx-6 mt-4 rounded-xl border border-amber-300 bg-amber-50/90 p-4">
            <div className="flex items-start gap-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-100 text-amber-800 shrink-0 mt-0.5">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </span>
              <div>
                <p className="text-xs font-bold text-amber-900">Corrections Requested from Candidate</p>
                <p className="text-xs text-amber-800 mt-1 font-medium bg-white/70 p-2 rounded border border-amber-200">
                  "{teacher.correctionNotes}"
                </p>
                {teacher.correctionsRequestedAt && (
                  <p className="text-[11px] text-amber-700 mt-1">Requested on {teacher.correctionsRequestedAt}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {/* Quick Badges & Contact */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 rounded-lg border border-[var(--ac-border)] bg-gray-50/70 p-4">
            <div>
              <div className="text-[11px] font-medium uppercase tracking-wider text-[var(--ac-muted)]">Primary Subject</div>
              <div className="mt-1 font-semibold text-sm text-[var(--ac-text)]">
                <span className="inline-block rounded-md bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                  {teacher.subject || "General"}
                </span>
              </div>
            </div>
            <div>
              <div className="text-[11px] font-medium uppercase tracking-wider text-[var(--ac-muted)]">Phone Number</div>
              <div className="mt-1 text-sm font-medium text-[var(--ac-text)]">{teacher.primaryContact || teacher.phone || "—"}</div>
            </div>
            <div>
              <div className="text-[11px] font-medium uppercase tracking-wider text-[var(--ac-muted)]">Email Address</div>
              <div className="mt-1 text-sm font-medium text-[var(--ac-text)] truncate">{teacher.email || "—"}</div>
            </div>
          </div>

          {/* Personal Information */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--ac-green)] flex items-center gap-1.5 border-b border-gray-100 pb-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Personal & Professional Information
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-[var(--ac-muted)] block">Gender:</span>
                <span className="font-semibold text-[var(--ac-text)]">{teacher.gender || "—"}</span>
              </div>
              <div>
                <span className="text-[var(--ac-muted)] block">Date of Birth:</span>
                <span className="font-semibold text-[var(--ac-text)]">{teacher.dob || "—"}</span>
              </div>
              <div>
                <span className="text-[var(--ac-muted)] block">Date of Joining:</span>
                <span className="font-semibold text-[var(--ac-text)]">{teacher.dateOfJoining || "—"}</span>
              </div>
              <div>
                <span className="text-[var(--ac-muted)] block">Blood Group:</span>
                <span className="font-semibold text-[var(--ac-text)]">{teacher.bloodGroup || "—"}</span>
              </div>
              <div>
                <span className="text-[var(--ac-muted)] block">Marital Status:</span>
                <span className="font-semibold text-[var(--ac-text)]">{teacher.maritalStatus || "—"}</span>
              </div>
              {teacher.maritalStatus === "Married" && teacher.spouseName && (
                <>
                  <div>
                    <span className="text-[var(--ac-muted)] block">
                      {teacher.gender === "Female" ? "Husband's Name" : teacher.gender === "Male" ? "Wife's Name" : "Spouse Name"}:
                    </span>
                    <span className="font-semibold text-[var(--ac-text)]">{teacher.spouseName}</span>
                  </div>
                  <div>
                    <span className="text-[var(--ac-muted)] block">Spouse Mobile:</span>
                    <span className="font-semibold text-[var(--ac-text)]">{teacher.spouseMobile || "—"}</span>
                  </div>
                </>
              )}
              <div>
                <span className="text-[var(--ac-muted)] block">Qualification:</span>
                <span className="font-semibold text-[var(--ac-text)]">{teacher.qualification || "—"}</span>
              </div>
              <div>
                <span className="text-[var(--ac-muted)] block">Work Experience:</span>
                <span className="font-semibold text-[var(--ac-text)]">{teacher.workExperience || "—"}</span>
              </div>
              <div>
                <span className="text-[var(--ac-muted)] block">Religion:</span>
                <span className="font-semibold text-[var(--ac-text)]">{teacher.religion || "—"}</span>
              </div>
              <div>
                <span className="text-[var(--ac-muted)] block">Mother Tongue:</span>
                <span className="font-semibold text-[var(--ac-text)]">{teacher.motherTongue || "—"}</span>
              </div>
              <div>
                <span className="text-[var(--ac-muted)] block">Aadhar Card No.:</span>
                <span className="font-semibold text-[var(--ac-text)] font-mono">{teacher.aadharNumber || teacher.aadharCard || "—"}</span>
              </div>
              <div>
                <span className="text-[var(--ac-muted)] block">PAN Card Number:</span>
                <span className="font-semibold text-[var(--ac-text)] font-mono">{teacher.panNumber || teacher.panId || "—"}</span>
              </div>
            </div>

            {/* Languages and Subjects */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {teacher.subjects && teacher.subjects.length > 0 && (
                <div>
                  <span className="text-xs text-[var(--ac-muted)] block mb-1">Subjects Handled:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {teacher.subjects.map((sub, i) => (
                      <span key={i} className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700 font-medium">
                        {sub}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {teacher.languages && teacher.languages.length > 0 && (
                <div>
                  <span className="text-xs text-[var(--ac-muted)] block mb-1">Languages Known:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {teacher.languages.map((lang, i) => (
                      <span key={i} className="rounded-full bg-[var(--ac-green-light)] px-2.5 py-0.5 text-xs text-[var(--ac-green)] font-semibold">
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Addresses */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
              <div className="rounded-md border border-gray-100 bg-gray-50 p-2.5">
                <span className="font-semibold text-gray-700 block mb-0.5">Present Address:</span>
                <span className="text-[var(--ac-muted)]">{teacher.address || "—"}</span>
              </div>
              <div className="rounded-md border border-gray-100 bg-gray-50 p-2.5">
                <span className="font-semibold text-gray-700 block mb-0.5">Permanent Address:</span>
                <span className="text-[var(--ac-muted)]">{teacher.permanentAddress || "—"}</span>
              </div>
            </div>
          </div>

          {/* Leaves Breakdown */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--ac-green)] flex items-center gap-1.5 border-b border-gray-100 pb-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Leaves Allotment
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
              <div className="rounded-lg border border-gray-200 p-3 bg-white">
                <div className="text-[11px] text-[var(--ac-muted)]">Medical Leaves</div>
                <div className="text-lg font-bold text-[var(--ac-green)] mt-1">{teacher.medicalLeaves ?? 10}</div>
              </div>
              <div className="rounded-lg border border-gray-200 p-3 bg-white">
                <div className="text-[11px] text-[var(--ac-muted)]">Casual Leaves</div>
                <div className="text-lg font-bold text-blue-600 mt-1">{teacher.casualLeaves ?? 8}</div>
              </div>
              <div className="rounded-lg border border-gray-200 p-3 bg-white">
                <div className="text-[11px] text-[var(--ac-muted)]">Maternity Leaves</div>
                <div className="text-lg font-bold text-purple-600 mt-1">{teacher.maternityLeaves ?? 0}</div>
              </div>
              <div className="rounded-lg border border-gray-200 p-3 bg-white">
                <div className="text-[11px] text-[var(--ac-muted)]">Sick Leaves</div>
                <div className="text-lg font-bold text-amber-600 mt-1">{teacher.sickLeaves ?? 6}</div>
              </div>
            </div>
          </div>

          {/* Transport & Bank Account */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Transport */}
            <div className="rounded-lg border border-[var(--ac-border)] p-4 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--ac-green)] flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                Transport Details
              </h4>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-[var(--ac-muted)]">Route:</span>
                  <span className="font-semibold">{teacher.route || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--ac-muted)]">Vehicle No:</span>
                  <span className="font-semibold">{teacher.vehicleNo || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--ac-muted)]">Pickup Point:</span>
                  <span className="font-semibold">{teacher.pickupPoint || "—"}</span>
                </div>
              </div>
            </div>

            {/* Bank Account */}
            <div className="rounded-lg border border-[var(--ac-border)] p-4 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--ac-green)] flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                Bank Account Detail
              </h4>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-[var(--ac-muted)]">Bank Name:</span>
                  <span className="font-semibold">{teacher.bankName || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--ac-muted)]">Account Holder:</span>
                  <span className="font-semibold">{teacher.accountHolderName || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--ac-muted)]">Account Number:</span>
                  <span className="font-semibold font-mono">{teacher.accountNumber || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--ac-muted)]">IFSC Code:</span>
                  <span className="font-semibold font-mono">{teacher.ifsc || "—"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--ac-border)] bg-gray-50 px-6 py-3.5">
          <div className="flex items-center gap-2">
            {onToggleStatus && (
              teacher.status === "Inactive" ? (
                <button
                  type="button"
                  onClick={() => onToggleStatus(teacher.id, "Active")}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--ac-border)] bg-white px-3.5 py-1.5 text-xs font-semibold text-[var(--ac-green)] hover:bg-emerald-50/70 hover:border-emerald-300 transition-colors shadow-2xs"
                >
                  <UserCheck className="h-3.5 w-3.5 text-[var(--ac-green)]" />
                  <span>Activate Teacher</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onToggleStatus(teacher.id, "Inactive")}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--ac-border)] bg-white px-3.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:text-gray-900 hover:border-gray-400 transition-colors shadow-2xs"
                >
                  <UserX className="h-3.5 w-3.5 text-gray-500" />
                  <span>Mark Inactive</span>
                </button>
              )
            )}

            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(teacher.id)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--ac-border)] bg-white px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors shadow-2xs"
                title="Permanently remove teacher"
              >
                <Trash2 className="h-3.5 w-3.5 text-red-500" />
                <span>Delete Permanently</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[var(--ac-border)] bg-white px-4 py-1.5 text-xs font-medium text-[var(--ac-text)] hover:bg-gray-50"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit?.(teacher);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--ac-green)] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[var(--ac-green-dark)] transition-colors shadow-sm"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Teacher
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
