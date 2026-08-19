import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, X } from "lucide-react";
import { useTeachers } from "../front-office/teachers/context/TeachersContext";
import {
  TEACHER_BLOOD_GROUPS,
  TEACHER_CLASSES,
  TEACHER_GENDERS,
  TEACHER_MARITAL_STATUSES,
  TEACHER_MOTHER_TONGUES,
  TEACHER_QUALIFICATIONS,
  TEACHER_RELIGIONS,
  TEACHER_SUBJECTS,
} from "../front-office/teachers/data/teachers";

export default function TeacherRecruitmentPage() {
  const navigate = useNavigate();
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const isFaculty = searchParams.get("preview") === "1" || searchParams.get("faculty") === "1";

  const {
    getTeacherByToken,
    submitTeacherCorrections,
    requestTeacherCorrections,
    markTeacherHired,
    createTeacherAccount,
  } = useTeachers();

  const teacher = getTeacherByToken(token);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    gender: "Male",
    primaryContact: "",
    email: "",
    dob: "",
    bloodGroup: "",
    qualification: "",
    workExperience: "",
    prevSchool: "",
    prevSchoolAddress: "",
    aadharNumber: "",
    panNumber: "",
    address: "",
    permanentAddress: "",
    religion: "",
    motherTongue: "",
    fatherName: "",
    motherName: "",
    maritalStatus: "Single",
    spouseName: "",
    spouseMobile: "",
    subjects: ["Physics"],
    languages: ["Hindi", "English"],
    bankName: "",
    branch: "",
    accountNumber: "",
    ifsc: "",
    otherInfo: "",
    accountHolderName: "",
    resumeName: "",
    degreeCertificateName: "",
    pgCertificateName: "",
    bedCertificateName: "",
    experienceCertificateName: "",
    joiningLetterName: "",
    aadharDocName: "",
    panDocName: "",
    avatarPreview: "",
  });

  const [subjectInput, setSubjectInput] = useState("");
  const [langInput, setLangInput] = useState("");
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [toast, setToast] = useState("");

  // Correction Modal in Faculty Mode
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [correctionNotes, setCorrectionNotes] = useState("");
  const [correctionError, setCorrectionError] = useState("");

  // Create ERP Account Modal in Faculty Mode
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [accountClass, setAccountClass] = useState("Class I-A");
  const [accountSubject, setAccountSubject] = useState("Physics");
  const [accountResult, setAccountResult] = useState(null);
  const [copiedCredentials, setCopiedCredentials] = useState(false);

  const photoInputRef = useRef(null);
  const resumeInputRef = useRef(null);
  const degreeInputRef = useRef(null);
  const pgInputRef = useRef(null);
  const bedInputRef = useRef(null);
  const experienceInputRef = useRef(null);
  const joiningLetterInputRef = useRef(null);
  const aadharDocInputRef = useRef(null);
  const panDocInputRef = useRef(null);

  useEffect(() => {
    if (teacher) {
      setForm((p) => ({
        ...p,
        firstName: teacher.firstName || "",
        lastName: teacher.lastName || "",
        email: teacher.email || "",
        primaryContact: teacher.primaryContact || teacher.phone || "",
        gender: teacher.gender || "Male",
        dob: teacher.dob || "",
        bloodGroup: teacher.bloodGroup || "",
        qualification: teacher.qualification || "",
        workExperience: teacher.workExperience || "",
        prevSchool: teacher.prevSchool || "",
        prevSchoolAddress: teacher.prevSchoolAddress || "",
        aadharNumber: teacher.aadharNumber || "",
        panNumber: teacher.panNumber || teacher.panId || "",
        address: teacher.address || "",
        permanentAddress: teacher.permanentAddress || "",
        religion: teacher.religion || "",
        motherTongue: teacher.motherTongue || "",
        fatherName: teacher.fatherName || "",
        motherName: teacher.motherName || "",
        maritalStatus: teacher.maritalStatus || "Single",
        spouseName: teacher.spouseName || "",
        spouseMobile: teacher.spouseMobile || "",
        subjects: teacher.subjects || (teacher.subject ? [teacher.subject] : ["Physics"]),
        languages: teacher.languages || ["Hindi", "English"],
        bankName: teacher.bankName || "",
        branch: teacher.branch || "",
        accountNumber: teacher.accountNumber || "",
        ifsc: teacher.ifsc || "",
        otherInfo: teacher.otherInfo || "",
        accountHolderName: teacher.accountHolderName || "",
        resumeName: teacher.resumeName || "",
        degreeCertificateName: teacher.degreeCertificateName || "",
        pgCertificateName: teacher.pgCertificateName || "",
        bedCertificateName: teacher.bedCertificateName || "",
        experienceCertificateName: teacher.experienceCertificateName || "",
        joiningLetterName: teacher.joiningLetterName || "",
        aadharDocName: teacher.aadharDocName || "",
        panDocName: teacher.panDocName || "",
        avatarPreview: teacher.avatarPreview || "",
      }));
    }
  }, [teacher]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const handleFieldChange = (field, value) => {
    if (isFaculty) return;
    setForm((p) => ({ ...p, [field]: value }));
    if (errors[field]) {
      setErrors((p) => {
        const next = { ...p };
        delete next[field];
        return next;
      });
    }
  };

  const handleDocUpload = (e, fieldKey) => {
    if (isFaculty) return;
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      showToast("File must be 4MB or smaller.");
      return;
    }
    setForm((p) => ({ ...p, [fieldKey]: file.name }));
  };

  const handleDocRemove = (fieldKey, ref) => {
    if (isFaculty) return;
    setForm((p) => ({ ...p, [fieldKey]: "" }));
    if (ref?.current) ref.current.value = "";
  };

  const handlePhotoUpload = (e) => {
    if (isFaculty) return;
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      showToast("Image must be 4MB or smaller.");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setForm((p) => ({ ...p, avatarPreview: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleAddSubject = (e) => {
    if (isFaculty) return;
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const val = subjectInput.trim();
      if (val && !form.subjects.includes(val)) {
        setForm((p) => ({ ...p, subjects: [...p.subjects, val] }));
      }
      setSubjectInput("");
    }
  };

  const removeSubject = (sub) => {
    if (isFaculty) return;
    setForm((p) => ({ ...p, subjects: p.subjects.filter((s) => s !== sub) }));
  };

  const handleAddLanguage = (e) => {
    if (isFaculty) return;
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const val = langInput.trim();
      if (val && !form.languages.includes(val)) {
        setForm((p) => ({ ...p, languages: [...p.languages, val] }));
      }
      setLangInput("");
    }
  };

  const removeLanguage = (lang) => {
    if (isFaculty) return;
    setForm((p) => ({ ...p, languages: p.languages.filter((l) => l !== lang) }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isFaculty) return;
    const newErrors = {};

    if (!form.firstName.trim()) newErrors.firstName = "First name is required.";
    const sanitizedContact = form.primaryContact.replace(/\D/g, "").trim();
    if (!sanitizedContact) {
      newErrors.primaryContact = "Primary contact number is required.";
    } else if (sanitizedContact.length !== 10) {
      newErrors.primaryContact = "Must be a valid 10-digit mobile number.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showToast("Please fix the highlighted errors.");
      return;
    }

    const primarySub = form.subjects && form.subjects.length > 0 ? form.subjects.join(", ") : (form.subject || "General");
    submitTeacherCorrections(token, {
      ...form,
      name: `${form.firstName} ${form.lastName}`.trim(),
      phone: form.primaryContact,
      subject: primarySub,
      subjects: form.subjects && form.subjects.length > 0 ? form.subjects : [primarySub],
      status: teacher?.status === "Corrections Requested" ? "Corrections Submitted" : "Form Submitted",
    });

    setSubmitted(true);
  };

  // Dynamic Spouse Label based on gender
  const isMarried = form.maritalStatus === "Married";
  const spouseNameLabel =
    form.gender === "Female"
      ? "Husband's Name"
      : form.gender === "Male"
      ? "Wife's Name"
      : "Spouse Name";

  const spouseMobileLabel =
    form.gender === "Female"
      ? "Husband's Mobile No."
      : form.gender === "Male"
      ? "Wife's Mobile No."
      : "Spouse Mobile No.";

  if (!teacher) {
    return (
      <div className="min-h-screen bg-[#f4f6f8] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl border border-[var(--ac-border)] p-8 text-center shadow-sm">
          <div className="h-12 w-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-4">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-base font-bold text-gray-900 mb-2">Invalid or Expired Link</h2>
          <p className="text-xs text-gray-500 mb-6">This teacher recruitment link is invalid or has expired. Please contact the school administration.</p>
          <Link to="/login" className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--ac-green)] px-4 py-2 text-xs font-semibold text-white hover:bg-[var(--ac-green-dark)] transition-colors">
            Go to BodhyaMarg Portal
          </Link>
        </div>
      </div>
    );
  }

  if (submitted && !isFaculty) {
    return (
      <div className="min-h-screen bg-[#f4f6f8] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl border border-[var(--ac-border)] p-8 text-center shadow-sm">
          <div className="h-12 w-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">
            {teacher.status === "Corrections Requested" ? "Corrections Submitted Successfully!" : "Recruitment Form Submitted!"}
          </h2>
          <p className="text-xs text-gray-600 mb-6">
            Thank you, <strong className="text-gray-900">{form.firstName} {form.lastName}</strong>. Your teacher profile and educational documents have been submitted to BodhyaMarg School for verification.
          </p>
          <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 text-xs text-gray-500 mb-6">
            Our HR & Academic administration team will review your application and reach out to you at <span className="font-semibold text-gray-700">{form.email || form.primaryContact}</span>.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f6f8] py-8 px-4 sm:px-6">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-xs text-white shadow-xl">
          <svg className="h-4 w-4 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          {toast}
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        {/* Back navigation button */}
        <div className="mb-4">
          <button
            type="button"
            onClick={() => {
              if (window.history.length > 1) {
                navigate(-1);
              } else {
                navigate("/front-office/teachers/recruitments");
              }
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--ac-border)] bg-white px-3.5 py-1.5 text-xs font-semibold text-[var(--ac-text)] hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-2xs"
          >
            <ArrowLeft className="h-4 w-4 text-[var(--ac-green)]" />
            <span>Back</span>
          </button>
        </div>

        {/* Simple & Clean Header Card */}
        <div className="mb-6 rounded-xl border border-[var(--ac-border)] bg-white p-6 shadow-xs border-t-4 border-t-[var(--ac-green)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--ac-green)]">
                {isFaculty ? "Staff Review & Verification" : "BodhyaMarg ERP · Teacher Onboarding"}
              </p>
              <h1 className="text-xl font-bold text-[var(--ac-text)] mt-1">
                {isFaculty
                  ? `${form.firstName} ${form.lastName}`.trim() || "Candidate Application"
                  : "Teacher Recruitment Form"}
              </h1>
              <p className="text-xs text-[var(--ac-muted)] mt-1 max-w-xl">
                {isFaculty
                  ? "Submitted application and educational certificates. Review details below."
                  : "Please fill out your personal details and upload required certificates."}
              </p>
            </div>

            <div className="flex flex-col items-end gap-2">
              <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-[var(--ac-green)]">
                Ref: {teacher.teacherId}
              </span>
              {isFaculty ? (
                <Link
                  to="/front-office/teachers/recruitments"
                  className="text-xs text-gray-500 hover:text-gray-800 font-medium flex items-center gap-1"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Back to Pipeline
                </Link>
              ) : null}
            </div>
          </div>
        </div>

        {/* School Corrections Request Banner */}
        {teacher.status === "Corrections Requested" && teacher.correctionNotes && (
          <div className="mb-6 rounded-xl border border-[var(--ac-border)] bg-white p-4 shadow-2xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-xs">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-50 text-amber-600 font-bold text-xs shrink-0 border border-amber-200">
                !
              </span>
              <span className="font-semibold text-gray-900">Correction Required:</span>
              <span className="text-gray-700">{teacher.correctionNotes}</span>
            </div>
            {!isFaculty && (
              <span className="text-[11px] text-[var(--ac-muted)] shrink-0 hidden sm:inline">
                Update details below and submit
              </span>
            )}
          </div>
        )}

        {/* Form Details — EXACT IDENTICAL SECTIONS AS ADD TEACHER */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* ── CARD 1: Personal Information ── */}
          <div className="rounded-xl border border-[var(--ac-border)] bg-white p-6">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-sm font-bold text-[var(--ac-green)]">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-[var(--ac-green)]">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </span>
                <span>Personal Information</span>
              </div>
              {isFaculty && (
                <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded">
                  Staff Review Mode
                </span>
              )}
            </div>

            {/* Photo Upload */}
            <div className="mb-6 flex flex-wrap items-center gap-4">
              <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              <div
                onClick={() => !isFaculty && photoInputRef.current?.click()}
                className={`relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-dashed border-[var(--ac-border)] bg-gray-50 shrink-0 ${
                  !isFaculty ? "cursor-pointer hover:border-[var(--ac-green)]" : ""
                }`}
              >
                {form.avatarPreview ? (
                  <img src={form.avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                )}
              </div>
              {!isFaculty && (
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 rounded-md border border-[var(--ac-border)] bg-white px-3 py-1.5 text-xs font-medium text-[var(--ac-text)] hover:bg-gray-50 transition-colors w-fit"
                  >
                    Upload Photo
                  </button>
                  <p className="text-[11px] text-[var(--ac-hint)]">Upload passport size photo (max 4MB, JPG, PNG)</p>
                </div>
              )}
            </div>

            {/* Row 1 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-[var(--ac-muted)] mb-1">
                  First Name {!isFaculty && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="text"
                  disabled={isFaculty}
                  className={`ac-input ${errors.firstName ? "border-red-400" : ""} ${isFaculty ? "bg-gray-50 text-gray-800" : ""}`}
                  value={form.firstName}
                  onChange={(e) => handleFieldChange("firstName", e.target.value)}
                  placeholder="First Name"
                />
                {errors.firstName && <p className="mt-1 text-[11px] text-red-500">{errors.firstName}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--ac-muted)] mb-1">Last Name</label>
                <input
                  type="text"
                  disabled={isFaculty}
                  className={`ac-input ${isFaculty ? "bg-gray-50 text-gray-800" : ""}`}
                  value={form.lastName}
                  onChange={(e) => handleFieldChange("lastName", e.target.value)}
                  placeholder="Last Name"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--ac-muted)] mb-1">Gender</label>
                <select disabled={isFaculty} className={`ac-select ${isFaculty ? "bg-gray-50 text-gray-800" : ""}`} value={form.gender} onChange={(e) => handleFieldChange("gender", e.target.value)}>
                  {TEACHER_GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--ac-muted)] mb-1">Date of Birth</label>
                <input type="date" disabled={isFaculty} className={`ac-input ${isFaculty ? "bg-gray-50 text-gray-800" : ""}`} value={form.dob} onChange={(e) => handleFieldChange("dob", e.target.value)} />
              </div>
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-[var(--ac-muted)] mb-1">
                  Primary Contact Number (10 Digits) {!isFaculty && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="tel"
                  disabled={isFaculty}
                  className={`ac-input ${errors.primaryContact ? "border-red-400" : ""} ${isFaculty ? "bg-gray-50 text-gray-800" : ""}`}
                  value={form.primaryContact}
                  onChange={(e) => handleFieldChange("primaryContact", e.target.value.replace(/\D/g, "").slice(0, 10))}
                  maxLength={10}
                  placeholder="e.g. 9876543210"
                />
                {errors.primaryContact && <p className="mt-1 text-[11px] text-red-500">{errors.primaryContact}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--ac-muted)] mb-1">Email Address</label>
                <input
                  type="email"
                  disabled={isFaculty}
                  className={`ac-input ${isFaculty ? "bg-gray-50 text-gray-800" : ""}`}
                  value={form.email}
                  onChange={(e) => handleFieldChange("email", e.target.value)}
                  placeholder="name@email.com"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--ac-muted)] mb-1">Aadhar Card No.</label>
                <input
                  type="text"
                  disabled={isFaculty}
                  className={`ac-input font-mono ${isFaculty ? "bg-gray-50 text-gray-800" : ""}`}
                  value={form.aadharNumber}
                  onChange={(e) => handleFieldChange("aadharNumber", e.target.value)}
                  placeholder="12-digit Aadhar"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--ac-muted)] mb-1">PAN Card Number</label>
                <input
                  type="text"
                  disabled={isFaculty}
                  className={`ac-input font-mono uppercase ${isFaculty ? "bg-gray-50 text-gray-800" : ""}`}
                  value={form.panNumber}
                  onChange={(e) => handleFieldChange("panNumber", e.target.value)}
                  placeholder="10-digit PAN"
                />
              </div>
            </div>

            {/* Row 3 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-[var(--ac-muted)] mb-1">Father's Name</label>
                <input type="text" disabled={isFaculty} className={`ac-input ${isFaculty ? "bg-gray-50 text-gray-800" : ""}`} value={form.fatherName} onChange={(e) => handleFieldChange("fatherName", e.target.value)} placeholder="Father's Name" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--ac-muted)] mb-1">Mother's Name</label>
                <input type="text" disabled={isFaculty} className={`ac-input ${isFaculty ? "bg-gray-50 text-gray-800" : ""}`} value={form.motherName} onChange={(e) => handleFieldChange("motherName", e.target.value)} placeholder="Mother's Name" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--ac-muted)] mb-1">Religion</label>
                <select disabled={isFaculty} className={`ac-select ${isFaculty ? "bg-gray-50 text-gray-800" : ""}`} value={form.religion} onChange={(e) => handleFieldChange("religion", e.target.value)}>
                  <option value="">Select</option>
                  {TEACHER_RELIGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--ac-muted)] mb-1">Mother Tongue</label>
                <select disabled={isFaculty} className={`ac-select ${isFaculty ? "bg-gray-50 text-gray-800" : ""}`} value={form.motherTongue} onChange={(e) => handleFieldChange("motherTongue", e.target.value)}>
                  <option value="">Select</option>
                  {TEACHER_MOTHER_TONGUES.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>

            {/* Row 4 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-[var(--ac-muted)] mb-1">Marital Status</label>
                <select disabled={isFaculty} className={`ac-select ${isFaculty ? "bg-gray-50 text-gray-800" : ""}`} value={form.maritalStatus} onChange={(e) => handleFieldChange("maritalStatus", e.target.value)}>
                  {TEACHER_MARITAL_STATUSES.map((ms) => <option key={ms} value={ms}>{ms}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--ac-muted)] mb-1">Blood Group</label>
                <select disabled={isFaculty} className={`ac-select ${isFaculty ? "bg-gray-50 text-gray-800" : ""}`} value={form.bloodGroup} onChange={(e) => handleFieldChange("bloodGroup", e.target.value)}>
                  <option value="">Select</option>
                  {TEACHER_BLOOD_GROUPS.map((bg) => <option key={bg} value={bg}>{bg}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--ac-muted)] mb-1">Qualification</label>
                <input
                  type="text"
                  disabled={isFaculty}
                  list="candidate-qualifications"
                  className={`ac-input ${isFaculty ? "bg-gray-50 text-gray-800" : ""}`}
                  value={form.qualification}
                  onChange={(e) => handleFieldChange("qualification", e.target.value)}
                  placeholder="Select or type qualification"
                />
                <datalist id="candidate-qualifications">
                  {TEACHER_QUALIFICATIONS.map((q) => <option key={q} value={q} />)}
                </datalist>
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--ac-muted)] mb-1">Work Experience</label>
                <input type="text" disabled={isFaculty} className={`ac-input ${isFaculty ? "bg-gray-50 text-gray-800" : ""}`} value={form.workExperience} onChange={(e) => handleFieldChange("workExperience", e.target.value)} placeholder="e.g. 5 Years" />
              </div>
            </div>

            {/* Dynamic Spouse Fields */}
            {isMarried && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium text-[var(--ac-muted)] mb-1">{spouseNameLabel}</label>
                  <input type="text" disabled={isFaculty} className={`ac-input ${isFaculty ? "bg-gray-50 text-gray-800" : ""}`} value={form.spouseName} onChange={(e) => handleFieldChange("spouseName", e.target.value)} placeholder={spouseNameLabel} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--ac-muted)] mb-1">{spouseMobileLabel} (10 Digits)</label>
                  <input
                    type="tel"
                    disabled={isFaculty}
                    className={`ac-input ${isFaculty ? "bg-gray-50 text-gray-800" : ""}`}
                    value={form.spouseMobile}
                    onChange={(e) => handleFieldChange("spouseMobile", e.target.value.replace(/\D/g, "").slice(0, 10))}
                    maxLength={10}
                    placeholder="e.g. 9876543210"
                  />
                </div>
              </div>
            )}

            {/* Subjects Tags */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-[var(--ac-muted)] mb-1">Subject(s) You Can Teach</label>
              <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-[var(--ac-border)] bg-white p-2 min-h-[42px]">
                {form.subjects.map((sub) => (
                  <span key={sub} className="inline-flex items-center gap-1 rounded-full bg-[var(--ac-green-light)] px-2.5 py-0.5 text-xs font-semibold text-[var(--ac-green)]">
                    {sub}
                    {!isFaculty && (
                      <button type="button" onClick={() => removeSubject(sub)} className="hover:text-red-600 ml-0.5 font-bold">×</button>
                    )}
                  </span>
                ))}
                {!isFaculty && (
                  <input
                    type="text"
                    className="flex-1 min-w-[80px] border-none bg-transparent p-0 text-xs outline-none focus:ring-0"
                    placeholder="+ Add subject"
                    value={subjectInput}
                    onChange={(e) => setSubjectInput(e.target.value)}
                    onKeyDown={handleAddSubject}
                  />
                )}
              </div>
            </div>

            {/* Languages Known Tags */}
            <div>
              <label className="block text-xs font-medium text-[var(--ac-muted)] mb-1">Languages Known</label>
              <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-[var(--ac-border)] bg-white p-2 min-h-[42px]">
                {form.languages.map((lang) => (
                  <span key={lang} className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-700">
                    {lang}
                    {!isFaculty && (
                      <button type="button" onClick={() => removeLanguage(lang)} className="hover:text-red-600 ml-0.5 font-bold">×</button>
                    )}
                  </span>
                ))}
                {!isFaculty && (
                  <input
                    type="text"
                    className="flex-1 min-w-[80px] border-none bg-transparent p-0 text-xs outline-none focus:ring-0"
                    placeholder="+ Add language"
                    value={langInput}
                    onChange={(e) => setLangInput(e.target.value)}
                    onKeyDown={handleAddLanguage}
                  />
                )}
              </div>
            </div>
          </div>

          {/* ── CARD 2: Address Details ── */}
          <div className="rounded-xl border border-[var(--ac-border)] bg-white p-6">
            <div className="mb-6 flex items-center gap-2.5 text-sm font-bold text-[var(--ac-green)]">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-[var(--ac-green)]">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
              </span>
              <span>Address</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-medium text-[var(--ac-muted)] mb-1.5">Current Address</label>
                <textarea rows={3} disabled={isFaculty} className={`ac-textarea min-h-[90px] ${isFaculty ? "bg-gray-50 text-gray-800" : ""}`} value={form.address} onChange={(e) => handleFieldChange("address", e.target.value)} placeholder="Enter current address..." />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--ac-muted)] mb-1.5">Permanent Address</label>
                <textarea rows={3} disabled={isFaculty} className={`ac-textarea min-h-[90px] ${isFaculty ? "bg-gray-50 text-gray-800" : ""}`} value={form.permanentAddress} onChange={(e) => handleFieldChange("permanentAddress", e.target.value)} placeholder="Enter permanent address..." />
              </div>
            </div>
          </div>

          {/* ── CARD 3: Previous School Details ── */}
          <div className="rounded-xl border border-[var(--ac-border)] bg-white p-6">
            <div className="mb-6 flex items-center gap-2.5 text-sm font-bold text-[var(--ac-green)]">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-[var(--ac-green)]">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </span>
              <span>Previous School Details</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[var(--ac-muted)] mb-1">Previous School Name</label>
                <input
                  type="text"
                  disabled={isFaculty}
                  className={`ac-input ${isFaculty ? "bg-gray-50 text-gray-800" : ""}`}
                  value={form.prevSchool}
                  onChange={(e) => handleFieldChange("prevSchool", e.target.value)}
                  placeholder="Previous School Name"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--ac-muted)] mb-1">Previous School Address</label>
                <input
                  type="text"
                  disabled={isFaculty}
                  className={`ac-input ${isFaculty ? "bg-gray-50 text-gray-800" : ""}`}
                  value={form.prevSchoolAddress}
                  onChange={(e) => handleFieldChange("prevSchoolAddress", e.target.value)}
                  placeholder="City, State"
                />
              </div>
            </div>
          </div>

          {/* ── CARD 4: Bank Details ── */}
          <div className="rounded-xl border border-[var(--ac-border)] bg-white p-6">
            <div className="mb-6 flex items-center gap-2.5 text-sm font-bold text-[var(--ac-green)]">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-[var(--ac-green)]">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </span>
              <span>Bank Details</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-[var(--ac-muted)] mb-1">Bank Name</label>
                <input type="text" disabled={isFaculty} className={`ac-input ${isFaculty ? "bg-gray-50 text-gray-800" : ""}`} value={form.bankName} onChange={(e) => handleFieldChange("bankName", e.target.value)} placeholder="Bank Name" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--ac-muted)] mb-1">Branch</label>
                <input type="text" disabled={isFaculty} className={`ac-input ${isFaculty ? "bg-gray-50 text-gray-800" : ""}`} value={form.branch} onChange={(e) => handleFieldChange("branch", e.target.value)} placeholder="Branch Name" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--ac-muted)] mb-1">Account Number</label>
                <input type="text" disabled={isFaculty} className={`ac-input font-mono ${isFaculty ? "bg-gray-50 text-gray-800" : ""}`} value={form.accountNumber} onChange={(e) => handleFieldChange("accountNumber", e.target.value)} placeholder="Account Number" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--ac-muted)] mb-1">IFSC Code</label>
                <input type="text" disabled={isFaculty} className={`ac-input font-mono uppercase ${isFaculty ? "bg-gray-50 text-gray-800" : ""}`} value={form.ifsc} onChange={(e) => handleFieldChange("ifsc", e.target.value)} placeholder="IFSC Code" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[var(--ac-muted)] mb-1">Other Information</label>
                <input type="text" disabled={isFaculty} className={`ac-input ${isFaculty ? "bg-gray-50 text-gray-800" : ""}`} value={form.otherInfo} onChange={(e) => handleFieldChange("otherInfo", e.target.value)} placeholder="Optional note" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--ac-muted)] mb-1">Account Holder Name</label>
                <input type="text" disabled={isFaculty} className={`ac-input ${isFaculty ? "bg-gray-50 text-gray-800" : ""}`} value={form.accountHolderName} onChange={(e) => handleFieldChange("accountHolderName", e.target.value)} placeholder="As per bank records" />
              </div>
            </div>
          </div>

          {/* ── CARD 5: Documents (Educational & Professional) ── */}
          <div className="rounded-xl border border-[var(--ac-border)] bg-white p-6">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-sm font-bold text-[var(--ac-green)]">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-[var(--ac-green)]">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </span>
                <span>Documents (Educational & Identity)</span>
              </div>
              {isFaculty && (
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Documents Verified
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Degree */}
              <div className="rounded-lg border border-[var(--ac-border)] bg-gray-50/50 p-4 flex flex-col justify-between">
                <div>
                  <input ref={degreeInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(e) => handleDocUpload(e, "degreeCertificateName")} />
                  <div className="text-xs font-semibold text-[var(--ac-text)]">Graduation / Degree Certificate</div>
                  <div className="text-[11px] text-[var(--ac-hint)] mt-0.5 mb-3">Upload image or file size of 4MB, Accepted Format PDF, JPG</div>
                </div>
                <div>
                  {!isFaculty && (
                    <button type="button" onClick={() => degreeInputRef.current?.click()} className="rounded-lg border border-[var(--ac-green)] bg-white px-4 py-1.5 text-xs font-semibold text-[var(--ac-green)] hover:bg-emerald-50 transition-colors">
                      Upload Document
                    </button>
                  )}
                  {form.degreeCertificateName ? (
                    <div className="mt-2 flex items-center justify-between gap-1 text-xs font-medium text-emerald-700 bg-emerald-50/80 px-2 py-1 rounded">
                      <span className="truncate">✓ {form.degreeCertificateName}</span>
                      {!isFaculty ? (
                        <button type="button" onClick={() => handleDocRemove("degreeCertificateName", degreeInputRef)} className="text-red-500 font-bold">×</button>
                      ) : (
                        <span className="text-[10px] font-bold bg-white px-1.5 py-0.5 rounded border border-emerald-300">View ↗</span>
                      )}
                    </div>
                  ) : (
                    <span className="text-[11px] text-gray-400">Not uploaded</span>
                  )}
                </div>
              </div>

              {/* Post-Graduation */}
              <div className="rounded-lg border border-[var(--ac-border)] bg-gray-50/50 p-4 flex flex-col justify-between">
                <div>
                  <input ref={pgInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(e) => handleDocUpload(e, "pgCertificateName")} />
                  <div className="text-xs font-semibold text-[var(--ac-text)]">Post-Graduation / Master's Certificate</div>
                  <div className="text-[11px] text-[var(--ac-hint)] mt-0.5 mb-3">Upload image or file size of 4MB, Accepted Format PDF, JPG</div>
                </div>
                <div>
                  {!isFaculty && (
                    <button type="button" onClick={() => pgInputRef.current?.click()} className="rounded-lg border border-[var(--ac-green)] bg-white px-4 py-1.5 text-xs font-semibold text-[var(--ac-green)] hover:bg-emerald-50 transition-colors">
                      Upload Document
                    </button>
                  )}
                  {form.pgCertificateName ? (
                    <div className="mt-2 flex items-center justify-between gap-1 text-xs font-medium text-emerald-700 bg-emerald-50/80 px-2 py-1 rounded">
                      <span className="truncate">✓ {form.pgCertificateName}</span>
                      {!isFaculty ? (
                        <button type="button" onClick={() => handleDocRemove("pgCertificateName", pgInputRef)} className="text-red-500 font-bold">×</button>
                      ) : (
                        <span className="text-[10px] font-bold bg-white px-1.5 py-0.5 rounded border border-emerald-300">View ↗</span>
                      )}
                    </div>
                  ) : (
                    <span className="text-[11px] text-gray-400">Not uploaded</span>
                  )}
                </div>
              </div>

              {/* B.Ed */}
              <div className="rounded-lg border border-[var(--ac-border)] bg-gray-50/50 p-4 flex flex-col justify-between">
                <div>
                  <input ref={bedInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(e) => handleDocUpload(e, "bedCertificateName")} />
                  <div className="text-xs font-semibold text-[var(--ac-text)]">B.Ed / Teaching Certification</div>
                  <div className="text-[11px] text-[var(--ac-hint)] mt-0.5 mb-3">Upload image or file size of 4MB, Accepted Format PDF, JPG</div>
                </div>
                <div>
                  {!isFaculty && (
                    <button type="button" onClick={() => bedInputRef.current?.click()} className="rounded-lg border border-[var(--ac-green)] bg-white px-4 py-1.5 text-xs font-semibold text-[var(--ac-green)] hover:bg-emerald-50 transition-colors">
                      Upload Document
                    </button>
                  )}
                  {form.bedCertificateName ? (
                    <div className="mt-2 flex items-center justify-between gap-1 text-xs font-medium text-emerald-700 bg-emerald-50/80 px-2 py-1 rounded">
                      <span className="truncate">✓ {form.bedCertificateName}</span>
                      {!isFaculty ? (
                        <button type="button" onClick={() => handleDocRemove("bedCertificateName", bedInputRef)} className="text-red-500 font-bold">×</button>
                      ) : (
                        <span className="text-[10px] font-bold bg-white px-1.5 py-0.5 rounded border border-emerald-300">View ↗</span>
                      )}
                    </div>
                  ) : (
                    <span className="text-[11px] text-gray-400">Not uploaded</span>
                  )}
                </div>
              </div>

              {/* Experience */}
              <div className="rounded-lg border border-[var(--ac-border)] bg-gray-50/50 p-4 flex flex-col justify-between">
                <div>
                  <input ref={experienceInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(e) => handleDocUpload(e, "experienceCertificateName")} />
                  <div className="text-xs font-semibold text-[var(--ac-text)]">Experience Certificate</div>
                  <div className="text-[11px] text-[var(--ac-hint)] mt-0.5 mb-3">Upload previous school experience letter (PDF, JPG)</div>
                </div>
                <div>
                  {!isFaculty && (
                    <button type="button" onClick={() => experienceInputRef.current?.click()} className="rounded-lg border border-[var(--ac-green)] bg-white px-4 py-1.5 text-xs font-semibold text-[var(--ac-green)] hover:bg-emerald-50 transition-colors">
                      Upload Document
                    </button>
                  )}
                  {form.experienceCertificateName ? (
                    <div className="mt-2 flex items-center justify-between gap-1 text-xs font-medium text-emerald-700 bg-emerald-50/80 px-2 py-1 rounded">
                      <span className="truncate">✓ {form.experienceCertificateName}</span>
                      {!isFaculty ? (
                        <button type="button" onClick={() => handleDocRemove("experienceCertificateName", experienceInputRef)} className="text-red-500 font-bold">×</button>
                      ) : (
                        <span className="text-[10px] font-bold bg-white px-1.5 py-0.5 rounded border border-emerald-300">View ↗</span>
                      )}
                    </div>
                  ) : (
                    <span className="text-[11px] text-gray-400">Not uploaded</span>
                  )}
                </div>
              </div>

              {/* Resume */}
              <div className="rounded-lg border border-[var(--ac-border)] bg-gray-50/50 p-4 flex flex-col justify-between">
                <div>
                  <input ref={resumeInputRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => handleDocUpload(e, "resumeName")} />
                  <div className="text-xs font-semibold text-[var(--ac-text)]">Resume / Curriculum Vitae (CV)</div>
                  <div className="text-[11px] text-[var(--ac-hint)] mt-0.5 mb-3">Upload latest resume (PDF, Word)</div>
                </div>
                <div>
                  {!isFaculty && (
                    <button type="button" onClick={() => resumeInputRef.current?.click()} className="rounded-lg border border-[var(--ac-green)] bg-white px-4 py-1.5 text-xs font-semibold text-[var(--ac-green)] hover:bg-emerald-50 transition-colors">
                      Upload Document
                    </button>
                  )}
                  {form.resumeName ? (
                    <div className="mt-2 flex items-center justify-between gap-1 text-xs font-medium text-emerald-700 bg-emerald-50/80 px-2 py-1 rounded">
                      <span className="truncate">✓ {form.resumeName}</span>
                      {!isFaculty ? (
                        <button type="button" onClick={() => handleDocRemove("resumeName", resumeInputRef)} className="text-red-500 font-bold">×</button>
                      ) : (
                        <span className="text-[10px] font-bold bg-white px-1.5 py-0.5 rounded border border-emerald-300">View ↗</span>
                      )}
                    </div>
                  ) : (
                    <span className="text-[11px] text-gray-400">Not uploaded</span>
                  )}
                </div>
              </div>

              {/* Joining Letter */}
              <div className="rounded-lg border border-[var(--ac-border)] bg-gray-50/50 p-4 flex flex-col justify-between">
                <div>
                  <input ref={joiningLetterInputRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => handleDocUpload(e, "joiningLetterName")} />
                  <div className="text-xs font-semibold text-[var(--ac-text)]">Joining / Appointment Letter</div>
                  <div className="text-[11px] text-[var(--ac-hint)] mt-0.5 mb-3">Upload signed joining letter (PDF, Word)</div>
                </div>
                <div>
                  {!isFaculty && (
                    <button type="button" onClick={() => joiningLetterInputRef.current?.click()} className="rounded-lg border border-[var(--ac-green)] bg-white px-4 py-1.5 text-xs font-semibold text-[var(--ac-green)] hover:bg-emerald-50 transition-colors">
                      Upload Document
                    </button>
                  )}
                  {form.joiningLetterName ? (
                    <div className="mt-2 flex items-center justify-between gap-1 text-xs font-medium text-emerald-700 bg-emerald-50/80 px-2 py-1 rounded">
                      <span className="truncate">✓ {form.joiningLetterName}</span>
                      {!isFaculty ? (
                        <button type="button" onClick={() => handleDocRemove("joiningLetterName", joiningLetterInputRef)} className="text-red-500 font-bold">×</button>
                      ) : (
                        <span className="text-[10px] font-bold bg-white px-1.5 py-0.5 rounded border border-emerald-300">View ↗</span>
                      )}
                    </div>
                  ) : (
                    <span className="text-[11px] text-gray-400">Not uploaded</span>
                  )}
                </div>
              </div>

              {/* Aadhar Copy */}
              <div className="rounded-lg border border-[var(--ac-border)] bg-gray-50/50 p-4 flex flex-col justify-between">
                <div>
                  <input ref={aadharDocInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(e) => handleDocUpload(e, "aadharDocName")} />
                  <div className="text-xs font-semibold text-[var(--ac-text)]">Aadhar Card Copy</div>
                  <div className="text-[11px] text-[var(--ac-hint)] mt-0.5 mb-3">Upload identity document (PDF, JPG, PNG)</div>
                </div>
                <div>
                  {!isFaculty && (
                    <button type="button" onClick={() => aadharDocInputRef.current?.click()} className="rounded-lg border border-[var(--ac-green)] bg-white px-4 py-1.5 text-xs font-semibold text-[var(--ac-green)] hover:bg-emerald-50 transition-colors">
                      Upload Document
                    </button>
                  )}
                  {form.aadharDocName ? (
                    <div className="mt-2 flex items-center justify-between gap-1 text-xs font-medium text-emerald-700 bg-emerald-50/80 px-2 py-1 rounded">
                      <span className="truncate">✓ {form.aadharDocName}</span>
                      {!isFaculty ? (
                        <button type="button" onClick={() => handleDocRemove("aadharDocName", aadharDocInputRef)} className="text-red-500 font-bold">×</button>
                      ) : (
                        <span className="text-[10px] font-bold bg-white px-1.5 py-0.5 rounded border border-emerald-300">View ↗</span>
                      )}
                    </div>
                  ) : (
                    <span className="text-[11px] text-gray-400">Not uploaded</span>
                  )}
                </div>
              </div>

              {/* PAN Copy */}
              <div className="rounded-lg border border-[var(--ac-border)] bg-gray-50/50 p-4 flex flex-col justify-between">
                <div>
                  <input ref={panDocInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(e) => handleDocUpload(e, "panDocName")} />
                  <div className="text-xs font-semibold text-[var(--ac-text)]">PAN Card Copy</div>
                  <div className="text-[11px] text-[var(--ac-hint)] mt-0.5 mb-3">Upload PAN card document (PDF, JPG, PNG)</div>
                </div>
                <div>
                  {!isFaculty && (
                    <button type="button" onClick={() => panDocInputRef.current?.click()} className="rounded-lg border border-[var(--ac-green)] bg-white px-4 py-1.5 text-xs font-semibold text-[var(--ac-green)] hover:bg-emerald-50 transition-colors">
                      Upload Document
                    </button>
                  )}
                  {form.panDocName ? (
                    <div className="mt-2 flex items-center justify-between gap-1 text-xs font-medium text-emerald-700 bg-emerald-50/80 px-2 py-1 rounded">
                      <span className="truncate">✓ {form.panDocName}</span>
                      {!isFaculty ? (
                        <button type="button" onClick={() => handleDocRemove("panDocName", panDocInputRef)} className="text-red-500 font-bold">×</button>
                      ) : (
                        <span className="text-[10px] font-bold bg-white px-1.5 py-0.5 rounded border border-emerald-300">View ↗</span>
                      )}
                    </div>
                  ) : (
                    <span className="text-[11px] text-gray-400">Not uploaded</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action Submission (Candidate Mode vs Faculty Review Mode) */}
          <div className="flex flex-wrap items-center justify-between rounded-xl border border-[var(--ac-border)] bg-white px-6 py-4 shadow-sm gap-3">
            {!isFaculty ? (
              <>
                <p className="text-xs text-[var(--ac-muted)]">
                  By submitting, you certify that all information provided is accurate and authentic.
                </p>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--ac-green)] px-6 py-2.5 text-xs font-semibold text-white hover:bg-[var(--ac-green-dark)] transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {teacher.status === "Corrections Requested" ? "Submit Corrections" : "Submit Application Form"}
                </button>
              </>
            ) : (
              /* Faculty Review Mode Action Bar */
              <>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-700">Faculty Review Actions:</span>
                  <span className="text-xs text-gray-500">Status: <strong>{teacher.status}</strong></span>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setCorrectionNotes(teacher.correctionNotes || "");
                      setCorrectionError("");
                      setShowCorrectionModal(true);
                    }}
                    className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-100 transition-colors"
                  >
                    Request Corrections
                  </button>

                  {teacher.status !== "Hired" && teacher.status !== "Active" && (
                    <button
                      type="button"
                      onClick={() => {
                        markTeacherHired(teacher.id);
                        showToast(`${teacher.name || "Candidate"} marked as Hired!`);
                      }}
                      className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors"
                    >
                      Mark as Hired / Selected
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      const res = createTeacherAccount(teacher.id, {
                        classAssigned: teacher.classAssigned && teacher.classAssigned !== "—" ? teacher.classAssigned : "Class I-A",
                        primarySubject: teacher.subject || "General",
                        email: teacher.email || `${(teacher.firstName || "teacher").toLowerCase()}.${(teacher.lastName || "staff").toLowerCase()}@bodhyamarg.com`,
                      });
                      setAccountResult(res);
                      setShowAccountModal(true);
                      showToast(`ERP Account created for ${res.name}!`);
                    }}
                    className="rounded-lg bg-[var(--ac-green)] px-5 py-2 text-xs font-semibold text-white hover:bg-[var(--ac-green-dark)] transition-colors shadow-sm"
                  >
                    Create ERP Account
                  </button>
                </div>
              </>
            )}
          </div>
        </form>
      </div>

      {/* ── FACULTY MODAL: Request Corrections ── */}
      {showCorrectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-[1px] transition-opacity"
            onClick={() => setShowCorrectionModal(false)}
          />
          <div className="relative z-10 w-full max-w-lg rounded-2xl border border-[var(--ac-border)] bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--ac-border)] pb-4 mb-4">
              <div className="flex items-center gap-2 text-sm font-bold text-[var(--ac-green)]">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-[var(--ac-green)]">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </span>
                <span>Request Corrections from Candidate</span>
              </div>
              <button
                type="button"
                onClick={() => setShowCorrectionModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-gray-600">
                Candidate will see these correction notes highlighted on their form link and can update details and re-upload documents.
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
                onClick={() => setShowCorrectionModal(false)}
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
                  requestTeacherCorrections(teacher.id, correctionNotes.trim());
                  setShowCorrectionModal(false);
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

      {/* ── FACULTY MODAL: Create ERP Account ── */}
      {showAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-[1px] transition-opacity"
            onClick={() => {
              setShowAccountModal(false);
              setAccountResult(null);
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
                <span>Create ERP Account: {form.firstName} {form.lastName}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAccountModal(false);
                  setAccountResult(null);
                }}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {!accountResult ? (
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

                <div className="mt-6 flex items-center justify-end gap-2.5 border-t border-[var(--ac-border)] pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAccountModal(false)}
                    className="rounded-lg border border-[var(--ac-border)] bg-white px-4 py-2 text-xs font-medium text-[var(--ac-text)] hover:bg-gray-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const res = createTeacherAccount(teacher.id, {
                        classAssigned: accountClass,
                        primarySubject: accountSubject,
                        email: form.email,
                      });
                      setAccountResult(res);
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
              /* Success Credentials Slip */
              <div className="space-y-4 text-xs">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 text-center">
                  <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-2 font-bold">
                    ✓
                  </div>
                  <h4 className="text-sm font-bold text-emerald-900">ERP Account Created Successfully!</h4>
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    Teacher is now active in the directory. You can share login credentials below.
                  </p>
                </div>

                <div className="rounded-xl border border-[var(--ac-border)] bg-gray-50/70 p-4 space-y-2.5 font-mono">
                  <div className="flex justify-between border-b border-gray-200 pb-1.5">
                    <span className="text-gray-500 font-sans">Teacher Name:</span>
                    <span className="font-bold text-gray-900">{accountResult.name}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-200 pb-1.5">
                    <span className="text-gray-500 font-sans">Teacher ID:</span>
                    <span className="font-bold text-[var(--ac-green)]">{accountResult.teacherId}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-200 pb-1.5">
                    <span className="text-gray-500 font-sans">Login Username / Email:</span>
                    <span className="font-bold text-gray-900">{accountResult.email}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-200 pb-1.5">
                    <span className="text-gray-500 font-sans">Temporary Password:</span>
                    <span className="font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">{accountResult.tempPassword}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-sans">Class & Subject:</span>
                    <span className="font-bold text-gray-900">{accountResult.classAssigned} · {accountResult.subject}</span>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-[var(--ac-border)] pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      const slipText = `BodhyaMarg ERP Teacher Credentials:\nName: ${accountResult.name}\nTeacher ID: ${accountResult.teacherId}\nLogin Email: ${accountResult.email}\nPassword: ${accountResult.tempPassword}\nPortal: ${window.location.origin}/login`;
                      navigator.clipboard.writeText(slipText);
                      setCopiedCredentials(true);
                      setTimeout(() => setCopiedCredentials(false), 2500);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--ac-border)] bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    {copiedCredentials ? "✓ Credentials Copied!" : "Copy Credentials"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowAccountModal(false);
                      setAccountResult(null);
                    }}
                    className="rounded-lg bg-[var(--ac-green)] px-6 py-2 text-xs font-semibold text-white hover:bg-[var(--ac-green-dark)]"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
