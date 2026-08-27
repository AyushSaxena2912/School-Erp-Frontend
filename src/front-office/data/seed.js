const today = new Date();
const iso = (d) => d.toISOString().slice(0, 10);
const daysFromNow = (n) => {
  const d = new Date(today);
  d.setDate(d.getDate() + n);
  return iso(d);
};
const daysAgo = (n) => daysFromNow(-n);

export function formatDateDMY(str) {
  if (!str) return "—";
  const clean = String(str).split(" ")[0].split("T")[0];
  const parts = clean.split("-");
  if (parts.length === 3 && parts[0].length === 4) {
    const [y, m, d] = parts;
    return `${d}/${m}/${y}`;
  }
  return str;
}

export function formatDateTimeDMY(str) {
  if (!str) return "—";
  try {
    const s = String(str).trim();
    const parts = s.includes("T") ? s.split("T") : s.split(" ");
    const rawDate = parts[0];
    const rawTime = parts[1] || "";
    let dmy = rawDate;
    const dateParts = rawDate.split("-");
    if (dateParts.length === 3 && dateParts[0].length === 4) {
      const [y, m, d] = dateParts;
      dmy = `${d}/${m}/${y}`;
    }
    if (!rawTime) return dmy;
    const timeClean = rawTime.split(".")[0];
    const timeParts = timeClean.split(":");
    const timeStr = timeParts.length >= 2 ? `${timeParts[0]}:${timeParts[1]}` : rawTime;
    return `${dmy} ${timeStr}`;
  } catch {
    return str;
  }
}

export const CURRENT_USER = {
  id: "admin",
  name: "Administrator",
  role: "Administrator",
  email: "admin@school.edu",
};

/** Admission pipeline statuses (Steps 1–6). */
export const ADMISSION_STATUSES = [
  "Inquiry",
  "Follow-up Pending",
  "Admission Approved",
  "Form Sent",
  "Form Submitted",
  "Corrections Requested",
  "Corrections Submitted",
  "Verified",
  "Accounts Created",
  "Lost",
];

export function makeAdmissionToken() {
  return `adm_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function makeAdmissionNumber(enquiryId) {
  const y = new Date().getFullYear();
  if (enquiryId && String(enquiryId).includes("-")) {
    return `STU-${y}-${String(enquiryId).split("-").pop()}`;
  }
  const n = String(Math.floor(1000 + Math.random() * 9000));
  return `STU-${y}-${n}`;
}

export function makeTempPassword() {
  return `Stu@${Math.random().toString(36).slice(2, 8)}`;
}

export function makeParentActivationToken() {
  return `act_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}


export const initialStaff = [];

export const initialClasses = [
  { id: "cls-1", name: "Nursery", feeStructureId: "fee-1" },
  { id: "cls-2", name: "LKG", feeStructureId: "fee-1" },
  { id: "cls-3", name: "UKG", feeStructureId: "fee-1" },
  { id: "cls-4", name: "Class 1", feeStructureId: "fee-2" },
  { id: "cls-5", name: "Class 2", feeStructureId: "fee-2" },
  { id: "cls-6", name: "Class 5", feeStructureId: "fee-3" },
  { id: "cls-7", name: "Class 8", feeStructureId: "fee-3" },
  { id: "cls-8", name: "Class 10", feeStructureId: "fee-4" },
];

export const initialFeeStructures = [
  { id: "fee-1", name: "Pre-Primary Standard", amount: 45000 },
  { id: "fee-2", name: "Primary Standard", amount: 52000 },
  { id: "fee-3", name: "Middle Standard", amount: 58000 },
  { id: "fee-4", name: "Secondary Standard", amount: 65000 },
];

export const REFERRAL_OPTIONS = [
  "Walk-in",
  "Existing Parent",
  "Staff Referral",
  "Website",
  "Social Media",
  "Advertisement",
  "Other",
];

export function isStaffReferral(referral) {
  return (
    referral === "Staff Referral" ||
    referral === "Told by staff" ||
    referral === "Staff referral"
  );
}

export const CALL_OUTCOMES = [
  "Not Called Yet",
  "Call Not Picked",
  "Interested",
  "Not Interested",
  "Admitted",
  "Needs Another Follow-up",
];

export const ENQUIRY_STATUSES = [
  "Inquiry",
  "Admission Approved",
  "Form Sent",
  "Form Submitted",
  "Corrections Requested",
  "Corrections Submitted",
  "Verified",
  "Accounts Created",
  "Lost",
  // legacy
  "New",
  "Follow-up Pending",
  "Admitted",
];

/** How strong the interest is — separate from pipeline Status. */
export const LEAD_TYPES = ["Hot Lead", "Warm Lead", "Cold Lead", "Closed"];

/** Selectable when capturing / editing an open enquiry (not after convert). */
export const ACTIVE_LEAD_TYPES = ["Hot Lead", "Warm Lead", "Cold Lead"];

export const LEAD_TYPE_HINTS = {
  "Hot Lead": "Ready to visit / decide soon",
  "Warm Lead": "Interested, still deciding",
  "Cold Lead": "Early enquiry / low urgency",
  Closed: "Converted to admission",
};

export const STATUS_HINTS = {
  New: "Just captured",
  "Follow-up Pending": "Call / follow-up scheduled",
  Admitted: "Converted to admission",
  Lost: "Not going ahead",
};

export const VISITOR_PURPOSES = [
  "General Inquiry",
  "Meet Staff",
  "Meet Student",
  "Vendor",
  "Other",
];

/** Visitor's relation to the student (when visiting for a student). */
export const VISITOR_RELATIONS = [
  "Father",
  "Mother",
  "Guardian",
  "Relative",
  "Other",
];

export const COMPLAINT_NATURES = [
  "Academic",
  "Behavioral",
  "Transport",
  "Fee",
  "Facility",
  "Staff",
  "Others",
];

export const COMPLAINT_STATUSES = ["New", "In Progress", "Resolved", "Closed"];

/** How the complaint entered the register. */
export const COMPLAINT_MODES = ["Online", "Offline"];

/** Who raised it (Online = Student/Parent ERP; Offline = Front Office desk). */
export const COMPLAINT_RAISED_BY = ["Student", "Parent", "Front Office"];

/** Filter / display labels for complaint source. */
export const COMPLAINT_SOURCES = [
  "Offline · Student",
  "Offline · Parent / Guardian",
  "Online · Student",
  "Online · Parent / Guardian",
];

export function complaintSourceLabel(complaint) {
  if (!complaint) return "Offline · Parent / Guardian";
  if (complaint.mode === "Online") {
    if (complaint.raisedBy === "Student") return "Online · Student";
    return "Online · Parent / Guardian";
  }
  if (complaint.relation === "Student") return "Offline · Student";
  return "Offline · Parent / Guardian";
}

export function parseComplaintSource(label) {
  if (label === "Online · Student")
    return { mode: "Online", raisedBy: "Student", relation: "" };
  if (
    label === "Online · Parent / Guardian" ||
    label === "Online · Parent"
  )
    return { mode: "Online", raisedBy: "Parent" };
  if (label === "Offline · Student")
    return {
      mode: "Offline",
      raisedBy: "Front Office",
      relation: "Student",
    };
  // Offline · Parent / Guardian + legacy labels
  return { mode: "Offline", raisedBy: "Front Office" };
}

/** Relation of the primary contact to the student (admission enquiry). */
export const GUARDIAN_RELATIONS = [
  "Father",
  "Mother",
  "Relative",
  "Other",
];

/** Complainant relation to the student. */
export const COMPLAINT_RELATIONS = [
  "Father",
  "Mother",
  "Guardian",
  "Student",
  "Relative",
  "Other",
];

/** Relation to show in UI — blank when student raised online (self). */
export function complaintRelationLabel(complaint) {
  if (!complaint) return "";
  if (complaint.mode === "Online" && complaint.raisedBy === "Student") {
    return "";
  }
  return complaint.relation || "";
}

export const RELATION_OPTIONS = [
  "Father",
  "Mother",
  "Guardian",
  "Student",
  "Vendor",
  "Other",
];

export const STUDENT_REQUIRED_RELATIONS = [
  "Father",
  "Mother",
  "Guardian",
  "Student",
];

export const initialStudents = [
  {
    id: "stu-1",
    name: "Aarav Patel",
    scholarNumber: "SCH2024001",
    admissionNumber: "ADM2024001",
    rollNumber: "12",
    className: "Class 5",
    section: "A",
    studentMobile: "9876501001",
    parentMobile: "9876501002",
  },
  {
    id: "stu-2",
    name: "Diya Kapoor",
    scholarNumber: "SCH2024012",
    admissionNumber: "ADM2024012",
    rollNumber: "5",
    className: "Class 2",
    section: "B",
    studentMobile: "9876502001",
    parentMobile: "9876502002",
  },
  {
    id: "stu-3",
    name: "Kabir Sharma",
    scholarNumber: "SCH2024033",
    admissionNumber: "ADM2024033",
    rollNumber: "8",
    className: "Class 8",
    section: "A",
    studentMobile: "9876503001",
    parentMobile: "9876503002",
  },
  {
    id: "stu-4",
    name: "Anvi Reddy",
    scholarNumber: "SCH2024045",
    admissionNumber: "ADM2024045",
    rollNumber: "3",
    className: "Class 1",
    section: "C",
    studentMobile: "9876504001",
    parentMobile: "9876504002",
  },
  {
    id: "stu-5",
    name: "Reyansh Gupta",
    scholarNumber: "SCH2024058",
    admissionNumber: "ADM2024058",
    rollNumber: "21",
    className: "Class 10",
    section: "A",
    studentMobile: "9876505001",
    parentMobile: "9876505002",
  },
  {
    id: "stu-6",
    name: "Myra Joshi",
    scholarNumber: "SCH2024071",
    admissionNumber: "ADM2024071",
    rollNumber: "2",
    className: "UKG",
    section: "A",
    studentMobile: "9876506001",
    parentMobile: "9876506002",
  },
];

/** Name · scholar · class · section for list / form chips. */
export function formatStudentLabel({
  name,
  studentName,
  scholarNumber,
  className,
  section,
} = {}) {
  return [
    name || studentName,
    scholarNumber,
    className,
    section ? `Sec ${section}` : "",
  ]
    .map((p) => String(p || "").trim())
    .filter(Boolean)
    .join(" · ");
}

export const initialCustomFields = [
  {
    id: "cf-garam",
    label: "garam",
    type: "Text",
    required: false,
    options: [],
    placeholder: "Enter garam",
  },
  {
    id: "cf-paani",
    label: "paani",
    type: "Text",
    required: false,
    options: [],
    placeholder: "Enter paani",
  },
];

/** Join first / middle / last into a display name. */
export function joinNameParts(first, middle, last) {
  return [first, middle, last]
    .map((p) => String(p || "").trim())
    .filter(Boolean)
    .join(" ");
}

/** Best-effort split of a full name into first / middle / last. */
export function splitFullName(full) {
  const parts = String(full || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return { first: "", middle: "", last: "" };
  if (parts.length === 1) return { first: parts[0], middle: "", last: "" };
  if (parts.length === 2) return { first: parts[0], middle: "", last: parts[1] };
  return {
    first: parts[0],
    middle: parts.slice(1, -1).join(" "),
    last: parts[parts.length - 1],
  };
}

/** Ensure enquiry has name parts + derived full names for display. */
export function normalizeEnquiryNames(enquiry) {
  const student =
    enquiry.studentFirstName || enquiry.studentLastName
      ? {
          first: enquiry.studentFirstName || "",
          middle: enquiry.studentMiddleName || "",
          last: enquiry.studentLastName || "",
        }
      : splitFullName(enquiry.studentName);

  let guardian =
    enquiry.guardianFirstName || enquiry.guardianLastName
      ? {
          first: enquiry.guardianFirstName || "",
          middle: enquiry.guardianMiddleName || "",
          last: enquiry.guardianLastName || "",
        }
      : null;
  let guardianRelation = enquiry.guardianRelation || "";

  // Migrate legacy father / mother fields → guardian(s)
  if (!guardian) {
    const father =
      enquiry.fatherFirstName || enquiry.fatherLastName
        ? {
            first: enquiry.fatherFirstName || "",
            middle: enquiry.fatherMiddleName || "",
            last: enquiry.fatherLastName || "",
          }
        : splitFullName(enquiry.parentName || enquiry.fatherName);
    const fatherName = joinNameParts(father.first, father.middle, father.last);
    if (fatherName) {
      guardian = father;
      guardianRelation =
        guardianRelation ||
        (enquiry.fatherFirstName || enquiry.fatherLastName || enquiry.fatherName
          ? "Father"
          : "");
    } else {
      guardian = { first: "", middle: "", last: "" };
    }
  }

  let guardian2 =
    enquiry.guardian2FirstName || enquiry.guardian2LastName
      ? {
          first: enquiry.guardian2FirstName || "",
          middle: enquiry.guardian2MiddleName || "",
          last: enquiry.guardian2LastName || "",
        }
      : null;
  let guardian2Relation = enquiry.guardian2Relation || "";

  if (!guardian2) {
    const mother =
      enquiry.motherFirstName || enquiry.motherLastName || enquiry.motherName
        ? enquiry.motherFirstName || enquiry.motherLastName
          ? {
              first: enquiry.motherFirstName || "",
              middle: enquiry.motherMiddleName || "",
              last: enquiry.motherLastName || "",
            }
          : splitFullName(enquiry.motherName)
        : { first: "", middle: "", last: "" };
    const motherName = joinNameParts(mother.first, mother.middle, mother.last);
    if (motherName || enquiry.includeMother) {
      guardian2 = mother;
      guardian2Relation = guardian2Relation || "Mother";
    } else {
      guardian2 = { first: "", middle: "", last: "" };
    }
  }

  const studentName = joinNameParts(student.first, student.middle, student.last);
  const guardianName = joinNameParts(
    guardian.first,
    guardian.middle,
    guardian.last
  );
  const guardian2Name = joinNameParts(
    guardian2.first,
    guardian2.middle,
    guardian2.last
  );
  const includeSecondGuardian = Boolean(
    guardian2Name || enquiry.includeSecondGuardian || enquiry.includeMother
  );

  const fatherName =
    guardianRelation === "Father"
      ? guardianName
      : guardian2Relation === "Father"
        ? guardian2Name
        : enquiry.fatherName || "";
  const motherName =
    guardianRelation === "Mother"
      ? guardianName
      : guardian2Relation === "Mother"
        ? guardian2Name
        : enquiry.motherName || "";

  return {
    ...enquiry,
    studentFirstName: student.first,
    studentMiddleName: student.middle,
    studentLastName: student.last,
    guardianFirstName: guardian.first,
    guardianMiddleName: guardian.middle,
    guardianLastName: guardian.last,
    guardianRelation: guardianRelation || (guardianName ? "Guardian" : ""),
    guardianName,
    guardian2FirstName: includeSecondGuardian ? guardian2.first : "",
    guardian2MiddleName: includeSecondGuardian ? guardian2.middle : "",
    guardian2LastName: includeSecondGuardian ? guardian2.last : "",
    guardian2Relation: includeSecondGuardian
      ? guardian2Relation || (guardian2Name ? "Guardian" : "")
      : "",
    guardian2Name: includeSecondGuardian ? guardian2Name : "",
    includeSecondGuardian: includeSecondGuardian && Boolean(guardian2Name),
    studentName,
    fatherName,
    motherName,
    parentName: guardianName || enquiry.parentName || "",
  };
}

/** Editable admission form field config (system fields can change label/required/visibility). */
export const initialSystemFields = [
  {
    id: "sys-studentName",
    key: "studentName",
    label: "Student Name",
    type: "Text",
    required: true,
    active: true,
    system: true,
  },
  {
    id: "sys-parentName",
    key: "parentName",
    label: "Guardian Name",
    type: "Text",
    required: false,
    active: true,
    system: true,
  },
  {
    id: "sys-contact",
    key: "contact",
    label: "Contact Number",
    type: "Phone",
    required: true,
    active: true,
    system: true,
  },
  {
    id: "sys-classId",
    key: "classId",
    label: "Class Applying For",
    type: "Class",
    source: "classes",
    required: true,
    active: true,
    system: true,
  },
  {
    id: "sys-feeStructureId",
    key: "feeStructureId",
    label: "Fee Structure",
    type: "Fee Structure",
    source: "fees",
    required: false,
    active: false,
    system: true,
  },
  {
    id: "sys-referral",
    key: "referral",
    label: "Enquiry Source",
    type: "Dropdown",
    required: false,
    active: true,
    system: true,
  },
  {
    id: "sys-leadType",
    key: "leadType",
    label: "Lead Temperature",
    type: "Dropdown",
    required: false,
    active: true,
    system: true,
  },

  {
    id: "sys-enquiryDetails",
    key: "enquiryDetails",
    label: "Enquiry Details",
    type: "Textarea",
    required: false,
    active: true,
    system: true,
  },
];

export const initialEnquiries = [];
export const initialVisitors = [];
export const initialComplaints = [];

export function getNextPendingFollowUp(enquiry) {
  if (!enquiry?.followUps?.length) return null;
  const pending = [...enquiry.followUps]
    .filter((f) => f.outcome === "Not Called Yet")
    .sort((a, b) => followUpSortKey(a).localeCompare(followUpSortKey(b)));
  return pending[0] || null;
}

export function getNextFollowUpDate(enquiry) {
  return getNextPendingFollowUp(enquiry)?.dateToCall || null;
}

/** Sort key: date + earliest actionable time. */
export function followUpSortKey(fu) {
  const date = fu?.dateToCall || "";
  const type = fu?.timeType || (fu?.timeToCall ? "at" : "");
  let time = "23:59";
  if (type === "at" || type === "after" || type === "between") {
    time = fu.timeToCall || "23:59";
  }
  return `${date}T${time}`;
}

export function formatFollowUpWhen(fu) {
  if (!fu?.dateToCall) return "—";
  const formattedDate = formatDateDMY(fu.dateToCall);
  const timeLabel = formatFollowUpTimeLabel(fu);
  return timeLabel ? `${formattedDate} · ${timeLabel}` : formattedDate;
}

/** Human-readable call window only (no date). */
export function formatFollowUpTimeLabel(fu) {
  if (!fu) return "";
  const type = fu.timeType || (fu.timeToCall ? "at" : "");
  if (!type || !fu.timeToCall) return "";
  if (type === "after") return `After ${fu.timeToCall}`;
  if (type === "between" && fu.timeToCallEnd) {
    return `${fu.timeToCall} – ${fu.timeToCallEnd}`;
  }
  return `At ${fu.timeToCall}`;
}

/** Overdue | Today | Upcoming based on date + call-time preference. */
export function getFollowUpUrgency(fu) {
  if (!fu?.dateToCall) return null;
  const today = todayISO();
  const date = fu.dateToCall;
  const type = fu.timeType || (fu.timeToCall ? "at" : "");

  if (date < today) return "Overdue";
  if (date > today) return "Upcoming";

  // date === today
  if (!type || !fu.timeToCall) return "Today";

  const now = new Date();
  const at = (t) => {
    const d = new Date(`${date}T${t}:00`);
    return Number.isNaN(d.getTime()) ? null : d;
  };

  if (type === "at") {
    const when = at(fu.timeToCall);
    if (!when) return "Today";
    return when < now ? "Overdue" : "Today";
  }

  if (type === "after") {
    // Window opens after this time; overdue only next day (handled above).
    return "Today";
  }

  if (type === "between") {
    const end = at(fu.timeToCallEnd || "23:59");
    if (end && now > end) return "Overdue";
    return "Today";
  }

  return "Today";
}

export function todayISO() {
  return iso(today);
}

export function smartSearchMatch(item, query, fieldKeys) {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return true;

  const values = fieldKeys
    .map((k) => (typeof k === "function" ? k(item) : item[k]))
    .filter((v) => v !== null && v !== undefined && v !== "")
    .map((v) => String(v).toLowerCase());

  if (values.length === 0) return false;

  const queryTokens = q.split(/\s+/).filter(Boolean);
  const allWords = values.flatMap((v) => v.split(/[\s,._\-@]+/)).filter(Boolean);
  const fullHaystack = values.join(" ");

  return queryTokens.every((token) => {
    if (token.length <= 2) {
      return (
        allWords.some((w) => w.startsWith(token)) ||
        values.some((v) => v.startsWith(token))
      );
    }
    return fullHaystack.includes(token);
  });
}
