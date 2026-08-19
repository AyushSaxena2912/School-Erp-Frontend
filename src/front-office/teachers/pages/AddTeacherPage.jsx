import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Trash2, UserCheck, UserX, X } from "lucide-react";
import { useTeachers } from "../context/TeachersContext";
import {
  TEACHER_BLOOD_GROUPS,
  TEACHER_CLASSES,
  TEACHER_GENDERS,
  TEACHER_MARITAL_STATUSES,
  TEACHER_MOTHER_TONGUES,
  TEACHER_PICKUP_POINTS,
  TEACHER_QUALIFICATIONS,
  TEACHER_RELIGIONS,
  TEACHER_ROUTES,
  TEACHER_SUBJECTS,
  TEACHER_SUBJECTS_LIST,
  TEACHER_VEHICLES,
} from "../data/teachers";

export default function AddTeacherPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    teachers,
    addTeacher,
    updateTeacher,
    deleteTeacher,
    getTeacherById,
    sendRecruitmentForm,
    requestTeacherCorrections,
  } = useTeachers();

  const isEdit = Boolean(id);
  const editingTeacher = isEdit ? getTeacherById(id) : null;

  // Send Form Modal States
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendEmail, setSendEmail] = useState("");
  const [sendPhone, setSendPhone] = useState("");
  const [sendName, setSendName] = useState("");
  const [sendSubject, setSendSubject] = useState("Physics");
  const [sendMsg, setSendMsg] = useState("Dear Candidate, Please fill out your teacher recruitment and onboarding profile along with educational certificates using the link below.");
  const [generatedLink, setGeneratedLink] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);

  // Request Corrections Modal States
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [correctionNotes, setCorrectionNotes] = useState("");
  const [correctionError, setCorrectionError] = useState("");
  const [showCorrectionSentModal, setShowCorrectionSentModal] = useState(false);

  const [form, setForm] = useState({
    teacherId: "",
    firstName: "",
    lastName: "",
    classTeacher: "",
    subjects: ["Physics"],
    gender: "Male",
    primaryContact: "",
    email: "",
    bloodGroup: "",
    dateOfJoining: "",
    fatherName: "",
    motherName: "",
    dob: "",
    maritalStatus: "Single",
    spouseName: "",
    spouseMobile: "",
    languages: ["Hindi", "English"],
    qualification: "",
    workExperience: "",
    prevSchool: "",
    prevSchoolAddress: "",
    address: "",
    permanentAddress: "",
    aadharNumber: "",
    panNumber: "",
    panId: "",
    status: "Active",
    religion: "",
    motherTongue: "",
    // Leaves
    medicalLeaves: 10,
    casualLeaves: 8,
    maternityLeaves: 0,
    sickLeaves: 6,
    // Transport
    route: "",
    vehicleNo: "",
    pickupPoint: "",
    // Documents
    resumeName: "",
    joiningLetterName: "",
    degreeCertificateName: "",
    pgCertificateName: "",
    bedCertificateName: "",
    experienceCertificateName: "",
    // Bank Account
    bankName: "",
    branch: "",
    ifsc: "",
    otherInfo: "",
    accountNumber: "",
    accountHolderName: "",
    // Password
    password: "",
    confirmPassword: "",
    // Avatar
    avatarPreview: "",
  });

  const [subjectInput, setSubjectInput] = useState("");
  const [langInput, setLangInput] = useState("");
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState("");

  const photoInputRef = useRef(null);
  const resumeInputRef = useRef(null);
  const joiningLetterInputRef = useRef(null);
  const degreeInputRef = useRef(null);
  const pgInputRef = useRef(null);
  const bedInputRef = useRef(null);
  const experienceInputRef = useRef(null);
  const aadharDocInputRef = useRef(null);
  const panDocInputRef = useRef(null);

  useEffect(() => {
    if (isEdit && editingTeacher) {
      setForm({
        teacherId: editingTeacher.teacherId || "",
        firstName: editingTeacher.firstName || "",
        lastName: editingTeacher.lastName || "",
        classTeacher: editingTeacher.classTeacher || editingTeacher.classAssigned || "",
        subjects: editingTeacher.subjects || (editingTeacher.subject ? [editingTeacher.subject] : ["General"]),
        gender: editingTeacher.gender || "Male",
        primaryContact: editingTeacher.primaryContact || editingTeacher.phone || "",
        email: editingTeacher.email || "",
        bloodGroup: editingTeacher.bloodGroup || "",
        dateOfJoining: editingTeacher.dateOfJoining || "",
        fatherName: editingTeacher.fatherName || "",
        motherName: editingTeacher.motherName || "",
        dob: editingTeacher.dob || "",
        maritalStatus: editingTeacher.maritalStatus || "Single",
        spouseName: editingTeacher.spouseName || "",
        spouseMobile: editingTeacher.spouseMobile || "",
        languages: editingTeacher.languages || ["Hindi", "English"],
        qualification: editingTeacher.qualification || "",
        workExperience: editingTeacher.workExperience || "",
        prevSchool: editingTeacher.prevSchool || "",
        prevSchoolAddress: editingTeacher.prevSchoolAddress || "",
        address: editingTeacher.address || "",
        permanentAddress: editingTeacher.permanentAddress || "",
        aadharNumber: editingTeacher.aadharNumber || editingTeacher.aadharCard || "",
        panNumber: editingTeacher.panNumber || editingTeacher.panId || "",
        panId: editingTeacher.panId || editingTeacher.panNumber || "",
        status: editingTeacher.status || "Active",
        religion: editingTeacher.religion || "",
        motherTongue: editingTeacher.motherTongue || "",
        medicalLeaves: editingTeacher.medicalLeaves ?? 10,
        casualLeaves: editingTeacher.casualLeaves ?? 8,
        maternityLeaves: editingTeacher.maternityLeaves ?? 0,
        sickLeaves: editingTeacher.sickLeaves ?? 6,
        route: editingTeacher.route || "",
        vehicleNo: editingTeacher.vehicleNo || "",
        pickupPoint: editingTeacher.pickupPoint || "",
        resumeName: editingTeacher.resumeName || "",
        joiningLetterName: editingTeacher.joiningLetterName || "",
        degreeCertificateName: editingTeacher.degreeCertificateName || "",
        pgCertificateName: editingTeacher.pgCertificateName || "",
        bedCertificateName: editingTeacher.bedCertificateName || "",
        experienceCertificateName: editingTeacher.experienceCertificateName || "",
        aadharDocName: editingTeacher.aadharDocName || "",
        panDocName: editingTeacher.panDocName || "",
        bankName: editingTeacher.bankName || "",
        branch: editingTeacher.branch || "",
        ifsc: editingTeacher.ifsc || "",
        otherInfo: editingTeacher.otherInfo || "",
        accountNumber: editingTeacher.accountNumber || "",
        accountHolderName: editingTeacher.accountHolderName || "",
        password: "",
        confirmPassword: "",
        avatarPreview: editingTeacher.avatarPreview || "",
      });
    } else if (!isEdit) {
      // Auto-generate teacher ID for new teacher
      const randomId = "T" + Math.floor(100000 + Math.random() * 900000);
      setForm((p) => ({
        ...p,
        teacherId: randomId,
        dateOfJoining: new Date().toISOString().split("T")[0],
      }));
    }
  }, [isEdit, editingTeacher]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const handleFieldChange = (field, value) => {
    setForm((p) => ({ ...p, [field]: value }));
    if (errors[field]) {
      setErrors((p) => {
        const next = { ...p };
        delete next[field];
        return next;
      });
    }
  };

  // Generic Document Upload Handler
  const handleDocUpload = (e, fieldKey) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      showToast("File must be 4MB or smaller.");
      return;
    }
    setForm((p) => ({ ...p, [fieldKey]: file.name }));
  };

  const handleDocRemove = (fieldKey, ref) => {
    setForm((p) => ({ ...p, [fieldKey]: "" }));
    if (ref?.current) ref.current.value = "";
  };

  // Add Subject Tag
  const handleAddSubject = (e) => {
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
    setForm((p) => ({ ...p, subjects: p.subjects.filter((s) => s !== sub) }));
  };

  // Add Language Tag
  const handleAddLanguage = (e) => {
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
    setForm((p) => ({ ...p, languages: p.languages.filter((l) => l !== lang) }));
  };

  // Photo Upload
  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      showToast("Photo must be smaller than 4MB.");
      return;
    }
    const url = URL.createObjectURL(file);
    setForm((p) => ({ ...p, avatarPreview: url }));
  };

  const handleRemovePhoto = () => {
    setForm((p) => ({ ...p, avatarPreview: "" }));
    if (photoInputRef.current) photoInputRef.current.value = "";
  };

  // Document Uploads
  const handleResumeUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      showToast("File must be 4MB or smaller.");
      return;
    }
    setForm((p) => ({ ...p, resumeName: file.name }));
  };

  const handleJoiningLetterUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      showToast("File must be 4MB or smaller.");
      return;
    }
    setForm((p) => ({ ...p, joiningLetterName: file.name }));
  };

  // Submit Handler
  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!form.firstName.trim()) {
      newErrors.firstName = "First name is required.";
    }
    const sanitizedContact = form.primaryContact.replace(/\D/g, "").trim();
    if (!sanitizedContact) {
      newErrors.primaryContact = "Primary contact number is required.";
    } else if (sanitizedContact.length !== 10) {
      newErrors.primaryContact = "Primary contact must be exactly 10 digits.";
    }
    if (form.password && form.password !== form.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showToast("Please fill all required fields correctly.");
      return;
    }

    if (isEdit && editingTeacher) {
      updateTeacher(editingTeacher.id, form);
      showToast("Teacher updated successfully!");
      setTimeout(() => navigate("/front-office/teachers"), 600);
    } else {
      addTeacher(form);
      showToast("Teacher added successfully!");
      setTimeout(() => navigate("/front-office/teachers"), 600);
    }
  };

  const handleToggleActiveStatus = () => {
    if (isEdit && editingTeacher) {
      const newStatus = editingTeacher.status === "Inactive" ? "Active" : "Inactive";
      const actionLabel = newStatus === "Inactive" ? "mark as Inactive" : "activate";
      if (window.confirm(`Are you sure you want to ${actionLabel} teacher "${editingTeacher.name}"?`)) {
        updateTeacher(editingTeacher.id, { status: newStatus });
        showToast(`Teacher ${editingTeacher.name} marked as ${newStatus}!`);
        setTimeout(() => navigate("/front-office/teachers"), 500);
      }
    }
  };

  const handlePermanentDelete = () => {
    if (isEdit && editingTeacher) {
      if (window.confirm(`⚠️ PERMANENT DELETE WARNING:\nAre you sure you want to permanently delete teacher record "${editingTeacher.name}"?\nThis cannot be undone.`)) {
        deleteTeacher(editingTeacher.id);
        navigate("/front-office/teachers");
      }
    }
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

  return (
    <div className="academic-page pb-12">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-xs text-white shadow-xl">
          <svg className="h-4 w-4 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[var(--ac-text)] flex items-center gap-2.5">
            {isEdit ? "Edit Teacher" : "Add Teacher"}
            {editingTeacher?.status && (
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                editingTeacher.status === "Corrections Requested"
                  ? "bg-amber-100 text-amber-800"
                  : editingTeacher.status === "Corrections Submitted"
                  ? "bg-emerald-100 text-emerald-800"
                  : editingTeacher.status === "Form Sent"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-gray-100 text-gray-700"
              }`}>
                {editingTeacher.status}
              </span>
            )}
          </h1>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-[var(--ac-hint)]">
            <Link to="/front-office" className="hover:text-[var(--ac-green)]">Dashboard</Link>
            <span>/</span>
            <Link to="/front-office/teachers" className="hover:text-[var(--ac-green)]">Teachers</Link>
            <span>/</span>
            <span className="text-[var(--ac-green)] font-medium">
              {isEdit ? "Edit Teacher" : "Add Teacher"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Send Form to Candidate Button */}
          <button
            type="button"
            onClick={() => {
              setSendEmail(form.email || "");
              setSendPhone(form.primaryContact || form.phone || "");
              setSendName(form.firstName ? `${form.firstName} ${form.lastName}`.trim() : "");
              setSendSubject(form.subjects?.[0] || "Physics");
              setGeneratedLink("");
              setCopiedLink(false);
              setShowSendModal(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--ac-green)] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[var(--ac-green-dark)] transition-colors shadow-2xs"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Send Form to Candidate
          </button>

          {/* Request Corrections Button (if in onboarding/recruitment and NOT Active in ERP) */}
          {isEdit && editingTeacher?.status && editingTeacher.status !== "Active" && (
            <button
              type="button"
              onClick={() => {
                setCorrectionNotes(editingTeacher?.correctionNotes || "");
                setCorrectionError("");
                setShowCorrectionModal(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--ac-border)] bg-white px-3.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:text-gray-900 hover:border-gray-400 transition-colors shadow-2xs"
            >
              <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span>Request Corrections</span>
            </button>
          )}

          <Link
            to="/front-office/teachers"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--ac-border)] bg-white px-3.5 py-1.5 text-xs font-medium text-[var(--ac-text)] hover:bg-gray-50 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to List
          </Link>
        </div>
      </div>

      {/* Corrections Banner if school requested corrections */}
      {editingTeacher?.status === "Corrections Requested" && editingTeacher?.correctionNotes && (
        <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50/90 p-4 flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-100 text-amber-800 shrink-0 mt-0.5">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </span>
            <div>
              <p className="text-xs font-bold text-amber-900">Corrections Requested from Candidate</p>
              <p className="text-xs text-amber-800 mt-1 font-medium bg-white/60 p-2 rounded border border-amber-200">
                "{editingTeacher.correctionNotes}"
              </p>
              {editingTeacher.correctionsRequestedAt && (
                <p className="text-[11px] text-amber-700 mt-1">Requested on {editingTeacher.correctionsRequestedAt}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setCorrectionNotes(editingTeacher.correctionNotes);
              setShowCorrectionModal(true);
            }}
            className="text-xs font-semibold text-amber-800 underline hover:text-amber-950 shrink-0"
          >
            Edit Request
          </button>
        </div>
      )}

      {/* Corrections Submitted Banner */}
      {editingTeacher?.status === "Corrections Submitted" && (
        <div className="mb-6 rounded-xl border border-emerald-300 bg-emerald-50/90 p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-100 text-emerald-800 shrink-0">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </span>
            <div>
              <p className="text-xs font-bold text-emerald-900">Candidate Resubmitted Corrections</p>
              <p className="text-[11px] text-emerald-700">
                {editingTeacher.correctionsSubmittedAt ? `Resubmitted on ${editingTeacher.correctionsSubmittedAt}. ` : ""}
                Review updated details & documents below.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              updateTeacher(editingTeacher.id, { status: "Active" });
              showToast("Teacher marked as Verified & Active!");
            }}
            className="rounded-lg bg-[var(--ac-green)] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[var(--ac-green-dark)] transition-colors shrink-0"
          >
            Approve & Verify
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* ── CARD 1: Personal Information ── */}
        <div className="rounded-xl border border-[var(--ac-border)] bg-white p-6">
          <div className="mb-6 flex items-center gap-2.5 text-sm font-bold text-[var(--ac-green)]">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-[var(--ac-green)]">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </span>
            <span>Personal Information</span>
          </div>

          {/* Upload Photo Box */}
          <div className="mb-6 flex flex-wrap items-center gap-4">
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
            />
            <div
              onClick={() => photoInputRef.current?.click()}
              className="relative flex h-16 w-16 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-dashed border-[var(--ac-border)] bg-gray-50 hover:border-[var(--ac-green)] transition-colors shrink-0"
            >
              {form.avatarPreview ? (
                <img
                  src={form.avatarPreview}
                  alt="Avatar"
                  className="h-full w-full object-cover"
                />
              ) : (
                <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 rounded-md border border-[var(--ac-border)] bg-white px-3 py-1.5 text-xs font-medium text-[var(--ac-text)] hover:bg-gray-50 transition-colors"
                >
                  Upload
                </button>
                {form.avatarPreview && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
              <p className="text-[11px] text-[var(--ac-hint)]">
                Upload image size 4MB, Format JPG, PNG, SVG
              </p>
            </div>
          </div>

          {/* 4-Column Grid Rows */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-[var(--ac-muted)] mb-1">Teacher ID</label>
              <input
                type="text"
                className="ac-input font-medium"
                value={form.teacherId}
                onChange={(e) => handleFieldChange("teacherId", e.target.value)}
                placeholder="e.g. T849127"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--ac-muted)] mb-1">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className={`ac-input ${errors.firstName ? "border-red-400" : ""}`}
                value={form.firstName}
                onChange={(e) => handleFieldChange("firstName", e.target.value)}
                placeholder="First Name"
              />
              {errors.firstName && (
                <p className="mt-1 text-[11px] text-red-500">{errors.firstName}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--ac-muted)] mb-1">Last Name</label>
              <input
                type="text"
                className="ac-input"
                value={form.lastName}
                onChange={(e) => handleFieldChange("lastName", e.target.value)}
                placeholder="Last Name"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--ac-muted)] mb-1">Class Teacher</label>
              <select
                className="ac-select"
                value={form.classTeacher}
                onChange={(e) => handleFieldChange("classTeacher", e.target.value)}
              >
                <option value="">Select Class</option>
                {TEACHER_CLASSES.map((cls) => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-[var(--ac-muted)] mb-1">
                Gender <span className="text-red-500">*</span>
              </label>
              <select
                className="ac-select"
                value={form.gender}
                onChange={(e) => handleFieldChange("gender", e.target.value)}
              >
                {TEACHER_GENDERS.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--ac-muted)] mb-1">Date of Birth</label>
              <input
                type="date"
                className="ac-input"
                value={form.dob}
                onChange={(e) => handleFieldChange("dob", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--ac-muted)] mb-1">Blood Group</label>
              <select
                className="ac-select"
                value={form.bloodGroup}
                onChange={(e) => handleFieldChange("bloodGroup", e.target.value)}
              >
                <option value="">Select</option>
                {TEACHER_BLOOD_GROUPS.map((bg) => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--ac-muted)] mb-1">Date of Joining</label>
              <input
                type="date"
                className="ac-input"
                value={form.dateOfJoining}
                onChange={(e) => handleFieldChange("dateOfJoining", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-[var(--ac-muted)] mb-1">
                Primary Contact Number (10 Digits) <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                className={`ac-input ${errors.primaryContact ? "border-red-400" : ""}`}
                value={form.primaryContact}
                onChange={(e) => handleFieldChange("primaryContact", e.target.value.replace(/\D/g, "").slice(0, 10))}
                maxLength={10}
                placeholder="e.g. 9876543210"
              />
              {errors.primaryContact && (
                <p className="mt-1 text-[11px] text-red-500">{errors.primaryContact}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--ac-muted)] mb-1">Email Address</label>
              <input
                type="email"
                className="ac-input"
                value={form.email}
                onChange={(e) => handleFieldChange("email", e.target.value)}
                placeholder="teacher@school.com"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--ac-muted)] mb-1">Aadhar Card No.</label>
              <input
                type="text"
                className="ac-input font-mono"
                value={form.aadharNumber}
                onChange={(e) => handleFieldChange("aadharNumber", e.target.value)}
                placeholder="12-digit Aadhar"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--ac-muted)] mb-1">PAN Card Number</label>
              <input
                type="text"
                className="ac-input font-mono uppercase"
                value={form.panNumber || form.panId}
                onChange={(e) => {
                  handleFieldChange("panNumber", e.target.value);
                  handleFieldChange("panId", e.target.value);
                }}
                placeholder="10-digit PAN"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-[var(--ac-muted)] mb-1">Father's Name</label>
              <input
                type="text"
                className="ac-input"
                value={form.fatherName}
                onChange={(e) => handleFieldChange("fatherName", e.target.value)}
                placeholder="Father's name"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--ac-muted)] mb-1">Mother's Name</label>
              <input
                type="text"
                className="ac-input"
                value={form.motherName}
                onChange={(e) => handleFieldChange("motherName", e.target.value)}
                placeholder="Mother's name"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--ac-muted)] mb-1">Religion</label>
              <select
                className="ac-select"
                value={form.religion}
                onChange={(e) => handleFieldChange("religion", e.target.value)}
              >
                <option value="">Select</option>
                {TEACHER_RELIGIONS.map((rel) => (
                  <option key={rel} value={rel}>{rel}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--ac-muted)] mb-1">Mother Tongue</label>
              <select
                className="ac-select"
                value={form.motherTongue}
                onChange={(e) => handleFieldChange("motherTongue", e.target.value)}
              >
                <option value="">Select</option>
                {TEACHER_MOTHER_TONGUES.map((mt) => (
                  <option key={mt} value={mt}>{mt}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-[var(--ac-muted)] mb-1">Marital Status</label>
              <select
                className="ac-select"
                value={form.maritalStatus}
                onChange={(e) => handleFieldChange("maritalStatus", e.target.value)}
              >
                {TEACHER_MARITAL_STATUSES.map((ms) => (
                  <option key={ms} value={ms}>{ms}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--ac-muted)] mb-1">Status</label>
              <select
                className="ac-select"
                value={form.status}
                onChange={(e) => handleFieldChange("status", e.target.value)}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--ac-muted)] mb-1">Qualification</label>
              <input
                type="text"
                list="teacher-qualifications"
                className="ac-input"
                value={form.qualification}
                onChange={(e) => handleFieldChange("qualification", e.target.value)}
                placeholder="Select or type (e.g. M.Sc, B.Ed)"
              />
              <datalist id="teacher-qualifications">
                {TEACHER_QUALIFICATIONS.map((q) => (
                  <option key={q} value={q} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--ac-muted)] mb-1">Work Experience</label>
              <input
                type="text"
                className="ac-input"
                value={form.workExperience}
                onChange={(e) => handleFieldChange("workExperience", e.target.value)}
                placeholder="e.g. 5 Years"
              />
            </div>
          </div>

          {/* Dynamic Spouse Fields */}
          {isMarried && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-[var(--ac-muted)] mb-1">{spouseNameLabel}</label>
                <input
                  type="text"
                  className="ac-input"
                  value={form.spouseName}
                  onChange={(e) => handleFieldChange("spouseName", e.target.value)}
                  placeholder="Enter name"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--ac-muted)] mb-1">{spouseMobileLabel} (10 Digits)</label>
                <input
                  type="tel"
                  className="ac-input"
                  value={form.spouseMobile}
                  onChange={(e) => handleFieldChange("spouseMobile", e.target.value.replace(/\D/g, "").slice(0, 10))}
                  maxLength={10}
                  placeholder="e.g. 9876543210"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-[var(--ac-muted)] mb-1">Previous School if Any</label>
              <input
                type="text"
                className="ac-input"
                value={form.prevSchool}
                onChange={(e) => handleFieldChange("prevSchool", e.target.value)}
                placeholder="Previous School Name"
              />
            </div>
          </div>

          {/* Subjects Tag Row */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-[var(--ac-muted)] mb-1">Subject(s)</label>
            <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-[var(--ac-border)] bg-white p-2 min-h-[42px] focus-within:border-[var(--ac-green)]">
              {form.subjects.map((sub) => (
                <span
                  key={sub}
                  className="inline-flex items-center gap-1 rounded-full bg-[var(--ac-green-light)] px-2.5 py-0.5 text-xs font-semibold text-[var(--ac-green)]"
                >
                  {sub}
                  <button
                    type="button"
                    onClick={() => removeSubject(sub)}
                    className="hover:text-red-600 ml-0.5 font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}
              <input
                type="text"
                className="flex-1 min-w-[80px] border-none bg-transparent p-0 text-xs outline-none focus:ring-0"
                placeholder={form.subjects.length === 0 ? "Add subject..." : "+ Add subject"}
                value={subjectInput}
                onChange={(e) => setSubjectInput(e.target.value)}
                onKeyDown={handleAddSubject}
              />
            </div>
          </div>

          {/* Language Known Tag Row */}
          <div>
            <label className="block text-xs font-medium text-[var(--ac-muted)] mb-1">Language Known</label>
            <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-dashed border-[var(--ac-border)] bg-white p-2 min-h-[42px] focus-within:border-[var(--ac-green)]">
              {form.languages.map((lang) => (
                <span
                  key={lang}
                  className="inline-flex items-center gap-1 rounded-full bg-[var(--ac-green-light)] px-2.5 py-0.5 text-xs font-semibold text-[var(--ac-green)]"
                >
                  {lang}
                  <button
                    type="button"
                    onClick={() => removeLanguage(lang)}
                    className="hover:text-red-600 ml-0.5 font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}
              <input
                type="text"
                className="flex-1 min-w-[80px] border-none bg-transparent p-0 text-xs outline-none focus:ring-0"
                placeholder={form.languages.length === 0 ? "Add language..." : "+ Add language"}
                value={langInput}
                onChange={(e) => setLangInput(e.target.value)}
                onKeyDown={handleAddLanguage}
              />
            </div>
          </div>
        </div>

        {/* ── CARD 2: Address ── */}
        <div className="rounded-xl border border-[var(--ac-border)] bg-white p-6">
          <div className="mb-6 flex items-center gap-2.5 text-sm font-bold text-[var(--ac-green)]">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-[var(--ac-green)]">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </span>
            <span>Address</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-medium text-[var(--ac-muted)] mb-1.5">
                Current Address <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                className="ac-textarea min-h-[90px]"
                value={form.address}
                onChange={(e) => handleFieldChange("address", e.target.value)}
                placeholder="Enter current address..."
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--ac-muted)] mb-1.5">
                Permanent Address
              </label>
              <textarea
                rows={3}
                className="ac-textarea min-h-[90px]"
                value={form.permanentAddress}
                onChange={(e) => handleFieldChange("permanentAddress", e.target.value)}
                placeholder="Enter permanent address..."
              />
            </div>
          </div>
        </div>



        {/* ── CARD 5: Documents (Educational & Professional) ── */}
        <div className="rounded-xl border border-[var(--ac-border)] bg-white p-6">
          <div className="mb-6 flex items-center gap-2.5 text-sm font-bold text-[var(--ac-green)]">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-[var(--ac-green)]">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </span>
            <span>Documents (Educational & Identity)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Degree / Graduation Certificate */}
            <div className="rounded-lg border border-[var(--ac-border)] bg-gray-50/50 p-4 flex flex-col justify-between">
              <div>
                <input
                  ref={degreeInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={(e) => handleDocUpload(e, "degreeCertificateName")}
                />
                <div className="text-xs font-semibold text-[var(--ac-text)]">Graduation / Degree Certificate</div>
                <div className="text-[11px] text-[var(--ac-hint)] mt-0.5 mb-3">
                  Upload image or file size of 4MB, Accepted Format PDF, JPG
                </div>
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => degreeInputRef.current?.click()}
                  className="rounded-lg border border-[var(--ac-green)] bg-white px-4 py-1.5 text-xs font-semibold text-[var(--ac-green)] hover:bg-emerald-50 transition-colors"
                >
                  Upload Document
                </button>
                {form.degreeCertificateName && (
                  <div className="mt-2 flex items-center justify-between gap-1 text-xs font-medium text-emerald-700 bg-emerald-50/80 px-2 py-1 rounded">
                    <span className="truncate">✓ {form.degreeCertificateName}</span>
                    <button type="button" onClick={() => handleDocRemove("degreeCertificateName", degreeInputRef)} className="text-red-500 hover:text-red-700 font-bold ml-1">×</button>
                  </div>
                )}
              </div>
            </div>

            {/* Post-Graduation Certificate */}
            <div className="rounded-lg border border-[var(--ac-border)] bg-gray-50/50 p-4 flex flex-col justify-between">
              <div>
                <input
                  ref={pgInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={(e) => handleDocUpload(e, "pgCertificateName")}
                />
                <div className="text-xs font-semibold text-[var(--ac-text)]">Post-Graduation / Master's Certificate</div>
                <div className="text-[11px] text-[var(--ac-hint)] mt-0.5 mb-3">
                  Upload image or file size of 4MB, Accepted Format PDF, JPG
                </div>
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => pgInputRef.current?.click()}
                  className="rounded-lg border border-[var(--ac-green)] bg-white px-4 py-1.5 text-xs font-semibold text-[var(--ac-green)] hover:bg-emerald-50 transition-colors"
                >
                  Upload Document
                </button>
                {form.pgCertificateName && (
                  <div className="mt-2 flex items-center justify-between gap-1 text-xs font-medium text-emerald-700 bg-emerald-50/80 px-2 py-1 rounded">
                    <span className="truncate">✓ {form.pgCertificateName}</span>
                    <button type="button" onClick={() => handleDocRemove("pgCertificateName", pgInputRef)} className="text-red-500 hover:text-red-700 font-bold ml-1">×</button>
                  </div>
                )}
              </div>
            </div>

            {/* B.Ed / Teaching Certificate */}
            <div className="rounded-lg border border-[var(--ac-border)] bg-gray-50/50 p-4 flex flex-col justify-between">
              <div>
                <input
                  ref={bedInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={(e) => handleDocUpload(e, "bedCertificateName")}
                />
                <div className="text-xs font-semibold text-[var(--ac-text)]">B.Ed / Teaching Certification</div>
                <div className="text-[11px] text-[var(--ac-hint)] mt-0.5 mb-3">
                  Upload image or file size of 4MB, Accepted Format PDF, JPG
                </div>
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => bedInputRef.current?.click()}
                  className="rounded-lg border border-[var(--ac-green)] bg-white px-4 py-1.5 text-xs font-semibold text-[var(--ac-green)] hover:bg-emerald-50 transition-colors"
                >
                  Upload Document
                </button>
                {form.bedCertificateName && (
                  <div className="mt-2 flex items-center justify-between gap-1 text-xs font-medium text-emerald-700 bg-emerald-50/80 px-2 py-1 rounded">
                    <span className="truncate">✓ {form.bedCertificateName}</span>
                    <button type="button" onClick={() => handleDocRemove("bedCertificateName", bedInputRef)} className="text-red-500 hover:text-red-700 font-bold ml-1">×</button>
                  </div>
                )}
              </div>
            </div>

            {/* Experience Certificate */}
            <div className="rounded-lg border border-[var(--ac-border)] bg-gray-50/50 p-4 flex flex-col justify-between">
              <div>
                <input
                  ref={experienceInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={(e) => handleDocUpload(e, "experienceCertificateName")}
                />
                <div className="text-xs font-semibold text-[var(--ac-text)]">Experience Certificate</div>
                <div className="text-[11px] text-[var(--ac-hint)] mt-0.5 mb-3">
                  Upload previous school experience letter (PDF, JPG)
                </div>
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => experienceInputRef.current?.click()}
                  className="rounded-lg border border-[var(--ac-green)] bg-white px-4 py-1.5 text-xs font-semibold text-[var(--ac-green)] hover:bg-emerald-50 transition-colors"
                >
                  Upload Document
                </button>
                {form.experienceCertificateName && (
                  <div className="mt-2 flex items-center justify-between gap-1 text-xs font-medium text-emerald-700 bg-emerald-50/80 px-2 py-1 rounded">
                    <span className="truncate">✓ {form.experienceCertificateName}</span>
                    <button type="button" onClick={() => handleDocRemove("experienceCertificateName", experienceInputRef)} className="text-red-500 hover:text-red-700 font-bold ml-1">×</button>
                  </div>
                )}
              </div>
            </div>

            {/* Resume / CV */}
            <div className="rounded-lg border border-[var(--ac-border)] bg-gray-50/50 p-4 flex flex-col justify-between">
              <div>
                <input
                  ref={resumeInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  onChange={(e) => handleDocUpload(e, "resumeName")}
                />
                <div className="text-xs font-semibold text-[var(--ac-text)]">Resume / Curriculum Vitae (CV)</div>
                <div className="text-[11px] text-[var(--ac-hint)] mt-0.5 mb-3">
                  Upload latest resume (PDF, Word)
                </div>
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => resumeInputRef.current?.click()}
                  className="rounded-lg border border-[var(--ac-green)] bg-white px-4 py-1.5 text-xs font-semibold text-[var(--ac-green)] hover:bg-emerald-50 transition-colors"
                >
                  Upload Document
                </button>
                {form.resumeName && (
                  <div className="mt-2 flex items-center justify-between gap-1 text-xs font-medium text-emerald-700 bg-emerald-50/80 px-2 py-1 rounded">
                    <span className="truncate">✓ {form.resumeName}</span>
                    <button type="button" onClick={() => handleDocRemove("resumeName", resumeInputRef)} className="text-red-500 hover:text-red-700 font-bold ml-1">×</button>
                  </div>
                )}
              </div>
            </div>

            {/* Joining / Appointment Letter */}
            <div className="rounded-lg border border-[var(--ac-border)] bg-gray-50/50 p-4 flex flex-col justify-between">
              <div>
                <input
                  ref={joiningLetterInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  onChange={(e) => handleDocUpload(e, "joiningLetterName")}
                />
                <div className="text-xs font-semibold text-[var(--ac-text)]">Joining / Appointment Letter</div>
                <div className="text-[11px] text-[var(--ac-hint)] mt-0.5 mb-3">
                  Upload signed joining letter (PDF, Word)
                </div>
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => joiningLetterInputRef.current?.click()}
                  className="rounded-lg border border-[var(--ac-green)] bg-white px-4 py-1.5 text-xs font-semibold text-[var(--ac-green)] hover:bg-emerald-50 transition-colors"
                >
                  Upload Document
                </button>
                {form.joiningLetterName && (
                  <div className="mt-2 flex items-center justify-between gap-1 text-xs font-medium text-emerald-700 bg-emerald-50/80 px-2 py-1 rounded">
                    <span className="truncate">✓ {form.joiningLetterName}</span>
                    <button type="button" onClick={() => handleDocRemove("joiningLetterName", joiningLetterInputRef)} className="text-red-500 hover:text-red-700 font-bold ml-1">×</button>
                  </div>
                )}
              </div>
            </div>

            {/* Aadhar Card Copy */}
            <div className="rounded-lg border border-[var(--ac-border)] bg-gray-50/50 p-4 flex flex-col justify-between">
              <div>
                <input
                  ref={aadharDocInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={(e) => handleDocUpload(e, "aadharDocName")}
                />
                <div className="text-xs font-semibold text-[var(--ac-text)]">Aadhar Card Copy</div>
                <div className="text-[11px] text-[var(--ac-hint)] mt-0.5 mb-3">
                  Upload identity document (PDF, JPG, PNG)
                </div>
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => aadharDocInputRef.current?.click()}
                  className="rounded-lg border border-[var(--ac-green)] bg-white px-4 py-1.5 text-xs font-semibold text-[var(--ac-green)] hover:bg-emerald-50 transition-colors"
                >
                  Upload Document
                </button>
                {form.aadharDocName && (
                  <div className="mt-2 flex items-center justify-between gap-1 text-xs font-medium text-emerald-700 bg-emerald-50/80 px-2 py-1 rounded">
                    <span className="truncate">✓ {form.aadharDocName}</span>
                    <button type="button" onClick={() => handleDocRemove("aadharDocName", aadharDocInputRef)} className="text-red-500 hover:text-red-700 font-bold ml-1">×</button>
                  </div>
                )}
              </div>
            </div>

            {/* PAN Card Copy */}
            <div className="rounded-lg border border-[var(--ac-border)] bg-gray-50/50 p-4 flex flex-col justify-between">
              <div>
                <input
                  ref={panDocInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={(e) => handleDocUpload(e, "panDocName")}
                />
                <div className="text-xs font-semibold text-[var(--ac-text)]">PAN Card Copy</div>
                <div className="text-[11px] text-[var(--ac-hint)] mt-0.5 mb-3">
                  Upload PAN card document (PDF, JPG, PNG)
                </div>
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => panDocInputRef.current?.click()}
                  className="rounded-lg border border-[var(--ac-green)] bg-white px-4 py-1.5 text-xs font-semibold text-[var(--ac-green)] hover:bg-emerald-50 transition-colors"
                >
                  Upload Document
                </button>
                {form.panDocName && (
                  <div className="mt-2 flex items-center justify-between gap-1 text-xs font-medium text-emerald-700 bg-emerald-50/80 px-2 py-1 rounded">
                    <span className="truncate">✓ {form.panDocName}</span>
                    <button type="button" onClick={() => handleDocRemove("panDocName", panDocInputRef)} className="text-red-500 hover:text-red-700 font-bold ml-1">×</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── CARD 6: Bank Account Detail ── */}
        <div className="rounded-xl border border-[var(--ac-border)] bg-white p-6">
          <div className="mb-6 flex items-center gap-2.5 text-sm font-bold text-[var(--ac-green)]">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-[var(--ac-green)]">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </span>
            <span>Bank Account Detail</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-[var(--ac-muted)] mb-1">Bank Name</label>
              <input
                type="text"
                className="ac-input"
                value={form.bankName}
                onChange={(e) => handleFieldChange("bankName", e.target.value)}
                placeholder="e.g. HDFC Bank"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--ac-muted)] mb-1">Branch</label>
              <input
                type="text"
                className="ac-input"
                value={form.branch}
                onChange={(e) => handleFieldChange("branch", e.target.value)}
                placeholder="e.g. Connaught Place"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--ac-muted)] mb-1">IFSC Number</label>
              <input
                type="text"
                className="ac-input font-mono uppercase"
                value={form.ifsc}
                onChange={(e) => handleFieldChange("ifsc", e.target.value)}
                placeholder="e.g. HDFC0001234"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--ac-muted)] mb-1">Other Information</label>
              <input
                type="text"
                className="ac-input"
                value={form.otherInfo}
                onChange={(e) => handleFieldChange("otherInfo", e.target.value)}
                placeholder="Additional details"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[var(--ac-muted)] mb-1">Account Number</label>
              <input
                type="text"
                className="ac-input font-mono"
                value={form.accountNumber}
                onChange={(e) => handleFieldChange("accountNumber", e.target.value)}
                placeholder="Enter bank account number"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--ac-muted)] mb-1">Account Holder Name</label>
              <input
                type="text"
                className="ac-input"
                value={form.accountHolderName}
                onChange={(e) => handleFieldChange("accountHolderName", e.target.value)}
                placeholder="As per bank records"
              />
            </div>
          </div>
        </div>

        {/* ── CARD 7: Password ── */}
        <div className="rounded-xl border border-[var(--ac-border)] bg-white p-6">
          <div className="mb-6 flex items-center gap-2.5 text-sm font-bold text-[var(--ac-green)]">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-[var(--ac-green)]">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </span>
            <span>Password</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[var(--ac-muted)] mb-1">Password</label>
              <input
                type="password"
                className="ac-input tracking-widest"
                value={form.password}
                onChange={(e) => handleFieldChange("password", e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--ac-muted)] mb-1">Confirm Password</label>
              <input
                type="password"
                className={`ac-input tracking-widest ${errors.confirmPassword ? "border-red-400" : ""}`}
                value={form.confirmPassword}
                onChange={(e) => handleFieldChange("confirmPassword", e.target.value)}
                placeholder="••••••••"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-[11px] text-red-500">{errors.confirmPassword}</p>
              )}
            </div>
          </div>
        </div>

        {/* ── Bottom Form Action Bar ── */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--ac-border)] bg-white px-6 py-4">
          {isEdit ? (
            <div className="flex items-center gap-2.5">
              {editingTeacher?.status === "Inactive" ? (
                <button
                  type="button"
                  onClick={handleToggleActiveStatus}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--ac-border)] bg-white px-3.5 py-2 text-xs font-semibold text-[var(--ac-green)] hover:bg-emerald-50/70 hover:border-emerald-300 transition-colors shadow-2xs"
                >
                  <UserCheck className="h-4 w-4 text-[var(--ac-green)]" />
                  <span>Activate Teacher</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleToggleActiveStatus}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--ac-border)] bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:text-gray-900 hover:border-gray-400 transition-colors shadow-2xs"
                >
                  <UserX className="h-4 w-4 text-gray-500" />
                  <span>Mark as Inactive</span>
                </button>
              )}

              <button
                type="button"
                onClick={handlePermanentDelete}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--ac-border)] bg-white px-3.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors shadow-2xs"
                title="Permanently remove teacher from database"
              >
                <Trash2 className="h-4 w-4 text-red-500" />
                <span>Delete Permanently</span>
              </button>
            </div>
          ) : <div />}

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/front-office/teachers")}
              className="rounded-lg border border-[var(--ac-border)] bg-white px-5 py-2 text-xs font-medium text-[var(--ac-text)] hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--ac-green)] px-6 py-2 text-xs font-semibold text-white hover:bg-[var(--ac-green-dark)] transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              {isEdit ? "Save Changes" : "Add Teacher"}
            </button>
          </div>
        </div>
      </form>

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
                  const res = sendRecruitmentForm({
                    email: sendEmail.trim(),
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
                <span>Request Corrections from Teacher / Candidate</span>
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
                Candidate will see these correction notes highlighted on their recruitment form link and can update details and re-upload documents.
              </p>

              <div>
                <label className="block font-medium text-[var(--ac-muted)] mb-1">
                  What should the candidate / teacher fix? <span className="text-red-500">*</span>
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
                  const targetId = editingTeacher?.id || id;
                  if (targetId) {
                    requestTeacherCorrections(targetId, correctionNotes.trim());
                  }
                  setShowCorrectionModal(false);
                  setShowCorrectionSentModal(true);
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

      {/* ── MODAL 3: Correction Request Sent Confirmation ── */}
      {showCorrectionSentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-[var(--ac-border)] bg-white p-6 shadow-2xl text-center">
            <div className="h-12 w-12 rounded-full bg-emerald-50 text-[var(--ac-green)] flex items-center justify-center mx-auto mb-3">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-1">Correction Request Sent!</h3>
            <p className="text-xs text-gray-600 mb-6">
              Status is now <strong>Corrections Requested</strong>. The candidate can open their form link, fix the requested details, and resubmit.
            </p>

            <div className="flex items-center justify-center gap-3">
              {editingTeacher?.recruitmentToken && (
                <a
                  href={`/teacher-recruitment/${editingTeacher.recruitmentToken}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg border border-[var(--ac-border)] bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Open Candidate Form ↗
                </a>
              )}
              <button
                type="button"
                onClick={() => setShowCorrectionSentModal(false)}
                className="rounded-lg bg-[var(--ac-green)] px-6 py-2 text-xs font-semibold text-white hover:bg-[var(--ac-green-dark)]"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

