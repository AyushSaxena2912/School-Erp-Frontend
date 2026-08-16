import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ROUTINE_DAYS,
} from "../data/academic";
import { useAcademic } from "../context/AcademicContext";
import { Field, Modal, SearchSelect, inputClass, selectClass } from "../../components/ui";
import { btnPrimary, btnSecondary } from "../components/AcademicListShell";

function formatTime(timeStr) {
  if (!timeStr) return "";
  const [hRaw, m] = timeStr.split(":");
  let h = parseInt(hRaw, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  h = h ? h : 12;
  return `${String(h).padStart(2, "0")}:${m} ${ampm}`;
}

function colorForSubject(name) {
  const n = String(name || "").toLowerCase();
  if (n.includes("math")) return "math";
  if (
    n.includes("science") ||
    n.includes("physics") ||
    n.includes("chem") ||
    n.includes("bio")
  )
    return "sci";
  if (n.includes("english") || n.includes("hindi")) return "eng";
  if (n.includes("history") || n.includes("geo")) return "hist";
  if (n.includes("computer")) return "comp";
  return "math";
}

const emptyForm = {
  day: "Monday",
  subject: "",
  teacher: "",
  start: "08:00",
  end: "08:40",
  room: "",
};

export default function ClassRoutinePage() {
  const navigate = useNavigate();
  const {
    classes,
    sections,
    subjects,
    teachers,
    classrooms,
    classSubjects,
    routineSlots,
    updateRoutineSlot,
    deleteRoutineSlot,
  } = useAcademic();

  const activeClasses = useMemo(
    () => classes.filter((c) => c.status === "Active"),
    [classes]
  );
  const activeSections = useMemo(
    () => sections.filter((s) => s.status === "Active"),
    [sections]
  );

  const [filterClassId, setFilterClassId] = useState(
    () => activeClasses.find((c) => c.id === "acls-3")?.id || activeClasses[0]?.id || ""
  );
  const [filterSectionId, setFilterSectionId] = useState(
    () => activeSections[0]?.id || ""
  );
  const [viewed, setViewed] = useState({
    classId: activeClasses.find((c) => c.id === "acls-3")?.id || activeClasses[0]?.id || "",
    sectionId: activeSections[0]?.id || "",
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  const className =
    classes.find((c) => c.id === viewed.classId)?.name || "—";
  const sectionName =
    sections.find((s) => s.id === viewed.sectionId)?.name || "—";

  const subjectsForClass = useMemo(() => {
    const assignedIds = new Set(
      classSubjects
        .filter((cs) => cs.classId === viewed.classId)
        .map((cs) => cs.subjectId)
    );
    return subjects
      .filter((s) => s.status === "Active" && assignedIds.has(s.id))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [classSubjects, subjects, viewed.classId]);

  const weekDays = useMemo(() => {
    const slots = routineSlots.filter(
      (s) =>
        s.classId === viewed.classId &&
        s.sectionId === viewed.sectionId &&
        s.type !== "break"
    );
    return ROUTINE_DAYS.map((day) => {
      const lectures = slots
        .filter((s) => s.day === day)
        .sort((a, b) => a.start.localeCompare(b.start));
      return { day, lectures };
    });
  }, [routineSlots, viewed]);

  const viewRoutine = () => {
    if (!filterClassId || !filterSectionId) return;
    setViewed({ classId: filterClassId, sectionId: filterSectionId });
  };

  const openEdit = (slot) => {
    setEditing(slot);
    setForm({
      day: slot.day,
      subject: slot.subject,
      teacher: slot.teacher || "",
      start: slot.start,
      end: slot.end,
      room: slot.room || "",
    });
    setError("");
    setModalOpen(true);
  };

  const save = (e) => {
    e.preventDefault();
    if (!editing) return;
    if (!form.start || !form.end) {
      setError("Start and end time are required.");
      return;
    }
    if (form.end <= form.start) {
      setError("End time must be after start time.");
      return;
    }
    const subject = form.subject.trim();
    if (!subject) {
      setError("Subject is required.");
      return;
    }
    if (!subjectsForClass.some((s) => s.name === subject)) {
      setError("Select a subject allocated to this class.");
      return;
    }
    updateRoutineSlot({
      id: editing.id,
      classId: viewed.classId,
      sectionId: viewed.sectionId,
      day: form.day,
      type: "lecture",
      subject,
      teacher: form.teacher.trim(),
      start: form.start,
      end: form.end,
      room: form.room.trim(),
      color: colorForSubject(subject),
    });
    setModalOpen(false);
  };

  const exportCsv = () => {
    const header = [
      "Day",
      "Type",
      "Subject",
      "Teacher",
      "Start",
      "End",
      "Room",
    ];
    const lines = [];
    for (const day of weekDays) {
      for (const lec of day.lectures) {
        lines.push(
          [
            day.day,
            lec.type,
            lec.subject,
            lec.teacher,
            lec.start,
            lec.end,
            lec.room,
          ]
            .map((v) => `"${String(v).replace(/"/g, '""')}"`)
            .join(",")
        );
      }
    }
    const blob = new Blob([[header.join(","), ...lines].join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `routine-${className}-${sectionName}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const roomOptions = classrooms.map(
    (r) => `Room ${r.roomNo} · ${r.roomType}`
  );

  return (
    <div className="academic-page academic-routine">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="ac-page-title">Class Routine</h1>
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
            <span className="text-[var(--ac-green)]">Class Routine</span>
          </div>
        </div>
        <button
          type="button"
          className={btnPrimary}
          onClick={() =>
            navigate("/front-office/academic/class-routine/create")
          }
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
          Add Routine
        </button>
      </div>

      <div className="rt-filter-card">
        <div className="rt-filter-group">
          <label>Select Class</label>
          <select
            className="rt-select"
            value={filterClassId}
            onChange={(e) => setFilterClassId(e.target.value)}
          >
            {activeClasses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="rt-filter-group">
          <label>Select Section</label>
          <select
            className="rt-select"
            value={filterSectionId}
            onChange={(e) => setFilterSectionId(e.target.value)}
          >
            {activeSections.map((s) => (
              <option key={s.id} value={s.id}>
                Section {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className="rt-filter-actions">
          <button type="button" className={btnPrimary} onClick={viewRoutine}>
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
                d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"
              />
            </svg>
            View Routine
          </button>
        </div>
      </div>

      <div className="rt-container">
        <div className="rt-header">
          <div className="rt-title">
            <svg
              className="h-[18px] w-[18px] text-[var(--ac-green)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 7V3m8 4V3M3 11h18M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            Weekly Routine: {className} – Section {sectionName}
          </div>
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
        </div>

        <div className="rt-body">
          {weekDays.map(({ day, lectures }) => (
            <div key={day} className="rt-day">
              <div className="rt-day-label">
                <div className="rt-day-name">{day}</div>
                <div className="rt-day-status">
                  {lectures.length > 0
                    ? `${lectures.length} Lecture${lectures.length === 1 ? "" : "s"}`
                    : "No Classes"}
                </div>
              </div>
              <div className="rt-timeline-wrap">
                <div className="rt-timeline">
                  {lectures.length === 0 ? (
                    <div className="rt-empty-day">No slots scheduled</div>
                  ) : (
                    lectures.map((lec) => (
                      <div
                        key={lec.id}
                        className={`rt-card rt-card-${lec.color || "math"}`}
                      >
                        <div className="rt-card-actions">
                          <button
                            type="button"
                            className="rt-act-btn"
                            title="Edit"
                            onClick={() => openEdit(lec)}
                          >
                            <svg
                              className="h-3.5 w-3.5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
                              />
                            </svg>
                          </button>
                          <button
                            type="button"
                            className="rt-act-btn danger"
                            title="Delete"
                            onClick={() => {
                              if (
                                window.confirm(
                                  `Delete ${lec.subject} on ${day}?`
                                )
                              ) {
                                deleteRoutineSlot(lec.id);
                              }
                            }}
                          >
                            <svg
                              className="h-3.5 w-3.5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                        <div className="rt-card-time">
                          {formatTime(lec.start)} – {formatTime(lec.end)}
                        </div>
                        <div className="rt-card-subject">{lec.subject}</div>
                        <div className="rt-card-meta">{lec.teacher}</div>
                        <div className="rt-card-meta">{lec.room}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Modal
        open={modalOpen}
        title="Edit Slot"
        onClose={() => setModalOpen(false)}
      >
        <form onSubmit={save} className="space-y-4">
          {error ? (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}
          <p className="text-xs text-[var(--ac-muted)]">
            For {className} – Section {sectionName}
          </p>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Day" required>
              <select
                className={selectClass}
                value={form.day}
                onChange={(e) =>
                  setForm((p) => ({ ...p, day: e.target.value }))
                }
              >
                {ROUTINE_DAYS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Subject" required>
              <select
                className={selectClass}
                value={form.subject}
                onChange={(e) =>
                  setForm((p) => ({ ...p, subject: e.target.value }))
                }
              >
                <option value="">Select subject</option>
                {subjectsForClass.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
                {form.subject &&
                !subjectsForClass.some((s) => s.name === form.subject) ? (
                  <option value={form.subject}>{form.subject}</option>
                ) : null}
              </select>
              {subjectsForClass.length === 0 ? (
                <p className="mt-1.5 text-xs text-[var(--ac-muted)]">
                  No subjects allocated to this class. Assign subjects in
                  Subject Allocation first.
                </p>
              ) : null}
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Start" required>
              <input
                type="time"
                className={inputClass}
                value={form.start}
                onChange={(e) =>
                  setForm((p) => ({ ...p, start: e.target.value }))
                }
              />
            </Field>
            <Field label="End" required>
              <input
                type="time"
                className={inputClass}
                value={form.end}
                onChange={(e) =>
                  setForm((p) => ({ ...p, end: e.target.value }))
                }
              />
            </Field>
          </div>
          <Field label="Teacher">
            <SearchSelect
              value={form.teacher}
              onChange={(teacher) =>
                setForm((p) => ({ ...p, teacher }))
              }
              options={teachers.map((t) => ({
                value: t.name,
                label: t.name,
              }))}
              placeholder="Select teacher"
              emptyText="No teacher found"
            />
          </Field>
          <Field label="Room">
            <select
              className={selectClass}
              value={form.room}
              onChange={(e) =>
                setForm((p) => ({ ...p, room: e.target.value }))
              }
            >
              <option value="">Select room</option>
              {roomOptions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
              {form.room && !roomOptions.includes(form.room) ? (
                <option value={form.room}>{form.room}</option>
              ) : null}
            </select>
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              className={btnSecondary}
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className={btnPrimary}>
              Save changes
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
