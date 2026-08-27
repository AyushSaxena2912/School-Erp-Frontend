import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useFrontOffice } from "../front-office/context/FrontOfficeContext";
import {
  Field,
  PhoneInput,
  btnPrimary,
  btnSecondary,
  inputClass,
  selectClass,
} from "../front-office/components/ui";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const GENDERS = ["Male", "Female", "Other"];
const SECTIONS = ["A", "B", "C", "D", "E", "F"];
const HOUSES = ["Red", "Blue", "Green", "Yellow"];
const RELIGIONS = [
  "Hindu",
  "Muslim",
  "Christian",
  "Sikh",
  "Buddhist",
  "Jain",
  "Other",
];
const CATEGORIES = ["General", "OBC", "SC", "ST", "EWS", "Other"];
const MOTHER_TONGUES = [
  "Hindi",
  "English",
  "Bengali",
  "Tamil",
  "Telugu",
  "Marathi",
  "Gujarati",
  "Other",
];

const emptySibling = () => ({
  studentId: "",
  name: "",
  rollNumber: "",
  admissionNo: "",
  className: "",
  section: "",
  searchQuery: "",
});

function matchStudent(student, query) {
  const q = query.trim().toLowerCase();
  if (!q) return false;
  const digits = q.replace(/\D/g, "");
  const hay = [
    student.name,
    student.scholarNumber,
    student.admissionNumber,
    student.studentMobile,
    student.parentMobile,
    student.className,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  if (hay.includes(q)) return true;
  if (digits.length >= 4) {
    const mobiles = `${student.studentMobile || ""}${student.parentMobile || ""}`;
    if (mobiles.includes(digits)) return true;
  }
  return false;
}

function IndianDateInput({ value, onChange, className, disabled, placeholder = "DD/MM/YYYY" }) {
  const formatDisplay = (iso) => {
    if (!iso) return "";
    const clean = String(iso).split(" ")[0].split("T")[0];
    const parts = clean.split("-");
    if (parts.length === 3 && parts[0].length === 4) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return iso;
  };

  const [textVal, setTextVal] = useState(() => formatDisplay(value));
  const hiddenRef = useRef(null);

  useEffect(() => {
    const formatted = formatDisplay(value);
    if (formatted !== textVal && (value || textVal)) {
      // Don't overwrite if the user is in the middle of typing a valid representation
      const parts = textVal.split("/");
      if (parts.length === 3 && parts[2] && parts[2].length === 4) {
        const d = parts[0].padStart(2, "0");
        const m = parts[1].padStart(2, "0");
        const y = parts[2];
        if (`${y}-${m}-${d}` === value) return;
      }
      setTextVal(formatted);
    }
  }, [value]);

  const handleInputChange = (e) => {
    const raw = e.target.value;
    // Allow digits and slashes
    let input = raw.replace(/[^\d/]/g, "").slice(0, 10);

    // Auto-insert slash when typing numbers continuously
    if (input.length > textVal.length) {
      if (input.length === 2 && !input.includes("/")) {
        input = input + "/";
      } else if (input.length === 5 && input.split("/").length === 2) {
        input = input + "/";
      }
    }

    setTextVal(input);

    if (!input.trim()) {
      onChange("");
      return;
    }

    const parts = input.split("/");
    if (parts.length === 3) {
      const d = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      const y = parseInt(parts[2], 10);
      if (
        !isNaN(d) && !isNaN(m) && !isNaN(y) &&
        d >= 1 && d <= 31 &&
        m >= 1 && m <= 12 &&
        y >= 1900 && y <= 2099 &&
        parts[2].length === 4
      ) {
        const iso = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        onChange(iso);
      }
    }
  };

  const handleNativeDate = (e) => {
    const iso = e.target.value;
    onChange(iso);
    setTextVal(formatDisplay(iso));
  };

  const handleOpenPicker = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (hiddenRef.current) {
      if (typeof hiddenRef.current.showPicker === "function") {
        try {
          hiddenRef.current.showPicker();
        } catch {
          hiddenRef.current.click();
        }
      } else {
        hiddenRef.current.click();
      }
    }
  };

  return (
    <div className="relative flex items-center w-full">
      <input
        type="text"
        inputMode="numeric"
        className={className}
        value={textVal}
        onChange={handleInputChange}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={10}
      />
      {!disabled ? (
        <button
          type="button"
          onClick={handleOpenPicker}
          className="absolute right-3 cursor-pointer text-gray-400 hover:text-green-700 flex items-center p-1 focus:outline-none"
          tabIndex={-1}
          title="Open Calendar"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 002-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </button>
      ) : null}
      <input
        ref={hiddenRef}
        type="date"
        className="sr-only absolute pointer-events-none"
        value={value || ""}
        onChange={handleNativeDate}
        tabIndex={-1}
      />
    </div>
  );
}

function SectionCard({ title, icon, children }) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 sm:p-6">
      <div className="mb-5 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50 text-green-800">
          {icon}
        </span>
        <h2 className="text-lg font-semibold text-green-900">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function PhotoUpload({ label, value, onChange }) {
  const ref = useRef(null);
  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-gray-100 text-gray-400">
        {value ? (
          <img src={value} alt="" className="h-full w-full object-cover" />
        ) : (
          <svg className="h-10 w-10" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 12a5 5 0 100-10 5 5 0 000 10zm0 2c-4.4 0-8 2.2-8 5v1h16v-1c0-2.8-3.6-5-8-5z" />
          </svg>
        )}
      </div>
      <div>
        {label ? (
          <p className="mb-1.5 text-sm font-medium text-gray-800">{label}</p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <input
            ref={ref}
            type="file"
            accept="image/jpeg,image/png,image/svg+xml"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              if (file.size > 4 * 1024 * 1024) {
                window.alert("Image must be under 4MB");
                return;
              }
              const reader = new FileReader();
              reader.onload = () => onChange(String(reader.result || ""));
              reader.readAsDataURL(file);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            className={btnSecondary}
            onClick={() => ref.current?.click()}
          >
            Upload
          </button>
          <button
            type="button"
            className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100"
            onClick={() => onChange("")}
          >
            Remove
          </button>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Upload image size 4MB, Format JPG, PNG, SVG
        </p>
      </div>
    </div>
  );
}

function TagInput({ label, values, onChange, placeholder }) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const v = draft.trim();
    if (!v || values.includes(v)) return;
    onChange([...values, v]);
    setDraft("");
  };
  return (
    <Field label={label}>
      <div className="flex flex-wrap items-center gap-2">
        {values.map((v) => (
          <span
            key={v}
            className="inline-flex items-center gap-1 rounded-md bg-green-700 px-2.5 py-1 text-xs font-medium text-white"
          >
            {v}
            <button
              type="button"
              className="opacity-80 hover:opacity-100"
              onClick={() => onChange(values.filter((x) => x !== v))}
            >
              ×
            </button>
          </span>
        ))}
        <input
          className="min-w-[8rem] flex-1 rounded-md border border-dashed border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-green-700"
          value={draft}
          placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          onBlur={add}
        />
      </div>
    </Field>
  );
}

function DocUpload({ label, required, error, hint, value, onChange }) {
  const ref = useRef(null);
  return (
    <div>
      <p className="mb-1 text-sm font-medium text-gray-800">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </p>
      <p className="mb-2 text-xs text-gray-500">{hint}</p>
      <input
        ref={ref}
        type="file"
        accept=".pdf,application/pdf,image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          if (file.size > 4 * 1024 * 1024) {
            window.alert("File must be under 4MB");
            return;
          }
          const reader = new FileReader();
          reader.onload = () =>
            onChange({
              name: file.name,
              type: file.type,
              size: file.size,
              dataUrl: String(reader.result || ""),
            });
          reader.readAsDataURL(file);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-md border border-green-700 bg-green-50 px-3 py-2 text-sm font-medium text-green-800 hover:bg-green-100"
        onClick={() => ref.current?.click()}
      >
        Upload Document
      </button>
      {value ? (
        <div className="mt-2 flex items-center gap-2 text-xs text-green-700 font-medium">
          <span>✓ {value.name}</span>
          <button
            type="button"
            className="text-red-600 hover:underline"
            onClick={() => onChange(null)}
          >
            Remove
          </button>
        </div>
      ) : null}
      {error ? <p className="mt-1 text-sm text-red-500">{error}</p> : null}
    </div>
  );
}

function ensureCountryCode(raw) {
  if (!raw) return "";
  const s = String(raw).trim();
  if (s.startsWith("+")) return s;
  const digits = s.replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  return digits ? `+91${digits}` : "";
}

function formFromEnquiry(enquiry, classes = []) {
  if (!enquiry) return {};
  const f = enquiry?.admissionForm || {};
  const nameParts = String(enquiry?.studentName || "").trim().split(/\s+/);
  
  const rawClass = f.classId || f.className || enquiry?.classId || enquiry?.className || "";
  const matchedClass = (classes || []).find(
    (c) =>
      c.id === rawClass ||
      c.name === rawClass ||
      c.name.toLowerCase() === String(rawClass).toLowerCase() ||
      c.id.toLowerCase() === String(rawClass).toLowerCase()
  );
  const resolvedClassId = matchedClass ? matchedClass.id : (rawClass || "");
  const resolvedClassName = matchedClass ? matchedClass.name : (rawClass || "");

  const rawGender = f.gender || enquiry?.gender || enquiry?.studentGender || "";

  return {
    photo: f.photo || "",
    academicYear: f.academicYear || enquiry?.academicYear || "April 2026/2027",
    admissionDate: f.admissionDate || new Date().toISOString().slice(0, 10),
    firstName: f.firstName || enquiry?.studentFirstName || nameParts[0] || "",
    lastName:
      f.lastName ||
      enquiry?.studentLastName ||
      (nameParts.length > 1 ? nameParts.slice(1).join(" ") : ""),
    classId: resolvedClassId,
    className: resolvedClassName,
    section: f.section || enquiry?.section || "",
    dateOfBirth: f.dateOfBirth || "",
    bloodGroup: f.bloodGroup || "",
    gender: rawGender || "",
    house: f.house || enquiry?.house || "",
    religion: f.religion || "",
    primaryContact: ensureCountryCode(
      f.primaryContact || enquiry?.studentMobile || enquiry?.parentMobile || ""
    ),
    email: f.email || enquiry?.parentEmail || "",
    motherTongue: f.motherTongue || "",
    category: f.category || "",
    languages: f.languages || [],
    aadharNo: f.aadharNo || "",
    father: {
      photo: f.father?.photo || "",
      name: f.father?.name || (enquiry?.guardianRelation === "Father" ? enquiry.parentName : "") || "",
      email: f.father?.email || (enquiry?.guardianRelation === "Father" ? enquiry.parentEmail : "") || "",
      phone: ensureCountryCode(
        f.father?.phone || (enquiry?.guardianRelation === "Father" ? enquiry.parentMobile : "") || ""
      ),
      occupation: f.father?.occupation || "",
    },
    mother: {
      photo: f.mother?.photo || "",
      name: f.mother?.name || (enquiry?.guardianRelation === "Mother" ? enquiry.parentName : "") || "",
      email: f.mother?.email || (enquiry?.guardianRelation === "Mother" ? enquiry.parentEmail : "") || "",
      phone: ensureCountryCode(
        f.mother?.phone || (enquiry?.guardianRelation === "Mother" ? enquiry.parentMobile : "") || ""
      ),
      occupation: f.mother?.occupation || "",
    },
    guardianIs:
      f.guardianIs ||
      (enquiry?.guardianRelation === "Mother"
        ? "Mother"
        : enquiry?.guardianRelation === "Father"
          ? "Father"
          : enquiry?.guardianRelation === "Other"
            ? "Other"
            : "Father"),
    guardian: {
      photo: f.guardian?.photo || "",
      name: (f.guardianIs === "Other" || enquiry?.guardianRelation === "Other") ? (f.guardian?.name || enquiry?.parentName || "") : "",
      nameAlt: f.guardian?.nameAlt || "",
      relation: (f.guardianIs === "Other" || enquiry?.guardianRelation === "Other") ? (f.guardian?.relation || enquiry?.guardianRelation || "") : "",
      phone: (f.guardianIs === "Other" || enquiry?.guardianRelation === "Other") ? (f.guardian?.phone || enquiry?.parentMobile || "") : "",
      email: (f.guardianIs === "Other" || enquiry?.guardianRelation === "Other") ? (f.guardian?.email || "") : "",
      occupation: (f.guardianIs === "Other" || enquiry?.guardianRelation === "Other") ? (f.guardian?.occupation || "") : "",
      address: f.guardian?.address || "",
    },
    hasSibling: f.hasSibling ?? false,
    siblings: f.siblings?.length ? f.siblings : [emptySibling()],
    currentAddress: f.currentAddress || f.address || "",
    permanentAddress: f.permanentAddress || "",
    docs: {
      medical: f.docs?.medical || null,
      transferCertificate: f.docs?.transferCertificate || null,
      aadhar: f.docs?.aadhar || null,
    },
    medicalCondition: f.medicalCondition || "Good",
    allergies: f.allergies || [],
    medications: f.medications || [],
    previousSchoolName: f.previousSchoolName || "",
    previousSchoolAddress: f.previousSchoolAddress || "",
    bank: {
      bankName: f.bank?.bankName || "",
      branch: f.bank?.branch || "",
      ifsc: f.bank?.ifsc || "",
      other: f.bank?.other || "",
      accountNumber: f.bank?.accountNumber || "",
      accountHolder: f.bank?.accountHolder || "",
    },
    customValues: f.customValues || enquiry?.customValues || (typeof enquiry?.custom_fields === "object" ? enquiry.custom_fields : {}),
  };
}

function ParentAdmissionFormInner() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preview = searchParams.get("preview") === "1";
  const {
    enquiries,
    classes,
    students,
    customFields,
    submitParentAdmissionForm,
    requestAdmissionCorrections,
    verifyAdmission,
  } = useFrontOffice();

  const handleCustomChange = (fieldLabel, val) => {
    setForm((p) => ({
      ...p,
      customValues: { ...(p.customValues || {}), [fieldLabel]: val },
    }));
  };

  const getClassName = (idOrName) => {
    if (!idOrName) return "Class 10";
    const found = classes.find(
      (c) =>
        c.id === idOrName ||
        c.name === idOrName ||
        c.id === `class-${idOrName}`.toLowerCase() ||
        c.name.toLowerCase() === String(idOrName).toLowerCase()
    );
    return found?.name || idOrName || "Class 10";
  };
  const enquiry = useMemo(() => {
    if (!token) return enquiries?.[0] || null;
    const cleanTok = String(token).toLowerCase().replace(/[^a-z0-9]/g, "");
    const found = (enquiries || []).find((e) => {
      const matchId = e.id && String(e.id).toLowerCase().replace(/[^a-z0-9]/g, "") === cleanTok;
      const matchName = e.name && String(e.name).toLowerCase().replace(/[^a-z0-9]/g, "") === cleanTok;
      const matchToken = e.admissionToken && String(e.admissionToken).toLowerCase().replace(/[^a-z0-9]/g, "") === cleanTok;
      const partialToken = e.admissionToken && String(e.admissionToken).toLowerCase().replace(/[^a-z0-9]/g, "").includes(cleanTok);
      const partialId = e.id && cleanTok.includes(String(e.id).toLowerCase().replace(/[^a-z0-9]/g, ""));
      return matchId || matchName || matchToken || partialToken || partialId;
    });
    return found || enquiries?.[0] || null;
  }, [enquiries, token]);
  const [form, setForm] = useState(() => formFromEnquiry(enquiry, classes));
  const [errors, setErrors] = useState({});
  const [done, setDone] = useState(
    () =>
      !preview &&
      (enquiry?.status === "Form Submitted" ||
        enquiry?.status === "Corrections Submitted" ||
        enquiry?.status === "Verified" ||
        enquiry?.status === "Accounts Created")
  );

  // Sync form whenever enquiry or classes load/change
  React.useEffect(() => {
    if (!enquiry) return;
    setForm(formFromEnquiry(enquiry, classes));
    if (
      !preview &&
      (enquiry.status === "Form Submitted" ||
        enquiry.status === "Corrections Submitted" ||
        enquiry.status === "Verified" ||
        enquiry.status === "Accounts Created")
    ) {
      setDone(true);
    } else if (enquiry.status === "Corrections Requested") {
      setDone(false);
    }
  }, [enquiry?.id, enquiry?.name, enquiry?.admissionToken, enquiry?.className, enquiry?.classId, enquiry?.gender, enquiry?.status, classes]);

  const [correctionDraft, setCorrectionDraft] = useState("");
  const [showFacultyCorrections, setShowFacultyCorrections] = useState(false);
  const [facultySavedNotice, setFacultySavedNotice] = useState(false);

  const isSchoolFieldDisabled = !preview;

  const set = (key, value) => {
    setForm((p) => ({ ...p, [key]: value }));
  };
  const setNested = (key, patch) => {
    setForm((p) => ({ ...p, [key]: { ...p[key], ...patch } }));
  };

  if (!enquiry) {
    return (
      <div className="mx-auto max-w-lg rounded-lg border border-gray-200 bg-white p-8">
        <h1 className="text-xl font-bold text-gray-900">Link invalid</h1>
        <p className="mt-2 text-sm text-gray-500">
          This admission form link is invalid or has expired. From Front Office,
          open the inquiry and click <strong>Send admission form</strong> again,
          then use the new link (same browser).
        </p>
        <Link
          to="/front-office/enquiries"
          className={`${btnSecondary} mt-4 inline-flex`}
        >
          Back to inquiries
        </Link>
      </div>
    );
  }

  if (
    enquiry.status === "Inquiry" ||
    enquiry.status === "Follow-up Pending" ||
    enquiry.status === "New" ||
    enquiry.status === "Admission Approved"
  ) {
    return (
      <div className="mx-auto max-w-lg rounded-lg border border-gray-200 bg-white p-8">
        <h1 className="text-xl font-bold text-gray-900">Form not ready</h1>
        <p className="mt-2 text-sm text-gray-500">
          The school has not sent the admission form yet.
        </p>
      </div>
    );
  }

  if (preview && !enquiry.admissionForm) {
    return (
      <div className="mx-auto max-w-lg rounded-lg border border-gray-200 bg-white p-8">
        <h1 className="text-xl font-bold text-gray-900">Not submitted yet</h1>
        <p className="mt-2 text-sm text-gray-500">
          Parent has not submitted this admission form.
        </p>
        <Link to="/front-office/enquiries" className={`${btnSecondary} mt-4 inline-block`}>
          Back to inquiries
        </Link>
      </div>
    );
  }

  if (done && !preview && enquiry.status !== "Corrections Requested") {
    const wasCorrection =
      enquiry.status === "Corrections Submitted";
    return (
      <div className="mx-auto max-w-lg rounded-lg border border-gray-200 bg-white p-8">
        <h1 className="text-xl font-bold text-gray-900">
          {wasCorrection ? "Corrections submitted" : "Form submitted"}
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          {wasCorrection
            ? "Thank you. Your corrections have been sent to the school for review."
            : "Thank you. The school will verify your details."}
        </p>
      </div>
    );
  }

  const submit = (e) => {
    e.preventDefault();
    const next = {};
    if (!form.dateOfBirth) next.dateOfBirth = "Date of Birth is required";
    if (!form.primaryContact || !form.primaryContact.trim()) next.primaryContact = "Primary Contact Number is required";
    if (!form.currentAddress || !form.currentAddress.trim()) next.currentAddress = "Current Address is required";
    if (!form.aadharNo || !form.aadharNo.trim() || form.aadharNo.trim().length < 12) {
      next.aadharNo = "12-digit Aadhar Card Number is required";
    }
    if (!form.docs.aadhar) {
      next.aadharDoc = "Aadhar Card Document Upload is required";
    }
    if (!form.father.name.trim() && !form.mother.name.trim()) {
      next.parents = "Enter Father or Mother details";
    }
    setErrors(next);
    if (Object.keys(next).length) {
      return;
    }

    submitParentAdmissionForm(token, {
      ...form,
      address: form.currentAddress.trim(),
      documents: [
        form.docs.medical,
        form.docs.transferCertificate,
        form.docs.aadhar,
      ].filter(Boolean),
      submittedAt: new Date().toISOString(),
    });
    setDone(true);
  };

  const saveFacultyChanges = (e) => {
    if (e) e.preventDefault();
    submitParentAdmissionForm(
      token,
      {
        ...form,
        address: form.currentAddress.trim(),
        documents: [
          form.docs.medical,
          form.docs.transferCertificate,
          form.docs.aadhar,
        ].filter(Boolean),
        submittedAt: enquiry?.formSubmittedAt || new Date().toISOString(),
      },
      true
    );
    setFacultySavedNotice(true);
    setTimeout(() => setFacultySavedNotice(false), 3000);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="border-b-4 border-green-700 bg-gradient-to-br from-green-50 via-white to-white px-5 py-6 sm:px-7 sm:py-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-green-800">
                {preview ? "Staff / Faculty Mode · Editable Form" : "Admission application"}
              </p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                {enquiry.studentName}
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-gray-600">
                {preview
                  ? "Form submitted by parent. As faculty/staff, you can view and edit any details below. Click 'Save Changes' to update this record."
                  : "Please fill in the remaining details carefully. Name and class are already set by the school and cannot be changed here."}
              </p>
              {preview ? (
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Link
                    to={`/front-office/enquiries?open=${enquiry.id}`}
                    className={btnSecondary}
                  >
                    ← Back to inquiry
                  </Link>
                  <button
                    type="button"
                    className={btnPrimary}
                    onClick={saveFacultyChanges}
                  >
                    Save Changes
                  </button>
                  {facultySavedNotice ? (
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded border border-emerald-200">
                      ✓ Changes saved successfully!
                    </span>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </div>
        {enquiry.correctionNotes ? (
          <div className="border-t border-amber-100 bg-amber-50 px-5 py-3 text-sm text-amber-900 sm:px-7">
            <p className="font-medium">School requested corrections</p>
            <p className="mt-1 whitespace-pre-wrap">{enquiry.correctionNotes}</p>
          </div>
        ) : null}
        {preview && enquiry.status === "Corrections Submitted" ? (
          <div className="border-t border-emerald-100 bg-emerald-50 px-5 py-3 text-sm text-emerald-900 sm:px-7">
            <p className="font-medium">Parent submitted corrections</p>
            {enquiry.correctionsSubmittedAt ? (
              <p className="mt-1">
                Resubmitted on {enquiry.correctionsSubmittedAt}
              </p>
            ) : null}
            {enquiry.lastCorrectionNotes ? (
              <p className="mt-2 whitespace-pre-wrap text-emerald-900/80">
                Previously requested: {enquiry.lastCorrectionNotes}
              </p>
            ) : null}
          </div>
        ) : null}
        {errors.parents ? (
          <p className="px-5 py-2 text-sm text-red-600 sm:px-7">
            {errors.parents}
          </p>
        ) : null}
      </div>

      <form onSubmit={preview ? saveFacultyChanges : submit} className="space-y-5">
        <fieldset
          className="min-w-0 space-y-5 border-0 p-0"
        >
          <SectionCard
            title="Personal Information"
            icon={
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12a5 5 0 100-10 5 5 0 000 10zm0 2c-4.4 0-8 2.2-8 5v1h16v-1c0-2.8-3.6-5-8-5z" />
              </svg>
            }
          >
            <PhotoUpload
              value={form.photo}
              onChange={(photo) => set("photo", photo)}
            />

            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Academic Year">
                <input
                  className={isSchoolFieldDisabled ? `${inputClass} bg-gray-50 text-gray-600 border-gray-200 cursor-not-allowed` : inputClass}
                  value={form.academicYear || "April 2026/2027"}
                  onChange={(e) => set("academicYear", e.target.value)}
                  disabled={isSchoolFieldDisabled}
                />
              </Field>
              <Field label="Admission Date">
                <input
                  type={isSchoolFieldDisabled ? "text" : "date"}
                  className={isSchoolFieldDisabled ? `${inputClass} bg-gray-50 text-gray-600 border-gray-200 cursor-not-allowed` : inputClass}
                  value={form.admissionDate || todayISO()}
                  onChange={(e) => set("admissionDate", e.target.value)}
                  disabled={isSchoolFieldDisabled}
                />
              </Field>
              <Field label="First Name" required>
                <input
                  className={inputClass}
                  value={form.firstName || ""}
                  onChange={(e) => set("firstName", e.target.value)}
                />
              </Field>
              <Field label="Last Name" required>
                <input
                  className={inputClass}
                  value={form.lastName || ""}
                  onChange={(e) => set("lastName", e.target.value)}
                />
              </Field>
              <Field label="Class">
                {isSchoolFieldDisabled ? (
                  <input
                    className={`${inputClass} bg-gray-50 text-gray-600 border-gray-200 cursor-not-allowed`}
                    value={getClassName(form.classId || form.className)}
                    disabled
                  />
                ) : (
                  <select
                    className={selectClass}
                    value={
                      classes.find(
                        (c) =>
                          c.id === form.classId ||
                          c.name === form.classId ||
                          c.name === form.className ||
                          c.name.toLowerCase() === String(form.classId).toLowerCase()
                      )?.id || form.classId || ""
                    }
                    onChange={(e) => {
                      const selectedClass = classes.find((c) => c.id === e.target.value);
                      set("classId", e.target.value);
                      if (selectedClass) set("className", selectedClass.name);
                    }}
                  >
                    <option value="">Select Class</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                )}
              </Field>
              <Field label="Section">
                {isSchoolFieldDisabled ? (
                  <input
                    className={`${inputClass} bg-gray-50 text-gray-600 border-gray-200 cursor-not-allowed`}
                    value={form.section || ""}
                    disabled
                  />
                ) : (
                  <select
                    className={selectClass}
                    value={form.section || ""}
                    onChange={(e) => set("section", e.target.value)}
                  >
                    <option value="">Select Section</option>
                    {SECTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                )}
              </Field>
              <Field label="Date of Birth" required error={errors.dateOfBirth}>
                <IndianDateInput
                  className={inputClass}
                  value={form.dateOfBirth}
                  onChange={(isoVal) => {
                    set("dateOfBirth", isoVal);
                    if (isoVal) {
                      setErrors((p) => ({ ...p, dateOfBirth: "" }));
                    }
                  }}
                />
              </Field>
              <Field label="Blood Group">
                <select
                  className={selectClass}
                  value={form.bloodGroup}
                  onChange={(e) => set("bloodGroup", e.target.value)}
                >
                  <option value="">Select</option>
                  {BLOOD_GROUPS.map((g) => (
                    <option key={g}>{g}</option>
                  ))}
                </select>
              </Field>
              <Field label="Gender" required>
                <select
                  className={selectClass}
                  value={form.gender || ""}
                  onChange={(e) => set("gender", e.target.value)}
                >
                  <option value="">Select Gender</option>
                  {GENDERS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="House">
                {isSchoolFieldDisabled ? (
                  <input
                    className={`${inputClass} bg-gray-50 text-gray-600 border-gray-200 cursor-not-allowed`}
                    value={form.house || ""}
                    disabled
                  />
                ) : (
                  <select
                    className={selectClass}
                    value={form.house || ""}
                    onChange={(e) => set("house", e.target.value)}
                  >
                    <option value="">Select House</option>
                    {HOUSES.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                )}
              </Field>
              <Field label="Religion">
                <select
                  className={selectClass}
                  value={form.religion}
                  onChange={(e) => set("religion", e.target.value)}
                >
                  <option value="">Select</option>
                  {RELIGIONS.map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </Field>
              <Field label="Aadhar Card No." required error={errors.aadharNo}>
                <input
                  className={inputClass}
                  value={form.aadharNo}
                  onChange={(e) => {
                    set("aadharNo", e.target.value.replace(/\D/g, "").slice(0, 12));
                    if (e.target.value.trim()) {
                      setErrors((p) => ({ ...p, aadharNo: "" }));
                    }
                  }}
                  inputMode="numeric"
                />
              </Field>
              <Field label="Mother Tongue">
                <select
                  className={selectClass}
                  value={form.motherTongue}
                  onChange={(e) => set("motherTongue", e.target.value)}
                >
                  <option value="">Select</option>
                  {MOTHER_TONGUES.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </Field>
              <Field label="Social Category">
                <select
                  className={selectClass}
                  value={form.category}
                  onChange={(e) => set("category", e.target.value)}
                >
                  <option value="">Select</option>
                  {CATEGORIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </Field>
              <div className="sm:col-span-2">
                <TagInput
                  label="Language Known"
                  values={form.languages}
                  onChange={(languages) => set("languages", languages)}
                  placeholder="Add language..."
                />
              </div>
            </div>
          </SectionCard>

          {customFields && customFields.length > 0 ? (
            <SectionCard
              title="Other Information"
              icon={
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            >
              <div className="grid gap-4 sm:grid-cols-2">
                {customFields.map((field) => (
                  <div
                    key={field.id || field.label}
                    className={field.type === "Textarea" ? "sm:col-span-2" : ""}
                  >
                    <Field
                      label={field.label}
                      required={field.required}
                      error={errors[`custom_${field.label}`]}
                    >
                      {field.type === "Dropdown" ? (
                        <select
                          className={selectClass}
                          value={form.customValues?.[field.label] || ""}
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
                          value={form.customValues?.[field.label] || ""}
                          onChange={(e) => handleCustomChange(field.label, e.target.value)}
                          placeholder={`Enter ${field.label.toLowerCase()}`}
                        />
                      ) : field.type === "Checkbox" ? (
                        <label className="flex items-center gap-2 pt-2 cursor-pointer text-sm text-gray-800 font-medium">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300 text-green-700 focus:ring-green-700 h-4 w-4"
                            checked={Boolean(form.customValues?.[field.label])}
                            onChange={(e) => handleCustomChange(field.label, e.target.checked)}
                          />
                          <span>{field.label}</span>
                        </label>
                      ) : field.type === "Phone" ? (
                        <PhoneInput
                          value={form.customValues?.[field.label] || ""}
                          onChange={(val) => handleCustomChange(field.label, val)}
                          placeholder={`Enter ${field.label.toLowerCase()}`}
                        />
                      ) : (
                        <input
                          type={field.type === "Number" ? "number" : field.type === "Date" ? "date" : "text"}
                          className={inputClass}
                          value={form.customValues?.[field.label] || ""}
                          onChange={(e) => handleCustomChange(field.label, e.target.value)}
                          placeholder={`Enter ${field.label.toLowerCase()}`}
                        />
                      )}
                    </Field>
                  </div>
                ))}
              </div>
            </SectionCard>
          ) : null}

          <SectionCard
            title="Siblings"
            icon={
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 11c0 5.6-7 10-7 10z" />
              </svg>
            }
          >
            <p className="mb-3 text-sm text-gray-700">
              Is Sibling studying in same school
            </p>
            <div className="mb-4 flex gap-2">
              {[true, false].map((v) => (
                <button
                  key={String(v)}
                  type="button"
                  onClick={() => set("hasSibling", v)}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium ${form.hasSibling === v
                      ? "bg-green-800 text-white"
                      : "border border-gray-300 bg-white text-gray-700"
                    }`}
                >
                  {v ? "Yes" : "No"}
                </button>
              ))}
            </div>
            {form.hasSibling
              ? form.siblings.map((sib, idx) => {
                const q = (sib.searchQuery || "").trim();
                const matches =
                  !sib.studentId && q.length >= 1
                    ? (students || [])
                        .filter((s) => s.id !== enquiry?.id && s.name !== enquiry?.studentName && matchStudent(s, q))
                        .slice(0, 8)
                    : [];
                const updateSib = (patch) => {
                  const siblings = [...form.siblings];
                  siblings[idx] = { ...sib, ...patch };
                  set("siblings", siblings);
                };
                const selectStudent = (s) => {
                  const updatedSiblings = [...form.siblings];
                  updatedSiblings[idx] = {
                    ...sib,
                    studentId: s.id || s.name,
                    name: s.name || s.studentName || "",
                    rollNumber: s.rollNumber || "",
                    admissionNo: s.admissionNumber || s.scholarNumber || s.id || s.name || "",
                    className: s.className || "",
                    section: s.section || "",
                    searchQuery: "",
                  };

                  const f = s.admissionForm || {};
                  const cf = s.customValues || (typeof s.custom_fields === "object" ? s.custom_fields : {}) || f.customValues || (typeof f === "object" ? f : {}) || {};

                  const fName = s.father?.name || f.father?.name || cf.father?.name || s.fatherName || cf.fatherName || "";
                  const fPhone = s.father?.phone || f.father?.phone || cf.father?.phone || s.fatherMobile || cf.fatherMobile || "";
                  const fEmail = s.father?.email || f.father?.email || cf.father?.email || s.fatherEmail || cf.fatherEmail || "";
                  const fOcc = s.father?.occupation || f.father?.occupation || cf.father?.occupation || s.fatherOccupation || cf.fatherOccupation || "";

                  const mName = s.mother?.name || f.mother?.name || cf.mother?.name || s.motherName || cf.motherName || "";
                  const mPhone = s.mother?.phone || f.mother?.phone || cf.mother?.phone || s.motherMobile || cf.motherMobile || "";
                  const mEmail = s.mother?.email || f.mother?.email || cf.mother?.email || s.motherEmail || cf.motherEmail || "";
                  const mOcc = s.mother?.occupation || f.mother?.occupation || cf.mother?.occupation || s.motherOccupation || cf.motherOccupation || "";

                  const gRel = s.guardianRelation || f.guardianRelation || cf.guardianRelation || s.guardian?.relation || s.guardianIs || f.guardianIs || "Father";
                  const gName = s.guardian?.name || f.guardian?.name || cf.guardian?.name || s.guardianName || s.parentName || (gRel === "Mother" ? mName : fName) || "";
                  const gPhone = s.guardian?.phone || f.guardian?.phone || s.parentMobile || s.contact || (gRel === "Mother" ? mPhone : fPhone) || "";
                  const gEmail = s.guardian?.email || f.guardian?.email || s.parentEmail || (gRel === "Mother" ? mEmail : fEmail) || "";

                  const currentAddress = s.currentAddress || f.currentAddress || cf.currentAddress || f.address || cf.address || s.address || "";
                  const permanentAddress = s.permanentAddress || f.permanentAddress || cf.permanentAddress || currentAddress || "";
                  const religion = s.religion || f.religion || cf.religion || "";
                  const category = s.category || f.category || cf.category || s.socialCategory || cf.socialCategory || "";
                  const motherTongue = s.motherTongue || f.motherTongue || cf.motherTongue || "";
                  const languages = (s.languages && s.languages.length) ? s.languages : (f.languages && f.languages.length ? f.languages : (cf.languages && cf.languages.length ? cf.languages : []));

                  setForm((prev) => ({
                    ...prev,
                    siblings: updatedSiblings,
                    primaryContact: gPhone || prev.primaryContact,
                    email: gEmail || prev.email,
                    guardianIs: gRel === "Mother" ? "Mother" : gRel === "Father" ? "Father" : "Other",
                    father: {
                      photo: s.father?.photo || f.father?.photo || prev.father?.photo || "",
                      name: fName || prev.father?.name || "",
                      phone: fPhone || prev.father?.phone || "",
                      email: fEmail || prev.father?.email || "",
                      occupation: fOcc || prev.father?.occupation || "",
                    },
                    mother: {
                      photo: s.mother?.photo || f.mother?.photo || prev.mother?.photo || "",
                      name: mName || prev.mother?.name || "",
                      phone: mPhone || prev.mother?.phone || "",
                      email: mEmail || prev.mother?.email || "",
                      occupation: mOcc || prev.mother?.occupation || "",
                    },
                    guardian: {
                      photo: s.guardian?.photo || f.guardian?.photo || prev.guardian?.photo || "",
                      name: gName || prev.guardian?.name || "",
                      relation: gRel || prev.guardian?.relation || "Father",
                      phone: gPhone || prev.guardian?.phone || "",
                      email: gEmail || prev.guardian?.email || "",
                      occupation: s.guardian?.occupation || f.guardian?.occupation || prev.guardian?.occupation || "",
                    },
                    currentAddress: currentAddress || prev.currentAddress,
                    permanentAddress: permanentAddress || prev.permanentAddress,
                    religion: religion || prev.religion,
                    category: category || prev.category,
                    motherTongue: motherTongue || prev.motherTongue,
                    languages: languages.length ? languages : prev.languages,
                    customValues: {
                      ...(prev.customValues || {}),
                      ...(cf || {}),
                    },
                  }));
                };
                return (
                  <div
                    key={idx}
                    className="mb-4 rounded-lg border border-gray-200 p-4"
                  >
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-gray-800">
                        Sibling {idx + 1}
                      </p>
                      {form.siblings.length > 1 ? (
                        <button
                          type="button"
                          className="text-sm text-red-600 hover:underline"
                          onClick={() =>
                            set(
                              "siblings",
                              form.siblings.filter((_, i) => i !== idx)
                            )
                          }
                        >
                          Remove
                        </button>
                      ) : null}
                    </div>

                    {!sib.studentId ? (
                      <div className="relative">
                        <Field label="Search sibling in school">
                          <input
                            className={inputClass}
                            value={sib.searchQuery || ""}
                            onChange={(e) =>
                              updateSib({ searchQuery: e.target.value })
                            }
                            placeholder="Name, admission no, or mobile (student / parent)"
                          />
                        </Field>
                        {matches.length > 0 ? (
                          <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-gray-200 bg-white py-1 shadow-sm">
                            {matches.map((s) => (
                              <li key={s.id}>
                                <button
                                  type="button"
                                  className="flex w-full flex-col px-3 py-2 text-left text-sm hover:bg-green-50"
                                  onClick={() => selectStudent(s)}
                                >
                                  <span className="font-medium text-gray-900">
                                    {s.name}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {[
                                      s.admissionNumber || s.scholarNumber,
                                      s.className,
                                      s.section ? `Sec ${s.section}` : "",
                                      s.studentMobile
                                        ? `Stu ${s.studentMobile}`
                                        : "",
                                      s.parentMobile
                                        ? `Parent ${s.parentMobile}`
                                        : "",
                                    ]
                                      .filter(Boolean)
                                      .join(" · ")}
                                  </span>
                                </button>
                              </li>
                            ))}
                          </ul>
                        ) : null}
                        {q.length >= 2 && matches.length === 0 ? (
                          <p className="mt-1 text-xs text-gray-500">
                            No matching student found. Try name, admission no, or
                            mobile.
                          </p>
                        ) : null}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm">
                          <div>
                            <p className="font-medium text-green-900">
                              {sib.name}
                            </p>
                            <p className="text-xs text-green-800">
                              {[
                                sib.admissionNo,
                                sib.className,
                                sib.section ? `Sec ${sib.section}` : "",
                                sib.rollNumber
                                  ? `Roll ${sib.rollNumber}`
                                  : "",
                              ]
                                .filter(Boolean)
                                .join(" · ")}
                            </p>
                          </div>
                          <button
                            type="button"
                            className="text-sm font-medium text-green-900 hover:underline"
                            onClick={() =>
                              updateSib({
                                studentId: "",
                                name: "",
                                rollNumber: "",
                                admissionNo: "",
                                className: "",
                                section: "",
                                searchQuery: "",
                              })
                            }
                          >
                            Change
                          </button>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                          <Field label="Sibling Name">
                            <input
                              className={`${inputClass} bg-gray-50 text-gray-600`}
                              value={sib.name}
                              disabled
                            />
                          </Field>
                          <Field label="Roll Number">
                            <input
                              className={`${inputClass} bg-gray-50 text-gray-600`}
                              value={sib.rollNumber}
                              disabled
                            />
                          </Field>
                          <Field label="Admission No">
                            <input
                              className={`${inputClass} bg-gray-50 text-gray-600`}
                              value={sib.admissionNo}
                              disabled
                            />
                          </Field>
                          <Field label="Class">
                            <input
                              className={`${inputClass} bg-gray-50 text-gray-600`}
                              value={
                                [sib.className, sib.section]
                                  .filter(Boolean)
                                  .join(" · ") || ""
                              }
                              disabled
                            />
                          </Field>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
              : null}
            {form.hasSibling ? (
              <button
                type="button"
                className="mt-1 rounded-md border border-green-700 px-3 py-1.5 text-sm font-medium text-green-800 hover:bg-green-50"
                onClick={() =>
                  set("siblings", [...form.siblings, emptySibling()])
                }
              >
                + Add New
              </button>
            ) : null}
          </SectionCard>

          <SectionCard
            title="Parent & Guardian Details"
            icon={
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
              </svg>
            }
          >
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3 border-b border-gray-100 pb-2">
                  Father's Details
                </h4>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Field label="Father's Name">
                    <input
                      className={inputClass}
                      value={form.father?.name || ""}
                      onChange={(e) =>
                        setNested("father", { name: e.target.value })
                      }
                      placeholder="Enter father's full name"
                    />
                  </Field>
                  <Field label="Father's Phone">
                    <PhoneInput
                      value={form.father?.phone || ""}
                      onChange={(val) => setNested("father", { phone: val })}
                      placeholder="Enter 10-digit number"
                    />
                  </Field>
                  <Field label="Father's Email">
                    <input
                      type="email"
                      className={inputClass}
                      value={form.father?.email || ""}
                      onChange={(e) =>
                        setNested("father", { email: e.target.value })
                      }
                      placeholder="father@example.com"
                    />
                  </Field>
                  <Field label="Father's Occupation">
                    <input
                      className={inputClass}
                      value={form.father?.occupation || ""}
                      onChange={(e) =>
                        setNested("father", { occupation: e.target.value })
                      }
                      placeholder="e.g. Engineer, Business"
                    />
                  </Field>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3 border-b border-gray-100 pb-2">
                  Mother's Details
                </h4>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Field label="Mother's Name">
                    <input
                      className={inputClass}
                      value={form.mother?.name || ""}
                      onChange={(e) =>
                        setNested("mother", { name: e.target.value })
                      }
                      placeholder="Enter mother's full name"
                    />
                  </Field>
                  <Field label="Mother's Phone">
                    <PhoneInput
                      value={form.mother?.phone || ""}
                      onChange={(val) => setNested("mother", { phone: val })}
                      placeholder="Enter 10-digit number"
                    />
                  </Field>
                  <Field label="Mother's Email">
                    <input
                      type="email"
                      className={inputClass}
                      value={form.mother?.email || ""}
                      onChange={(e) =>
                        setNested("mother", { email: e.target.value })
                      }
                      placeholder="mother@example.com"
                    />
                  </Field>
                  <Field label="Mother's Occupation">
                    <input
                      className={inputClass}
                      value={form.mother?.occupation || ""}
                      onChange={(e) =>
                        setNested("mother", { occupation: e.target.value })
                      }
                      placeholder="e.g. Teacher, Homemaker"
                    />
                  </Field>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3 border-b border-gray-100 pb-2">
                  Primary Contact & Guardian Details
                </h4>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Field label="Guardian Relation">
                    <select
                      className={selectClass}
                      value={form.guardianIs || "Father"}
                      onChange={(e) => {
                        const val = e.target.value;
                        setForm((prev) => ({
                          ...prev,
                          guardianIs: val,
                          guardian:
                            val === "Other"
                              ? {
                                  ...(prev.guardian || {}),
                                  name:
                                    prev.guardianIs === "Other"
                                      ? prev.guardian?.name || ""
                                      : "",
                                  email:
                                    prev.guardianIs === "Other"
                                      ? prev.guardian?.email || ""
                                      : "",
                                  occupation:
                                    prev.guardianIs === "Other"
                                      ? prev.guardian?.occupation || ""
                                      : "",
                                }
                              : prev.guardian,
                        }));
                      }}
                    >
                      <option value="Father">Father</option>
                      <option value="Mother">Mother</option>
                      <option value="Other">Other Guardian</option>
                    </select>
                  </Field>
                  <Field
                    label="Primary Contact Number"
                    required
                    error={errors.primaryContact}
                  >
                    <PhoneInput
                      value={form.primaryContact}
                      onChange={(val) => {
                        set("primaryContact", val);
                        if (val) {
                          setErrors((p) => ({ ...p, primaryContact: "" }));
                        }
                      }}
                      placeholder="Enter 10-digit mobile number"
                    />
                  </Field>

                  {(form.guardianIs === "Other" || form.guardianIs === "Other Guardian") ? (
                    <>
                      <Field label="Guardian Name">
                        <input
                          className={inputClass}
                          value={form.guardian?.name || ""}
                          onChange={(e) =>
                            setNested("guardian", { name: e.target.value })
                          }
                          placeholder="Enter guardian name"
                          autoComplete="off"
                        />
                      </Field>
                      <Field label="Guardian Email">
                        <input
                          type="email"
                          className={inputClass}
                          value={form.guardian?.email || ""}
                          onChange={(e) =>
                            setNested("guardian", { email: e.target.value })
                          }
                          placeholder="Enter guardian email"
                          autoComplete="off"
                        />
                      </Field>
                      <Field label="Guardian Occupation">
                        <input
                          className={inputClass}
                          value={form.guardian?.occupation || ""}
                          onChange={(e) =>
                            setNested("guardian", { occupation: e.target.value })
                          }
                          placeholder="Enter guardian occupation"
                          autoComplete="off"
                        />
                      </Field>
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Address"
            icon={
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2a7 7 0 00-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 00-7-7zm0 9.5A2.5 2.5 0 1112 6a2.5 2.5 0 010 5.5z" />
              </svg>
            }
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Current Address"
                required
                error={errors.currentAddress}
              >
                <textarea
                  className={`${inputClass} min-h-[100px]`}
                  placeholder="Enter current address..."
                  value={form.currentAddress}
                  onChange={(e) => {
                    set("currentAddress", e.target.value);
                    if (e.target.value.trim()) {
                      setErrors((p) => ({ ...p, currentAddress: "" }));
                    }
                  }}
                />
              </Field>
              <Field label="Permanent Address">
                <textarea
                  className={`${inputClass} min-h-[100px]`}
                  placeholder="Enter permanent address..."
                  value={form.permanentAddress}
                  onChange={(e) => set("permanentAddress", e.target.value)}
                />
              </Field>
            </div>
          </SectionCard>

          <SectionCard
            title="Documents"
            icon={
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm1 7V3.5L18.5 9H15z" />
              </svg>
            }
          >
            <div className="grid gap-6 sm:grid-cols-3">
              <DocUpload
                label="Medical Condition"
                hint="Upload image size of 4MB, Accepted Format PDF"
                value={form.docs.medical}
                onChange={(medical) => setNested("docs", { medical })}
              />
              <DocUpload
                label="Upload Transfer Certificate"
                hint="Upload image size of 4MB, Accepted Format PDF"
                value={form.docs.transferCertificate}
                onChange={(transferCertificate) =>
                  setNested("docs", { transferCertificate })
                }
              />
              <DocUpload
                label="Aadhar Card / ID (Identity Proof)"
                required
                error={errors.aadharDoc}
                hint="Upload image size of 4MB, Accepted Format PDF"
                value={form.docs.aadhar}
                onChange={(aadhar) => {
                  setNested("docs", { aadhar });
                  if (aadhar) {
                    setErrors((p) => ({ ...p, aadharDoc: "" }));
                  }
                }}
              />
            </div>
          </SectionCard>

          <SectionCard
            title="Medical History"
            icon={
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zm-7 14h-2v-4H6v-2h4V7h2v4h4v2h-4v4z" />
              </svg>
            }
          >
            <p className="mb-3 text-sm text-gray-700">
              Does the student have any medical history, allergies, or regular medications?
            </p>
            <div className="mb-4 flex gap-2">
              {[true, false].map((v) => (
                <button
                  key={String(v)}
                  type="button"
                  onClick={() => {
                    set("hasMedicalHistory", v);
                    if (!v) {
                      set("allergies", []);
                      set("medications", []);
                    }
                  }}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium ${(form.hasMedicalHistory ?? false) === v
                      ? "bg-green-800 text-white"
                      : "border border-gray-300 bg-white text-gray-700"
                    }`}
                >
                  {v ? "Yes" : "No"}
                </button>
              ))}
            </div>

            {form.hasMedicalHistory ? (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <TagInput
                  label="Allergies"
                  values={form.allergies}
                  onChange={(allergies) => set("allergies", allergies)}
                  placeholder="Add allergy..."
                />
                <TagInput
                  label="Medications"
                  values={form.medications}
                  onChange={(medications) => set("medications", medications)}
                  placeholder="Add medication..."
                />
              </div>
            ) : null}
          </SectionCard>

          <SectionCard
            title="Previous School Details"
            icon={
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3L1 9l11 6 9-4.9V17h2V9L12 3zM5 13.2v3.3L12 20l7-3.5v-3.3L12 17l-7-3.8z" />
              </svg>
            }
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="School Name">
                <input
                  className={inputClass}
                  value={form.previousSchoolName}
                  onChange={(e) => set("previousSchoolName", e.target.value)}
                />
              </Field>
              <Field label="Address">
                <input
                  className={inputClass}
                  value={form.previousSchoolAddress}
                  onChange={(e) => set("previousSchoolAddress", e.target.value)}
                />
              </Field>
            </div>
          </SectionCard>

          <SectionCard
            title="Bank Account Detail"
            icon={
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 10h18v2H3v-2zm0 4h18v6H3v-6zm2 2v2h2v-2H5zm14-10l-8-4-8 4v2h16V6z" />
              </svg>
            }
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Bank Name">
                <input
                  className={inputClass}
                  value={form.bank.bankName}
                  onChange={(e) =>
                    setNested("bank", { bankName: e.target.value })
                  }
                />
              </Field>
              <Field label="Branch">
                <input
                  className={inputClass}
                  value={form.bank.branch}
                  onChange={(e) => setNested("bank", { branch: e.target.value })}
                />
              </Field>
              <Field label="IFSC Number">
                <input
                  className={inputClass}
                  value={form.bank.ifsc}
                  onChange={(e) =>
                    setNested("bank", {
                      ifsc: e.target.value.toUpperCase().slice(0, 11),
                    })
                  }
                />
              </Field>
              <Field label="Other Information">
                <input
                  className={inputClass}
                  value={form.bank.other}
                  onChange={(e) => setNested("bank", { other: e.target.value })}
                />
              </Field>
              <Field label="Account Number">
                <input
                  className={inputClass}
                  placeholder="Enter bank account number"
                  value={form.bank.accountNumber}
                  onChange={(e) =>
                    setNested("bank", {
                      accountNumber: e.target.value.replace(/\D/g, ""),
                    })
                  }
                />
              </Field>
              <Field label="Account Holder Name">
                <input
                  className={inputClass}
                  placeholder="As per bank records"
                  value={form.bank.accountHolder}
                  onChange={(e) =>
                    setNested("bank", { accountHolder: e.target.value })
                  }
                />
              </Field>
            </div>
          </SectionCard>
        </fieldset>

        <div className="flex flex-wrap justify-end gap-2 pb-8">
          {preview ? (
            <>
              <Link
                to={`/front-office/enquiries?open=${enquiry.id}`}
                className={btnSecondary}
              >
                ← Back to inquiry
              </Link>
              <button
                type="button"
                className={btnPrimary}
                onClick={saveFacultyChanges}
              >
                Save Changes
              </button>
              {enquiry.status === "Form Submitted" ||
                enquiry.status === "Corrections Submitted" ? (
                <>
                  <button
                    type="button"
                    className={btnSecondary}
                    onClick={() => {
                      setCorrectionDraft("");
                      setShowFacultyCorrections(true);
                    }}
                  >
                    Request corrections
                  </button>
                  <button
                    type="button"
                    className={btnPrimary}
                    onClick={() => {
                      verifyAdmission(enquiry.id);
                      navigate(`/front-office/enquiries?open=${enquiry.id}`);
                    }}
                  >
                    Verify & approve
                  </button>
                </>
              ) : null}
            </>
          ) : (
            <>
              <Link to="/login" className={btnSecondary}>
                Cancel
              </Link>
              <button type="submit" className={btnPrimary}>
                Submit admission form
              </button>
            </>
          )}
        </div>
      </form>

      {preview && showFacultyCorrections ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close"
            onClick={() => setShowFacultyCorrections(false)}
          />
          <div className="relative w-full max-w-lg rounded-lg bg-white p-6 shadow-lg">
            <h2 className="text-xl font-bold text-gray-900">
              Request corrections
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Parent will see these notes and can resubmit the form.
            </p>
            <Field label="What should the parent fix?">
              <textarea
                className={`${inputClass} mt-2 min-h-[90px]`}
                value={correctionDraft}
                onChange={(e) => setCorrectionDraft(e.target.value)}
                placeholder="e.g. Upload clearer birth certificate"
              />
            </Field>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className={btnSecondary}
                onClick={() => setShowFacultyCorrections(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={btnPrimary}
                onClick={() => {
                  if (!correctionDraft.trim()) return;
                  requestAdmissionCorrections(
                    enquiry.id,
                    correctionDraft.trim()
                  );
                  setShowFacultyCorrections(false);
                  navigate(`/front-office/enquiries?open=${enquiry.id}`);
                }}
              >
                Send request
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** Public parent form — shares app FrontOfficeProvider (in-memory demo state). */
export default function ParentAdmissionPage() {
  return (
    <div className="min-h-screen bg-gray-100 px-4 py-8">
      <ParentAdmissionFormInner />
    </div>
  );
}
