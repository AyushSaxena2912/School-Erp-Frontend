import React, { useMemo, useState } from "react";
import { useFrontOffice } from "../context/FrontOfficeContext";
import { joinNameParts, splitFullName, GUARDIAN_RELATIONS, ACTIVE_LEAD_TYPES, LEAD_TYPE_HINTS } from "../data/seed";
import { Field, btnPrimary, btnSecondary, inputClass, selectClass } from "./ui";

const COUNTRY_CODES = [
  { code: "+91", label: "🇮🇳 +91", country: "India" },
  { code: "+1",  label: "🇺🇸 +1",  country: "USA/Canada" },
  { code: "+44", label: "🇬🇧 +44", country: "UK" },
  { code: "+971",label: "🇦🇪 +971",country: "UAE" },
  { code: "+61", label: "🇦🇺 +61", country: "Australia" },
  { code: "+65", label: "🇸🇬 +65", country: "Singapore" },
  { code: "+60", label: "🇲🇾 +60", country: "Malaysia" },
  { code: "+92", label: "🇵🇰 +92", country: "Pakistan" },
  { code: "+880",label: "🇧🇩 +880",country: "Bangladesh" },
  { code: "+94", label: "🇱🇰 +94", country: "Sri Lanka" },
  { code: "+977",label: "🇳🇵 +977",country: "Nepal" },
  { code: "+49", label: "🇩🇪 +49", country: "Germany" },
  { code: "+33", label: "🇫🇷 +33", country: "France" },
  { code: "+81", label: "🇯🇵 +81", country: "Japan" },
  { code: "+86", label: "🇨🇳 +86", country: "China" },
];

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

function splitPhone(raw) {
  if (!raw) return { code: "+91", number: "" };
  const sRaw = String(raw).trim();
  const match = COUNTRY_CODES.find((c) => sRaw.startsWith(c.code));
  if (match) {
    return {
      code: match.code,
      number: sRaw.slice(match.code.length).replace(/\D/g, "").slice(0, 10),
    };
  }
  return {
    code: "+91",
    number: sRaw.replace(/^\+?91/, "").replace(/\D/g, "").slice(0, 10),
  };
}

/**
 * Step 1 — Front Office basic inquiry only:
 * student name, class, parent name, parent mobile or email.
 */
export default function EnquiryForm({ initial, onSave, onCancel }) {
  const { classes, customFields } = useFrontOffice();
  const [customValues, setCustomValues] = useState(() => {
    if (typeof initial?.customValues === "object" && initial.customValues) return initial.customValues;
    if (typeof initial?.custom_fields === "object" && initial.custom_fields) return initial.custom_fields;
    if (typeof initial?.custom_fields === "string") {
      try { return JSON.parse(initial.custom_fields); } catch { return {}; }
    }
    return {};
  });

  const handleCustomChange = (fieldLabel, val) => {
    setCustomValues((prev) => ({ ...prev, [fieldLabel]: val }));
  };
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
  const matchedInitialClass = useMemo(() => {
    if (!initial) return null;
    const cid = initial.classId || initial.className;
    return (classes || []).find(
      (c) => c.id === cid || c.name === cid || c.id === `class-${cid}`.toLowerCase() || (c.name && c.name.toLowerCase() === String(cid).toLowerCase())
    );
  }, [initial, classes]);

  const [classId, setClassId] = useState(() => matchedInitialClass?.id || initial?.classId || initial?.className || "");
  const [studentCountryCode, setStudentCountryCode] = useState(() => {
    const raw = initial?.studentMobile || "";
    const match = COUNTRY_CODES.find(c => raw.startsWith(c.code));
    return match ? match.code : "+91";
  });
  const [studentMobile, setStudentMobile] = useState(() => {
    const raw = initial?.studentMobile || "";
    const match = COUNTRY_CODES.find(c => raw.startsWith(c.code));
    return match ? raw.slice(match.code.length).replace(/\D/g, "").slice(0, 10) : raw.replace(/^\+?91/, "").replace(/\D/g, "").slice(0, 10);
  });
  const [guardianRelation, setGuardianRelation] = useState(
    initial?.guardianRelation || ""
  );
  const [parentCountryCode, setParentCountryCode] = useState(() => {
    const raw = initial?.parentMobile || initial?.contact || "";
    const match = COUNTRY_CODES.find(c => raw.startsWith(c.code));
    return match ? match.code : "+91";
  });
  const [parentMobile, setParentMobile] = useState(() => {
    const raw = initial?.parentMobile || initial?.contact || "";
    const match = COUNTRY_CODES.find(c => raw.startsWith(c.code));
    return match ? raw.slice(match.code.length).replace(/\D/g, "").slice(0, 10) : raw.replace(/^\+?91/, "").replace(/\D/g, "").slice(0, 10);
  });
  const [parentEmail, setParentEmail] = useState(initial?.parentEmail || "");
  const [leadType, setLeadType] = useState(
    initial?.leadType && ACTIVE_LEAD_TYPES.includes(initial.leadType)
      ? initial.leadType
      : ""
  );
  const [errors, setErrors] = useState({});

  React.useEffect(() => {
    if (initial) {
      setStudent(partsFrom(initial, "studentFirstName", "studentMiddleName", "studentLastName", "studentName"));
      setParent(partsFrom(initial, "guardianFirstName", "guardianMiddleName", "guardianLastName", "parentName"));
      setGuardianRelation(initial.guardianRelation || initial.guardian_relation || "");
      setParentEmail(initial.parentEmail || initial.guardian_email || "");
      if (initial.classId || initial.className) {
        setClassId(initial.classId || initial.className);
      }
      if (initial.leadType && ACTIVE_LEAD_TYPES.includes(initial.leadType)) {
        setLeadType(initial.leadType);
      }

      const s = splitPhone(initial.studentMobile);
      setStudentCountryCode(s.code);
      setStudentMobile(s.number);

      const p = splitPhone(initial.parentMobile || initial.contact || initial.guardian_mobile);
      setParentCountryCode(p.code);
      setParentMobile(p.number);
    }
  }, [initial]);

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
      next.studentMobile = "Enter a valid 10-digit mobile number";
    }

    const mobile = parentMobile.replace(/\D/g, "");
    const email = parentEmail.toLowerCase().trim();

    if (!mobile) {
      next.parentMobile = "Required";
    } else if (mobile.length !== 10) {
      next.parentMobile = "Enter a valid 10-digit mobile number";
    }

    if (!email) {
      next.parentEmail = "Required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      next.parentEmail = "Enter a valid email";
    }

    setErrors(next);
    if (Object.keys(next).length) return;

    const studentName = joinNameParts(
      student.first,
      student.middle,
      student.last
    );
    const parentName = joinNameParts(parent.first, parent.middle, parent.last);

    const matchedClassObj = (classes || []).find((c) => c.id === classId || c.name === classId);
    const classNameVal = matchedClassObj?.name || classId;

    onSave({
      studentFirstName: student.first.trim(),
      studentMiddleName: student.middle.trim(),
      studentLastName: student.last.trim(),
      studentName,
      gender: initial?.gender || initial?.studentGender || "",
      studentGender: initial?.gender || initial?.studentGender || "",
      studentMobile: studentPhone ? `${studentCountryCode}${studentPhone}` : "",
      guardianFirstName: parent.first.trim(),
      guardianMiddleName: parent.middle.trim(),
      guardianLastName: parent.last.trim(),
      guardianRelation,
      parentName,
      parentMobile: mobile ? `${parentCountryCode}${mobile}` : "",
      parentEmail: email,
      contact: mobile ? `${parentCountryCode}${mobile}` : email,
      classId: classNameVal,
      className: classNameVal,
      status: initial?.status || "Inquiry",
      leadType,
      referral: initial?.referral || "Walk-in",
      assignedTo: initial?.assignedTo || "",
      customValues,
      followUps: initial?.followUps || [],
      converted: false,
    });
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-gray-900">Student</h3>
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
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
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
            <div style={{ display: "flex", border: "1px solid #d1d5db", borderRadius: "10px", overflow: "hidden", background: "#fff" }}>
              <div style={{ position: "relative", flexShrink: 0, borderRight: "1px solid #e5e7eb", background: "#f9fafb" }}>
                <select
                  value={studentCountryCode}
                  onChange={(e) => setStudentCountryCode(e.target.value)}
                  style={{
                    width: "100px",
                    border: "none",
                    padding: "10px 28px 10px 10px",
                    fontSize: "13px",
                    fontWeight: 600,
                    background: "transparent",
                    cursor: "pointer",
                    outline: "none",
                    appearance: "none",
                    WebkitAppearance: "none",
                    MozAppearance: "none",
                  }}
                >
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.code} value={c.code} title={c.country}>{c.label}</option>
                  ))}
                </select>
                <svg style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#6b7280" }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
              <input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                style={{ flex: 1, border: "none", padding: "10px 12px", fontSize: "14px", outline: "none", background: "transparent" }}
                value={studentMobile}
                onChange={(e) => setStudentMobile(e.target.value.replace(/[^0-9]/g, "").slice(0, 10))}
                onKeyDown={(e) => {
                  if (e.key.length === 1 && !/[0-9]/.test(e.key) && !e.ctrlKey && !e.metaKey) {
                    e.preventDefault();
                  }
                }}
                placeholder="Mobile number"
              />
            </div>
          </Field>
        </div>
      </div>

      <div className="border-t border-gray-100 pt-5">
        <h3 className="text-sm font-semibold text-gray-900">Parent / Guardian</h3>
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
          <Field label="Mobile" required error={errors.parentMobile}>
            <div style={{ display: "flex", border: "1px solid #d1d5db", borderRadius: "10px", overflow: "hidden", background: "#fff" }}>
              <div style={{ position: "relative", flexShrink: 0, borderRight: "1px solid #e5e7eb", background: "#f9fafb" }}>
                <select
                  value={parentCountryCode}
                  onChange={(e) => setParentCountryCode(e.target.value)}
                  style={{
                    width: "100px",
                    border: "none",
                    padding: "10px 28px 10px 10px",
                    fontSize: "13px",
                    fontWeight: 600,
                    background: "transparent",
                    cursor: "pointer",
                    outline: "none",
                    appearance: "none",
                    WebkitAppearance: "none",
                    MozAppearance: "none",
                  }}
                >
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.code} value={c.code} title={c.country}>{c.label}</option>
                  ))}
                </select>
                <svg style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#6b7280" }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
              <input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                style={{ flex: 1, border: "none", padding: "10px 12px", fontSize: "14px", outline: "none", background: "transparent" }}
                value={parentMobile}
                onChange={(e) => {
                  setParentMobile(e.target.value.replace(/[^0-9]/g, "").slice(0, 10));
                  if (e.target.value) setErrors((prev) => ({ ...prev, parentMobile: "" }));
                }}
                onKeyDown={(e) => {
                  if (e.key.length === 1 && !/[0-9]/.test(e.key) && !e.ctrlKey && !e.metaKey) {
                    e.preventDefault();
                  }
                }}
                placeholder="Mobile number"
              />
            </div>
          </Field>
          <Field label="Email" required error={errors.parentEmail}>
            <input
              type="email"
              className={inputClass}
              value={parentEmail}
              onChange={(e) => {
                setParentEmail(e.target.value.toLowerCase());
                if (e.target.value) setErrors((prev) => ({ ...prev, parentEmail: "" }));
              }}
              placeholder="parent@email.com"
            />
          </Field>
        </div>
      </div>

      <div className="border-t border-gray-100 pt-5">
        <div className="max-w-sm">
          <Field label="Lead type" required error={errors.leadType}>
            <select
              className={selectClass}
              value={leadType}
              onChange={(e) => {
                setLeadType(e.target.value);
                if (e.target.value) setErrors((prev) => ({ ...prev, leadType: "" }));
              }}
            >
              <option value="">Select lead type</option>
              {ACTIVE_LEAD_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </div>
      {customFields && customFields.length > 0 ? (
        <div className="border-t border-gray-100 pt-5 space-y-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Custom Fields</h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {customFields.map((field) => (
              <div
                key={field.id || field.label}
                className={field.type === "Textarea" ? "sm:col-span-2" : ""}
              >
                <Field
                  label={field.label}
                  required={field.required}
                >
                  {field.type === "Dropdown" ? (
                    <select
                      className={selectClass}
                      value={customValues[field.label] || ""}
                      onChange={(e) => handleCustomChange(field.label, e.target.value)}
                    >
                      <option value="">Select option</option>
                      {(field.options || []).map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : field.type === "Textarea" ? (
                    <textarea
                      className={inputClass}
                      rows={2}
                      value={customValues[field.label] || ""}
                      onChange={(e) => handleCustomChange(field.label, e.target.value)}
                      placeholder={`Enter ${field.label.toLowerCase()}`}
                    />
                  ) : field.type === "Checkbox" ? (
                    <label className="flex items-center gap-2 pt-2 cursor-pointer text-sm text-gray-800 font-medium">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-green-700 focus:ring-green-700 h-4 w-4"
                        checked={Boolean(customValues[field.label])}
                        onChange={(e) => handleCustomChange(field.label, e.target.checked)}
                      />
                      <span>{field.label}</span>
                    </label>
                  ) : field.type === "Phone" ? (
                    <PhoneInput
                      value={customValues[field.label] || ""}
                      onChange={(val) => handleCustomChange(field.label, val)}
                      placeholder={`Enter ${field.label.toLowerCase()}`}
                    />
                  ) : (
                    <input
                      type={field.type === "Number" ? "number" : field.type === "Date" ? "date" : "text"}
                      className={inputClass}
                      value={customValues[field.label] || ""}
                      onChange={(e) => handleCustomChange(field.label, e.target.value)}
                      placeholder={`Enter ${field.label.toLowerCase()}`}
                    />
                  )}
                </Field>
              </div>
            ))}
          </div>
        </div>
      ) : null}

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
