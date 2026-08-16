import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ROUTINE_DAYS } from "../data/academic";
import { useAcademic } from "../context/AcademicContext";
import { Field, SearchSelect, inputClass, selectClass } from "../../components/ui";
import { btnPrimary, btnSecondary } from "../components/AcademicListShell";

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

function newRow(day) {
  return {
    key: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    day,
    subject: "",
    teacher: "",
    start: "08:00",
    end: "08:40",
    roomType: "Classroom",
    roomNo: "",
  };
}

export default function CreateRoutinePage() {
  const navigate = useNavigate();
  const {
    classes,
    sections,
    subjects,
    teachers,
    classrooms,
    classSubjects,
    setClassSectionRoutine,
  } = useAcademic();

  const activeClasses = useMemo(
    () => classes.filter((c) => c.status === "Active"),
    [classes]
  );
  const activeSections = useMemo(
    () => sections.filter((s) => s.status === "Active"),
    [sections]
  );

  const [classId, setClassId] = useState(
    () => activeClasses.find((c) => c.id === "acls-3")?.id || activeClasses[0]?.id || ""
  );
  const [sectionId, setSectionId] = useState(
    () => activeSections[0]?.id || ""
  );
  const [activeDay, setActiveDay] = useState("Monday");
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");

  const roomTypes = useMemo(() => {
    const set = new Set(classrooms.map((r) => r.roomType));
    return Array.from(set).sort();
  }, [classrooms]);

  const roomsForType = (roomType) =>
    classrooms
      .filter((r) => r.roomType === roomType)
      .sort((a, b) =>
        String(a.roomNo).localeCompare(String(b.roomNo), undefined, {
          numeric: true,
        })
      );

  const makeRow = (day) => {
    const roomType = roomTypes.includes("Classroom")
      ? "Classroom"
      : roomTypes[0] || "Classroom";
    const first = roomsForType(roomType)[0];
    return {
      ...newRow(day),
      roomType,
      roomNo: first ? String(first.roomNo) : "",
    };
  };

  useEffect(() => {
    if (rows.length === 0 && classrooms.length > 0) {
      setRows([makeRow("Monday")]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classrooms.length]);

  const subjectsForClass = useMemo(() => {
    const ids = new Set(
      classSubjects
        .filter((cs) => cs.classId === classId)
        .map((cs) => cs.subjectId)
    );
    return subjects
      .filter((s) => s.status === "Active" && ids.has(s.id))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [classSubjects, subjects, classId]);

  const dayRows = rows.filter((r) => r.day === activeDay);

  const setActiveTab = (day) => {
    setActiveDay(day);
    setRows((prev) => {
      if (prev.some((r) => r.day === day)) return prev;
      return [...prev, makeRow(day)];
    });
  };

  const updateRow = (key, patch) => {
    setRows((prev) =>
      prev.map((r) => (r.key === key ? { ...r, ...patch } : r))
    );
  };

  const addLectureRow = () => {
    setRows((prev) => [...prev, makeRow(activeDay)]);
  };

  const removeRow = (key) => {
    const visible = rows.filter((r) => r.day === activeDay);
    if (visible.length <= 1) return;
    setRows((prev) => prev.filter((r) => r.key !== key));
  };

  const onClassChange = (id) => {
    setClassId(id);
    setRows((prev) =>
      prev.map((r) => ({ ...r, subject: "" }))
    );
    setError("");
  };

  const onRoomTypeChange = (key, roomType) => {
    const first = roomsForType(roomType)[0];
    updateRow(key, {
      roomType,
      roomNo: first ? String(first.roomNo) : "",
    });
  };

  const save = () => {
    if (!classId || !sectionId) {
      setError("Please select class and section.");
      return;
    }
    const usable = rows.filter(
      (r) => r.subject.trim() && r.start && r.end
    );
    if (usable.length === 0) {
      setError("Add at least one lecture with a subject.");
      return;
    }
    for (const r of usable) {
      if (r.end <= r.start) {
        setError(`End time must be after start on ${r.day}.`);
        return;
      }
      if (!subjectsForClass.some((s) => s.name === r.subject)) {
        setError(`Subject "${r.subject}" is not allocated to this class.`);
        return;
      }
    }

    const slots = usable.map((r) => {
      const roomLabel = r.roomNo
        ? `Room ${r.roomNo} · ${r.roomType}`
        : "";
      return {
        day: r.day,
        type: "lecture",
        subject: r.subject.trim(),
        teacher: r.teacher.trim(),
        start: r.start,
        end: r.end,
        room: roomLabel,
        color: colorForSubject(r.subject),
      };
    });

    setClassSectionRoutine(classId, sectionId, slots);
    navigate("/front-office/academic/class-routine");
  };

  return (
    <div className="academic-page academic-routine-create">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="ac-page-title">Create Weekly Routine</h1>
          <div className="ac-breadcrumb flex items-center gap-1">
            <Link to="/front-office" className="hover:text-[var(--ac-green)]">
              Dashboard
            </Link>
            <span className="text-[var(--ac-hint)]">/</span>
            <span>Academic</span>
            <span className="text-[var(--ac-hint)]">/</span>
            <Link
              to="/front-office/academic/class-routine"
              className="hover:text-[var(--ac-green)]"
            >
              Class Routine
            </Link>
            <span className="text-[var(--ac-hint)]">/</span>
            <span className="text-[var(--ac-green)]">Create Routine</span>
          </div>
        </div>
        <Link
          to="/front-office/academic/class-routine"
          className={btnSecondary}
        >
          ← Back to Routine
        </Link>
      </div>

      <div className="rt-create-card">
        {error ? (
          <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <div className="rt-create-top">
          <Field label="Class" required>
            <select
              className={selectClass}
              value={classId}
              onChange={(e) => onClassChange(e.target.value)}
            >
              <option value="">Select Class</option>
              {activeClasses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Section" required>
            <select
              className={selectClass}
              value={sectionId}
              onChange={(e) => setSectionId(e.target.value)}
            >
              <option value="">Select Section</option>
              {activeSections.map((s) => (
                <option key={s.id} value={s.id}>
                  Section {s.name}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="rt-tabs">
          {ROUTINE_DAYS.map((day) => (
            <button
              key={day}
              type="button"
              className={`rt-tab ${activeDay === day ? "active" : ""}`}
              onClick={() => setActiveTab(day)}
            >
              {day}
            </button>
          ))}
        </div>

        <div className="rt-rows">
          {dayRows.map((row) => {
            const typeRooms = roomsForType(row.roomType);
            return (
              <div key={row.key} className="rt-lecture-row">
                <div className="rt-row-top">
                  <Field label="Subject" required>
                    <select
                      className={selectClass}
                      value={row.subject}
                      onChange={(e) =>
                        updateRow(row.key, { subject: e.target.value })
                      }
                    >
                      <option value="">Select subject</option>
                      {subjectsForClass.map((s) => (
                        <option key={s.id} value={s.name}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                    {subjectsForClass.length === 0 ? (
                      <p className="mt-1 text-xs text-[var(--ac-muted)]">
                        No subjects for this class — assign in Subject
                        Allocation.
                      </p>
                    ) : null}
                  </Field>
                  <Field label="Teacher">
                    <SearchSelect
                      value={row.teacher}
                      onChange={(teacher) =>
                        updateRow(row.key, { teacher })
                      }
                      options={teachers.map((t) => ({
                        value: t.name,
                        label: t.name,
                      }))}
                      placeholder="Select teacher"
                      emptyText="No teacher found"
                    />
                  </Field>
                  <div className="rt-row-remove-wrap">
                    <button
                      type="button"
                      className="rt-remove-btn"
                      title="Remove lecture"
                      disabled={dayRows.length <= 1}
                      onClick={() => removeRow(row.key)}
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
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="rt-row-bottom">
                  <Field label="Start Time">
                    <input
                      type="time"
                      className={inputClass}
                      value={row.start}
                      onChange={(e) =>
                        updateRow(row.key, { start: e.target.value })
                      }
                    />
                  </Field>
                  <Field label="End Time">
                    <input
                      type="time"
                      className={inputClass}
                      value={row.end}
                      onChange={(e) =>
                        updateRow(row.key, { end: e.target.value })
                      }
                    />
                  </Field>
                  <Field label="Room Type">
                    <select
                      className={selectClass}
                      value={row.roomType}
                      onChange={(e) =>
                        onRoomTypeChange(row.key, e.target.value)
                      }
                    >
                      {roomTypes.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Room No.">
                    <select
                      className={selectClass}
                      value={row.roomNo}
                      onChange={(e) =>
                        updateRow(row.key, { roomNo: e.target.value })
                      }
                    >
                      {typeRooms.length === 0 ? (
                        <option value="">No rooms available</option>
                      ) : (
                        typeRooms.map((r) => (
                          <option key={r.id} value={r.roomNo}>
                            {r.roomNo}
                          </option>
                        ))
                      )}
                    </select>
                  </Field>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4">
          <button
            type="button"
            className="rt-add-lecture-btn"
            onClick={addLectureRow}
          >
            + Add Another Lecture
          </button>
        </div>

        <div className="rt-create-footer">
          <Link
            to="/front-office/academic/class-routine"
            className={btnSecondary}
          >
            Cancel
          </Link>
          <button type="button" className={btnPrimary} onClick={save}>
            Save Full Routine
          </button>
        </div>
      </div>
    </div>
  );
}
