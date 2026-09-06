import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  useComplaint,
  useRegisterComplaint,
  useStudents,
  useUpdateComplaint,
} from "@/lib/api/queries";
import { fromComplaintView, toStudentOption } from "@/lib/api/adapters";
import { COMPLAINT_NATURES, COMPLAINT_RELATIONS, complaintSourceLabel, formatStudentLabel } from "../data/seed";
import {
  Field,
  btnPrimary,
  btnSecondary,
  inputClass,
  selectClass,
} from "../components/ui";

const emptyForm = () => ({
  complainantName: "",
  contact: "",
  relation: "Father",
  studentId: "",
  studentName: "",
  className: "",
  section: "",
  scholarNumber: "",
  nature: COMPLAINT_NATURES[0],
  natureOther: "",
  description: "",
  mode: "Offline",
});

const MAX_DESC_WORDS = 150;

function countWords(text) {
  return String(text || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function formFromComplaint(c) {
  return {
    complainantName: c.complainantName || "",
    contact: c.contact || "",
    relation: c.relation || "Father",
    studentId: c.studentId || "",
    studentName: c.studentName || "",
    className: c.className || "",
    section: c.section || "",
    scholarNumber: c.scholarNumber || "",
    nature: c.nature || COMPLAINT_NATURES[0],
    natureOther: c.natureOther || "",
    description: c.description || "",
    mode: c.mode || "Offline",
  };
}

/**
 * Fetches the complaint, then hands it to the form.
 *
 * The split matters: the form seeds its state from `editing` with lazy
 * `useState` initialisers, which run once at mount. If the form owned the
 * query it would mount before the data arrived and stay blank forever.
 */
export default function ComplaintFormPage() {
  const { id } = useParams();
  const { data: editing, isLoading } = useComplaint(id);

  if (id && isLoading) {
    return <div className="p-6 text-sm text-gray-500">Loading complaint…</div>;
  }

  if (id && !editing) {
    return (
      <div className="rounded-lg bg-white p-8 shadow-sm">
        <h2 className="mb-2 text-xl font-bold text-gray-900">
          Complaint not found
        </h2>
        <Link
          to="/front-office/complaints"
          className="text-sm font-medium text-green-700 hover:underline"
        >
          Back to complaints
        </Link>
      </div>
    );
  }

  return <ComplaintFormBody key={id ?? "new"} id={id} editing={editing} />;
}

function ComplaintFormBody({ id, editing }) {
  const navigate = useNavigate();
  const register = useRegisterComplaint();
  const update = useUpdateComplaint();
  const { data: studentRecords } = useStudents();
  const students = useMemo(
    () => (studentRecords ?? []).map(toStudentOption),
    [studentRecords],
  );
  const isEdit = Boolean(id);

  const [form, setForm] = useState(() =>
    editing ? formFromComplaint(editing) : emptyForm()
  );
  const [studentQuery, setStudentQuery] = useState(() =>
    editing?.studentId
      ? `${editing.studentName || ""} (${editing.scholarNumber || ""})`.trim()
      : ""
  );
  const [errors, setErrors] = useState({});

  const set = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  // Opened by focus, not only by typing — an empty box should still show what
  // is available (or that nothing is).
  const [studentOpen, setStudentOpen] = useState(false);

  const studentMatches = useMemo(() => {
    if (form.studentId) return [];
    const q = studentQuery.trim().toLowerCase();
    if (!q) return students.slice(0, 6);
    return students
      .filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.scholarNumber.toLowerCase().includes(q)
      )
      .slice(0, 6);
  }, [studentQuery, students, form.studentId]);

  const clearStudent = () => {
    setStudentQuery("");
    setForm((prev) => ({
      ...prev,
      studentId: "",
      studentName: "",
      className: "",
      section: "",
      scholarNumber: "",
    }));
  };

  const selectStudent = (s) => {
    setStudentQuery(`${s.name} (${s.scholarNumber})`);
    setForm((prev) => ({
      ...prev,
      studentId: s.id,
      studentName: s.name,
      className: s.className,
      section: s.section || "",
      scholarNumber: s.scholarNumber,
    }));
  };

  const descriptionWords = countWords(form.description);

  const setDescription = (value) => {
    const words = value.trim().split(/\s+/).filter(Boolean);
    if (words.length <= MAX_DESC_WORDS) {
      set("description", value);
      return;
    }
    const trimmed = words.slice(0, MAX_DESC_WORDS).join(" ");
    set("description", value.endsWith(" ") ? `${trimmed} ` : trimmed);
  };

  const submit = async (e) => {
    e.preventDefault();

    let currentStudentId = form.studentId;
    let currentStudent = null;

    if (!currentStudentId && studentQuery.trim()) {
      const q = studentQuery.trim().toLowerCase();
      const match = students.find(
        (s) =>
          s.name.toLowerCase() === q ||
          s.scholarNumber?.toLowerCase() === q
      );
      if (match) {
        currentStudentId = match.id;
        currentStudent = match;
        setForm((prev) => ({
          ...prev,
          studentId: match.id,
          studentName: match.name,
          className: match.className,
          section: match.section || "",
          scholarNumber: match.scholarNumber,
        }));
      }
    }

    const next = {};
    if (!form.complainantName.trim()) next.complainantName = "Required";
    if (!form.relation) next.relation = "Required";
    if (!/^\d{10}$/.test(String(form.contact || "").trim())) {
      next.contact = "Enter a valid 10-digit number";
    }
    // The student is optional, matching `Complaint Register.student` (a Link to
    // Student with reqd=0). The complainant is who the record is really about;
    // the desk also takes complaints from parents of applicants, vendors and
    // neighbours, none of whom are enrolled students.
    //
    // If a name was typed but matched nothing, say so rather than silently
    // dropping it — otherwise the complaint is filed against no one.
    if (!currentStudentId && studentQuery.trim()) {
      next.student = "No student matched. Clear the box to file without one.";
    }
    if (!form.description.trim()) next.description = "Required";
    else if (countWords(form.description) > MAX_DESC_WORDS) {
      next.description = `Max ${MAX_DESC_WORDS} words`;
    }
    if (form.nature === "Others" && !form.natureOther.trim()) {
      next.natureOther = "Required";
    }
    setErrors(next);
    if (Object.keys(next).length) return;

    const payload = {
      ...form,
      // Send the source the form is showing. Without it the DocType default
      // ("Offline · Parent / Guardian") is stored, so a complaint displayed as
      // "Offline · Student" was silently saved as something else.
      source: complaintSourceLabel({ mode: form.mode || "Offline", relation: form.relation }),
      ...(currentStudent
        ? {
            studentId: currentStudent.id,
            studentName: currentStudent.name,
            className: currentStudent.className,
            section: currentStudent.section || "",
            scholarNumber: currentStudent.scholarNumber,
          }
        : {}),
    };

    // `recorded_by` is stamped server-side from the session; the client does not
    // get to claim who filed a complaint.
    const body = fromComplaintView(payload);

    // A save can genuinely fail now (validation, permissions). Without this the
    // form would sit there looking inert, with the reason only in the console.
    try {
      if (isEdit) {
        await update.mutateAsync({ name: editing.name, payload: body });
        navigate(`/front-office/complaints?open=${editing.name}`, { replace: true });
        return;
      }

      const created = await register.mutateAsync(body);
      navigate(`/front-office/complaints?open=${created.name}`, { replace: true });
    } catch (err) {
      setErrors({
        submit: err?.message || "Could not save the complaint. Please try again.",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate("/front-office/complaints")}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 shadow-xs hover:bg-gray-50 hover:border-gray-300 hover:text-green-700 transition-all cursor-pointer"
          title="Back"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">
            {isEdit ? "Edit Complaint" : "Register Offline Complaint"}
          </h2>
          <p className="text-xs text-gray-500">
            Walk-in desk entry — capture the complaint from the visitor and submit
            it to the register.
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-5 sm:p-6 lg:p-7">
        <form className="space-y-5" onSubmit={submit}>
          {errors.submit ? (
            <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {errors.submit}
            </p>
          ) : null}

          <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
            Source:{" "}
            <span className="font-medium text-gray-900">
              {complaintSourceLabel({
                mode: "Offline",
                relation: form.relation,
              })}
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <Field
              label="Complainant Name"
              required
              error={errors.complainantName}
            >
              <input
                className={inputClass}
                value={form.complainantName}
                onChange={(e) => set("complainantName", e.target.value)}
                placeholder="e.g. Pooja Patel"
              />
            </Field>

            <Field label="Relation to student" required error={errors.relation}>
              <select
                className={selectClass}
                value={form.relation}
                onChange={(e) => set("relation", e.target.value)}
              >
                {COMPLAINT_RELATIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Mobile Number" required error={errors.contact}>
              <input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                className={inputClass}
                value={form.contact}
                onChange={(e) =>
                  set("contact", e.target.value.replace(/[^0-9]/g, "").slice(0, 10))
                }
                onKeyDown={(e) => {
                  if (e.key.length === 1 && !/[0-9]/.test(e.key) && !e.ctrlKey && !e.metaKey) {
                    e.preventDefault();
                  }
                }}
                placeholder="10-digit mobile"
              />
            </Field>

            <Field label="Student" error={errors.student}>
              {form.studentId ? (
                <div className="flex items-center justify-between rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
                  <span>{formatStudentLabel(form)}</span>
                  <button
                    type="button"
                    className="text-sm font-medium text-red-600 hover:underline"
                    onClick={clearStudent}
                  >
                    Change
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <input
                    className={inputClass}
                    value={studentQuery}
                    onChange={(e) => setStudentQuery(e.target.value)}
                    onFocus={() => setStudentOpen(true)}
                    onBlur={() => setStudentOpen(false)}
                    placeholder="Search name or scholar number (optional)"
                  />
                  {!studentOpen ? null : studentMatches.length > 0 ? (
                    <ul
                      // Keep focus on the input: a blur here would unmount the
                      // list before the click landed, so options selected only
                      // when mouseup beat the close.
                      onMouseDown={(e) => e.preventDefault()}
                      className="absolute left-0 right-0 top-full z-30 mt-1 max-h-56 overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg"
                    >
                      {studentMatches.map((s) => (
                        <li key={s.id}>
                          <button
                            type="button"
                            className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                            onClick={() => selectStudent(s)}
                          >
                            {formatStudentLabel(s)}
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <ul className="absolute left-0 right-0 top-full z-30 mt-1 max-h-56 overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg">
                      <li className="px-3 py-2 text-sm text-gray-500">
                        No students
                      </li>
                    </ul>
                  )}
                </div>
              )}
            </Field>

            <Field label="Nature of Complaint">
              <select
                className={selectClass}
                value={form.nature}
                onChange={(e) => set("nature", e.target.value)}
              >
                {COMPLAINT_NATURES.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </Field>

            {form.nature === "Others" ? (
              <Field
                label="Specify Nature"
                required
                error={errors.natureOther}
              >
                <input
                  className={inputClass}
                  value={form.natureOther}
                  onChange={(e) => set("natureOther", e.target.value)}
                  placeholder="Write the complaint category"
                />
              </Field>
            ) : null}
          </div>

          <Field label="Brief Discussion" required error={errors.description}>
            <textarea
              className={inputClass}
              rows={4}
              value={form.description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. School bus arriving 20 minutes late every day this week."
            />
            <p
              className={`mt-1 text-xs ${
                descriptionWords >= MAX_DESC_WORDS
                  ? "text-red-600"
                  : "text-gray-500"
              }`}
            >
              {descriptionWords} / {MAX_DESC_WORDS} words
            </p>
          </Field>

          <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
            <button
              type="button"
              className={btnSecondary}
              onClick={() => navigate("/front-office/complaints")}
            >
              Cancel
            </button>
            <button type="submit" className={btnPrimary}>
              {isEdit ? "Update" : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
