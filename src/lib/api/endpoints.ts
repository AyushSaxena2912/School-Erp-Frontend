/**
 * Every backend method endpoint, typed, in one place.
 *
 * Mirrors docs/api/README.md. If a call is not here, it does not exist — do not
 * hand-roll a `fetch` at a call site.
 *
 * Field names are `snake_case`, exactly as the backend expects. There are no
 * aliases: a mis-spelled key is silently ignored, not mapped.
 */

import { callMethod } from "./client";
import type {
  AdmissionEnquiry,
  ComplaintRegister,
  EnquiryFollowup,
  VisitorLog,
} from "@/types/generated/doctypes";

const FO = "education.api.front_office";

// ---------------------------------------------------------------- auth

export interface Session {
  user: string;
  email?: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  user_image?: string | null;
  user_type?: string;
  roles?: string[];
  is_authenticated: boolean;
  csrf_token: string;
  status?: string;
}

export const auth = {
  login: (usr: string, pwd: string) =>
    callMethod<Session>("education.api.auth.login", { usr, pwd }),

  me: () => callMethod<Session>("education.api.auth.me", undefined, "GET"),

  logout: () => callMethod<{ status: string }>("education.api.auth.logout"),

  forgotPassword: (user: string) =>
    callMethod<{ status: string; message: string }>("education.api.auth.forgot_password", { user }),

  resetPassword: (key: string, new_password: string) =>
    callMethod<Session>("education.api.auth.reset_password", { key, new_password }),

  changePassword: (old_password: string, new_password: string) =>
    callMethod<Session>("education.api.auth.change_password", { old_password, new_password }),
};

// ------------------------------------------------------------ admissions

/** School-defined extra fields, as a flat map. */
export type CustomValues = Record<string, string | number | null>;

/**
 * `custom_values` is a child table in the schema but a flat `{key: value}` map
 * on the wire — the API flattens it because that is what a form needs. The
 * generated DocType type describes the *storage* shape, so it is omitted and
 * redeclared here. (Caught by tsc when these two disagreed.)
 */
export interface EnquiryPayload extends Omit<Partial<AdmissionEnquiry>, "custom_values"> {
  custom_values?: CustomValues;
}

export interface EnquiryDetail extends Omit<AdmissionEnquiry, "custom_values"> {
  custom_values?: CustomValues;
  followups: EnquiryFollowup[];
}

export interface AdmissionTokenResult {
  name: string;
  status?: string;
  /** The plaintext parent-form token. Returned ONCE and never recoverable. */
  admission_token: string;
  token_expires_on: string;
}

export const enquiries = {
  create: (payload: EnquiryPayload) =>
    callMethod<EnquiryDetail>(`${FO}.enquiry.create_enquiry`, payload),

  update: (enquiry_id: string, payload: EnquiryPayload) =>
    callMethod<EnquiryDetail>(`${FO}.enquiry.update_enquiry`, { enquiry_id, ...payload }),

  get: (enquiry_id: string) =>
    callMethod<EnquiryDetail>(`${FO}.enquiry.get_enquiry`, { enquiry_id }, "GET"),

  addFollowup: (
    enquiry_id: string,
    followup: Partial<EnquiryFollowup>,
  ) =>
    callMethod<{ followup: EnquiryFollowup; enquiry_status: string }>(
      `${FO}.enquiry.add_followup`,
      { enquiry_id, ...followup },
    ),

  /**
   * Move an enquiry through the pipeline: `Form Sent`, `Corrections Requested`,
   * `Verified`, `Lost`. The transition is validated server-side.
   *
   * `Form Submitted` / `Corrections Submitted` are NOT settable here — only the
   * parent, through a verified form token, can reach those.
   */
  setStatus: (
    enquiry_id: string,
    status: AdmissionEnquiry["status"],
    extra?: { enquiry_details?: string },
  ) =>
    callMethod<{ name: string; status: string; lead_temperature: string }>(
      `${FO}.enquiry.set_status`,
      { enquiry_id, status, ...extra },
    ),

  /**
   * The current parent-form link for an enquiry.
   *
   * The token is encrypted at rest rather than hashed-only, precisely so staff
   * can re-send a link the parent lost — which is how this screen has always
   * behaved. Returns `admission_token: null` when there is no live link.
   */
  getLink: (enquiry_id: string) =>
    callMethod<{ name: string; admission_token: string | null; token_expires_on: string | null }>(
      `${FO}.enquiry.get_admission_link`,
      { enquiry_id },
      "GET",
    ),

  /** Approve and mint the parent-form link. Capture the token immediately. */
  approve: (enquiry_id: string) =>
    callMethod<AdmissionTokenResult>(`${FO}.enquiry.approve_admission`, { enquiry_id }),

  /** Mint a replacement link, invalidating the previous one. */
  reissueToken: (enquiry_id: string) =>
    callMethod<AdmissionTokenResult>(`${FO}.enquiry.reissue_admission_token`, { enquiry_id }),

  provisionAccounts: (enquiry_id: string) =>
    callMethod<{
      name: string;
      status: string;
      guardian_user: string;
      created_users: string[];
      existing_users: string[];
    }>(`${FO}.enquiry.provision_admission_accounts`, { enquiry_id }),
};

// --------------------------------------------------------------- visitors

export const visitors = {
  checkIn: (payload: Partial<VisitorLog>) =>
    callMethod<VisitorLog>(`${FO}.visitor.check_in`, payload),

  update: (visitor_log: string, payload: Partial<VisitorLog>) =>
    callMethod<VisitorLog>(`${FO}.visitor.update_visitor`, { visitor_log, ...payload }),

  checkOut: (visitor_log: string, check_out_time?: string) =>
    callMethod<VisitorLog>(`${FO}.visitor.check_out`, { visitor_log, check_out_time }),
};

// ------------------------------------------------------------- complaints

export const complaints = {
  register: (payload: Partial<ComplaintRegister>) =>
    callMethod<ComplaintRegister>(`${FO}.complaint.register`, payload),

  update: (complaint: string, payload: Partial<ComplaintRegister>) =>
    callMethod<ComplaintRegister>(`${FO}.complaint.update_complaint`, { complaint, ...payload }),

  setStatus: (
    complaint: string,
    status: ComplaintRegister["status"],
    extra?: { resolution_notes?: string; assigned_to?: string },
  ) => callMethod<ComplaintRegister>(`${FO}.complaint.set_status`, { complaint, status, ...extra }),
};

// -------------------------------------------------------------- dashboard

export interface DashboardSummary {
  counters: {
    calls_due: number;
    calls_overdue: number;
    visitors_inside: number;
    visitors_today: number;
    open_complaints: number;
    new_enquiries_this_week: number;
  };
  calls_due: {
    followup: string;
    enquiry: string;
    student_name: string;
    class_applying_for: string;
    guardian_name: string;
    guardian_mobile: string;
    date_to_call: string;
    time_preference: string;
    notes: string | null;
    is_overdue: boolean;
  }[];
  visitors_inside: VisitorLog[];
  open_complaints: ComplaintRegister[];
}

export const dashboard = {
  summary: () => callMethod<DashboardSummary>(`${FO}.dashboard.get_summary`, undefined, "GET"),
};

// --------------------------------------------------------------- settings

export interface FrontOfficeSettingsPayload {
  default_academic_year?: string | null;
  token_expiry_hours?: number;
  auto_checkout_enabled?: 0 | 1;
  auto_checkout_time?: string | null;
}

export const settings = {
  get: () => callMethod<FrontOfficeSettingsPayload>(`${FO}.settings.get_settings`, undefined, "GET"),
  update: (payload: FrontOfficeSettingsPayload) =>
    callMethod<FrontOfficeSettingsPayload>(`${FO}.settings.update_settings`, payload),
};

// ------------------------------------------------------- admission form fields

export interface AdmissionFormFieldDefinition {
  field_key: string;
  label: string;
  fieldtype: "Data" | "Small Text" | "Int" | "Float" | "Date" | "Select" | "Check";
  options: string[];
  is_mandatory: boolean;
  display_order: number | null;
  description: string | null;
}

export const formFields = {
  list: () =>
    callMethod<AdmissionFormFieldDefinition[]>(
      `${FO}.form_fields.list_form_fields`,
      undefined,
      "GET",
    ),
};

// ---------------------------------------------------------------- masters

export const masters = {
  classes: () =>
    callMethod<{ name: string; grade_name: string; description: string | null }[]>(
      "education.api.masters.list_classes",
      undefined,
      "GET",
    ),

  academicYears: () =>
    callMethod<
      { name: string; academic_year_name: string; year_start_date: string; year_end_date: string }[]
    >("education.api.masters.list_academic_years", undefined, "GET"),

  assignableStaff: () =>
    callMethod<{ name: string; full_name: string }[]>(
      "education.api.masters.list_assignable_staff",
      undefined,
      "GET",
    ),
};

// ------------------------------------------------- public (token-scoped)

export interface AdmissionFormFieldView {
  field_key: string;
  label: string;
  fieldtype: string;
  options: string[];
  is_mandatory: boolean;
  description: string | null;
}

export interface AdmissionFormView {
  /** School-defined extra fields, bundled so guests need no second call. */
  custom_fields: AdmissionFormFieldView[];
  custom_values: Record<string, string | null>;
  name: string;
  student_first_name: string;
  student_middle_name?: string | null;
  student_last_name: string;
  gender?: string | null;
  student_mobile?: string | null;
  class_applying_for: string;
  academic_year: string;
  guardian_relation: string;
  guardian_first_name: string;
  guardian_middle_name?: string | null;
  guardian_last_name: string;
  guardian_mobile: string;
  guardian_email: string;
  status: string;
  token_expires_on: string;
}

/**
 * The parent-facing admission form. No session — the link token is the entire
 * authorisation. An invalid *or* expired token yields 403, indistinguishably.
 */
export const publicAdmission = {
  getForm: (token: string) =>
    callMethod<AdmissionFormView>(`${FO}.public.get_admission_form`, { token }, "GET"),

  submitForm: (token: string, payload: Record<string, unknown>) =>
    callMethod<{ name: string; status: string }>(`${FO}.public.submit_admission_form`, {
      token,
      ...payload,
    }),
};
