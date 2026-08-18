import React, { useEffect, useMemo, useRef, useState } from "react";
import { Field, Modal, inputClass, selectClass } from "../../components/ui";
import { useAcademic } from "../../academic/context/AcademicContext";
import {
  ACADEMIC_YEARS,
} from "../../academic/data/academic";
import {
  Breadcrumbs,
  RowMenu,
  btnPrimary,
  btnSecondary,
} from "../../academic/components/AcademicListShell";
import { NOTICE_AUDIENCES } from "../data/notices";
import { useNotices } from "../context/NoticesContext";

/** Who can receive a class/section-targeted notice */
const CLASS_RECIPIENTS = [
  { value: "Student", label: "Students" },
  { value: "Parent", label: "Parents" },
  {
    value: "ClassTeacher",
    label: "Class teachers",
    hint: "Homeroom / class teacher of selected sections",
  },
  {
    value: "SubjectTeacher",
    label: "Teachers who teach these classes",
    hint: "Subject teachers from the class timetable",
  },
];
const CLASS_RECIPIENT_VALUES = CLASS_RECIPIENTS.map((r) => r.value);

/** Map legacy "Teacher" → ClassTeacher when editing older notices */
function normalizeAudiences(list = []) {
  return [
    ...new Set(
      list.map((a) => (a === "Teacher" ? "ClassTeacher" : a))
    ),
  ];
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function formatDisplayDate(iso) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return `${String(d).padStart(2, "0")} ${MONTHS[m - 1]} ${y}`;
}

function todayIso() {
  const d = new Date();
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

const emptyForm = () => ({
  title: "",
  noticeDate: todayIso(),
  publishOn: todayIso(),
  message: "",
  audiences: [],
  classScope: "all",
  classTargets: [], // [{ classId, sectionIds: [] }]
  attachmentName: "",
  attachmentType: "",
  attachmentPreview: "",
  addToCalendar: true,
});

const ACCEPTED_ATTACH = {
  "application/pdf": "pdf",
  "image/jpeg": "poster",
  "image/jpg": "poster",
  "image/png": "poster",
  "image/webp": "poster",
};

function detectAttachType(file) {
  if (ACCEPTED_ATTACH[file.type]) return ACCEPTED_ATTACH[file.type];
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf")) return "pdf";
  if (/\.(jpe?g|png|webp)$/.test(name)) return "poster";
  return null;
}

/** Normalize legacy classIds/sectionIds → classTargets */
function normalizeClassTargets(notice) {
  if (Array.isArray(notice.classTargets) && notice.classTargets.length) {
    return notice.classTargets.map((t) => ({
      classId: t.classId,
      sectionIds: [...(t.sectionIds || [])],
    }));
  }
  if (notice.classScope === "specific" && (notice.classIds || []).length) {
    return notice.classIds.map((classId) => ({
      classId,
      sectionIds: [...(notice.sectionIds || [])],
    }));
  }
  return [];
}

function formatTargetLabel(notice, classes, sections) {
  const targets = normalizeClassTargets(notice);
  if (notice.classScope !== "specific" || !targets.length) return null;

  return targets
    .map((t) => {
      const className =
        classes.find((c) => c.id === t.classId)?.name || t.classId;
      if (!(t.sectionIds || []).length) {
        return `${className} (all sections)`;
      }
      const secs = t.sectionIds
        .map((id) => sections.find((s) => s.id === id)?.name || id)
        .join(", ");
      return `${className} (Sec ${secs})`;
    })
    .join(" · ");
}

const PER_PAGE = 8;

function SimpleEditor({ value, onChange, disabled, placeholder }) {
  const editorRef = useRef(null);

  useEffect(() => {
    if (!disabled && editorRef.current && editorRef.current.innerHTML !== (value || "")) {
      editorRef.current.innerHTML = value || "";
    }
  }, [value, disabled]);

  const exec = (cmd, arg) => {
    if (disabled) return;
    document.execCommand(cmd, false, arg);
    editorRef.current.focus();
    if (onChange) onChange(editorRef.current.innerHTML);
  };

  const handleInput = () => {
    if (onChange && editorRef.current) onChange(editorRef.current.innerHTML);
  };

  return (
    <div className={`border border-[var(--ac-border)] rounded-md overflow-hidden bg-white ${disabled ? "opacity-70 bg-gray-50" : ""}`}>
      {!disabled && (
        <div className="flex flex-wrap items-center gap-1 border-b border-[var(--ac-border)] p-1.5 bg-[#f8f9fb]">
          <button type="button" onClick={() => exec("bold")} className="p-1 hover:bg-gray-200 rounded text-sm font-bold w-7 text-center text-gray-700">B</button>
          <button type="button" onClick={() => exec("italic")} className="p-1 hover:bg-gray-200 rounded text-sm italic w-7 text-center text-gray-700">I</button>
          <button type="button" onClick={() => exec("underline")} className="p-1 hover:bg-gray-200 rounded text-sm underline w-7 text-center text-gray-700">U</button>
          <button type="button" onClick={() => exec("strikeThrough")} className="p-1 hover:bg-gray-200 rounded text-sm line-through w-7 text-center text-gray-700">S</button>
          <div
            className="flex items-center hover:bg-gray-200 rounded px-1"
            title="Text Color"
            onMouseDown={(e) => {
              // Save selection before color picker steals focus
              const sel = window.getSelection();
              if (sel && sel.rangeCount > 0) {
                editorRef.current._savedRange = sel.getRangeAt(0).cloneRange();
              }
            }}
          >
            <input
              type="color"
              className="w-5 h-5 border-0 p-0 cursor-pointer bg-transparent rounded-full"
              onChange={(e) => {
                // Restore saved selection then apply color
                const saved = editorRef.current._savedRange;
                if (saved) {
                  const sel = window.getSelection();
                  sel.removeAllRanges();
                  sel.addRange(saved);
                }
                exec("foreColor", e.target.value);
              }}
              defaultValue="#1a1d23"
            />
          </div>
          <div className="w-px h-5 bg-gray-300 mx-1"></div>
          <button type="button" onClick={() => exec("justifyLeft")} className="p-1 hover:bg-gray-200 rounded text-gray-700" title="Align Left">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M3 21v-2h18v2H3zm0-4v-2h12v2H3zm0-4v-2h18v2H3zm0-4V7h12v2H3z"/></svg>
          </button>
          <button type="button" onClick={() => exec("justifyCenter")} className="p-1 hover:bg-gray-200 rounded text-gray-700" title="Align Center">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M3 21v-2h18v2H3zm4-4v-2h10v2H7zm-4-4v-2h18v2H3zm4-4V7h10v2H7z"/></svg>
          </button>
          <button type="button" onClick={() => exec("justifyRight")} className="p-1 hover:bg-gray-200 rounded text-gray-700" title="Align Right">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M3 21v-2h18v2H3zm6-4v-2h12v2H9zm-6-4v-2h18v2H3zm6-4V7h12v2H9z"/></svg>
          </button>
          <div className="w-px h-5 bg-gray-300 mx-1"></div>
          <button type="button" onClick={() => exec("insertUnorderedList")} className="p-1 hover:bg-gray-200 rounded text-gray-700" title="Bullet List">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 6h13v2H8V6zm-4 2V6h2v2H4zm4 5h13v2H8v-2zm-4 2v-2h2v2H4zm4 5h13v2H8v-2zm-4 2v-2h2v2H4z"/></svg>
          </button>
          <button type="button" onClick={() => exec("insertOrderedList")} className="p-1 hover:bg-gray-200 rounded text-gray-700" title="Numbered List">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 6h13v2H8V6zm-5 2V6h2v2H3zm5 5h13v2H8v-2zm-5 2v-2h2v2H3zm5 5h13v2H8v-2zm-5 2v-2h2v2H3z"/></svg>
          </button>
        </div>
      )}
      {disabled ? (
        <div 
          className="p-3 min-h-[120px] max-h-[300px] overflow-y-auto text-[13.5px] text-[var(--ac-text)]"
          dangerouslySetInnerHTML={{ __html: value || `<span class="text-[var(--ac-muted)]">${placeholder}</span>` }}
        />
      ) : (
        <div
          ref={editorRef}
          className="p-3 min-h-[120px] max-h-[300px] overflow-y-auto text-[13.5px] text-[var(--ac-text)] focus:outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-[var(--ac-muted)]"
          contentEditable={true}
          onInput={handleInput}
          onBlur={handleInput}
          data-placeholder={placeholder}
        ></div>
      )}
    </div>
  );
}

export default function NoticeBoardPage() {
  const { notices, addNotice, updateNotice, deleteNotice } = useNotices();
  const { addCalendarEvent, classes, sections, mappings, routineSlots, teachers } =
    useAcademic();

  const [academicYear, setAcademicYear] = useState("2026-2027");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState("create");
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [toast, setToast] = useState("");

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mediaDropdownOpen, setMediaDropdownOpen] = useState(false);
  const [dropdownSearch, setDropdownSearch] = useState("");
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!dropdownOpen) return undefined;
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
        setDropdownSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  const [filterAudience, setFilterAudience] = useState("");
  const [filterClassId, setFilterClassId] = useState("");
  const [filterSectionId, setFilterSectionId] = useState("");
  const [dateRangePreset, setDateRangePreset] = useState("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);
  const dateDropdownRef = useRef(null);

  useEffect(() => {
    if (!dateDropdownOpen) return undefined;
    const handleClickOutsideDate = (e) => {
      if (dateDropdownRef.current && !dateDropdownRef.current.contains(e.target)) {
        setDateDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutsideDate);
    return () => document.removeEventListener("mousedown", handleClickOutsideDate);
  }, [dateDropdownOpen]);

  useEffect(() => {
    setPage(1);
  }, [filterAudience, filterClassId, filterSectionId, dateRangePreset, customStartDate, customEndDate]);



  const activeClasses = useMemo(
    () => classes.filter((c) => c.status === "Active"),
    [classes]
  );
  const activeSections = useMemo(
    () => sections.filter((s) => s.status === "Active"),
    [sections]
  );

  const sectionsForClass = (classId) => {
    const fromMaps = [
      ...new Set(
        (mappings || [])
          .filter((m) => m.classId === classId)
          .map((m) => m.sectionId)
      ),
    ];
    const ids = fromMaps.length
      ? fromMaps
      : activeSections.map((s) => s.id);
    return ids
      .map((id) => sections.find((s) => s.id === id))
      .filter(Boolean)
      .filter((s) => s.status === "Active");
  };

  const teacherNameById = useMemo(() => {
    const map = {};
    (teachers || []).forEach((t) => {
      map[t.id] = t.name;
    });
    return map;
  }, [teachers]);

  const resolvedClassTeachers = useMemo(() => {
    if (form.classScope !== "specific") return [];
    const names = new Set();
    form.classTargets.forEach((t) => {
      (mappings || []).forEach((m) => {
        if (m.classId !== t.classId || !m.teacherId) return;
        if (t.sectionIds.length && !t.sectionIds.includes(m.sectionId)) {
          return;
        }
        const name = teacherNameById[m.teacherId];
        if (name) names.add(name);
      });
    });
    return [...names].sort();
  }, [form.classScope, form.classTargets, mappings, teacherNameById]);

  const resolvedSubjectTeachers = useMemo(() => {
    if (form.classScope !== "specific") return [];
    const names = new Set();
    form.classTargets.forEach((t) => {
      (routineSlots || []).forEach((slot) => {
        if (slot.classId !== t.classId || !slot.teacher) return;
        if (
          t.sectionIds.length &&
          slot.sectionId &&
          !t.sectionIds.includes(slot.sectionId)
        ) {
          return;
        }
        names.add(slot.teacher);
      });
    });
    return [...names].sort();
  }, [form.classScope, form.classTargets, routineSlots]);

  const isClassSelected = (classId) =>
    form.classTargets.some((t) => t.classId === classId);

  const filteredNotices = useMemo(() => {
    return notices.filter((notice) => {
      if (!notice) return false;

      // ─── 1. AUDIENCE FILTER ─────────────────────────────────────────────────
      // Strategy: the filter value is a "canonical" role. We need to match it
      // against what is effectively stored in the notice, handling legacy data.
      //
      // Stored values can be:
      //   "Student", "Parent", "Teacher" (legacy all-class notice),
      //   "ClassTeacher", "SubjectTeacher" (specific-class notice), "Admin", etc.
      //
      // normalizeAudiences maps "Teacher" → "ClassTeacher" for editing, but for
      // filtering we want "Teacher" in the filter to match ANY teacher-type role.
      if (filterAudience) {
        const rawAudiences = notice.audiences || [];

        // Build a set of effective audiences, expanding legacy "Teacher"
        const effective = new Set(rawAudiences);
        if (rawAudiences.includes("Teacher")) {
          effective.add("ClassTeacher"); // legacy Teacher covers class teachers
        }

        let matches = false;
        if (filterAudience === "Teacher") {
          // "Teacher" in the filter should match any teacher-type audience
          matches =
            effective.has("Teacher") ||
            effective.has("ClassTeacher") ||
            effective.has("SubjectTeacher");
        } else {
          matches = effective.has(filterAudience);
        }
        if (!matches) return false;
      }

      // ─── 2. CLASS + SECTION FILTER ──────────────────────────────────────────
      // Edge cases handled:
      //   a) classScope missing/null → treated as "all" (defensive fallback)
      //   b) classScope "all"       → matches any class/section filter
      //   c) classScope "specific"  → must match the filtered classId;
      //                               if sectionIds[] is empty it means "all sections of that class"
      //   d) filterSectionId set but filterClassId empty → section filter is ignored
      //      (you cannot meaningfully filter by section without knowing the class)
      if (filterClassId) {
        const scope = notice.classScope || "all"; // defensive: missing scope = all

        if (scope === "all") {
          // School-wide notice → visible for any class/section filter
        } else if (scope === "specific") {
          const targets = normalizeClassTargets(notice);

          // Must target the filtered class
          const target = targets.find((t) => t.classId === filterClassId);
          if (!target) return false;

          // If a section filter is also active:
          if (filterSectionId) {
            const { sectionIds = [] } = target;
            if (sectionIds.length > 0) {
              // Notice targets specific sections — section must be in the list
              if (!sectionIds.includes(filterSectionId)) return false;
            }
            // sectionIds.length === 0 → "all sections of this class" → keep it
          }
        } else {
          // Unknown scope value — exclude to be safe
          return false;
        }
      }
      // Note: if filterClassId is empty but filterSectionId is set, we ignore
      // the section filter entirely (prevents confusing behaviour).

      // ─── 3. DATE RANGE FILTER ───────────────────────────────────────────────
      if (dateRangePreset && dateRangePreset !== "all") {
        if (!notice.noticeDate) return false;

        // Parse date strings in local time to avoid UTC timezone offset shifts
        const parts = notice.noticeDate.split("-").map(Number);
        if (parts.length !== 3 || parts.some(isNaN)) return false;
        const noticeDate = new Date(parts[0], parts[1] - 1, parts[2]);
        noticeDate.setHours(0, 0, 0, 0);

        const today = new Date();
        const todayLocal = new Date(today.getFullYear(), today.getMonth(), today.getDate());

        if (dateRangePreset === "today") {
          if (noticeDate.getTime() !== todayLocal.getTime()) return false;
        } else if (dateRangePreset === "yesterday") {
          const yesterday = new Date(todayLocal);
          yesterday.setDate(todayLocal.getDate() - 1);
          if (noticeDate.getTime() !== yesterday.getTime()) return false;
        } else if (dateRangePreset === "last-7") {
          const sevenDaysAgo = new Date(todayLocal);
          sevenDaysAgo.setDate(todayLocal.getDate() - 7);
          if (
            noticeDate.getTime() < sevenDaysAgo.getTime() ||
            noticeDate.getTime() > todayLocal.getTime()
          ) {
            return false;
          }
        } else if (dateRangePreset === "this-month") {
          if (
            noticeDate.getFullYear() !== todayLocal.getFullYear() ||
            noticeDate.getMonth() !== todayLocal.getMonth()
          ) {
            return false;
          }
        } else if (dateRangePreset === "custom") {
          if (customStartDate) {
            const sParts = customStartDate.split("-").map(Number);
            if (sParts.length === 3 && !sParts.some(isNaN)) {
              const start = new Date(sParts[0], sParts[1] - 1, sParts[2]);
              if (noticeDate.getTime() < start.getTime()) return false;
            }
          }
          if (customEndDate) {
            const eParts = customEndDate.split("-").map(Number);
            if (eParts.length === 3 && !eParts.some(isNaN)) {
              const end = new Date(eParts[0], eParts[1] - 1, eParts[2]);
              if (noticeDate.getTime() > end.getTime()) return false;
            }
          }
        }
      }

      return true;
    });
  }, [
    notices,
    filterAudience,
    filterClassId,
    filterSectionId,
    dateRangePreset,
    customStartDate,
    customEndDate,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredNotices.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const pageRows = useMemo(
    () => filteredNotices.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE),
    [filteredNotices, safePage]
  );

  const showToast = (msg) => {
    setToast(msg);
    window.setTimeout(() => setToast(""), 2500);
  };

  const openCreate = () => {
    setMode("create");
    setEditingId(null);
    setForm(emptyForm());
    setModalOpen(true);
  };

  const openEdit = (notice, viewOnly = false) => {
    setMode(viewOnly ? "view" : "edit");
    setEditingId(notice.id);
    const targets = normalizeClassTargets(notice);
    setForm({
      title: notice.title || "",
      noticeDate: notice.noticeDate || todayIso(),
      publishOn: notice.publishOn || notice.noticeDate || todayIso(),
      message: notice.message || "",
      audiences: normalizeAudiences(notice.audiences || []),
      classScope:
        notice.classScope ||
        (targets.length ? "specific" : "all"),
      classTargets: targets,
      attachmentName: notice.attachmentName || "",
      attachmentType: notice.attachmentType || "",
      attachmentPreview: notice.attachmentPreview || "",
      addToCalendar: false,
    });
    setModalOpen(true);
  };

  const toggleAudience = (value) => {
    setForm((prev) => {
      const has = prev.audiences.includes(value);
      return {
        ...prev,
        audiences: has
          ? prev.audiences.filter((a) => a !== value)
          : [...prev.audiences, value],
      };
    });
  };

  const toggleClass = (classId) => {
    setForm((prev) => {
      const has = prev.classTargets.some((t) => t.classId === classId);
      const classTargets = has
        ? prev.classTargets.filter((t) => t.classId !== classId)
        : [...prev.classTargets, { classId, sectionIds: [] }];
      return { ...prev, classTargets };
    });
  };

  const selectAllSectionsForClass = (classId) => {
    setForm((prev) => ({
      ...prev,
      classTargets: prev.classTargets.map((t) =>
        t.classId === classId ? { ...t, sectionIds: [] } : t
      ),
    }));
  };

  const onFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const kind = detectAttachType(file);
    if (!kind) {
      showToast("Use PDF or poster image (JPG, PNG, WEBP).");
      e.target.value = "";
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      showToast("File must be 4MB or smaller.");
      e.target.value = "";
      return;
    }
    if (form.attachmentPreview) {
      URL.revokeObjectURL(form.attachmentPreview);
    }
    const preview = kind === "poster" ? URL.createObjectURL(file) : "";
    setForm((prev) => ({
      ...prev,
      attachmentName: file.name,
      attachmentType: kind,
      attachmentPreview: preview,
    }));
  };

  const clearAttachment = () => {
    if (form.attachmentPreview) {
      URL.revokeObjectURL(form.attachmentPreview);
    }
    setForm((prev) => ({
      ...prev,
      attachmentName: "",
      attachmentType: "",
      attachmentPreview: "",
    }));
  };

  const saveNotice = (e) => {
    e.preventDefault();
    if (mode === "view") {
      setModalOpen(false);
      return;
    }
    const title = form.title.trim();
    if (!title) return;

    const classScope = form.classScope;
    if (classScope === "specific" && form.classTargets.length === 0) {
      showToast("Select at least one class, or choose All classes.");
      return;
    }

    let audiences = [...form.audiences];
    if (classScope === "specific") {
      audiences = audiences.filter((a) =>
        CLASS_RECIPIENT_VALUES.includes(a)
      );
      if (audiences.length === 0) {
        showToast(
          "Choose who should receive this: Students, Parents, Class teachers, or subject teachers."
        );
        return;
      }
    } else if (audiences.length === 0) {
      showToast("Select at least one Message To role.");
      return;
    }

    const payload = {
      title,
      noticeDate: form.noticeDate,
      publishOn: form.publishOn,
      message: form.message.trim(),
      audiences,
      classScope,
      classTargets:
        classScope === "specific" ? form.classTargets : [],
      attachmentName: form.attachmentName,
      attachmentType: form.attachmentType || "",
      attachmentPreview: form.attachmentPreview || "",
      addToCalendar: !!form.addToCalendar,
    };

    if (mode === "edit" && editingId) {
      updateNotice({ id: editingId, ...payload });
      showToast("Notice updated successfully!");
    } else {
      addNotice(payload);
      if (form.addToCalendar) {
        const start = form.noticeDate || todayIso();
        addCalendarEvent(academicYear, {
          title,
          start,
          end: start,
          cat: "Notice",
          color: "red",
          desc: form.message.trim() || "Added from Notice Board",
          classScope: form.classScope || "all",
          classTargets: form.classScope === "specific" ? (form.classTargets || []) : [],
        });
      }
      showToast("Notice added successfully!");
    }

    setModalOpen(false);
    setPage(1);
  };

  const exportCsv = () => {
    const header = [
      "Title",
      "Notice Date",
      "Publish On",
      "Message To",
      "Class / Section",
      "Message",
      "Attachment",
    ];
    const lines = notices.map((n) => {
      const target =
        formatTargetLabel(n, classes, sections) ||
        (n.classScope === "specific" ? "Specific" : "All classes");
      return [
        n.title,
        n.noticeDate,
        n.publishOn,
        (n.audiences || []).join("; "),
        target,
        n.message || "",
        n.attachmentName || "",
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",");
    });
    const blob = new Blob([[header.join(","), ...lines].join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "notice-board.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const activeFilterCount = [
    filterAudience,
    filterClassId,
    filterSectionId,
    dateRangePreset !== "all" ? dateRangePreset : "",
  ].filter(Boolean).length;
  const isFilterActive = activeFilterCount > 0;

  const clearAllFilters = () => {
    setFilterAudience("");
    setFilterClassId("");
    setFilterSectionId("");
    setDateRangePreset("all");
    setCustomStartDate("");
    setCustomEndDate("");
  };

  const readOnly = mode === "view";
  const modalTitle =
    mode === "view"
      ? "View Message"
      : mode === "edit"
        ? "Edit Message"
        : "New Message";

  return (
    <div className="academic-page notice-board-page space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="ac-page-title">Notice Board</h1>
          <Breadcrumbs
            items={[
              { label: "Dashboard", to: "/front-office" },
              { label: "Announcements" },
              { label: "Notice Board" },
            ]}
          />
        </div>
        <div className="nb-page-actions">
          <select
            className="nb-ay-select"
            value={academicYear}
            onChange={(e) => setAcademicYear(e.target.value)}
            aria-label="Academic year"
          >
            {ACADEMIC_YEARS.map((ay) => (
              <option key={ay} value={ay}>
                Academic Year {ay}
              </option>
            ))}
          </select>
          <button type="button" className="nb-btn-export" onClick={exportCsv}>
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
          </button>
          <button type="button" className="nb-btn-add" onClick={openCreate}>
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
            Add Message
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex justify-end gap-2">
          {/* Date Preset Selector */}
          <div className="relative" ref={dateDropdownRef}>
            <button
              type="button"
              className={`ac-toolbar-btn ${
                dateRangePreset !== "all" ? "border-green-600 bg-green-50/50 text-green-700 font-semibold" : ""
              }`}
              onClick={() => setDateDropdownOpen(!dateDropdownOpen)}
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3M3 11h18M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {dateRangePreset === "all"
                ? "All dates"
                : dateRangePreset === "today"
                  ? "Today"
                  : dateRangePreset === "yesterday"
                    ? "Yesterday"
                    : dateRangePreset === "last-7"
                      ? "Last 7 days"
                      : dateRangePreset === "this-month"
                        ? "This Month"
                        : "Custom Range"}
            </button>

            {dateDropdownOpen && (
              <div className="absolute right-0 z-20 mt-1 w-44 rounded-md border border-gray-200 bg-white py-1 shadow-lg">
                {[
                  { value: "all", label: "All dates" },
                  { value: "today", label: "Today" },
                  { value: "yesterday", label: "Yesterday" },
                  { value: "last-7", label: "Last 7 days" },
                  { value: "this-month", label: "This Month" },
                  { value: "custom", label: "Custom range..." },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`w-full px-4 py-2 text-left text-xs hover:bg-green-50 ${
                      dateRangePreset === opt.value
                        ? "bg-green-50/60 font-semibold text-green-700"
                        : "text-gray-700"
                    }`}
                    onClick={() => {
                      setDateRangePreset(opt.value);
                      setDateDropdownOpen(false);
                      if (opt.value === "custom") {
                        setFilterPanelOpen(true);
                      }
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Filter Toggle Button */}
          <button
            type="button"
            onClick={() => setFilterPanelOpen(!filterPanelOpen)}
            className={`ac-toolbar-btn ${
              isFilterActive ? "border-green-600 bg-green-50/50 text-green-700 font-semibold" : ""
            }`}
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h18M6 12h12M10 20h4" />
            </svg>
            Filter
            {activeFilterCount > 0 && (
              <span className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-green-600 text-[10px] font-bold text-white leading-none">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Expandable Filter Panel */}
        {filterPanelOpen && (
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Target Audience */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                  Target Audience
                </label>
                <select
                  className={`${selectClass} text-xs`}
                  value={filterAudience}
                  onChange={(e) => setFilterAudience(e.target.value)}
                >
                  <option value="">All Audiences</option>
                  <option value="Student">Students</option>
                  <option value="Parent">Parents / Guardian</option>
                  <option value="Teacher">Teachers (any type)</option>
                  <option value="ClassTeacher">Class Teacher</option>
                  <option value="Admin">Admin</option>
                  <option value="Accountant">Accountant</option>
                  <option value="Librarian">Librarian</option>
                  <option value="Receptionist">Receptionist</option>
                  <option value="Super Admin">Super Admin</option>
                  <option value="Principal">Principal</option>
                </select>
              </div>

              {/* Target Class */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                  Target Class
                </label>
                <select
                  className={`${selectClass} text-xs`}
                  value={filterClassId}
                  onChange={(e) => {
                    setFilterClassId(e.target.value);
                    setFilterSectionId(""); // Reset section filter if class changes
                  }}
                >
                  <option value="">All Classes</option>
                  {activeClasses.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Target Section */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                  Target Section
                </label>
                <select
                  className={`${selectClass} text-xs`}
                  disabled={!filterClassId}
                  value={filterSectionId}
                  onChange={(e) => setFilterSectionId(e.target.value)}
                >
                  <option value="">All Sections</option>
                  {filterClassId &&
                    sectionsForClass(filterClassId).map((sec) => (
                      <option key={sec.id} value={sec.id}>
                        Sec {sec.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* Custom Date Range */}
            {dateRangePreset === "custom" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-gray-100 pt-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                    Start Date
                  </label>
                  <input
                    type="date"
                    className="w-full rounded-md border border-gray-300 p-2 text-xs outline-none focus:border-green-700"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                    End Date
                  </label>
                  <input
                    type="date"
                    className="w-full rounded-md border border-gray-300 p-2 text-xs outline-none focus:border-green-700"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Active Filters Summary */}
            {isFilterActive && (
              <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                <div className="flex flex-wrap gap-1.5 items-center">
                  <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mr-1">
                    Active Filters:
                  </span>
                  {filterAudience && (
                    <span className="inline-flex items-center gap-1 rounded bg-green-50 border border-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">
                      Audience:{" "}
                      {filterAudience === "Parent"
                        ? "Parents / Guardian"
                        : filterAudience === "Teacher"
                          ? "Teachers (any type)"
                          : filterAudience === "ClassTeacher"
                            ? "Class Teacher"
                            : filterAudience}
                      <button onClick={() => setFilterAudience("")} className="text-green-500 hover:text-green-700 font-bold ml-0.5">✕</button>
                    </span>
                  )}
                  {filterClassId && (
                    <span className="inline-flex items-center gap-1 rounded bg-green-50 border border-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">
                      Class: {classes.find((c) => c.id === filterClassId)?.name || filterClassId}
                      <button onClick={() => setFilterClassId("")} className="text-green-500 hover:text-green-700 font-bold ml-0.5">✕</button>
                    </span>
                  )}
                  {filterSectionId && (
                    <span className="inline-flex items-center gap-1 rounded bg-green-50 border border-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">
                      Section: {sections.find((s) => s.id === filterSectionId)?.name || filterSectionId}
                      <button onClick={() => setFilterSectionId("")} className="text-green-500 hover:text-green-700 font-bold ml-0.5">✕</button>
                    </span>
                  )}
                  {dateRangePreset !== "all" && (
                    <span className="inline-flex items-center gap-1 rounded bg-green-50 border border-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">
                      Date: {dateRangePreset === "custom" ? `${customStartDate || "Start"} to ${customEndDate || "End"}` : dateRangePreset}
                      <button onClick={() => setDateRangePreset("all")} className="text-green-500 hover:text-green-700 font-bold ml-0.5">✕</button>
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="text-xs font-semibold text-red-600 hover:text-red-800 transition-colors"
                >
                  Reset All Filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="nb-card">
        {pageRows.length === 0 ? (
          <div className="px-5 py-10 text-center text-[13px] text-[var(--ac-muted)]">
            No notices yet. Click Add Message to create one.
          </div>
        ) : (
          pageRows.map((n) => (
            <div key={n.id} className="nb-row">
              <div className="nb-check">
                <input
                  type="checkbox"
                  checked={selected.includes(n.id)}
                  onChange={(e) =>
                    setSelected((prev) =>
                      e.target.checked
                        ? [...new Set([...prev, n.id])]
                        : prev.filter((id) => id !== n.id)
                    )
                  }
                />
              </div>
              <div className="nb-icon">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <div className="nb-info min-w-0 flex-1">
                <div className="nb-title">{n.title}</div>
                <div className="nb-date">
                  Added on : {formatDisplayDate(n.noticeDate)}
                  {(() => {
                    const target = formatTargetLabel(n, classes, sections);
                    return target ? (
                      <span className="nb-target"> · {target}</span>
                    ) : null;
                  })()}
                </div>
              </div>
              <RowMenu
                items={[
                  {
                    label: "View",
                    onClick: () => openEdit(n, true),
                  },
                  {
                    label: "Edit",
                    onClick: () => openEdit(n, false),
                  },
                  {
                    label: "Delete",
                    danger: true,
                    onClick: () => {
                      if (window.confirm("Delete this notice?")) {
                        deleteNotice(n.id);
                        setSelected((prev) => prev.filter((id) => id !== n.id));
                      }
                    },
                  },
                ]}
              />
            </div>
          ))
        )}

        <div className="nb-pagination">
          <button
            type="button"
            className={`ac-pg-btn ${safePage === 1 ? "disabled" : ""}`}
            disabled={safePage === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Pre
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
            const show =
              p === 1 ||
              p === totalPages ||
              (p >= safePage - 1 && p <= safePage + 1);
            const dots =
              p === safePage - 2 || p === safePage + 2;
            if (dots) {
              return (
                <span key={`d-${p}`} className="px-1 text-[12px] text-[var(--ac-hint)]">
                  …
                </span>
              );
            }
            if (!show) return null;
            return (
              <button
                key={p}
                type="button"
                className={`ac-pg-btn ${p === safePage ? "active" : ""}`}
                onClick={() => setPage(p)}
              >
                {p}
              </button>
            );
          })}
          <button
            type="button"
            className={`ac-pg-btn ${safePage === totalPages ? "disabled" : ""}`}
            disabled={safePage === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </button>
        </div>
      </div>

      <Modal
        open={modalOpen}
        title={modalTitle}
        onClose={() => setModalOpen(false)}
        wide
      >
        <form onSubmit={saveNotice} className="space-y-4">
          <Field label="Title" required>
            <input
              className={inputClass}
              value={form.title}
              disabled={readOnly}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="Enter notice title"
              required
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Notice Date" required>
              <input
                type="date"
                className={inputClass}
                value={form.noticeDate}
                disabled={readOnly}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, noticeDate: e.target.value }))
                }
                required
              />
            </Field>

            <Field label="Publish On" required>
              <input
                type="date"
                className={inputClass}
                value={form.publishOn}
                disabled={readOnly}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, publishOn: e.target.value }))
                }
                required
              />
            </Field>
          </div>

          <div className="nb-attach">
            <div className="nb-attach-label">Attachment</div>
            <div className="nb-attach-hint">
              PDF document or poster image (JPG, PNG, WEBP). Recommended dimensions: 800x1200px. Max size 4MB.
            </div>
            {!readOnly ? (
              <div className="nb-attach-actions relative flex items-center">
                <button
                  type="button"
                  className="ac-btn ac-btn-primary"
                  onClick={() => setMediaDropdownOpen(!mediaDropdownOpen)}
                >
                  Add media
                  <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {mediaDropdownOpen && (
                  <div 
                    className="absolute top-full left-0 mt-2 w-48 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 z-20"
                    onMouseLeave={() => setMediaDropdownOpen(false)}
                  >
                    <div className="py-1">
                      <label className="block px-4 py-2 text-sm text-[var(--ac-text)] hover:bg-gray-100 cursor-pointer">
                        Upload PDF
                        <input
                          type="file"
                          accept=".pdf,application/pdf"
                          className="hidden"
                          onChange={(e) => {
                            onFileChange(e);
                            setMediaDropdownOpen(false);
                          }}
                        />
                      </label>
                      <label className="block px-4 py-2 text-sm text-[var(--ac-text)] hover:bg-gray-100 cursor-pointer">
                        Upload Poster <span className="ml-1 font-normal opacity-75 text-[10px]">(800x1200)</span>
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                          className="hidden"
                          onChange={(e) => {
                            onFileChange(e);
                            setMediaDropdownOpen(false);
                          }}
                        />
                      </label>
                    </div>
                  </div>
                )}
                {form.attachmentName ? (
                  <button
                    type="button"
                    className="nb-attach-clear ml-2"
                    onClick={clearAttachment}
                  >
                    Remove
                  </button>
                ) : null}
              </div>
            ) : null}
            {form.attachmentName ? (
              <div className="nb-attach-file">
                {form.attachmentType === "poster" && form.attachmentPreview ? (
                  <img
                    src={form.attachmentPreview}
                    alt="Poster preview"
                    className="nb-poster-preview"
                  />
                ) : null}
                <div className="nb-attach-name">
                  {form.attachmentType === "poster" ? "Poster: " : "PDF: "}
                  {form.attachmentName}
                </div>
              </div>
            ) : null}
          </div>

          <Field label="Message">
            <SimpleEditor
              value={form.message}
              disabled={readOnly}
              onChange={(val) =>
                setForm((prev) => ({ ...prev, message: val }))
              }
              placeholder="Write your message here…"
            />
          </Field>

          <Field
            label="Send to"
            hint="School-wide, or only chosen classes / sections"
          >
            <div className="nb-scope-row">
              <label className="nb-scope-opt">
                <input
                  type="radio"
                  name="classScope"
                  checked={form.classScope === "all"}
                  disabled={readOnly}
                  onChange={() =>
                    setForm((prev) => ({
                      ...prev,
                      classScope: "all",
                      classTargets: [],
                    }))
                  }
                />
                Entire school (all classes)
              </label>
              <label className="nb-scope-opt">
                <input
                  type="radio"
                  name="classScope"
                  checked={form.classScope === "specific"}
                  disabled={readOnly}
                  onChange={() =>
                    setForm((prev) => {
                      const hasClassRecipient = prev.audiences.some((a) =>
                        CLASS_RECIPIENT_VALUES.includes(a)
                      );
                      return {
                        ...prev,
                        classScope: "specific",
                        audiences: hasClassRecipient
                          ? prev.audiences.filter((a) =>
                              CLASS_RECIPIENT_VALUES.includes(a)
                            )
                          : ["Student"],
                      };
                    })
                  }
                />
                Specific class / section only
              </label>
            </div>

            {form.classScope === "specific" ? (
              <div className="nb-target-panel">
                <div className="nb-target-label">Select classes</div>
                <div className="nb-chip-grid">
                  {activeClasses.map((c) => (
                    <label
                      key={c.id}
                      className={`nb-chip ${isClassSelected(c.id) ? "nb-chip-on" : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={isClassSelected(c.id)}
                        disabled={readOnly}
                        onChange={() => toggleClass(c.id)}
                      />
                      {c.name}
                    </label>
                  ))}
                </div>

                {form.classTargets.length === 0 ? (
                  <p className="mt-2 text-[12px] text-[var(--ac-muted)]">
                    Pick at least one class. Then choose sections under it (or
                    leave as all sections).
                  </p>
                ) : (
                  form.classTargets.map((t) => {
                    const cls = classes.find((c) => c.id === t.classId);
                    const secs = sectionsForClass(t.classId);
                    return (
                      <div key={t.classId} className="nb-class-block">
                        <div className="nb-class-block-head">
                          <span>{cls?.name || t.classId}</span>
                          {!readOnly ? (
                            <div className="flex gap-2">
                              <button
                                type="button"
                                className="nb-link-btn"
                                onClick={() => selectAllSectionsForClass(t.classId)}
                              >
                                Select All
                              </button>
                              <button
                                type="button"
                                className="nb-link-btn"
                                style={{ color: "#ef4444" }}
                                onClick={() => toggleClass(t.classId)}
                              >
                                Remove
                              </button>
                            </div>
                          ) : null}
                        </div>
                        <div className="nb-chip-grid">
                          {secs.map((s) => {
                            const isAll = !t.sectionIds.length;
                            // [] = all sections selected; show all chips green
                            const checked = isAll || t.sectionIds.includes(s.id);
                            return (
                              <label
                                key={s.id}
                                className={`nb-chip ${checked ? "nb-chip-on" : ""}`}
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  disabled={readOnly}
                                  onChange={() => {
                                    const allIds = secs.map((x) => x.id);
                                    setForm((prev) => ({
                                      ...prev,
                                      classTargets: prev.classTargets.map((x) => {
                                        if (x.classId !== t.classId) return x;
                                        // If currently "all" (empty), expand to all ids first
                                        const current = x.sectionIds.length
                                          ? [...x.sectionIds]
                                          : [...allIds];
                                        const next = current.includes(s.id)
                                          ? current.filter((id) => id !== s.id)
                                          : [...current, s.id];
                                        // All manually selected → collapse back to []
                                        if (
                                          next.length === allIds.length &&
                                          allIds.every((id) => next.includes(id))
                                        ) {
                                          return { ...x, sectionIds: [] };
                                        }
                                        return { ...x, sectionIds: next };
                                      }),
                                    }));
                                  }}
                                />
                                Sec {s.name}
                              </label>
                            );
                          })}
                        </div>
                        <p className="nb-sec-status">
                          {!t.sectionIds.length
                            ? "Sending to all sections of this class"
                            : `Sending to Sec ${t.sectionIds
                                .map(
                                  (id) =>
                                    sections.find((sx) => sx.id === id)
                                      ?.name || id
                                )
                                .join(", ")}`}
                        </p>
                      </div>
                    );
                  })
                )}

                <div className="nb-who-block">
                  <div className="nb-target-label">
                    Who should receive this?
                  </div>
                  <p className="nb-who-hint">
                    Students, parents, class teacher, or teachers who teach these classes
                  </p>
                  <div className="nb-chip-grid">
                    {CLASS_RECIPIENTS.map((r) => (
                      <label
                        key={r.value}
                        className={`nb-chip ${
                          form.audiences.includes(r.value) ? "nb-chip-on" : ""
                        }`}
                        title={r.hint || ""}
                      >
                        <input
                          type="checkbox"
                          checked={form.audiences.includes(r.value)}
                          disabled={readOnly}
                          onChange={() => toggleAudience(r.value)}
                        />
                        {r.label}
                      </label>
                    ))}
                  </div>

                  {form.classTargets.length > 0 &&
                  form.audiences.includes("ClassTeacher") ? (
                    <p className="nb-teacher-preview">
                      <span>Class teachers:</span>{" "}
                      {resolvedClassTeachers.length
                        ? resolvedClassTeachers.join(", ")
                        : "None assigned yet for selected sections"}
                    </p>
                  ) : null}

                  {form.classTargets.length > 0 &&
                  form.audiences.includes("SubjectTeacher") ? (
                    <p className="nb-teacher-preview">
                      <span>Subject teachers:</span>{" "}
                      {resolvedSubjectTeachers.length
                        ? resolvedSubjectTeachers.join(", ")
                        : "No timetable teachers found for selected classes"}
                    </p>
                  ) : null}
                </div>
              </div>
            ) : null}
          </Field>

          {form.classScope === "all" ? (() => {
            const coreRoles = [
              { value: "Student", label: "Student" },
              { value: "Teacher", label: "Teacher" },
              { value: "Parent", label: "Parent/Guardian" },
            ];
            const otherRolesList = [
              "Admin",
              "Accountant",
              "Librarian",
              "Receptionist",
              "Super Admin",
              "Principal",
            ];
            const selectedOtherRoles = form.audiences.filter((role) =>
              otherRolesList.includes(role)
            );
            const filteredOtherRoles = otherRolesList.filter((role) =>
              role.toLowerCase().includes(dropdownSearch.toLowerCase())
            );

            return (
              <Field label="Message To">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                  {coreRoles.map((r) => {
                    const isChecked = form.audiences.includes(r.value);
                    return (
                      <label
                        key={r.value}
                        className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-all ${
                          isChecked
                            ? "border-green-600 bg-green-50/40 text-green-900"
                            : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={readOnly}
                          className="h-4.5 w-4.5 rounded border-gray-300 text-green-600 focus:ring-green-500 accent-green-600 cursor-pointer"
                          onChange={() => toggleAudience(r.value)}
                        />
                        <span className="text-sm font-semibold select-none">{r.label}</span>
                      </label>
                    );
                  })}
                </div>

                <div className="relative" ref={dropdownRef}>
                  <label className="block text-[11px] font-medium text-gray-400 mb-1">
                    Or select additional staff/roles to send notice:
                  </label>
                  <button
                    type="button"
                    disabled={readOnly}
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex w-full items-center justify-between rounded-md border border-gray-300 bg-white p-2.5 text-left text-sm hover:border-gray-400 focus:border-green-700 focus:outline-none transition-all disabled:opacity-55"
                  >
                    <span className={selectedOtherRoles.length > 0 ? "text-gray-900 font-medium" : "text-gray-400"}>
                      {selectedOtherRoles.length > 0
                        ? `Selected: ${selectedOtherRoles.join(", ")}`
                        : "Select other roles..."}
                    </span>
                    <svg
                      className={`h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200 ${
                        dropdownOpen ? "rotate-180" : ""
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {dropdownOpen && (
                    <div className="absolute left-0 right-0 z-30 mt-1 max-h-60 overflow-hidden rounded-md border border-gray-200 bg-white shadow-xl flex flex-col">
                      <div className="border-b border-gray-100 p-2">
                        <input
                          type="text"
                          className="w-full rounded-md border border-gray-300 p-2 text-sm outline-none focus:border-green-700"
                          value={dropdownSearch}
                          onChange={(e) => setDropdownSearch(e.target.value)}
                          placeholder="Type to search roles (e.g. Principal)..."
                          autoFocus
                        />
                      </div>
                      <div className="overflow-y-auto py-1 flex-1 max-h-40">
                        {filteredOtherRoles.length === 0 ? (
                          <div className="px-3 py-2 text-sm text-gray-400">No matches found</div>
                        ) : (
                          filteredOtherRoles.map((role) => {
                            const isSelected = form.audiences.includes(role);
                            return (
                              <label
                                key={role}
                                className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-700 hover:bg-green-50/50 cursor-pointer select-none"
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleAudience(role)}
                                  className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500 accent-green-600 cursor-pointer"
                                />
                                <span className={isSelected ? "font-semibold text-green-800" : ""}>
                                  {role}
                                </span>
                              </label>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {selectedOtherRoles.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {selectedOtherRoles.map((role) => (
                      <span
                        key={role}
                        className="inline-flex items-center gap-1 rounded-md bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700 border border-green-200"
                      >
                        {role}
                        {!readOnly && (
                          <button
                            type="button"
                            onClick={() => toggleAudience(role)}
                            className="text-green-500 hover:text-green-700 font-bold ml-1"
                          >
                            ✕
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                )}
              </Field>
            );
          })() : null}

          {mode === "create" ? (
            <label className="nb-calendar-opt">
              <input
                type="checkbox"
                checked={form.addToCalendar}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    addToCalendar: e.target.checked,
                  }))
                }
              />
              <span>Publish to Academic Calendar automatically</span>
            </label>
          ) : null}

          <div className="flex justify-end gap-2 border-t border-[var(--ac-border)] pt-4">
            <button
              type="button"
              className={btnSecondary}
              onClick={() => setModalOpen(false)}
            >
              {readOnly ? "Close" : "Cancel"}
            </button>
            {!readOnly ? (
              <button type="submit" className={btnPrimary}>
                {mode === "edit" ? "Save Changes" : "Add New Message"}
              </button>
            ) : null}
          </div>
        </form>
      </Modal>

      {toast ? (
        <div className="nb-toast">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {toast}
        </div>
      ) : null}
    </div>
  );
}
