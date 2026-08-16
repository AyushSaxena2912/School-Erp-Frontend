import React, { useMemo, useState } from "react";
import { useFrontOffice } from "../context/FrontOfficeContext";
import { joinNameParts, splitFullName, GUARDIAN_RELATIONS, ACTIVE_LEAD_TYPES, LEAD_TYPE_HINTS } from "../data/seed";
import { Field, btnPrimary, btnSecondary, inputClass, selectClass } from "./ui";

function emptyName() {
  return { first: "", middle: "", last: "" };
}

function partsFrom(initial, firstKey, middleKey, lastKey, fullKey) {
  if (initial?.[firstKey] || initial?.[lastKey]) {
    return {
      first: initial[firstKey] || "",
      middle: initial[middleKey] || "",
      last: initial[lastKey] || "",
    };
  }
  if (initial?.[fullKey]) return splitFullName(initial[fullKey]);
  return emptyName();
}

/**
 * Step 1 — Front Office basic inquiry only:
 * student name, class, parent name, parent mobile or email.
 */
export default function EnquiryForm({ initial, onSave, onCancel }) {
  const { classes } = useFrontOffice();
  const [student, setStudent] = useState(() =>
    partsFrom(
      initial,
      "studentFirstName",
      "studentMiddleName",
      "studentLastName",
      "studentName"
    )
  );
  const [parent, setParent] = useState(() =>
    partsFrom(
      initial,
      "guardianFirstName",
      "guardianMiddleName",
      "guardianLastName",
      "parentName"
    )
  );
  const [classId, setClassId] = useState(initial?.classId || "");
  const [studentMobile, setStudentMobile] = useState(
    initial?.studentMobile || ""
  );
  const [guardianRelation, setGuardianRelation] = useState(
    initial?.guardianRelation || ""
  );
  const [parentMobile, setParentMobile] = useState(
    initial?.parentMobile || initial?.contact || ""
  );
  const [parentEmail, setParentEmail] = useState(initial?.parentEmail || "");
  const [leadType, setLeadType] = useState(
    initial?.leadType && ACTIVE_LEAD_TYPES.includes(initial.leadType)
      ? initial.leadType
      : "Warm Lead"
  );
  const [errors, setErrors] = useState({});

  const classOptions = useMemo(
    () => (classes || []).filter((c) => c.id),
    [classes]
  );

  const setStudentPart = (k, v) => setStudent((p) => ({ ...p, [k]: v }));
  const setParentPart = (k, v) => setParent((p) => ({ ...p, [k]: v }));

  const submit = (e) => {
    e.preventDefault();
    const next = {};
    if (!student.first.trim()) next.studentFirstName = "Required";
    if (!student.last.trim()) next.studentLastName = "Required";
    if (!parent.first.trim()) next.parentFirstName = "Required";
    if (!parent.last.trim()) next.parentLastName = "Required";
    if (!guardianRelation) next.guardianRelation = "Required";
    if (!classId) next.classId = "Required";
    if (!leadType) next.leadType = "Required";

    const studentPhone = studentMobile.replace(/\D/g, "");
    if (studentPhone && studentPhone.length !== 10) {
      next.studentMobile = "Enter a valid 10-digit mobile";
    }

    const mobile = parentMobile.replace(/\D/g, "");
    const email = parentEmail.trim();
    if (!mobile && !email) {
      next.parentContact = "Enter parent mobile or email";
    } else {
      if (mobile && mobile.length !== 10) {
        next.parentMobile = "Enter a valid 10-digit mobile";
      }
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        next.parentEmail = "Enter a valid email";
      }
    }

    setErrors(next);
    if (Object.keys(next).length) return;

    const studentName = joinNameParts(
      student.first,
      student.middle,
      student.last
    );
    const parentName = joinNameParts(parent.first, parent.middle, parent.last);

    onSave({
      studentFirstName: student.first.trim(),
      studentMiddleName: student.middle.trim(),
      studentLastName: student.last.trim(),
      studentName,
      studentMobile: studentPhone,
      guardianFirstName: parent.first.trim(),
      guardianMiddleName: parent.middle.trim(),
      guardianLastName: parent.last.trim(),
      guardianRelation,
      parentName,
      parentMobile: mobile,
      parentEmail: email,
      contact: mobile || email,
      classId,
      status: initial?.status || "Inquiry",
      leadType,
      referral: initial?.referral || "Walk-in",
      assignedTo: initial?.assignedTo || "",
      customValues: initial?.customValues || {},
      followUps: initial?.followUps || [],
      converted: false,
    });
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-gray-900">Student</h3>
        <p className="text-xs text-gray-500">Basic inquiry details only.</p>
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          <Field label="First name" required error={errors.studentFirstName}>
            <input
              className={inputClass}
              value={student.first}
              onChange={(e) => setStudentPart("first", e.target.value)}
            />
          </Field>
          <Field label="Middle name (optional)">
            <input
              className={inputClass}
              value={student.middle}
              onChange={(e) => setStudentPart("middle", e.target.value)}
            />
          </Field>
          <Field label="Last name" required error={errors.studentLastName}>
            <input
              className={inputClass}
              value={student.last}
              onChange={(e) => setStudentPart("last", e.target.value)}
            />
          </Field>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 max-w-2xl">
          <Field label="Class" required error={errors.classId}>
            <select
              className={selectClass}
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
            >
              <option value="">Select class</option>
              {classOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Student mobile (optional)" error={errors.studentMobile}>
            <input
              className={inputClass}
              value={studentMobile}
              onChange={(e) =>
                setStudentMobile(e.target.value.replace(/\D/g, "").slice(0, 10))
              }
              inputMode="numeric"
            />
          </Field>
        </div>
      </div>

      <div className="border-t border-gray-100 pt-5">
        <h3 className="text-sm font-semibold text-gray-900">Parent / Guardian</h3>
        <p className="text-xs text-gray-500">
          Mobile or email required (at least one) for the admission form link.
        </p>
        <div className="mt-3 max-w-sm">
          <Field
            label="Relation to student"
            required
            error={errors.guardianRelation}
          >
            <select
              className={selectClass}
              value={guardianRelation}
              onChange={(e) => setGuardianRelation(e.target.value)}
            >
              <option value="">Select relation</option>
              {GUARDIAN_RELATIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Field label="First name" required error={errors.parentFirstName}>
            <input
              className={inputClass}
              value={parent.first}
              onChange={(e) => setParentPart("first", e.target.value)}
            />
          </Field>
          <Field label="Middle name (optional)">
            <input
              className={inputClass}
              value={parent.middle}
              onChange={(e) => setParentPart("middle", e.target.value)}
            />
          </Field>
          <Field label="Last name" required error={errors.parentLastName}>
            <input
              className={inputClass}
              value={parent.last}
              onChange={(e) => setParentPart("last", e.target.value)}
            />
          </Field>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Mobile" error={errors.parentMobile}>
            <input
              className={inputClass}
              value={parentMobile}
              onChange={(e) =>
                setParentMobile(e.target.value.replace(/\D/g, "").slice(0, 10))
              }
              placeholder="10-digit mobile"
              inputMode="numeric"
            />
          </Field>
          <Field label="Email" error={errors.parentEmail}>
            <input
              type="email"
              className={inputClass}
              value={parentEmail}
              onChange={(e) => setParentEmail(e.target.value)}
              placeholder="parent@email.com"
            />
          </Field>
        </div>
        {errors.parentContact ? (
          <p className="mt-2 text-sm text-red-600">{errors.parentContact}</p>
        ) : null}
      </div>

      <div className="border-t border-gray-100 pt-5">
        <div className="max-w-sm">
          <Field label="Lead type" required error={errors.leadType}>
            <select
              className={selectClass}
              value={leadType}
              onChange={(e) => setLeadType(e.target.value)}
            >
              {ACTIVE_LEAD_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>
          {leadType && LEAD_TYPE_HINTS[leadType] ? (
            <p className="mt-1.5 text-xs text-gray-500">
              {LEAD_TYPE_HINTS[leadType]}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
        <button type="button" className={btnSecondary} onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className={btnPrimary}>
          {initial ? "Update inquiry" : "Save inquiry"}
        </button>
      </div>
    </form>
  );
}
