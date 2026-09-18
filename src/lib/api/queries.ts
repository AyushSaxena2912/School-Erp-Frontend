/**
 * Server state lives in TanStack Query. React context is for UI state only.
 *
 * Before this, every page hand-rolled loading/error/refetch and cached results
 * in a 1,393-line context that also merged in demo rows.
 */

import { QueryClient, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  complaints,
  dashboard,
  enquiries,
  formFields,
  masters,
  publicAdmission,
  settings,
  visitors,
} from "./endpoints";
import type { EnquiryPayload } from "./endpoints";
import { ApiError } from "./errors";
import * as resource from "./resource";
import type { Filter, ListParams } from "./resource";
import type {
  AdmissionEnquiry,
  AdmissionFormField,
  Branch,
  ComplaintRegister,
  SchoolProfile,
  Student,
  VisitorLog,
} from "@/types/generated/doctypes";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry(failureCount, error) {
        // Never retry a deliberate rejection — the answer will not change.
        if (error instanceof ApiError && error.status > 0 && error.status < 500) return false;
        return failureCount < 2;
      },
    },
  },
});

/**
 * Query keys, centralised so invalidation cannot drift from fetching.
 * `as const` keeps them literal for type inference.
 */
export const keys = {
  session: ["session"] as const,

  enquiries: {
    all: ["enquiries"] as const,
    list: (params: unknown) => ["enquiries", "list", params] as const,
    detail: (name: string) => ["enquiries", "detail", name] as const,
  },
  visitors: {
    all: ["visitors"] as const,
    list: (params: unknown) => ["visitors", "list", params] as const,
  },
  complaints: {
    all: ["complaints"] as const,
    list: (params: unknown) => ["complaints", "list", params] as const,
  },
  dashboard: ["dashboard"] as const,
  settings: ["settings"] as const,
  formFields: ["form-fields"] as const,
  masters: {
    classes: ["masters", "classes"] as const,
    academicYears: ["masters", "academic-years"] as const,
    staff: ["masters", "staff"] as const,
    students: ["masters", "students"] as const,
  },
};

// ------------------------------------------------------------- dashboard

export function useDashboard() {
  return useQuery({ queryKey: keys.dashboard, queryFn: dashboard.summary });
}

// ------------------------------------------------------------- enquiries

export function useEnquiries(params: ListParams<AdmissionEnquiry> = {}) {
  return useQuery({
    queryKey: keys.enquiries.list(params),
    queryFn: () => resource.listPage<AdmissionEnquiry>("Admission Enquiry", params),
  });
}

export function useEnquiry(name: string | undefined) {
  return useQuery({
    queryKey: keys.enquiries.detail(name ?? ""),
    queryFn: () => enquiries.get(name as string),
    enabled: Boolean(name),
  });
}

export function useCreateEnquiry() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (payload: EnquiryPayload) => enquiries.create(payload),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: keys.enquiries.all });
      client.invalidateQueries({ queryKey: keys.dashboard });
    },
  });
}

export function useUpdateEnquiry() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ name, payload }: { name: string; payload: EnquiryPayload }) =>
      enquiries.update(name, payload),
    onSuccess: (_data, { name }) => {
      client.invalidateQueries({ queryKey: keys.enquiries.detail(name) });
      client.invalidateQueries({ queryKey: keys.enquiries.all });
    },
  });
}

export function useAddFollowup() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ name, followup }: { name: string; followup: Record<string, unknown> }) =>
      enquiries.addFollowup(name, followup),
    onSuccess: (_data, { name }) => {
      client.invalidateQueries({ queryKey: keys.enquiries.detail(name) });
      client.invalidateQueries({ queryKey: keys.enquiries.all });
      client.invalidateQueries({ queryKey: keys.dashboard });
    },
  });
}

/**
 * Approve an admission.
 *
 * The result carries `admission_token` — the plaintext parent-form token,
 * returned **once**. Build and send the link from the mutation result; it is
 * stored hashed and cannot be fetched again.
 */
/** The live parent-form link for an enquiry, for display and re-sending. */
export function useAdmissionLink(name: string | undefined) {
  return useQuery({
    queryKey: ["enquiries", "link", name ?? ""],
    queryFn: () => enquiries.getLink(name as string),
    enabled: Boolean(name),
  });
}

export function useApproveAdmission() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => enquiries.approve(name),
    onSuccess: (_data, name) => {
      client.invalidateQueries({ queryKey: keys.enquiries.detail(name) });
      client.invalidateQueries({ queryKey: keys.enquiries.all });
    },
  });
}

export function useSetEnquiryStatus() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      name,
      status,
    }: {
      name: string;
      status: AdmissionEnquiry["status"];
    }) => enquiries.setStatus(name, status),
    onSuccess: (_data, { name }) => {
      client.invalidateQueries({ queryKey: keys.enquiries.detail(name) });
      client.invalidateQueries({ queryKey: keys.enquiries.all });
      client.invalidateQueries({ queryKey: keys.dashboard });
    },
  });
}

export function useProvisionAccounts() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => enquiries.provisionAccounts(name),
    onSuccess: (_data, name) => {
      client.invalidateQueries({ queryKey: keys.enquiries.detail(name) });
      client.invalidateQueries({ queryKey: keys.enquiries.all });
    },
  });
}

// -------------------------------------------------------------- visitors

export function useVisitors(params: ListParams<VisitorLog> = {}) {
  return useQuery({
    queryKey: keys.visitors.list(params),
    queryFn: () => resource.listPage<VisitorLog>("Visitor Log", params),
  });
}

export function useCheckInVisitor() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<VisitorLog>) => visitors.checkIn(payload),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: keys.visitors.all });
      client.invalidateQueries({ queryKey: keys.dashboard });
    },
  });
}

export function useUpdateVisitor() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ name, payload }: { name: string; payload: Partial<VisitorLog> }) =>
      visitors.update(name, payload),
    onSuccess: () => client.invalidateQueries({ queryKey: keys.visitors.all }),
  });
}

/**
 * Delete visitor logs. There is no bulk endpoint by design — each delete is
 * permission-checked individually — so this loops and reports partial failure.
 */
export function useDeleteVisitors() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (names: string[]) => resource.removeMany("Visitor Log", names),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: keys.visitors.all });
      client.invalidateQueries({ queryKey: keys.dashboard });
    },
  });
}

export function useCheckOutVisitor() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => visitors.checkOut(name),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: keys.visitors.all });
      client.invalidateQueries({ queryKey: keys.dashboard });
    },
  });
}

// ------------------------------------------------------------ complaints

export function useComplaints(params: ListParams<ComplaintRegister> = {}) {
  return useQuery({
    queryKey: keys.complaints.list(params),
    queryFn: () => resource.listPage<ComplaintRegister>("Complaint Register", params),
  });
}

export function useComplaint(name: string | undefined) {
  return useQuery({
    queryKey: ["complaints", "detail", name ?? ""],
    queryFn: () => resource.get<ComplaintRegister>("Complaint Register", name as string),
    enabled: Boolean(name),
  });
}

export function useRegisterComplaint() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<ComplaintRegister>) => complaints.register(payload),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: keys.complaints.all });
      client.invalidateQueries({ queryKey: keys.dashboard });
    },
  });
}

export function useUpdateComplaint() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ name, payload }: { name: string; payload: Partial<ComplaintRegister> }) =>
      complaints.update(name, payload),
    onSuccess: () => client.invalidateQueries({ queryKey: keys.complaints.all }),
  });
}

export function useDeleteComplaints() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (names: string[]) => resource.removeMany("Complaint Register", names),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: keys.complaints.all });
      client.invalidateQueries({ queryKey: keys.dashboard });
    },
  });
}

export function useSetComplaintStatus() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      name,
      status,
      resolution_notes,
    }: {
      name: string;
      status: ComplaintRegister["status"];
      resolution_notes?: string;
    }) => complaints.setStatus(name, status, { resolution_notes }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: keys.complaints.all });
      client.invalidateQueries({ queryKey: keys.dashboard });
    },
  });
}

// ------------------------------------------- settings, form fields, masters

export function useSettings() {
  return useQuery({ queryKey: keys.settings, queryFn: settings.get });
}

export function useUpdateSettings() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: settings.update,
    onSuccess: () => client.invalidateQueries({ queryKey: keys.settings }),
  });
}

/** Definitions for the school's custom admission-form fields. */
export function useAdmissionFormFields() {
  return useQuery({
    queryKey: keys.formFields,
    queryFn: formFields.list,
    staleTime: 5 * 60_000,
  });
}

/**
 * School-defined admission form field definitions, as editable records.
 *
 * Replaces the old `customFields` slot, which lived in a single global
 * `frappe.db.set_default("fo_custom_fields")` key with no schema, validation or
 * permissions.
 */
export function useAdmissionFormFieldRecords() {
  return useQuery({
    queryKey: ["admission-form-fields", "records"],
    queryFn: () =>
      resource.list<AdmissionFormField>("Admission Form Field", {
        fields: [
          "name",
          "field_key",
          "label",
          "fieldtype",
          "options",
          "is_mandatory",
          "is_active",
          "display_order",
          "description",
        ],
        orderBy: "display_order asc",
        limitPageLength: 0,
      }),
  });
}

function useFormFieldMutation(mutationFn: (vars: never) => Promise<unknown>) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: mutationFn as never,
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["admission-form-fields"] });
      client.invalidateQueries({ queryKey: keys.formFields });
    },
  });
}

export function useCreateAdmissionFormField() {
  return useFormFieldMutation((values: Partial<AdmissionFormField>) =>
    resource.create<AdmissionFormField>("Admission Form Field", values),
  );
}

export function useUpdateAdmissionFormField() {
  return useFormFieldMutation(({ name, values }: { name: string; values: Partial<AdmissionFormField> }) =>
    resource.update<AdmissionFormField>("Admission Form Field", name, values),
  );
}

export function useDeleteAdmissionFormField() {
  return useFormFieldMutation((name: string) => resource.remove("Admission Form Field", name));
}

// ---------------------------------------------------------------- branches

export function useBranches() {
  return useQuery({
    queryKey: ["branches"],
    queryFn: () =>
      resource.list<Branch>("Branch", {
        fields: [
          "name",
          "branch_name",
          "branch_code",
          "is_active",
          "contact_number",
          "email",
          "address_line",
          "city",
          "state",
          "postal_code",
          "principal_name",
        ],
        orderBy: "branch_name asc",
        limitPageLength: 0,
      }),
    staleTime: 5 * 60_000,
  });
}

function useBranchMutation(mutationFn: (vars: never) => Promise<unknown>) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: mutationFn as never,
    onSuccess: () => client.invalidateQueries({ queryKey: ["branches"] }),
  });
}

export function useCreateBranch() {
  return useBranchMutation((values: Partial<Branch>) => resource.create<Branch>("Branch", values));
}

export function useUpdateBranch() {
  return useBranchMutation(({ name, values }: { name: string; values: Partial<Branch> }) =>
    resource.update<Branch>("Branch", name, values),
  );
}

export function useDeleteBranch() {
  return useBranchMutation((name: string) => resource.remove("Branch", name));
}

export function useSchoolProfile() {
  return useQuery({
    queryKey: ["school-profile"],
    queryFn: () => resource.get<SchoolProfile>("School Profile", "School Profile"),
    staleTime: 5 * 60_000,
  });
}

export function useUpdateSchoolProfile() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (values: Partial<SchoolProfile>) =>
      resource.update<SchoolProfile>("School Profile", "School Profile", values),
    onSuccess: () => client.invalidateQueries({ queryKey: ["school-profile"] }),
  });
}

// ------------------------------------------------- public (token-scoped)

/**
 * The parent-facing admission form. No session — the link token is the whole
 * authorisation, so this must never be paired with authenticated queries.
 */
export function useAdmissionForm(token: string | undefined) {
  return useQuery({
    queryKey: ["admission-form", token ?? ""],
    queryFn: () => publicAdmission.getForm(token as string),
    enabled: Boolean(token),
    retry: false,
  });
}

export function useSubmitAdmissionForm() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ token, payload }: { token: string; payload: Record<string, unknown> }) =>
      publicAdmission.submitForm(token, payload),
    // The token is single-use and the server burns it on success, so a refetch
    // is guaranteed to 403. Patch the new status into the cache instead of
    // invalidating — invalidating turned a successful submission into
    // "Link invalid" for the parent.
    onSuccess: (data, { token }) =>
      client.setQueryData(["admission-form", token], (previous) =>
        previous ? { ...previous, status: data?.status } : previous,
      ),
  });
}

export function useClasses() {
  return useQuery({
    queryKey: keys.masters.classes,
    queryFn: masters.classes,
    staleTime: 5 * 60_000,
  });
}

export function useAcademicYears() {
  return useQuery({
    queryKey: keys.masters.academicYears,
    queryFn: masters.academicYears,
    staleTime: 5 * 60_000,
  });
}

export function useAssignableStaff() {
  return useQuery({
    queryKey: keys.masters.staff,
    queryFn: masters.assignableStaff,
    staleTime: 5 * 60_000,
  });
}

/**
 * The student directory backing the pickers on the visitor and complaint forms.
 *
 * `Visitor Log.student` and `Complaint Register.student` are Links to Student,
 * so only real Student records are selectable. The old context synthesised
 * entries from Admission Enquiry as well, which a Link field cannot store.
 */
export function useStudents() {
  return useQuery({
    queryKey: keys.masters.students,
    queryFn: () =>
      resource.list<Student>("Student", {
        fields: ["name", "student_name", "grade"],
        filters: [["enabled", "=", 1]],
        orderBy: "student_name asc",
        limitPageLength: 0,
      }),
    staleTime: 5 * 60_000,
  });
}

export type { Filter, ListParams };
