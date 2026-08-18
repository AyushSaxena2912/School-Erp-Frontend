import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ACADEMIC_YEARS,
  CALENDAR_COLORS,
  EVENT_CATEGORIES,
} from "../data/academic";
import { useAcademic } from "../context/AcademicContext";
import { Field, Modal, inputClass } from "../../components/ui";
import { btnPrimary, btnSecondary } from "../components/AcademicListShell";

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const MONTHS_SHORT = [
  "Jan","Feb","Mar","Apr","May","Jun",
  "Jul","Aug","Sep","Oct","Nov","Dec",
];

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function toLocalDateStr(d) {
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

function colorOf(id) {
  return CALENDAR_COLORS.find((c) => c.id === id) || CALENDAR_COLORS[0];
}

function parseYMD(str) {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function buildMonthCells(year, month) {
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevDays = new Date(year, month, 0).getDate();
  const total = Math.ceil((firstDow + daysInMonth) / 7) * 7;
  const cells = [];

  for (let i = firstDow - 1; i >= 0; i--) {
    const d = prevDays - i;
    const date = new Date(year, month - 1, d);
    cells.push({ dateStr: toLocalDateStr(date), day: d, other: true });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    cells.push({ dateStr: toLocalDateStr(date), day: d, other: false });
  }
  const filled = cells.length;
  for (let d = 1; d <= total - filled; d++) {
    const date = new Date(year, month + 1, d);
    cells.push({ dateStr: toLocalDateStr(date), day: d, other: true });
  }
  return cells;
}

/** Check if an event applies to given classId / sectionId filter */
function eventMatchesFilter(ev, filterClassId, filterSectionId) {
  // School-wide events always visible
  if (!ev.classScope || ev.classScope === "all") return true;
  if (!ev.classTargets || ev.classTargets.length === 0) return true;

  // If no class filter is set, show all events
  if (!filterClassId) return true;

  // Find the matching class target
  const match = ev.classTargets.find((t) => t.classId === filterClassId);
  if (!match) return false;

  // If no section filter, show event for any section of that class
  if (!filterSectionId) return true;

  // If sectionIds is empty or contains the filtered section
  if (!match.sectionIds || match.sectionIds.length === 0) return true;
  return match.sectionIds.includes(filterSectionId);
}

const emptyForm = {
  title: "",
  start: "",
  end: "",
  cat: "Exam",
  color: "blue",
  desc: "",
  multi: false,
  classScope: "all",
  classTargets: [], // [{classId, sectionIds:[]}]
};

const PDF_OPTIONS = [
  { key: "1m", label: "Current Month (1 Month)", months: 1 },
  { key: "3m", label: "Next 3 Months", months: 3 },
  { key: "6m", label: "Next 6 Months", months: 6 },
  { key: "1y", label: "Full Academic Year (12 Months)", months: 12 },
];

/** Generate array of {year, month} for N months starting from startYear/startMonth */
function genMonthRange(startYear, startMonth, count) {
  const result = [];
  let y = startYear;
  let m = startMonth;
  for (let i = 0; i < count; i++) {
    result.push({ year: y, month: m });
    m++;
    if (m > 11) { m = 0; y++; }
  }
  return result;
}

export default function AcademicCalendarPage() {
  const {
    calendarByYear,
    addCalendarEvent,
    updateCalendarEvent,
    deleteCalendarEvent,
    classes,
    sections,
    mappings,
  } = useAcademic();

  const todayStr = useMemo(() => toLocalDateStr(new Date()), []);
  const [academicYear, setAcademicYear] = useState("2026-2027");
  const allEvents = calendarByYear[academicYear] || [];

  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  // ── Class / Section filter ──────────────────────────────────────────────────
  const [filterClassId, setFilterClassId] = useState("");
  const [filterSectionId, setFilterSectionId] = useState("");

  const activeClasses = useMemo(
    () => (classes || []).filter((c) => c.status === "Active"),
    [classes]
  );

  /** Sections mapped to a given class (via mappings or all active sections) */
  const sectionsForClass = useCallback((classId) => {
    const fromMaps = [
      ...new Set(
        (mappings || []).filter((m) => m.classId === classId).map((m) => m.sectionId)
      ),
    ];
    const ids = fromMaps.length ? fromMaps : (sections || []).filter((s) => s.status === "Active").map((s) => s.id);
    return ids
      .map((id) => (sections || []).find((s) => s.id === id))
      .filter(Boolean)
      .filter((s) => s.status === "Active");
  }, [mappings, sections]);

  const availableSections = useMemo(() => {
    if (!filterClassId) return [];
    return sectionsForClass(filterClassId);
  }, [filterClassId, sectionsForClass]);

  // Filtered events based on class/section filter
  const events = useMemo(
    () => allEvents.filter((ev) => eventMatchesFilter(ev, filterClassId, filterSectionId)),
    [allEvents, filterClassId, filterSectionId]
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  // ── PDF download state ──────────────────────────────────────────────────────
  const [pdfOpen, setPdfOpen] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [printMonths, setPrintMonths] = useState([]);
  const pdfDropRef = useRef(null);

  useEffect(() => {
    if (!pdfOpen) return;
    const handler = (e) => {
      if (pdfDropRef.current && !pdfDropRef.current.contains(e.target)) {
        setPdfOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [pdfOpen]);

  // When printMonths is set, trigger print then clear
  useEffect(() => {
    if (!printing || printMonths.length === 0) return;
    const timer = setTimeout(() => {
      window.print();
      setPrinting(false);
      setPrintMonths([]);
    }, 300);
    return () => clearTimeout(timer);
  }, [printing, printMonths]);

  const handlePdfDownload = (opt) => {
    setPdfOpen(false);
    const months = genMonthRange(viewYear, viewMonth, opt.months);
    setPrintMonths(months);
    setPrinting(true);
  };

  // ── Calendar grid ───────────────────────────────────────────────────────────
  const cells = useMemo(
    () => buildMonthCells(viewYear, viewMonth),
    [viewYear, viewMonth]
  );

  const eventsOnDate = (dateStr) =>
    events.filter((e) => dateStr >= e.start && dateStr <= e.end);

  const upcoming = useMemo(() => {
    return [...events]
      .filter((e) => e.end >= todayStr)
      .sort((a, b) => a.start.localeCompare(b.start));
  }, [events, todayStr]);

  const changeMonth = (offset) => {
    let m = viewMonth + offset;
    let y = viewYear;
    if (m > 11) { m = 0; y += 1; }
    if (m < 0)  { m = 11; y -= 1; }
    setViewMonth(m);
    setViewYear(y);
  };

  const goToday = () => {
    const d = new Date();
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  };

  const changeAY = (ay) => {
    setAcademicYear(ay);
    const startYear = parseInt(ay.split("-")[0], 10);
    setViewYear(startYear);
    setViewMonth(3); // April
  };

  // ── Event modal helpers ─────────────────────────────────────────────────────
  const openAdd = (dateStr = "") => {
    setEditingId(null);
    setForm({
      ...emptyForm,
      start: dateStr || todayStr,
      end: dateStr || todayStr,
    });
    setError("");
    setModalOpen(true);
  };

  const openEdit = (e, id) => {
    e.stopPropagation();
    const ev = allEvents.find((x) => x.id === id);
    if (!ev) return;
    setEditingId(id);
    setForm({
      title: ev.title,
      start: ev.start,
      end: ev.end,
      cat: ev.cat,
      color: ev.color,
      desc: ev.desc || "",
      multi: ev.start !== ev.end,
      classScope: ev.classScope || "all",
      classTargets: ev.classTargets || [],
    });
    setError("");
    setModalOpen(true);
  };

  const isClassSelected = (classId) =>
    form.classTargets.some((t) => t.classId === classId);

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

  const saveEvent = (e) => {
    e.preventDefault();
    const title = form.title.trim();
    const start = form.start;
    const end = form.multi ? form.end : form.start;
    if (!title || !start || !end) {
      setError("Please fill all required fields.");
      return;
    }
    if (end < start) {
      setError("End date cannot be before start date.");
      return;
    }
    if (form.classScope === "specific" && form.classTargets.length === 0) {
      setError("Select at least one class or switch to 'For All'.");
      return;
    }
    const payload = {
      title,
      start,
      end,
      cat: form.cat || "Other",
      color: form.color,
      desc: form.desc.trim(),
      classScope: form.classScope,
      classTargets: form.classScope === "specific" ? form.classTargets : [],
    };
    if (editingId) {
      updateCalendarEvent(academicYear, { id: editingId, ...payload });
    } else {
      addCalendarEvent(academicYear, payload);
    }
    setModalOpen(false);
  };

  const deleteEvent = () => {
    if (!editingId) return;
    if (!window.confirm("Delete this event?")) return;
    deleteCalendarEvent(academicYear, editingId);
    setModalOpen(false);
  };

  const exportCsv = () => {
    const header = ["Title", "Start", "End", "Category", "Description", "Scope"];
    const lines = events.map((ev) =>
      [ev.title, ev.start, ev.end, ev.cat, ev.desc || "", ev.classScope || "all"]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    );
    const blob = new Blob([[header.join(","), ...lines].join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `academic-calendar-${academicYear}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const chipClasses = (ev, dateStr) => {
    const dow = parseYMD(dateStr).getDay();
    let cls = "cal-event-chip";
    if (ev.start < dateStr && dow !== 0) cls += " span-left";
    if (ev.end > dateStr && dow !== 6) cls += " span-right";
    return cls;
  };

  // ── Render helper: a single month calendar grid (for print layout too) ──────
  const renderMonthGrid = (year, month, evList, isCurrentMonth = false) => {
    const cells2 = buildMonthCells(year, month);
    const evOnDate2 = (dateStr) =>
      evList.filter((e) => dateStr >= e.start && dateStr <= e.end);

    return (
      <div className="print-month-block">
        <div className="print-month-title">
          {MONTHS[month]} {year}
        </div>
        <div className="print-grid-header">
          {DOW.map((d) => (
            <div key={d} className="print-dow">{d}</div>
          ))}
        </div>
        <div className="print-grid-body">
          {cells2.map((cell) => {
            const dayEvents = evOnDate2(cell.dateStr);
            const isToday = cell.dateStr === todayStr;
            return (
              <div
                key={cell.dateStr}
                className={`print-day ${cell.other ? "other-month" : ""} ${isToday ? "today" : ""}`}
              >
                <div className="print-day-num">{cell.day}</div>
                <div className="print-event-stack">
                  {dayEvents.slice(0, 3).map((ev) => {
                    const c = colorOf(ev.color);
                    return (
                      <div
                        key={ev.id}
                        className="print-event-chip"
                        style={{ background: c.bg, color: c.text, borderLeft: `3px solid ${c.text}` }}
                      >
                        {ev.title}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Label for class/section filter display
  const filterLabel = useMemo(() => {
    if (!filterClassId) return "All Classes";
    const cls = activeClasses.find((c) => c.id === filterClassId);
    if (!filterSectionId) return cls?.name || filterClassId;
    const sec = (sections || []).find((s) => s.id === filterSectionId);
    return `${cls?.name || filterClassId} – Sec ${sec?.name || filterSectionId}`;
  }, [filterClassId, filterSectionId, activeClasses, sections]);

  return (
    <div className="academic-page academic-calendar">
      {/* ── Print-only layout ─────────────────────────────────────────────── */}
      {printing && printMonths.length > 0 && (
        <div className="print-calendar-container">
          <div className="print-header">
            <div className="print-school-name">Academic Calendar</div>
            <div className="print-meta">
              {academicYear.replace("-", " / ")} &nbsp;·&nbsp; {filterLabel}
            </div>
          </div>
          {printMonths.map(({ year, month }) =>
            renderMonthGrid(year, month, allEvents.filter((ev) => eventMatchesFilter(ev, filterClassId, filterSectionId)))
          )}
        </div>
      )}

      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="ac-page-title">Academic Calendar</h1>
          <div className="ac-breadcrumb flex items-center gap-1">
            <Link to="/front-office" className="hover:text-[var(--ac-green)]">
              Dashboard
            </Link>
            <svg className="mx-0.5 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            <span>Academic</span>
            <svg className="mx-0.5 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-[var(--ac-green)]">Calendar</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Academic Year */}
          <select
            className="cal-ay-select"
            value={academicYear}
            onChange={(e) => changeAY(e.target.value)}
          >
            {ACADEMIC_YEARS.map((ay) => (
              <option key={ay} value={ay}>
                Academic Year : {ay.replace("-", " / ")}
              </option>
            ))}
          </select>

          {/* CSV Export */}
          <button type="button" className={btnSecondary} onClick={exportCsv}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
            </svg>
            Export CSV
          </button>

          {/* PDF Download dropdown */}
          <div className="cal-pdf-wrap" ref={pdfDropRef}>
            <button
              type="button"
              className="cal-pdf-btn"
              onClick={() => setPdfOpen((v) => !v)}
              aria-haspopup="true"
              aria-expanded={pdfOpen}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v6h6" />
              </svg>
              Download PDF
              <svg className={`h-3.5 w-3.5 transition-transform ${pdfOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {pdfOpen && (
              <div className="cal-pdf-dropdown">
                {PDF_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    className="cal-pdf-option"
                    onClick={() => handlePdfDownload(opt)}
                  >
                    {opt.label}
                  </button>
                ))}
                <div className="cal-pdf-note">
                  Opens browser print dialog → Save as PDF
                </div>
              </div>
            )}
          </div>

          {/* Add Event */}
          <button type="button" className={btnPrimary} onClick={() => openAdd()}>
            <svg className="h-[15px] w-[15px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
            </svg>
            Add Event
          </button>
        </div>
      </div>

      {/* ── Class / Section Filter bar ─────────────────────────────────────── */}
      <div className="cal-filter-bar">
        <div className="cal-filter-group">
          <label className="cal-filter-label">Class</label>
          <select
            className="ac-select"
            value={filterClassId}
            onChange={(e) => {
              setFilterClassId(e.target.value);
              setFilterSectionId("");
            }}
          >
            <option value="">All Classes</option>
            {activeClasses.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {filterClassId && availableSections.length > 0 && (
          <div className="cal-filter-group">
            <label className="cal-filter-label">Section</label>
            <select
              className="ac-select"
              value={filterSectionId}
              onChange={(e) => setFilterSectionId(e.target.value)}
            >
              <option value="">All Sections</option>
              {availableSections.map((s) => (
                <option key={s.id} value={s.id}>Section {s.name}</option>
              ))}
            </select>
          </div>
        )}

        {filterClassId && (
          <div className="cal-filter-badge">
            Viewing: <strong>{filterLabel}</strong>
            <button
              type="button"
              className="cal-filter-clear"
              onClick={() => { setFilterClassId(""); setFilterSectionId(""); }}
              aria-label="Clear filter"
            >
              ✕
            </button>
          </div>
        )}

        <div className="cal-filter-info">
          {events.length} event{events.length !== 1 ? "s" : ""}
          {filterClassId ? " for this filter" : " total"}
        </div>
      </div>

      {/* ── Main calendar app ─────────────────────────────────────────────── */}
      <div className="cal-app">
        <div className="cal-main">
          <div className="cal-toolbar">
            <div className="cal-toolbar-left">
              <button type="button" className="cal-btn-today" onClick={goToday}>
                Today
              </button>
              <div className="cal-nav-group">
                <button type="button" className="cal-nav-btn" onClick={() => changeMonth(-1)} aria-label="Previous month">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button type="button" className="cal-nav-btn" onClick={() => changeMonth(1)} aria-label="Next month">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              <div className="cal-title">
                {MONTHS[viewMonth]} {viewYear}
              </div>
            </div>
          </div>

          <div className="cal-grid-header">
            {DOW.map((d) => (
              <div key={d} className="cal-dow">{d}</div>
            ))}
          </div>

          <div className="cal-grid-body">
            {cells.map((cell) => {
              const dayEvents = eventsOnDate(cell.dateStr);
              const isToday = cell.dateStr === todayStr;
              return (
                <div
                  key={cell.dateStr}
                  className={`cal-day ${cell.other ? "other-month" : ""} ${isToday ? "today" : ""}`}
                  onClick={() => openAdd(cell.dateStr)}
                  onKeyDown={(e) => { if (e.key === "Enter") openAdd(cell.dateStr); }}
                  role="button"
                  tabIndex={0}
                >
                  <div className="cal-day-num">{cell.day}</div>
                  <div className="cal-event-stack">
                    {dayEvents.map((ev) => {
                      const c = colorOf(ev.color);
                      return (
                        <button
                          key={ev.id}
                          type="button"
                          className={chipClasses(ev, cell.dateStr)}
                          style={{ background: c.bg, color: c.text, borderLeftColor: c.text }}
                          onClick={(e) => openEdit(e, ev.id)}
                        >
                          {ev.classScope === "specific" && (
                            <span className="cal-chip-scope-dot" title="Class-specific event">●</span>
                          )}
                          {ev.title}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Agenda sidebar ──────────────────────────────────────────────── */}
        <aside className="cal-agenda">
          <div className="cal-agenda-header">
            <div className="flex items-center gap-2">
              Upcoming Events
              <span className="cal-agenda-count">{upcoming.length}</span>
            </div>
          </div>
          <div className="cal-agenda-list">
            {upcoming.length === 0 ? (
              <div className="cal-empty-agenda">
                <svg className="h-8 w-8 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3M3 11h18M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <div>No upcoming events</div>
              </div>
            ) : (
              upcoming.map((ev) => {
                const startObj = parseYMD(ev.start);
                const endObj = parseYMD(ev.end);
                const c = colorOf(ev.color);
                const dateLabel =
                  ev.start === ev.end
                    ? "One-day event"
                    : `Until ${endObj.getDate()} ${MONTHS[endObj.getMonth()].substring(0, 3)}`;
                // Compute scope label
                let scopeLabel = "";
                if (ev.classScope === "specific" && ev.classTargets?.length) {
                  const names = ev.classTargets.map((t) => {
                    const cls = (classes || []).find((c) => c.id === t.classId);
                    return cls?.name || t.classId;
                  });
                  scopeLabel = names.join(", ");
                }
                return (
                  <div key={ev.id} className="cal-agenda-item">
                    <div className="cal-agenda-date">
                      <div className="cal-agenda-mon">
                        {MONTHS[startObj.getMonth()].substring(0, 3)}
                      </div>
                      <div className="cal-agenda-num">{startObj.getDate()}</div>
                    </div>
                    <button
                      type="button"
                      className="cal-agenda-card"
                      style={{ borderLeft: `4px solid ${c.text}` }}
                      onClick={(e) => openEdit(e, ev.id)}
                    >
                      <span className="cal-agenda-cat" style={{ background: c.bg, color: c.text }}>
                        {ev.cat}
                      </span>
                      <div className="cal-agenda-title">{ev.title}</div>
                      <div className="cal-agenda-time">{dateLabel}</div>
                      {scopeLabel && (
                        <div className="cal-agenda-scope">
                          Target: {scopeLabel}
                        </div>
                      )}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </aside>
      </div>

      {/* ── Add/Edit Event Modal ──────────────────────────────────────────── */}
      <Modal
        open={modalOpen}
        title={editingId ? "Edit Event" : "Add Event"}
        onClose={() => setModalOpen(false)}
      >
        <p className="-mt-2 mb-4 text-xs text-[var(--ac-muted)]">
          Add one-day events (e.g., Unit Tests) or multi-day schedules (e.g., Holidays). Choose whether the event applies to all classes or specific ones.
        </p>
        <form onSubmit={saveEvent} className="space-y-4">
          {error ? (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          ) : null}

          {/* One-day / Multi-day toggle */}
          <div className="flex flex-wrap gap-4">
            <label className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--ac-text)]">
              <input
                type="radio"
                name="evType"
                checked={!form.multi}
                onChange={() => setForm((p) => ({ ...p, multi: false, end: p.start }))}
                className="accent-[var(--ac-green)]"
              />
              One-Day Event
            </label>
            <label className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--ac-text)]">
              <input
                type="radio"
                name="evType"
                checked={form.multi}
                onChange={() => setForm((p) => ({ ...p, multi: true }))}
                className="accent-[var(--ac-green)]"
              />
              Multiple Days
            </label>
          </div>

          <Field label="Event Title" required>
            <input
              className={inputClass}
              value={form.title}
              onChange={(e) => { setForm((p) => ({ ...p, title: e.target.value })); setError(""); }}
              placeholder="e.g. Science Exhibition"
              autoFocus
            />
          </Field>

          <div className={`grid gap-4 ${form.multi ? "grid-cols-2" : "grid-cols-1"}`}>
            <Field label={form.multi ? "Start Date" : "Date"} required>
              <input
                type="date"
                className={inputClass}
                value={form.start}
                onChange={(e) => {
                  const start = e.target.value;
                  setForm((p) => ({ ...p, start, end: p.multi ? p.end : start }));
                }}
              />
            </Field>
            {form.multi ? (
              <Field label="End Date" required>
                <input
                  type="date"
                  className={inputClass}
                  value={form.end}
                  onChange={(e) => setForm((p) => ({ ...p, end: e.target.value }))}
                />
              </Field>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Category">
              <input
                className={inputClass}
                list="cal-cat-list"
                value={form.cat}
                onChange={(e) => setForm((p) => ({ ...p, cat: e.target.value }))}
                placeholder="Select or type…"
              />
              <datalist id="cal-cat-list">
                {EVENT_CATEGORIES.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </Field>
            <Field label="Color">
              <div className="cal-color-picker">
                {CALENDAR_COLORS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className={`cal-color-swatch ${form.color === c.id ? "active" : ""}`}
                    style={{ backgroundColor: c.border }}
                    onClick={() => setForm((p) => ({ ...p, color: c.id }))}
                    aria-label={c.id}
                  />
                ))}
              </div>
            </Field>
          </div>

          <Field label="Description (Optional)">
            <textarea
              className={inputClass}
              rows={3}
              value={form.desc}
              onChange={(e) => setForm((p) => ({ ...p, desc: e.target.value }))}
              placeholder="Add additional details…"
            />
          </Field>

          {/* ── Target Scope ────────────────────────────────────────────── */}
          <div className="cal-scope-section">
            <div className="cal-scope-label">Apply Event To</div>
            <div className="cal-scope-options">
              <label className={`cal-scope-opt ${form.classScope === "all" ? "active" : ""}`}>
                <input
                  type="radio"
                  name="calScope"
                  checked={form.classScope === "all"}
                  onChange={() => setForm((p) => ({ ...p, classScope: "all", classTargets: [] }))}
                  className="accent-[var(--ac-green)]"
                />
                <div>
                  <div className="cal-scope-opt-title">
                    For All Classes &amp; Sections
                  </div>
                  <div className="cal-scope-opt-desc">Event appears for the entire school</div>
                </div>
              </label>
              <label className={`cal-scope-opt ${form.classScope === "specific" ? "active" : ""}`}>
                <input
                  type="radio"
                  name="calScope"
                  checked={form.classScope === "specific"}
                  onChange={() => setForm((p) => ({ ...p, classScope: "specific" }))}
                  className="accent-[var(--ac-green)]"
                />
                <div>
                  <div className="cal-scope-opt-title">
                    Specific Classes &amp; Sections
                  </div>
                  <div className="cal-scope-opt-desc">Select which classes / sections see this event</div>
                </div>
              </label>
            </div>

            {form.classScope === "specific" && (
              <div className="cal-target-panel">
                <div className="cal-target-label">Select Classes</div>
                <div className="cal-chip-grid">
                  {activeClasses.map((c) => (
                    <label
                      key={c.id}
                      className={`cal-chip ${isClassSelected(c.id) ? "cal-chip-on" : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={isClassSelected(c.id)}
                        onChange={() => toggleClass(c.id)}
                      />
                      {c.name}
                    </label>
                  ))}
                </div>

                {form.classTargets.length === 0 ? (
                  <p className="mt-2 text-[12px] text-[var(--ac-muted)]">
                    Pick at least one class. Then choose sections under it (or leave as all sections).
                  </p>
                ) : (
                  form.classTargets.map((t) => {
                    const cls = (classes || []).find((c) => c.id === t.classId);
                    const secs = sectionsForClass(t.classId);
                    return (
                      <div key={t.classId} className="cal-class-block">
                        <div className="cal-class-block-head">
                          <span>{cls?.name || t.classId}</span>
                          <button
                            type="button"
                            className="cal-link-btn"
                            onClick={() => selectAllSectionsForClass(t.classId)}
                          >
                            All sections
                          </button>
                        </div>
                        <div className="cal-chip-grid">
                          {secs.map((s) => {
                            // Start unselected; sectionIds=[] means "all sections" at save time
                            const isAll = !t.sectionIds.length;
                            const checked = !isAll && t.sectionIds.includes(s.id);
                            return (
                              <label
                                key={s.id}
                                className={`cal-chip ${checked ? "cal-chip-on" : ""}`}
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => {
                                    const allIds = secs.map((x) => x.id);
                                    setForm((prev) => ({
                                      ...prev,
                                      classTargets: prev.classTargets.map((x) => {
                                        if (x.classId !== t.classId) return x;
                                        // When empty (all), start fresh and add this one
                                        const current = [...x.sectionIds];
                                        const next = current.includes(s.id)
                                          ? current.filter((id) => id !== s.id)
                                          : [...current, s.id];
                                        // If all sections manually selected, store as [] (= all)
                                        if (next.length === allIds.length) {
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
                        <p className="cal-sec-status">
                          {!t.sectionIds.length
                            ? "Applies to all sections of this class"
                            : `Applies to Sec ${t.sectionIds.map((id) => (sections || []).find((sx) => sx.id === id)?.name || id).join(", ")}`}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-[var(--ac-border)] pt-4">
            {editingId ? (
              <button type="button" className="cal-btn-danger mr-auto" onClick={deleteEvent}>
                Delete Event
              </button>
            ) : null}
            <button type="button" className={btnSecondary} onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className={btnPrimary}>
              Save Event
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
