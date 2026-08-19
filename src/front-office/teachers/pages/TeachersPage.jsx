import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTeachers } from "../context/TeachersContext";
import TeacherDetailsModal from "./TeacherDetailsModal";
import { TEACHER_CLASSES, TEACHER_SECTIONS, TEACHER_SUBJECTS } from "../data/teachers";

export default function TeachersPage() {
  const navigate = useNavigate();
  const { teachers, updateTeacher, deleteTeacher } = useTeachers();

  const [viewMode, setViewMode] = useState("grid"); // "grid" | "list"
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState("az"); // "az" | "za"
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [visibleGridCount, setVisibleGridCount] = useState(8);

  // Filter dropdown state
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterClasses, setFilterClasses] = useState([]);
  const [classDropdownOpen, setClassDropdownOpen] = useState(false);
  const [filterSections, setFilterSections] = useState([]);
  const [sectionDropdownOpen, setSectionDropdownOpen] = useState(false);
  const [filterSubjects, setFilterSubjects] = useState([]);
  const [subjectDropdownOpen, setSubjectDropdownOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterSearch, setFilterSearch] = useState("");
  const [activeActionMenuId, setActiveActionMenuId] = useState(null);

  // Details Modal State
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // ERP Active/Inactive Teachers (excl. in-progress recruitment pipeline candidates)
  const erpTeachers = useMemo(() => {
    return teachers.filter((t) => {
      if (t.isRecruitmentCandidate && t.status !== "Active" && t.status !== "Inactive") {
        return false;
      }
      return true;
    });
  }, [teachers]);

  // Filtered & Sorted Teachers
  const filteredTeachers = useMemo(() => {
    const q = (search || filterSearch).trim().toLowerCase();

    let list = erpTeachers.filter((t) => {
      const matchSearch =
        !q ||
        (t.name && t.name.toLowerCase().includes(q)) ||
        (t.teacherId && t.teacherId.toLowerCase().includes(q)) ||
        (t.email && t.email.toLowerCase().includes(q)) ||
        (t.phone && t.phone.toLowerCase().includes(q)) ||
        (t.subject && t.subject.toLowerCase().includes(q)) ||
        (t.classAssigned && t.classAssigned.toLowerCase().includes(q));

      const teacherClass = `${t.classAssigned || ""} ${t.classTeacher || ""}`.trim();
      const matchClass =
        filterClasses.length === 0 ||
        filterClasses.some((c) => teacherClass.includes(c) || c.includes(teacherClass));

      const matchSection =
        filterSections.length === 0 ||
        filterSections.some((sec) => {
          const cleanSec = sec.replace("Section ", "").trim();
          return (
            teacherClass.includes(sec) ||
            teacherClass.includes(`(${cleanSec})`) ||
            teacherClass.includes(`-${cleanSec}`) ||
            teacherClass.includes(` ${cleanSec}`) ||
            (t.section && t.section === sec)
          );
        });

      const teacherSubjects = [
        t.subject,
        ...(Array.isArray(t.subjects) ? t.subjects : [])
      ].filter(Boolean);

      const matchSubject =
        filterSubjects.length === 0 ||
        teacherSubjects.some((sub) => filterSubjects.includes(sub));

      const effectiveStatus = t.status === "Inactive" ? "Inactive" : "Active";
      const matchStatus =
        filterStatus === "All" || effectiveStatus === filterStatus;

      return matchSearch && matchClass && matchSection && matchSubject && matchStatus;
    });

    list = [...list].sort((a, b) => {
      const nameA = String(a.name || "").toLowerCase();
      const nameB = String(b.name || "").toLowerCase();
      return sortOrder === "az"
        ? nameA.localeCompare(nameB)
        : nameB.localeCompare(nameA);
    });

    return list;
  }, [erpTeachers, search, filterSearch, filterClasses, filterSections, filterSubjects, filterStatus, sortOrder]);

  // Pagination for List View
  const total = filteredTeachers.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedTeachers = filteredTeachers.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize
  );

  // Grid view items (with Load More support)
  const gridTeachers = filteredTeachers.slice(0, visibleGridCount);
  const hasMoreGrid = visibleGridCount < filteredTeachers.length;

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedIds(pagedTeachers.map((t) => t.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id, checked) => {
    setSelectedIds((prev) =>
      checked ? [...new Set([...prev, id])] : prev.filter((x) => x !== id)
    );
  };

  const allSelected =
    pagedTeachers.length > 0 &&
    pagedTeachers.every((t) => selectedIds.includes(t.id));

  // Reset Filters
  const handleResetFilter = () => {
    setFilterClasses([]);
    setClassDropdownOpen(false);
    setFilterSections([]);
    setSectionDropdownOpen(false);
    setFilterSubjects([]);
    setSubjectDropdownOpen(false);
    setFilterStatus("All");
    setFilterSearch("");
    setFilterOpen(false);
    setPage(1);
    setVisibleGridCount(8);
  };

  const handleApplyFilter = () => {
    setFilterOpen(false);
    setClassDropdownOpen(false);
    setSectionDropdownOpen(false);
    setSubjectDropdownOpen(false);
    setPage(1);
    setVisibleGridCount(8);
  };

  const handleToggleClass = (cls) => {
    setFilterClasses((prev) =>
      prev.includes(cls) ? prev.filter((c) => c !== cls) : [...prev, cls]
    );
  };

  const handleSelectAllClasses = () => {
    if (filterClasses.length === TEACHER_CLASSES.length) {
      setFilterClasses([]);
    } else {
      setFilterClasses([...TEACHER_CLASSES]);
    }
  };

  const handleToggleSection = (sec) => {
    setFilterSections((prev) =>
      prev.includes(sec) ? prev.filter((s) => s !== sec) : [...prev, sec]
    );
  };

  const handleSelectAllSections = () => {
    if (filterSections.length === TEACHER_SECTIONS.length) {
      setFilterSections([]);
    } else {
      setFilterSections([...TEACHER_SECTIONS]);
    }
  };

  const handleToggleSubject = (sub) => {
    setFilterSubjects((prev) =>
      prev.includes(sub) ? prev.filter((s) => s !== sub) : [...prev, sub]
    );
  };

  const handleSelectAllSubjects = () => {
    if (filterSubjects.length === TEACHER_SUBJECTS.length) {
      setFilterSubjects([]);
    } else {
      setFilterSubjects([...TEACHER_SUBJECTS]);
    }
  };

  // Export CSV
  const handleExportCsv = () => {
    const header = [
      "Teacher ID",
      "Full Name",
      "Class Assigned",
      "Subject",
      "Email",
      "Phone",
      "Gender",
      "Status",
      "Date of Joining",
      "Qualification",
      "Work Experience",
    ];

    const lines = filteredTeachers.map((t) =>
      [
        t.teacherId || t.id,
        t.name,
        t.classAssigned || t.classTeacher || "",
        t.subject || "",
        t.email || "",
        t.phone || t.primaryContact || "",
        t.gender || "",
        t.status || "Active",
        t.dateOfJoining || "",
        t.qualification || "",
        t.workExperience || "",
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    );

    const blob = new Blob([[header.join(","), ...lines].join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `teachers_export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Print
  const handlePrint = () => {
    window.print();
  };

  // Open Details
  const openTeacherDetails = (teacher) => {
    navigate(`/front-office/teachers/${teacher.id}`);
  };

  return (
    <div className="academic-page pb-12">
      {/* ── Page Header ── */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[var(--ac-text)]">Teachers</h1>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-[var(--ac-hint)]">
            <Link to="/front-office" className="hover:text-[var(--ac-green)]">Dashboard</Link>
            <span>/</span>
            <span>Peoples</span>
            <span>/</span>
            <span className="text-[var(--ac-green)] font-medium">Teachers</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Export CSV Button */}
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--ac-border)] bg-white px-3.5 py-2 text-xs font-medium text-[var(--ac-text)] hover:bg-gray-50 transition-colors"
          >
            <svg className="h-4 w-4 text-[var(--ac-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export
          </button>

          {/* Add Teacher Button */}
          <Link
            to="/front-office/teachers/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--ac-green)] px-4 py-2 text-xs font-semibold text-white hover:bg-[var(--ac-green-dark)] transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Teacher
          </Link>
        </div>
      </div>

      {/* Module Tabs */}
      <div className="mb-6 flex border-b border-[var(--ac-border)] text-xs font-semibold text-gray-500">
        <Link
          to="/front-office/teachers"
          className="border-b-2 border-[var(--ac-green)] px-4 py-2.5 text-[var(--ac-green)] font-bold"
        >
          All Teachers ({erpTeachers.length})
        </Link>
        <Link
          to="/front-office/teachers/recruitments"
          className="border-b-2 border-transparent px-4 py-2.5 hover:text-gray-900 transition-colors"
        >
          Recruitment Pipeline ({teachers.filter((t) => t.isRecruitmentCandidate || ["Form Sent", "Form Submitted", "Corrections Requested", "Corrections Submitted", "Hired"].includes(t.status) || t.recruitmentToken).length})
        </Link>
      </div>

      {/* ── Toolbar ── */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--ac-border)] bg-white p-3.5">
        <div className="text-sm font-bold text-[var(--ac-text)]">
          {viewMode === "grid" ? "Teachers Grid" : "Teachers List"}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Academic Date Range Pill */}
          <div className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-[var(--ac-border)] bg-gray-50 px-3 py-1.5 text-xs font-medium text-[var(--ac-muted)]">
            <svg className="h-3.5 w-3.5 text-[var(--ac-hint)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            05/21/2026 - 05/27/2026
          </div>

          {/* Filter Dropdown Toggle */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setFilterOpen((v) => !v)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                filterOpen || filterClasses.length > 0 || filterSections.length > 0 || filterSubjects.length > 0 || filterStatus !== "All"
                  ? "border-[var(--ac-green)] bg-[var(--ac-green-light)] text-[var(--ac-green)] font-semibold"
                  : "border-[var(--ac-border)] bg-white text-[var(--ac-text)] hover:bg-gray-50"
              }`}
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filter
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Filter Dropdown Content */}
            {filterOpen && (
              <>
                <div
                  className="fixed inset-0 z-20 cursor-default"
                  onClick={() => {
                    setFilterOpen(false);
                    setClassDropdownOpen(false);
                    setSectionDropdownOpen(false);
                    setSubjectDropdownOpen(false);
                  }}
                />
                <div className="absolute right-0 z-30 mt-2 w-84 rounded-xl border border-[var(--ac-border)] bg-white p-4 shadow-[0_10px_25px_rgba(0,0,0,0.08)]">
                  <div className="mb-3 text-xs font-bold text-[var(--ac-text)] uppercase tracking-wider">
                    Filter Teachers
                  </div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2.5">
                      {/* Class */}
                      <div className="relative">
                        <label className="block text-[11px] font-medium text-[var(--ac-muted)] mb-1">
                          Class {filterClasses.length > 0 ? `(${filterClasses.length})` : ""}
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setClassDropdownOpen((v) => !v);
                            setSectionDropdownOpen(false);
                            setSubjectDropdownOpen(false);
                          }}
                          className="w-full h-8 rounded-lg border border-[var(--ac-border)] bg-white px-2.5 text-xs flex items-center justify-between text-left cursor-pointer hover:border-gray-300 transition-colors"
                        >
                          <span className="truncate">
                            {filterClasses.length === 0
                              ? "All"
                              : filterClasses.length === 1
                              ? filterClasses[0]
                              : `${filterClasses.length} Selected`}
                          </span>
                          <svg className="h-3.5 w-3.5 text-gray-400 shrink-0 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>

                        {classDropdownOpen && (
                          <div className="absolute left-0 top-full z-40 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-[var(--ac-border)] bg-white p-2 shadow-lg space-y-1 text-xs">
                            <div
                              onClick={handleSelectAllClasses}
                              className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-gray-50 cursor-pointer font-semibold text-gray-800 border-b border-gray-100 pb-1.5"
                            >
                              <input
                                type="checkbox"
                                checked={filterClasses.length === TEACHER_CLASSES.length && TEACHER_CLASSES.length > 0}
                                onChange={() => {}}
                                className="h-3.5 w-3.5 rounded accent-[var(--ac-green)] cursor-pointer"
                              />
                              <span>All</span>
                            </div>
                            {TEACHER_CLASSES.map((cls) => {
                              const isSelected = filterClasses.includes(cls);
                              return (
                                <div
                                  key={cls}
                                  onClick={() => handleToggleClass(cls)}
                                  className="flex items-center gap-2 rounded px-2 py-1 hover:bg-gray-50 cursor-pointer text-gray-700"
                                >
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => {}}
                                    className="h-3.5 w-3.5 rounded accent-[var(--ac-green)] cursor-pointer"
                                  />
                                  <span className="truncate">{cls}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Section */}
                      <div className="relative">
                        <label className="block text-[11px] font-medium text-[var(--ac-muted)] mb-1">
                          Section {filterSections.length > 0 ? `(${filterSections.length})` : ""}
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setSectionDropdownOpen((v) => !v);
                            setClassDropdownOpen(false);
                            setSubjectDropdownOpen(false);
                          }}
                          className="w-full h-8 rounded-lg border border-[var(--ac-border)] bg-white px-2.5 text-xs flex items-center justify-between text-left cursor-pointer hover:border-gray-300 transition-colors"
                        >
                          <span className="truncate">
                            {filterSections.length === 0
                              ? "All"
                              : filterSections.length === 1
                              ? filterSections[0]
                              : `${filterSections.length} Selected`}
                          </span>
                          <svg className="h-3.5 w-3.5 text-gray-400 shrink-0 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>

                        {sectionDropdownOpen && (
                          <div className="absolute left-0 top-full z-40 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-[var(--ac-border)] bg-white p-2 shadow-lg space-y-1 text-xs">
                            <div
                              onClick={handleSelectAllSections}
                              className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-gray-50 cursor-pointer font-semibold text-gray-800 border-b border-gray-100 pb-1.5"
                            >
                              <input
                                type="checkbox"
                                checked={filterSections.length === TEACHER_SECTIONS.length && TEACHER_SECTIONS.length > 0}
                                onChange={() => {}}
                                className="h-3.5 w-3.5 rounded accent-[var(--ac-green)] cursor-pointer"
                              />
                              <span>All</span>
                            </div>
                            {TEACHER_SECTIONS.map((sec) => {
                              const isSelected = filterSections.includes(sec);
                              return (
                                <div
                                  key={sec}
                                  onClick={() => handleToggleSection(sec)}
                                  className="flex items-center gap-2 rounded px-2 py-1 hover:bg-gray-50 cursor-pointer text-gray-700"
                                >
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => {}}
                                    className="h-3.5 w-3.5 rounded accent-[var(--ac-green)] cursor-pointer"
                                  />
                                  <span className="truncate">{sec}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      {/* Subject */}
                      <div className="relative">
                        <label className="block text-[11px] font-medium text-[var(--ac-muted)] mb-1">
                          Subjects {filterSubjects.length > 0 ? `(${filterSubjects.length})` : ""}
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setSubjectDropdownOpen((v) => !v);
                            setClassDropdownOpen(false);
                            setSectionDropdownOpen(false);
                          }}
                          className="w-full h-8 rounded-lg border border-[var(--ac-border)] bg-white px-2.5 text-xs flex items-center justify-between text-left cursor-pointer hover:border-gray-300 transition-colors"
                        >
                          <span className="truncate">
                            {filterSubjects.length === 0
                              ? "All"
                              : filterSubjects.length === 1
                              ? filterSubjects[0]
                              : `${filterSubjects.length} Selected`}
                          </span>
                          <svg className="h-3.5 w-3.5 text-gray-400 shrink-0 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>

                        {subjectDropdownOpen && (
                          <div className="absolute left-0 top-full z-40 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-[var(--ac-border)] bg-white p-2 shadow-lg space-y-1 text-xs">
                            <div
                              onClick={handleSelectAllSubjects}
                              className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-gray-50 cursor-pointer font-semibold text-gray-800 border-b border-gray-100 pb-1.5"
                            >
                              <input
                                type="checkbox"
                                checked={filterSubjects.length === TEACHER_SUBJECTS.length && TEACHER_SUBJECTS.length > 0}
                                onChange={() => {}}
                                className="h-3.5 w-3.5 rounded accent-[var(--ac-green)] cursor-pointer"
                              />
                              <span>All</span>
                            </div>
                            {TEACHER_SUBJECTS.map((sub) => {
                              const isSelected = filterSubjects.includes(sub);
                              return (
                                <div
                                  key={sub}
                                  onClick={() => handleToggleSubject(sub)}
                                  className="flex items-center gap-2 rounded px-2 py-1 hover:bg-gray-50 cursor-pointer text-gray-700"
                                >
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => {}}
                                    className="h-3.5 w-3.5 rounded accent-[var(--ac-green)] cursor-pointer"
                                  />
                                  <span className="truncate">{sub}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Status */}
                      <div>
                        <label className="block text-[11px] font-medium text-[var(--ac-muted)] mb-1">Status</label>
                        <select
                          className="ac-select text-xs py-1.5 !h-8"
                          value={filterStatus}
                          onChange={(e) => setFilterStatus(e.target.value)}
                        >
                          <option value="All">All</option>
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-[var(--ac-muted)] mb-1">Status</label>
                      <select
                        className="ac-select text-xs py-1.5"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                      >
                        <option value="All">All</option>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-[var(--ac-muted)] mb-1">Search Keyword</label>
                      <input
                        type="text"
                        className="ac-input text-xs py-1.5"
                        placeholder="Name, ID, Phone, Email..."
                        value={filterSearch}
                        onChange={(e) => setFilterSearch(e.target.value)}
                      />
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={handleResetFilter}
                        className="rounded-md border border-[var(--ac-border)] px-3 py-1 text-xs text-[var(--ac-muted)] hover:bg-gray-50"
                      >
                        Reset
                      </button>
                      <button
                        type="button"
                        onClick={handleApplyFilter}
                        className="rounded-md bg-[var(--ac-green)] px-3.5 py-1 text-xs font-semibold text-white hover:bg-[var(--ac-green-dark)] transition-colors"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Grid / List View Toggle */}
          <div className="flex items-center gap-1 rounded-lg border border-[var(--ac-border)] bg-gray-50 p-1">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              title="Table List View"
              className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
                viewMode === "list"
                  ? "bg-[var(--ac-green)] text-white"
                  : "text-[var(--ac-muted)] hover:text-[var(--ac-text)]"
              }`}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              title="Cards Grid View"
              className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
                viewMode === "grid"
                  ? "bg-[var(--ac-green)] text-white"
                  : "text-[var(--ac-muted)] hover:text-[var(--ac-text)]"
              }`}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
          </div>

          {/* Sort A-Z Toggle */}
          <button
            type="button"
            onClick={() => setSortOrder((prev) => (prev === "az" ? "za" : "az"))}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--ac-border)] bg-white px-3 py-1.5 text-xs font-medium text-[var(--ac-text)] hover:bg-gray-50 transition-colors"
          >
            <svg className="h-3.5 w-3.5 text-[var(--ac-hint)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
            </svg>
            Sort by {sortOrder === "az" ? "A-Z" : "Z-A"}
          </button>
        </div>
      </div>

      {/* ════ VIEW 1: GRID VIEW ════ */}
      {viewMode === "grid" && (
        <div>
          {filteredTeachers.length === 0 ? (
            <div className="rounded-xl border border-[var(--ac-border)] bg-white py-16 text-center text-sm text-[var(--ac-muted)]">
              No teachers found matching your filters.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {gridTeachers.map((teacher) => (
                <div
                  key={teacher.id}
                  className="flex flex-col justify-between rounded-xl border border-[var(--ac-border)] bg-white p-4 hover:border-gray-300 transition-colors"
                >
                  <div>
                    {/* Top Row: Teacher ID, Status Badge & Actions */}
                    <div className="mb-3 flex items-center justify-between border-b border-dashed border-[var(--ac-border)] pb-2.5">
                      <span className="font-medium text-[13px] text-[var(--ac-green)]">
                        {teacher.teacherId || teacher.id}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {/* Status Pill */}
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                            teacher.status === "Inactive"
                              ? "bg-red-50 text-red-700"
                              : "bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              teacher.status === "Inactive" ? "bg-red-500" : "bg-emerald-500"
                            }`}
                          />
                          {teacher.status === "Inactive" ? "Inactive" : "Active"}
                        </span>

                        {/* 3 Dots Menu Button for Grid Card */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveActionMenuId(activeActionMenuId === `grid-${teacher.id}` ? null : `grid-${teacher.id}`);
                            }}
                            className={`flex h-6 w-6 items-center justify-center rounded-md transition-colors cursor-pointer ${
                              activeActionMenuId === `grid-${teacher.id}`
                                ? "bg-gray-100 text-gray-900"
                                : "text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                            }`}
                            title="Actions"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                            </svg>
                          </button>

                          {activeActionMenuId === `grid-${teacher.id}` && (
                            <>
                              <div
                                className="fixed inset-0 z-40 cursor-default"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveActionMenuId(null);
                                }}
                              />
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="absolute right-0 top-7 z-50 w-36 rounded-xl border border-gray-200 bg-white py-1.5 shadow-xl animate-in fade-in zoom-in-95 duration-100 text-xs font-medium text-gray-700 space-y-0.5 text-left"
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveActionMenuId(null);
                                    openTeacherDetails(teacher);
                                  }}
                                  className="flex items-center gap-2 w-full px-3 py-1.5 text-left hover:bg-gray-50 hover:text-[var(--ac-green)] transition-colors cursor-pointer"
                                >
                                  <svg className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                  <span>View Details</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveActionMenuId(null);
                                    navigate(`/front-office/teachers/${teacher.id}/edit`);
                                  }}
                                  className="flex items-center gap-2 w-full px-3 py-1.5 text-left hover:bg-gray-50 hover:text-gray-900 transition-colors cursor-pointer"
                                >
                                  <svg className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                  <span>Edit Teacher</span>
                                </button>

                                <div className="border-t border-gray-100 my-1" />

                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveActionMenuId(null);
                                    if (window.confirm(`Are you sure you want to delete ${teacher.name || "this teacher"}?`)) {
                                      deleteTeacher(teacher.id);
                                    }
                                  }}
                                  className="flex items-center gap-2 w-full px-3 py-1.5 text-left text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                >
                                  <svg className="h-3.5 w-3.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                  <span>Delete</span>
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Profile Banner */}
                    <div
                      onClick={() => openTeacherDetails(teacher)}
                      className="mb-3.5 flex items-center gap-3 rounded-lg bg-[#f4f6f8] p-3 cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--ac-border)] bg-white font-medium text-sm text-[var(--ac-muted)]">
                        {teacher.avatarPreview ? (
                          <img src={teacher.avatarPreview} alt="" className="h-full w-full rounded-full object-cover" />
                        ) : (
                          <span className="font-bold text-xs text-[var(--ac-green)]">
                            {teacher.firstName ? teacher.firstName[0] : teacher.name?.[0] || "T"}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-[var(--ac-text)] hover:text-[var(--ac-green)]">
                          {teacher.name}
                        </div>
                        <div className="text-xs text-[var(--ac-muted)]">
                          {teacher.classAssigned || teacher.classTeacher || "—"}
                        </div>
                      </div>
                    </div>

                    {/* Contact details */}
                    <div className="space-y-3 text-xs mb-4">
                      <div>
                        <div className="text-[11.5px] text-[var(--ac-muted)] mb-0.5">Email</div>
                        <div className="font-medium text-[var(--ac-text)] truncate text-[13px]">
                          {teacher.email || "—"}
                        </div>
                      </div>
                      <div>
                        <div className="text-[11.5px] text-[var(--ac-muted)] mb-0.5">Phone</div>
                        <div className="font-medium text-[var(--ac-text)] text-[13px]">
                          {teacher.phone || teacher.primaryContact || "—"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer: Subjects + View Details */}
                  <div className="border-t border-dashed border-[var(--ac-border)] pt-3">
                    {/* Subject pills */}
                    <div className="flex flex-wrap gap-1 mb-2.5">
                      {(teacher.subjects?.length ? teacher.subjects : [teacher.subject || "General"]).map((sub) => (
                        <span
                          key={sub}
                          className="inline-block rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-700"
                        >
                          {sub}
                        </span>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => openTeacherDetails(teacher)}
                      className="w-full rounded-md border border-[var(--ac-border)] bg-[#f4f6f8] px-3 py-1.5 text-xs font-medium text-[var(--ac-muted)] hover:bg-[#e2e8f0] hover:text-[var(--ac-text)] transition-colors"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Load More Button for Grid */}
          {hasMoreGrid && (
            <div className="mt-8 text-center">
              <button
                type="button"
                onClick={() => setVisibleGridCount((prev) => prev + 8)}
                className="inline-flex items-center gap-2 rounded-lg bg-[var(--ac-green)] px-6 py-2.5 text-xs font-semibold text-white hover:bg-[var(--ac-green-dark)] shadow-sm transition-colors"
              >
                <svg className="h-4 w-4 animate-spin-slow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Load More
              </button>
            </div>
          )}
        </div>
      )}

      {/* ════ VIEW 2: LIST VIEW (TABLE) ════ */}
      {viewMode === "list" && (
        <div className="rounded-xl border border-[var(--ac-border)] bg-white overflow-hidden">
          {/* Table Header Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--ac-border)] p-4">
            <div className="flex items-center gap-2 text-xs text-[var(--ac-muted)]">
              <span>Row Per Page</span>
              <select
                className="ac-select text-xs py-1 px-2.5 !w-16"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>

            <div className="relative">
              <svg className="absolute left-3 top-2.5 h-4 w-4 text-[var(--ac-hint)] pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                className="ac-input text-xs !pl-9 py-1.5 w-60"
                placeholder="Search Teacher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Table Content */}
          <div className="overflow-x-auto">
            <table className="ac-table w-full min-w-[950px]">
              <thead>
                <tr>
                  <th style={{ width: 44 }}>
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded accent-[var(--ac-green)]"
                      checked={allSelected}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                  </th>
                  <th style={{ width: 110, minWidth: 100 }}>Teacher ID</th>
                  <th style={{ minWidth: 250, width: "28%" }}>Name</th>
                  <th style={{ minWidth: 130, width: "15%" }}>Class</th>
                  <th style={{ minWidth: 150, width: "18%" }}>Subject</th>
                  <th style={{ minWidth: 130, width: "15%" }}>Phone</th>
                  <th style={{ width: 110, minWidth: 100 }}>Status</th>
                  <th style={{ width: 100, textAlign: "center" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {pagedTeachers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-xs text-[var(--ac-muted)]">
                      No teachers found.
                    </td>
                  </tr>
                ) : (
                  pagedTeachers.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded accent-[var(--ac-green)]"
                          checked={selectedIds.includes(row.id)}
                          onChange={(e) => handleSelectOne(row.id, e.target.checked)}
                        />
                      </td>
                      <td>
                        <span className="font-semibold text-xs text-[var(--ac-green)]">
                          {row.teacherId || row.id}
                        </span>
                      </td>
                      <td>
                        <div
                          onClick={() => openTeacherDetails(row)}
                          className="flex items-center gap-2.5 cursor-pointer group pr-4"
                        >
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-[var(--ac-green)] font-bold text-xs border border-emerald-200">
                            {row.firstName ? row.firstName[0] : row.name?.[0] || "T"}
                          </div>
                          <div className="min-w-0">
                            <span className="ac-name block font-semibold group-hover:text-[var(--ac-green)] transition-colors truncate">
                              {row.name}
                            </span>
                            <span className="text-[11px] text-[var(--ac-hint)] block truncate max-w-[200px]">{row.email}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="text-xs text-[var(--ac-text)] font-medium block whitespace-nowrap">
                          {row.classAssigned || row.classTeacher || "—"}
                        </span>
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          {(row.subjects?.length ? row.subjects : [row.subject || "General"]).map((sub) => (
                            <span
                              key={sub}
                              className="inline-block rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-700"
                            >
                              {sub}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <span className="text-xs text-[var(--ac-muted)]">
                          {row.phone || row.primaryContact || "—"}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            row.status === "Inactive"
                              ? "bg-red-50 text-red-700"
                              : "bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              row.status === "Inactive" ? "bg-red-500" : "bg-emerald-500"
                            }`}
                          />
                          {row.status === "Inactive" ? "Inactive" : "Active"}
                        </span>
                      </td>
                      <td className="relative text-center">
                        <div className="inline-flex items-center justify-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveActionMenuId(activeActionMenuId === row.id ? null : row.id);
                            }}
                            className={`flex h-7 w-7 items-center justify-center rounded-lg border transition-colors cursor-pointer ${
                              activeActionMenuId === row.id
                                ? "border-[var(--ac-green)] bg-[var(--ac-green-light)] text-[var(--ac-green)]"
                                : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                            }`}
                            title="Actions"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                            </svg>
                          </button>

                          {activeActionMenuId === row.id && (
                            <>
                              <div
                                className="fixed inset-0 z-40 cursor-default"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveActionMenuId(null);
                                }}
                              />
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="absolute right-4 top-10 z-50 w-36 rounded-xl border border-gray-200 bg-white py-1.5 shadow-xl animate-in fade-in zoom-in-95 duration-100 text-xs font-medium text-gray-700 space-y-0.5 text-left"
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveActionMenuId(null);
                                    openTeacherDetails(row);
                                  }}
                                  className="flex items-center gap-2 w-full px-3 py-1.5 text-left hover:bg-gray-50 hover:text-[var(--ac-green)] transition-colors cursor-pointer"
                                >
                                  <svg className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                  <span>View Details</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveActionMenuId(null);
                                    navigate(`/front-office/teachers/${row.id}/edit`);
                                  }}
                                  className="flex items-center gap-2 w-full px-3 py-1.5 text-left hover:bg-gray-50 hover:text-gray-900 transition-colors cursor-pointer"
                                >
                                  <svg className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                  <span>Edit Teacher</span>
                                </button>

                                <div className="border-t border-gray-100 my-1" />

                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveActionMenuId(null);
                                    if (window.confirm(`Are you sure you want to delete ${row.name || "this teacher"}?`)) {
                                      deleteTeacher(row.id);
                                    }
                                  }}
                                  className="flex items-center gap-2 w-full px-3 py-1.5 text-left text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                >
                                  <svg className="h-3.5 w-3.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                  <span>Delete</span>
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table Pagination Footer */}
          <div className="flex items-center justify-between border-t border-[var(--ac-border)] px-4 py-3 text-xs text-[var(--ac-muted)]">
            <div>
              Showing {Math.min((safePage - 1) * pageSize + 1, total)} to{" "}
              {Math.min(safePage * pageSize, total)} of {total} entries
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-md border border-[var(--ac-border)] px-2.5 py-1 text-xs font-medium disabled:opacity-40 hover:bg-gray-50"
              >
                Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setPage(num)}
                  className={`flex h-7 w-7 items-center justify-center rounded-md text-xs font-semibold ${
                    num === safePage
                      ? "bg-[var(--ac-green)] text-white"
                      : "border border-[var(--ac-border)] bg-white text-[var(--ac-text)] hover:bg-gray-50"
                  }`}
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="rounded-md border border-[var(--ac-border)] px-2.5 py-1 text-xs font-medium disabled:opacity-40 hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Teacher Details Modal ── */}
      <TeacherDetailsModal
        teacher={selectedTeacher}
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        onEdit={(t) => navigate(`/front-office/teachers/${t.id}/edit`)}
        onToggleStatus={(id, newStatus) => {
          const teacherObj = teachers.find((t) => t.id === id);
          const actionLabel = newStatus === "Inactive" ? "mark as Inactive" : "activate";
          if (window.confirm(`Are you sure you want to ${actionLabel} teacher "${teacherObj?.name || "Teacher"}"?`)) {
            updateTeacher(id, { status: newStatus });
            setDetailsOpen(false);
          }
        }}
        onDelete={(id) => {
          const teacherObj = teachers.find((t) => t.id === id);
          if (window.confirm(`⚠️ PERMANENT DELETE:\nAre you sure you want to permanently delete "${teacherObj?.name || "this teacher"}"?\nThis cannot be undone.`)) {
            deleteTeacher(id);
            setDetailsOpen(false);
          }
        }}
      />
    </div>
  );
}
