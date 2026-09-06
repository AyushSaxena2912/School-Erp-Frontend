/**
 * Translation between the backend's `snake_case` DocType fields and the
 * `camelCase` shape the existing views were written against.
 *
 * The API contract has exactly one spelling per field and accepts no aliases,
 * so the adapting happens here, at the edge. Keeping it in one
 * module means the mapping is reviewable rather than scattered through pages.
 *
 * As views are rewritten they should move to the backend field names directly
 * and drop these.
 */

import type { ComplaintRegister, Student, VisitorLog } from "@/types/generated/doctypes";

/**
 * Fields pulled from the linked Student record. Frappe returns these when a
 * list query asks for `student.student_name`-style paths.
 */
interface LinkedStudentFields {
  student_name?: string | null;
  student_grade?: string | null;
}

const joinName = (...parts: (string | null | undefined)[]): string =>
  parts.filter(Boolean).join(" ").trim();

/**
 * A Student link, or "" when the value is not one.
 *
 * The visitor form lets the desk type a name that matches no record and used to
 * synthesise `student-<name>` as a stand-in id. That is not a Student record, so
 * sending it fails link validation.
 */
function isStudentLink(value: string | null | undefined): string {
  const id = (value ?? "").trim();
  if (!id || id.startsWith("student-")) return "";
  return id;
}

// ---------------------------------------------------------------- students

export interface StudentOption {
  id: string;
  name: string;
  className: string;
  section: string;
  scholarNumber: string;
}

/**
 * A Student row as the visitor/complaint pickers expect it.
 *
 * The admission number *is* the record name, so `id` and `scholarNumber` are
 * the same value. `section` has no home on Student yet, so it stays blank.
 */
export function toStudentOption(row: Student): StudentOption {
  return {
    id: row.name,
    name: row.student_name ?? row.name,
    className: row.grade ?? "",
    section: "",
    scholarNumber: row.name,
  };
}

// ---------------------------------------------------------------- visitors

export interface VisitorView {
  id: string;
  name: string;
  contact: string;
  purpose: string;
  relation: string;
  /** The Student record's name, which is also the admission number. */
  student: string | null;
  studentId: string;
  studentName: string;
  scholarNumber: string;
  className: string;
  section: string;
  whomToMeet: string;
  checkIn: string;
  checkOut: string | null;
  remarks: string;
}

export function toVisitorView(row: VisitorLog): VisitorView {
  return {
    id: row.name,
    name: row.visitor_name ?? "",
    contact: row.contact_number ?? "",
    purpose: row.purpose_of_visit ?? "",
    relation: row.relation_to_student ?? "",
    student: row.student ?? null,
    // Resolved from the linked Student record when the caller asked for those
    // columns (`student.student_name` etc. via /api/resource fetch-from-link).
    studentId: row.student ?? "",
    studentName: (row as LinkedStudentFields).student_name ?? row.student ?? "",
    // The admission number *is* the Student record name.
    scholarNumber: row.student ?? "",
    className: (row as LinkedStudentFields).student_grade ?? "",
    section: "",
    whomToMeet: row.whom_to_meet ?? "",
    checkIn: row.check_in_time ?? "",
    checkOut: row.check_out_time ?? null,
    remarks: row.remarks ?? "",
  };
}

/** Only fields the backend actually accepts are emitted. */
export function fromVisitorView(view: Partial<VisitorView>): Partial<VisitorLog> {
  const payload: Partial<VisitorLog> = {};
  if (view.name !== undefined) payload.visitor_name = view.name;
  if (view.contact !== undefined) payload.contact_number = view.contact;
  if (view.purpose !== undefined) payload.purpose_of_visit = view.purpose as VisitorLog["purpose_of_visit"];
  if (view.relation !== undefined)
    payload.relation_to_student = (view.relation || undefined) as VisitorLog["relation_to_student"];
  // `student` is a Link to Student, so only a real record name may go in it. A
  // typed-but-unmatched name would be rejected as a broken link, so it is
  // dropped rather than sent. `studentName` is display-only, resolved from the
  // link on read.
  if (view.student !== undefined || view.studentId !== undefined)
    payload.student = isStudentLink(view.student ?? view.studentId) || undefined;
  if (view.whomToMeet !== undefined) payload.whom_to_meet = view.whomToMeet;
  if (view.remarks !== undefined) payload.remarks = view.remarks;
  if (view.checkIn) payload.check_in_time = toFrappeDatetime(view.checkIn);
  return payload;
}

// -------------------------------------------------------------- complaints

export interface ComplaintView {
  id: string;
  complainantName: string;
  relation: string;
  student: string | null;
  /** The Student link as the form holds it; same value as `student`. */
  studentId: string;
  studentName: string;
  contact: string;
  nature: string;
  natureOther: string | null;
  source: string;
  date: string;
  status: ComplaintRegister["status"];
  description: string;
  resolutionNotes: string;
  assignedTo: string | null;
}

export function toComplaintView(row: ComplaintRegister): ComplaintView {
  return {
    id: row.name,
    complainantName: row.complainant_name ?? "",
    relation: row.relation_to_student ?? "",
    student: row.student ?? null,
    studentId: row.student ?? "",
    studentName: (row as LinkedStudentFields).student_name ?? row.student ?? "",
    contact: row.mobile_number ?? "",
    nature: row.nature_of_complaint ?? "",
    natureOther: null,
    source: row.source ?? "",
    date: row.date ?? "",
    status: row.status,
    description: row.brief_discussion ?? "",
    resolutionNotes: row.resolution_notes ?? "",
    assignedTo: row.assigned_to ?? null,
  };
}

export function fromComplaintView(view: Partial<ComplaintView>): Partial<ComplaintRegister> {
  const payload: Partial<ComplaintRegister> = {};
  if (view.complainantName !== undefined) payload.complainant_name = view.complainantName;
  if (view.relation !== undefined)
    payload.relation_to_student = (view.relation || undefined) as ComplaintRegister["relation_to_student"];
  // `student` is a Link to Student, so only a real record name may go in it. A
  // typed-but-unmatched name would be rejected as a broken link, so it is
  // dropped rather than sent. `studentName` is display-only, resolved from the
  // link on read.
  if (view.student !== undefined || view.studentId !== undefined)
    payload.student = isStudentLink(view.student ?? view.studentId) || undefined;
  if (view.contact !== undefined) payload.mobile_number = view.contact;
  if (view.nature !== undefined)
    payload.nature_of_complaint = view.nature as ComplaintRegister["nature_of_complaint"];
  if (view.source !== undefined) payload.source = view.source as ComplaintRegister["source"];
  if (view.date !== undefined) payload.date = view.date;
  if (view.description !== undefined) payload.brief_discussion = view.description;
  if (view.resolutionNotes !== undefined) payload.resolution_notes = view.resolutionNotes;
  if (view.assignedTo !== undefined) payload.assigned_to = view.assignedTo ?? undefined;
  return payload;
}

// ----------------------------------------------------------------- shared

/**
 * `<input type="datetime-local">` produces "YYYY-MM-DDTHH:mm"; Frappe stores
 * "YYYY-MM-DD HH:mm:ss".
 */
export function toFrappeDatetime(value: string): string {
  if (!value) return value;
  const normalised = value.replace("T", " ");
  return normalised.length === 16 ? `${normalised}:00` : normalised;
}

/** The inverse, for pre-filling a datetime-local input. */
export function toInputDatetime(value: string | null | undefined): string {
  if (!value) return "";
  return value.replace(" ", "T").slice(0, 16);
}

export { joinName };

// -------------------------------------------------------------- enquiries

/** The shape `EnquiryForm` emits. */
export interface EnquiryFormValues {
  studentFirstName?: string;
  studentMiddleName?: string;
  studentLastName?: string;
  studentGender?: string;
  studentMobile?: string;
  guardianFirstName?: string;
  guardianMiddleName?: string;
  guardianLastName?: string;
  guardianRelation?: string;
  parentMobile?: string;
  parentEmail?: string;
  classId?: string;
  leadType?: string;
  referral?: string;
  assignedTo?: string;
  customValues?: Record<string, string | number | null>;
}

/**
 * Only fields the backend accepts are emitted.
 *
 * `status` is deliberately absent: a new enquiry always starts at `Inquiry`,
 * and later moves go through the pipeline endpoints so the transition table is
 * consulted. Sending it here would be silently ignored.
 */
export function fromEnquiryForm(values: EnquiryFormValues): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  const set = (key: string, value: unknown) => {
    if (value !== undefined && value !== null && value !== "") payload[key] = value;
  };

  set("student_first_name", values.studentFirstName);
  set("student_middle_name", values.studentMiddleName);
  set("student_last_name", values.studentLastName);
  set("gender", values.studentGender);
  set("student_mobile", values.studentMobile);
  set("guardian_first_name", values.guardianFirstName);
  set("guardian_middle_name", values.guardianMiddleName);
  set("guardian_last_name", values.guardianLastName);
  set("guardian_relation", values.guardianRelation);
  set("guardian_mobile", values.parentMobile);
  set("guardian_email", values.parentEmail);
  set("class_applying_for", values.classId);
  set("lead_temperature", values.leadType);
  set("enquiry_source", values.referral);
  set("assigned_to", values.assignedTo);

  if (values.customValues && Object.keys(values.customValues).length) {
    payload.custom_values = values.customValues;
  }
  return payload;
}
