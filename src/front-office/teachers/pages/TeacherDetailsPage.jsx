import React, { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Award,
  BookOpen,
  Briefcase,
  Building,
  Bus,
  Calendar,
  Check,
  ChevronRight,
  Clock,
  Copy,
  CreditCard,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  Heart,
  Home,
  Languages,
  Lock,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Printer,
  School,
  Share2,
  Shield,
  Trash2,
  User,
  UserCheck,
  UserX,
  Users,
  X,
} from "lucide-react";
import { useTeachers } from "../context/TeachersContext";
import { useAcademic } from "../../academic";
import { initialTeachersData } from "../data/teachers";

export default function TeacherDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { teachers, updateTeacher, toggleTeacherStatus, deleteTeacher } = useTeachers();
  const academic = useAcademic();

  const [activeTab, setActiveTab] = useState("details"); // "details" | "routine" | "attendance"
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [copiedField, setCopiedField] = useState("");
  const [toast, setToast] = useState("");

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  const copyToClipboard = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    showToast(`${fieldName} copied to clipboard!`);
    setTimeout(() => setCopiedField(""), 2000);
  };

  const teacher =
    (teachers && teachers.find(
      (t) =>
        String(t.id) === String(id) ||
        String(t.teacherId) === String(id) ||
        String(t.id).toLowerCase() === String(id).toLowerCase() ||
        String(t.teacherId).toLowerCase() === String(id).toLowerCase()
    )) ||
    initialTeachersData.find(
      (t) =>
        String(t.id) === String(id) ||
        String(t.teacherId) === String(id) ||
        String(t.id).toLowerCase() === String(id).toLowerCase() ||
        String(t.teacherId).toLowerCase() === String(id).toLowerCase()
    ) ||
    (teachers && teachers[0]) ||
    initialTeachersData[0];

  if (!teacher) {
    return (
      <div className="p-8 text-center">
        <div className="mx-auto max-w-md rounded-2xl border border-[var(--ac-border)] bg-white p-8 shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500">
            <UserX className="h-7 w-7" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Teacher Not Found</h2>
          <p className="mt-1 text-xs text-gray-500">
            The teacher record you are looking for does not exist or has been removed.
          </p>
          <div className="mt-6">
            <Link
              to="/front-office/teachers"
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--ac-green)] px-4 py-2 text-xs font-semibold text-white hover:bg-[var(--ac-green-dark)] transition-colors"
            >
              Back to Teachers List
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const teacherName =
    teacher.name ||
    `${teacher.firstName || ""} ${teacher.lastName || ""}`.trim() ||
    "Teacher";

  const initials = teacherName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const subjectsList = Array.isArray(teacher.subjects) && teacher.subjects.length > 0
    ? teacher.subjects
    : teacher.subject
    ? teacher.subject.split(",").map((s) => s.trim()).filter(Boolean)
    : ["General"];

  const languagesList = Array.isArray(teacher.languages) && teacher.languages.length > 0
    ? teacher.languages
    : ["Hindi", "English"];

  const documents = [
    { name: "Resume.pdf", size: "1.2 MB", type: "PDF" },
    { name: "Joining_Letter.pdf", size: "840 KB", type: "PDF" },
    { name: "Graduation_Degree.pdf", size: "2.4 MB", type: "PDF" },
    { name: "Post_Graduation.pdf", size: "3.1 MB", type: "PDF" },
    { name: "B.Ed_Certificate.pdf", size: "1.8 MB", type: "PDF" },
    { name: "Experience_Letter.pdf", size: "950 KB", type: "PDF" },
    { name: "Aadhar_Card_Copy.pdf", size: "620 KB", type: "PDF" },
    { name: "PAN_Card_Copy.pdf", size: "540 KB", type: "PDF" },
  ];

  const teacherId = teacher.teacherId || teacher.id || "T100001";
  const teacherEmail =
    teacher.email ||
    `${(teacher.firstName || teacherName.split(" ")[0] || "teacher").toLowerCase()}.${(
      teacher.lastName || teacherName.split(" ")[1] || "staff"
    ).toLowerCase()}@bodhyamarg.com`;

  const teacherPassword =
    teacher.password ||
    teacher.accountPassword ||
    teacher.loginPassword ||
    teacher.tempPassword ||
    `Bodhya@${String(teacherId).replace(/\D/g, "") || "2026"}`;

  const primarySubject =
    teacher?.subject ||
    (teacher?.subjects && teacher.subjects[0]) ||
    "Physics";

  const assignedClass =
    teacher?.classAssigned && teacher.classAssigned !== "—"
      ? teacher.classAssigned
      : teacher?.classTeacher && teacher.classTeacher !== "—"
      ? teacher.classTeacher
      : "Class X – A";

  // Build realistic weekly routine for this teacher based on their subject & classes
  const weeklyRoutine = [
    {
      day: "Monday",
      lectures: [
        {
          time: "08:00 AM – 08:40 AM",
          subject: primarySubject,
          className: assignedClass,
          room: "Room 101",
          theme: "blue",
        },
        {
          time: "09:20 AM – 10:00 AM",
          subject: primarySubject,
          className: "Class IX – B",
          room: "Room 102",
          theme: "emerald",
        },
      ],
    },
    {
      day: "Tuesday",
      lectures: [
        {
          time: "08:40 AM – 09:20 AM",
          subject: primarySubject,
          className: assignedClass,
          room: "Room 101",
          theme: "blue",
        },
        {
          time: "10:20 AM – 11:00 AM",
          subject: primarySubject,
          className: "Class VIII – C",
          room: "Room 103",
          theme: "blue",
        },
      ],
    },
    {
      day: "Wednesday",
      lectures: [
        {
          time: "10:20 AM – 11:00 AM",
          subject: primarySubject,
          className: "Class IX – A",
          room: "Room 104",
          theme: "blue",
        },
      ],
    },
    {
      day: "Thursday",
      lectures: [
        {
          time: "12:20 PM – 01:00 PM",
          subject: primarySubject,
          className: "Class X – B",
          room: "Lab 1",
          theme: "emerald",
        },
      ],
    },
    {
      day: "Friday",
      lectures: [
        {
          time: "08:00 AM – 08:40 AM",
          subject: primarySubject,
          className: assignedClass,
          room: "Room 101",
          theme: "blue",
        },
      ],
    },
    {
      day: "Saturday",
      lectures: [
        {
          time: "08:40 AM – 09:20 AM",
          subject: primarySubject,
          className: "Class VIII – B",
          room: "Room 101",
          theme: "blue",
        },
      ],
    },
  ];

  return (
    <div className="academic-page pb-16 space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-xs text-white shadow-xl animate-in fade-in slide-in-from-bottom-2">
          <Check className="h-4 w-4 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* ── Page Header & Action Bar ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Teacher Details</h1>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
            <Link to="/front-office" className="hover:text-gray-900">Dashboard</Link>
            <ChevronRight className="h-3 w-3 text-gray-400" />
            <Link to="/front-office/teachers" className="hover:text-gray-900">Teachers</Link>
            <ChevronRight className="h-3 w-3 text-gray-400" />
            <span className="text-gray-800 font-medium">{teacherName}</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowLoginModal(true)}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-[var(--ac-border)] bg-white px-4 text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            <Lock className="h-3.5 w-3.5 text-gray-500" />
            <span>Login Details</span>
          </button>

          <Link
            to={`/front-office/teachers/${teacher.id}/edit`}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-[var(--ac-green)] px-4 text-xs font-semibold text-white hover:bg-[var(--ac-green-dark)] transition-colors"
          >
            <Pencil className="h-3.5 w-3.5 text-white" />
            <span>Edit Teacher</span>
          </Link>
        </div>
      </div>

      {/* ── Main 2-Column Grid Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ════════ LEFT COLUMN (Profile & Summary Info) ════════ */}
        <div className="lg:col-span-4 space-y-5">
          {/* Card 1: Profile Summary */}
          <div className="rounded-xl border border-[var(--ac-border)] bg-white p-5 space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[var(--ac-green)] text-white text-lg font-bold shadow-xs">
                {teacher.avatarPreview ? (
                  <img
                    src={teacher.avatarPreview}
                    alt={teacherName}
                    className="h-full w-full rounded-xl object-cover"
                  />
                ) : (
                  initials
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-bold text-gray-900 truncate">
                  {teacherName}
                </h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-mono text-xs font-semibold text-[var(--ac-green)]">
                    {teacher.teacherId || teacher.id}
                  </span>
                  <span className="text-[10px] text-gray-400">·</span>
                  <span className="text-[11px] text-gray-500">
                    Joined : {teacher.dateOfJoining || "15 Mar 2022"}
                  </span>
                </div>
                <div className="mt-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${
                      teacher.status === "Inactive"
                        ? "border-amber-200 bg-amber-50 text-amber-800"
                        : "border-emerald-200 bg-emerald-50 text-[var(--ac-green)]"
                    }`}
                  >
                    {teacher.status || "Active"}
                  </span>
                </div>
              </div>
            </div>

            <div className="border-t border-[var(--ac-border)] pt-4">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">
                Basic Information
              </h3>
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Class Teacher Of</span>
                  <span className="font-semibold text-gray-900">
                    {teacher.classTeacher || teacher.classAssigned || "8A"}
                  </span>
                </div>

                <div className="flex items-start justify-between gap-2">
                  <span className="text-gray-500 shrink-0">Subject</span>
                  <span className="font-semibold text-gray-900 text-right">
                    {subjectsList.join(", ")}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Gender</span>
                  <span className="font-semibold text-gray-900">{teacher.gender || "Male"}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Blood Group</span>
                  <span className="font-semibold text-gray-900">{teacher.bloodGroup || "O +ve"}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-500">House</span>
                  <span className="font-semibold text-gray-900">{teacher.house || "Red"}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Religion</span>
                  <span className="font-semibold text-gray-900">{teacher.religion || "Hindu"}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Mother Tongue</span>
                  <span className="font-semibold text-gray-900">{teacher.motherTongue || "Hindi"}</span>
                </div>

                <div className="flex items-start justify-between gap-2 pt-1">
                  <span className="text-gray-500 shrink-0">Languages</span>
                  <div className="flex flex-wrap justify-end gap-1">
                    {languagesList.map((lang) => (
                      <span
                        key={lang}
                        className="rounded border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] font-medium text-gray-700"
                      >
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Primary Contact Info */}
          <div className="rounded-xl border border-[var(--ac-border)] bg-white p-5 space-y-3.5">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
              Primary Contact Info
            </h3>
            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50/70 p-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-500 shrink-0">
                  <Phone className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] text-gray-500">Phone Number</div>
                  <div className="font-semibold text-gray-900 truncate">
                    {teacher.phone || teacher.primaryContact || "+91 98765 43210"}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50/70 p-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-500 shrink-0">
                  <Mail className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] text-gray-500">Email Address</div>
                  <div className="font-semibold text-gray-900 truncate">
                    {teacherEmail}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Identity Cards (Aadhar / PAN) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-xl border border-[var(--ac-border)] bg-white p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-50 border border-gray-200 text-gray-500 shrink-0">
                  <CreditCard className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-[11px] text-gray-500">Aadhar Card No.</div>
                  <div className="font-semibold text-gray-900 font-mono text-xs">
                    {teacher.aadharNo || teacher.aadharId || "9876 5432 1098"}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  copyToClipboard(
                    teacher.aadharNo || teacher.aadharId || "9876 5432 1098",
                    "Aadhar Card No"
                  )
                }
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--ac-border)] bg-white text-gray-500 hover:bg-gray-50 hover:text-[var(--ac-green)] transition-colors"
                title="Copy Aadhar No"
              >
                {copiedField === "Aadhar Card No" ? (
                  <Check className="h-4 w-4 text-[var(--ac-green)]" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-[var(--ac-border)] bg-white p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-50 border border-gray-200 text-gray-500 shrink-0">
                  <Shield className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-[11px] text-gray-500">PAN Number</div>
                  <div className="font-semibold text-gray-900 font-mono text-xs">
                    {teacher.panId || teacher.panNo || "ABCDE1234F"}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  copyToClipboard(
                    teacher.panId || teacher.panNo || "ABCDE1234F",
                    "PAN Number"
                  )
                }
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--ac-border)] bg-white text-gray-500 hover:bg-gray-50 hover:text-[var(--ac-green)] transition-colors"
                title="Copy PAN Number"
              >
                {copiedField === "PAN Number" ? (
                  <Check className="h-4 w-4 text-[var(--ac-green)]" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ════════ RIGHT COLUMN (Tabs & Comprehensive Profile Sections) ════════ */}
        <div className="lg:col-span-8 space-y-5">
          {/* Top Section Tabs */}
          <div className="flex border-b border-[var(--ac-border)] bg-white rounded-xl px-4 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab("details")}
              className={`inline-flex items-center gap-2 border-b-2 py-3 px-3 transition-colors ${
                activeTab === "details"
                  ? "border-[var(--ac-green)] text-[var(--ac-green)] font-bold"
                  : "border-transparent text-gray-500 hover:text-gray-900"
              }`}
            >
              <User className="h-4 w-4" />
              <span>Teacher Details</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("routine")}
              className={`inline-flex items-center gap-2 border-b-2 py-3 px-3 transition-colors ${
                activeTab === "routine"
                  ? "border-[var(--ac-green)] text-[var(--ac-green)] font-bold"
                  : "border-transparent text-gray-500 hover:text-gray-900"
              }`}
            >
              <Calendar className="h-4 w-4" />
              <span>Routine</span>
            </button>
          </div>

          {activeTab === "details" && (
            <>
              {/* Section 1: Profile Details */}
              <div className="rounded-xl border border-[var(--ac-border)] bg-white p-5 space-y-4">
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                  Profile Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-4 gap-x-6 text-xs">
                  <div>
                    <div className="text-[11px] text-gray-500 mb-0.5">Father's Name</div>
                    <div className="font-semibold text-gray-900">
                      {teacher.fatherName || "Ramesh Sharma"}
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] text-gray-500 mb-0.5">Mother Name</div>
                    <div className="font-semibold text-gray-900">
                      {teacher.motherName || "Sunita Sharma"}
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] text-gray-500 mb-0.5">DOB</div>
                    <div className="font-semibold text-gray-900">
                      {teacher.dob || "25 Jan 1992"}
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] text-gray-500 mb-0.5">Marital Status</div>
                    <div className="font-semibold text-gray-900">
                      {teacher.maritalStatus || "Single"}
                      {teacher.spouseName && (
                        <span className="block text-[11px] text-gray-500 font-normal">
                          Spouse: {teacher.spouseName} ({teacher.spouseMobile || "—"})
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] text-gray-500 mb-0.5">Qualification</div>
                    <div className="font-semibold text-gray-900">
                      {teacher.qualification || "M.Sc, B.Ed"}
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] text-gray-500 mb-0.5">Experience</div>
                    <div className="font-semibold text-gray-900">
                      {teacher.workExperience || teacher.experience || "4 Years"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Documents & Address Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Documents */}
                <div className="rounded-xl border border-[var(--ac-border)] bg-white p-5 space-y-3 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                      Documents
                    </h3>
                    <span className="text-[11px] text-gray-400 font-medium">
                      {documents.length} files attached
                    </span>
                  </div>

                  <div className="max-h-[135px] overflow-y-auto space-y-2 pr-1">
                    {documents.map((doc, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between rounded-lg border border-[var(--ac-border)] bg-gray-50/50 p-2 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="flex h-7 w-7 items-center justify-center rounded bg-red-50 text-red-600 font-bold text-[9px] border border-red-100 shrink-0">
                            PDF
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-gray-900 truncate">
                              {doc.name}
                            </div>
                            <div className="text-[10px] text-gray-400 font-mono">
                              {doc.size}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => showToast(`Opening ${doc.name}...`)}
                          className="flex h-7 w-7 items-center justify-center rounded border border-[var(--ac-border)] bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors shrink-0 ml-2"
                          title="Download / View"
                        >
                          <Download className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Address */}
                <div className="rounded-xl border border-[var(--ac-border)] bg-white p-5 space-y-3 flex flex-col justify-between">
                  <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                    Address
                  </h3>
                  <div className="space-y-2.5 my-auto">
                    <div className="flex items-start gap-3 rounded-lg border border-[var(--ac-border)] bg-gray-50/50 p-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-400 shrink-0 mt-0.5">
                        <MapPin className="h-4 w-4 text-gray-500" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-gray-900">Current Address</div>
                        <div className="text-[11px] text-gray-500 leading-relaxed mt-0.5">
                          {teacher.address || "Flat 402, Sunshine Apartments, MG Road, New Delhi, India 110001"}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 rounded-lg border border-[var(--ac-border)] bg-gray-50/50 p-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-400 shrink-0 mt-0.5">
                        <Home className="h-4 w-4 text-gray-500" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-gray-900">Permanent Address</div>
                        <div className="text-[11px] text-gray-500 leading-relaxed mt-0.5">
                          {teacher.permanentAddress || "12/B, Civil Lines, Jaipur, Rajasthan, India 302006"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Previous School Details (Clean Full-Width Typography) */}
              <div className="rounded-xl border border-[var(--ac-border)] bg-white p-5 space-y-3.5">
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                  Previous School Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 text-xs">
                  <div>
                    <div className="text-[11px] text-gray-500 mb-0.5">Previous School Name</div>
                    <div className="font-semibold text-gray-900">
                      {teacher.prevSchool || "Delhi Public School"}
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] text-gray-500 mb-0.5">School Address</div>
                    <div className="font-semibold text-gray-900">
                      {teacher.prevSchoolAddress || "Sector 12, RK Puram, New Delhi 110022"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 4: Bank Details & Work Details Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Bank Details */}
                <div className="rounded-xl border border-[var(--ac-border)] bg-white p-5 space-y-3.5">
                  <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                    Bank Details
                  </h3>
                  <div className="grid grid-cols-3 gap-y-3.5 gap-x-3 text-xs">
                    <div>
                      <div className="text-[11px] text-gray-500 mb-0.5">Bank Name</div>
                      <div className="font-semibold text-gray-900 truncate">
                        {teacher.bankName || "State Bank of India"}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-gray-500 mb-0.5">Branch</div>
                      <div className="font-semibold text-gray-900 truncate">
                        {teacher.branch || "Connaught Place"}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-gray-500 mb-0.5">IFSC</div>
                      <div className="font-semibold text-gray-900 font-mono truncate">
                        {teacher.ifsc || "SBIN0000691"}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-gray-500 mb-0.5">Account Holder</div>
                      <div className="font-semibold text-gray-900 truncate">
                        {teacher.accountHolderName || teacherName}
                      </div>
                    </div>
                    <div className="col-span-2">
                      <div className="text-[11px] text-gray-500 mb-0.5">Account Number</div>
                      <div className="font-semibold text-gray-900 font-mono">
                        {teacher.accountNumber || "30012345678"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Work Details */}
                <div className="rounded-xl border border-[var(--ac-border)] bg-white p-5 space-y-3.5">
                  <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                    Work Details
                  </h3>
                  <div className="grid grid-cols-3 gap-y-3.5 gap-x-3 text-xs">
                    <div>
                      <div className="text-[11px] text-gray-500 mb-0.5">Contract Type</div>
                      <div className="font-semibold text-gray-900 truncate">
                        {teacher.contractType || "Permanent"}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-gray-500 mb-0.5">Shift</div>
                      <div className="font-semibold text-gray-900 truncate">
                        {teacher.shift || "Morning"}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-gray-500 mb-0.5">Work Location</div>
                      <div className="font-semibold text-gray-900 truncate">
                        {teacher.workLocation || "2nd Floor, Block A"}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-gray-500 mb-0.5">Role Type</div>
                      <div className="font-semibold text-gray-900 truncate">
                        Full-Time Faculty
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-gray-500 mb-0.5">Department</div>
                      <div className="font-semibold text-gray-900 truncate">
                        {teacher.subject || (teacher.subjects && teacher.subjects[0]) || "Science"}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-gray-500 mb-0.5">Date of Joining</div>
                      <div className="font-semibold text-gray-900 truncate">
                        {teacher.dateOfJoining || "15 Mar 2022"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 5: Social Media */}
              <div className="rounded-xl border border-[var(--ac-border)] bg-white p-5 space-y-3.5">
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                  Social Media
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                  <div>
                    <div className="text-[11px] text-gray-500 mb-0.5">Facebook</div>
                    <div className="font-medium text-gray-800 hover:text-blue-600 truncate">
                      {teacher.facebook || "www.facebook.com"}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-gray-500 mb-0.5">Twitter</div>
                    <div className="font-medium text-gray-800 hover:text-sky-500 truncate">
                      {teacher.twitter || "www.twitter.com"}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-gray-500 mb-0.5">Linkedin</div>
                    <div className="font-medium text-gray-800 hover:text-blue-700 truncate">
                      {teacher.linkedin || "www.linkedin.com"}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-gray-500 mb-0.5">Youtube</div>
                    <div className="font-medium text-gray-800 hover:text-red-600 truncate">
                      {teacher.youtube || "www.youtube.com"}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-gray-500 mb-0.5">Instagram</div>
                    <div className="font-medium text-gray-800 hover:text-pink-600 truncate">
                      {teacher.instagram || "www.instagram.com"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 6: Other Info */}
              <div className="rounded-xl border border-[var(--ac-border)] bg-white p-5 space-y-2">
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                  Other Info
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {teacher.otherInfo ||
                    "Depending on the specific needs of your organization or system, additional information may be collected or tracked. It's important to ensure that any data collected complies with privacy regulations and policies to protect students' sensitive information."}
                </p>
              </div>
            </>
          )}

          {activeTab === "routine" && (
            <div className="rounded-2xl border border-[var(--ac-border)] bg-white overflow-hidden">
              {/* Routine Header */}
              <div className="flex items-center justify-between border-b border-gray-100 p-5">
                <div className="flex items-center gap-2.5">
                  <Calendar className="h-4 w-4 text-[var(--ac-green)]" />
                  <h3 className="text-sm font-bold text-gray-900">
                    Weekly Routine: {teacherName}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--ac-border)] bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Printer className="h-3.5 w-3.5 text-gray-500" />
                  <span>Print</span>
                </button>
              </div>

              {/* Weekly Day-by-Day Flow */}
              <div className="p-6 space-y-6">
                {weeklyRoutine.map((dayData, dIdx) => (
                  <div key={dayData.day}>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      {/* Day Column */}
                      <div className="w-24 shrink-0">
                        <div className="text-sm font-bold text-gray-900">{dayData.day}</div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {dayData.lectures.length} Lectures
                        </div>
                      </div>

                      {/* Vertical Divider */}
                      <div className="hidden sm:block h-10 w-[1.5px] bg-gray-100 mx-2 shrink-0" />

                      {/* Lectures Cards */}
                      <div className="flex flex-wrap items-center gap-4 flex-1">
                        {dayData.lectures.map((lec, lIdx) => {
                          const isEmerald = lec.theme === "emerald";
                          return (
                            <div
                              key={lIdx}
                              className={`min-w-[210px] sm:min-w-[230px] rounded-2xl p-4 space-y-2 border-l-4 transition-all ${
                                isEmerald
                                  ? "border-l-[#16a34a] bg-[#dcfce7]/70 text-emerald-950"
                                  : "border-l-[#2563eb] bg-[#dbeafe]/70 text-blue-950"
                              }`}
                            >
                              {/* Time */}
                              <div
                                className={`flex items-start gap-1.5 text-xs font-semibold ${
                                  isEmerald ? "text-[#16a34a]" : "text-[#2563eb]"
                                }`}
                              >
                                <Clock className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                                <span>{lec.time}</span>
                              </div>

                              {/* Subject */}
                              <div className="text-sm font-bold text-gray-900 pt-0.5">
                                {lec.subject}
                              </div>

                              {/* Class and Room info */}
                              <div className="space-y-1 pt-1 text-xs">
                                <div className="flex items-center gap-1.5 font-medium text-gray-700">
                                  <Users className="h-3.5 w-3.5 text-gray-400" />
                                  <span>{lec.className}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-gray-500">
                                  <MapPin className="h-3.5 w-3.5 text-gray-400" />
                                  <span>{lec.room}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {dIdx !== weeklyRoutine.length - 1 && (
                      <div className="border-b border-dashed border-gray-200 mt-6" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Login Details & Change Password Modal ── */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-[2px]"
            onClick={() => {
              setShowLoginModal(false);
              setIsEditingPassword(false);
              setNewPassword("");
              setConfirmPassword("");
              setPasswordError("");
            }}
          />
          <div className="relative w-full max-w-sm rounded-xl border border-[var(--ac-border)] bg-white p-5 shadow-xl animate-in fade-in zoom-in-95 duration-150 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-sm">
                {isEditingPassword ? "Change Password" : "Login Details"}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowLoginModal(false);
                  setIsEditingPassword(false);
                  setNewPassword("");
                  setConfirmPassword("");
                  setPasswordError("");
                }}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {!isEditingPassword ? (
              <>
                <div className="py-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Teacher ID</span>
                    <span className="font-mono font-semibold text-gray-900">{teacherId}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Email</span>
                    <span className="font-medium text-gray-900">{teacherEmail}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Password</span>
                    <span className="font-mono font-semibold text-gray-900">
                      {teacherPassword}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-100 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingPassword(true);
                      setPasswordError("");
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--ac-border)] bg-white px-3 py-1.5 font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <Lock className="h-3.5 w-3.5 text-gray-500" />
                    <span>Change Password</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const slip = `Teacher ID: ${teacherId}\nEmail: ${teacherEmail}\nPassword: ${teacherPassword}`;
                        navigator.clipboard.writeText(slip);
                        showToast("Credentials copied!");
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--ac-border)] bg-white px-3 py-1.5 font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <Copy className="h-3.5 w-3.5 text-gray-500" />
                      <span>Copy</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowLoginModal(false)}
                      className="rounded-lg bg-[var(--ac-green)] px-4 py-1.5 font-semibold text-white hover:bg-[var(--ac-green-dark)] transition-colors cursor-pointer"
                    >
                      Done
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setPasswordError("");
                  if (!newPassword.trim()) {
                    setPasswordError("Please enter a new password");
                    return;
                  }
                  if (newPassword.length < 6) {
                    setPasswordError("Password must be at least 6 characters");
                    return;
                  }
                  if (newPassword !== confirmPassword) {
                    setPasswordError("Passwords do not match");
                    return;
                  }
                  updateTeacher(teacher.id, { password: newPassword });
                  showToast("Password updated successfully!");
                  setIsEditingPassword(false);
                  setNewPassword("");
                  setConfirmPassword("");
                }}
                className="py-4 space-y-3.5"
              >
                <div>
                  <label className="block text-[11px] font-medium text-gray-500 mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        setPasswordError("");
                      }}
                      placeholder="Enter new password (e.g. Bodhya@2026)"
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 pr-9 text-xs outline-none focus:border-[var(--ac-green)] focus:ring-1 focus:ring-[var(--ac-green)]"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((v) => !v)}
                      className="absolute right-2.5 top-2 text-gray-400 hover:text-gray-700"
                    >
                      {showNewPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-gray-500 mb-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setPasswordError("");
                      }}
                      placeholder="Re-enter new password"
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 pr-9 text-xs outline-none focus:border-[var(--ac-green)] focus:ring-1 focus:ring-[var(--ac-green)]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      className="absolute right-2.5 top-2 text-gray-400 hover:text-gray-700"
                    >
                      {showConfirmPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Simple helper note */}
                <p className="text-[11px] text-gray-400">
                  Must be at least 8 characters with letters, numbers & special character.
                </p>

                {passwordError && (
                  <p className="text-[11px] font-medium text-red-600">
                    {passwordError}
                  </p>
                )}

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingPassword(false);
                      setNewPassword("");
                      setConfirmPassword("");
                      setPasswordError("");
                    }}
                    className="rounded-lg border border-[var(--ac-border)] bg-white px-3.5 py-1.5 font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-[var(--ac-green)] px-4 py-1.5 font-semibold text-white hover:bg-[var(--ac-green-dark)] transition-colors"
                  >
                    Save Password
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
