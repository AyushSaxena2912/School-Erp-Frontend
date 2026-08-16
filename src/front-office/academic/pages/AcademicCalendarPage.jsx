import React, { useMemo, useState } from "react";
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
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
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
    cells.push({
      dateStr: toLocalDateStr(date),
      day: d,
      other: true,
    });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    cells.push({
      dateStr: toLocalDateStr(date),
      day: d,
      other: false,
    });
  }
  const filled = cells.length;
  for (let d = 1; d <= total - filled; d++) {
    const date = new Date(year, month + 1, d);
    cells.push({
      dateStr: toLocalDateStr(date),
      day: d,
      other: true,
    });
  }
  return cells;
}

const emptyForm = {
  title: "",
  start: "",
  end: "",
  cat: "Exam",
  color: "blue",
  desc: "",
  multi: false,
};

export default function AcademicCalendarPage() {
  const {
    calendarByYear,
    addCalendarEvent,
    updateCalendarEvent,
    deleteCalendarEvent,
  } = useAcademic();

  const todayStr = useMemo(() => toLocalDateStr(new Date()), []);
  const [academicYear, setAcademicYear] = useState("2026-2027");
  const events = calendarByYear[academicYear] || [];

  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

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
    if (m > 11) {
      m = 0;
      y += 1;
    }
    if (m < 0) {
      m = 11;
      y -= 1;
    }
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
    const ev = events.find((x) => x.id === id);
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
    });
    setError("");
    setModalOpen(true);
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
    const payload = {
      title,
      start,
      end,
      cat: form.cat || "Other",
      color: form.color,
      desc: form.desc.trim(),
    };
    if (editingId) {
      updateCalendarEvent(academicYear, {
        id: editingId,
        ...payload,
      });
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
    const header = ["Title", "Start", "End", "Category", "Description"];
    const lines = events.map((ev) =>
      [ev.title, ev.start, ev.end, ev.cat, ev.desc || ""]
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

  return (
    <div className="academic-page academic-calendar">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="ac-page-title">Academic Calendar</h1>
          <div className="ac-breadcrumb flex items-center gap-1">
            <Link to="/front-office" className="hover:text-[var(--ac-green)]">
              Dashboard
            </Link>
            <svg
              className="mx-0.5 h-3 w-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5l7 7-7 7"
              />
            </svg>
            <span>Academic</span>
            <svg
              className="mx-0.5 h-3 w-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5l7 7-7 7"
              />
            </svg>
            <span className="text-[var(--ac-green)]">Calendar</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
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
          <button type="button" className={btnSecondary} onClick={exportCsv}>
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
          <button
            type="button"
            className={btnPrimary}
            onClick={() => openAdd()}
          >
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
            Add Event
          </button>
        </div>
      </div>

      <div className="cal-app">
        <div className="cal-main">
          <div className="cal-toolbar">
            <div className="cal-toolbar-left">
              <button type="button" className="cal-btn-today" onClick={goToday}>
                Today
              </button>
              <div className="cal-nav-group">
                <button
                  type="button"
                  className="cal-nav-btn"
                  onClick={() => changeMonth(-1)}
                  aria-label="Previous month"
                >
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
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
                <button
                  type="button"
                  className="cal-nav-btn"
                  onClick={() => changeMonth(1)}
                  aria-label="Next month"
                >
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
                      d="M9 5l7 7-7 7"
                    />
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
              <div key={d} className="cal-dow">
                {d}
              </div>
            ))}
          </div>

          <div className="cal-grid-body">
            {cells.map((cell) => {
              const dayEvents = eventsOnDate(cell.dateStr);
              const isToday = cell.dateStr === todayStr;
              return (
                <div
                  key={cell.dateStr}
                  className={`cal-day ${cell.other ? "other-month" : ""} ${
                    isToday ? "today" : ""
                  }`}
                  onClick={() => openAdd(cell.dateStr)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") openAdd(cell.dateStr);
                  }}
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
                          style={{
                            background: c.bg,
                            color: c.text,
                            borderLeftColor: c.text,
                          }}
                          onClick={(e) => openEdit(e, ev.id)}
                        >
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
                <svg
                  className="h-8 w-8 opacity-50"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 7V3m8 4V3M3 11h18M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
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
                    : `Until ${endObj.getDate()} ${MONTHS[
                        endObj.getMonth()
                      ].substring(0, 3)}`;
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
                      <span
                        className="cal-agenda-cat"
                        style={{ background: c.bg, color: c.text }}
                      >
                        {ev.cat}
                      </span>
                      <div className="cal-agenda-title">{ev.title}</div>
                      <div className="cal-agenda-time">{dateLabel}</div>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </aside>
      </div>

      <Modal
        open={modalOpen}
        title={editingId ? "Edit Event" : "Add Event"}
        onClose={() => setModalOpen(false)}
      >
        <p className="-mt-2 mb-4 text-xs text-[var(--ac-muted)]">
          Add one-day events (e.g., Unit Tests) or multi-day schedules (e.g.,
          Holidays).
        </p>
        <form onSubmit={saveEvent} className="space-y-4">
          {error ? (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-4">
            <label className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--ac-text)]">
              <input
                type="radio"
                name="evType"
                checked={!form.multi}
                onChange={() =>
                  setForm((p) => ({ ...p, multi: false, end: p.start }))
                }
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
              onChange={(e) => {
                setForm((p) => ({ ...p, title: e.target.value }));
                setError("");
              }}
              placeholder="e.g. Science Exhibition"
              autoFocus
            />
          </Field>

          <div
            className={`grid gap-4 ${form.multi ? "grid-cols-2" : "grid-cols-1"}`}
          >
            <Field label={form.multi ? "Start Date" : "Date"} required>
              <input
                type="date"
                className={inputClass}
                value={form.start}
                onChange={(e) => {
                  const start = e.target.value;
                  setForm((p) => ({
                    ...p,
                    start,
                    end: p.multi ? p.end : start,
                  }));
                }}
              />
            </Field>
            {form.multi ? (
              <Field label="End Date" required>
                <input
                  type="date"
                  className={inputClass}
                  value={form.end}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, end: e.target.value }))
                  }
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
                onChange={(e) =>
                  setForm((p) => ({ ...p, cat: e.target.value }))
                }
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
                    className={`cal-color-swatch ${
                      form.color === c.id ? "active" : ""
                    }`}
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
              onChange={(e) =>
                setForm((p) => ({ ...p, desc: e.target.value }))
              }
              placeholder="Add additional details…"
            />
          </Field>

          <div className="flex items-center justify-end gap-2 border-t border-[var(--ac-border)] pt-4">
            {editingId ? (
              <button
                type="button"
                className="cal-btn-danger mr-auto"
                onClick={deleteEvent}
              >
                Delete Event
              </button>
            ) : null}
            <button
              type="button"
              className={btnSecondary}
              onClick={() => setModalOpen(false)}
            >
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
