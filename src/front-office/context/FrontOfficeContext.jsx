import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from "react";
import { fetchMasters } from "../../api/masters";
import { me as fetchMe } from "../../api/auth";
import { frontOfficeService } from "../../services/frontOfficeService";
import {
  CURRENT_USER,
  initialClasses,
  initialComplaints,
  initialCustomFields,
  initialEnquiries,
  initialStaff,
  initialStudents,
  initialSystemFields,
  initialVisitors,
  normalizeEnquiryNames,
  todayISO,
  makeAdmissionToken,
  makeAdmissionNumber,
  makeTempPassword,
  makeParentActivationToken,
} from "../data/seed";

const FrontOfficeContext = createContext(null);

function uid(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

const PIPELINE_STATUSES = [
  "Admission Approved",
  "Form Sent",
  "Form Submitted",
  "Corrections Requested",
  "Corrections Submitted",
  "Verified",
  "Accounts Created",
  "Lost",
];

export function resolveLeadType(status, currentLeadType) {
  const current = currentLeadType || "Warm Lead";
  if (PIPELINE_STATUSES.includes(status) && current === "Hot Lead") {
    return "Closed Lead";
  }
  return current;
}

function applyFollowUpStatus(enquiry, followUp) {
  let status = enquiry.status;
  if (followUp.outcome === "Admitted") {
    status = "Accounts Created";
  } else if (followUp.outcome === "Not Interested") {
    status = "Lost";
  }
  return { status, leadType: resolveLeadType(status, enquiry.leadType) };
}

function mergeByName(erpList, demoList) {
  const erp = (erpList || []).map((item) => ({ ...item, source: "erp" }));
  const seen = new Set(erp.map((item) => (item.name || "").toLowerCase()));
  const demo = demoList
    .filter((item) => !seen.has((item.name || "").toLowerCase()))
    .map((item) => ({ ...item, source: "demo" }));
  return [...erp, ...demo];
}

/** Keep ERP records without demo staff. */
function mergeStaffWithDemo(erpStaff) {
  return (erpStaff || []).map((item) => ({ ...item, source: "erp" }));
}

function mergeClassesWithDemo(erpClasses) {
  if (erpClasses && erpClasses.length > 0) {
    return erpClasses.map((item) => ({ ...item, source: "erp" }));
  }
  return initialClasses;
}

function reducer(state, action) {
  switch (action.type) {
    case "SET_MASTERS": {
      const {
        staff,
        classes,
        feeStructures,
        students,
        mastersSource,
        replaceMasters,
      } = action.payload;
      if (replaceMasters) {
        const nextStaff = mergeStaffWithDemo(staff);
        const nextClasses = mergeClassesWithDemo(classes);
        const staffIds = new Set(nextStaff.map((s) => s.id));
        return {
          ...state,
          staff: nextStaff,
          classes: nextClasses,
          feeStructures: feeStructures ?? [],
          students:
            students?.length > 0 ? students : state.students,
          mastersSource: mastersSource || "backend",
          assignableStaffIds: (() => {
            const kept = (state.assignableStaffIds || []).filter((id) =>
              staffIds.has(id)
            );
            // If nothing left (e.g. first ERP sync), keep demo defaults that still exist
            if (kept.length) return kept;
            return ["staff-1", "staff-2", "staff-3"].filter((id) =>
              staffIds.has(id)
            );
          })(),
        };
      }
      const nextStaff = staff?.length
        ? mergeStaffWithDemo(staff)
        : state.staff;
      const staffIds = new Set(nextStaff.map((s) => s.id));
      return {
        ...state,
        staff: nextStaff,
        classes: classes?.length
          ? mergeClassesWithDemo(classes)
          : state.classes,
        feeStructures: feeStructures?.length
          ? feeStructures
          : state.feeStructures,
        students: students?.length ? students : state.students,
        mastersSource: mastersSource || state.mastersSource,
        assignableStaffIds: (() => {
          const kept = (state.assignableStaffIds || []).filter((id) =>
            staffIds.has(id)
          );
          if (kept.length) return kept;
          return ["staff-1", "staff-2", "staff-3"].filter((id) =>
            staffIds.has(id)
          );
        })(),
      };
    }
    case "SET_CURRENT_USER": {
      return { ...state, currentUser: action.payload };
    }
    case "SET_ENQUIRIES": {
      return {
        ...state,
        enquiries: (action.payload || []).map(normalizeEnquiryNames),
      };
    }
    case "SET_VISITORS": {
      return {
        ...state,
        visitors: action.payload,
      };
    }
    case "SET_COMPLAINTS": {
      return {
        ...state,
        complaints: action.payload,
      };
    }
    case "ADD_ENQUIRY": {
      const enquiry = {
        ...action.payload,
        id: action.payload.id || uid("enq"),
        createdAt: action.payload.createdAt || todayISO(),
        converted: false,
        followUps: action.payload.followUps || [],
        customValues: action.payload.customValues || {},
      };
      return {
        ...state,
        enquiries: [normalizeEnquiryNames({
          ...enquiry,
          status: enquiry.status || "Inquiry",
          parentMobile: enquiry.parentMobile || enquiry.contact || "",
          parentEmail: enquiry.parentEmail || "",
        }), ...state.enquiries],

      };
    }
    case "UPDATE_ENQUIRY": {
      const { id, id_new } = action.payload;
      return {
        ...state,
        enquiries: state.enquiries.map((e) =>
          e.id === id || (id_new && e.id === id_new) || (e.name && (e.name === id || e.name === id_new))
            ? normalizeEnquiryNames({ ...e, ...action.payload, id: id_new || action.payload.id || e.id })
            : e
        ),
      };
    }
    case "DELETE_ENQUIRIES": {
      const ids = new Set(
        Array.isArray(action.payload) ? action.payload : [action.payload]
      );
      return {
        ...state,
        enquiries: state.enquiries.filter((e) => !ids.has(e.id)),
      };
    }
    case "ADD_FOLLOW_UP": {
      const { enquiryId, followUp } = action.payload;
      return {
        ...state,
        enquiries: state.enquiries.map((e) => {
          if (e.id !== enquiryId) return e;
          const next = {
            ...followUp,
            id: uid("fu"),
            createdAt: todayISO(),
          };
          const { status, leadType } = applyFollowUpStatus(e, followUp);
          const converted =
            e.converted || followUp.outcome === "Admitted";
          return {
            ...e,
            status: e.converted ? e.status : status,
            leadType,
            converted,
            followUps: [...(e.followUps || []), next],
          };
        }),
      };
    }
    case "UPDATE_FOLLOW_UP": {
      const { enquiryId, followUpId, patch } = action.payload;
      return {
        ...state,
        enquiries: state.enquiries.map((e) => {
          if (e.id !== enquiryId) return e;
          const followUps = (e.followUps || []).map((fu) =>
            fu.id === followUpId ? { ...fu, ...patch } : fu
          );
          const updated = followUps.find((fu) => fu.id === followUpId) || patch;
          const { status, leadType } = applyFollowUpStatus(e, updated);
          const converted =
            e.converted || updated.outcome === "Admitted";
          return {
            ...e,
            status: e.converted ? e.status : status,
            leadType,
            converted,
            followUps,
          };
        }),
      };
    }
    case "CONVERT_ENQUIRY":
    case "APPROVE_ADMISSION": {
      const targetId = action.payload;
      return {
        ...state,
        enquiries: state.enquiries.map((e) =>
          e.id === targetId || e.name === targetId
            ? {
              ...e,
              status: "Admission Approved",
              leadType: resolveLeadType("Admission Approved", e.leadType),
              converted: false,
              approvedAt: todayISO(),
              admissionToken: action.security_token || e.admissionToken,
              security_token: action.security_token || e.security_token,
            }
            : e
        ),
      };
    }
    case "SEND_ADMISSION_FORM": {
      const { id, token } = action.payload;
      return {
        ...state,
        enquiries: state.enquiries.map((e) =>
          e.id === id || e.name === id
            ? {
              ...e,
              status: "Form Sent",
              leadType: resolveLeadType("Form Sent", e.leadType),
              admissionToken: token,
              formSentAt: todayISO(),
              correctionNotes: "",
            }
            : e
        ),
      };
    }
    case "SUBMIT_PARENT_ADMISSION_FORM": {
      const { token, form, isFaculty } = action.payload;
      const qToken = (token || "").toLowerCase();
      return {
        ...state,
        enquiries: state.enquiries.map((e) => {
          const matchToken = e.admissionToken && e.admissionToken.toLowerCase() === qToken;
          const matchSecurity = e.security_token && e.security_token.toLowerCase() === qToken;
          const matchId = (e.id && (qToken.includes(e.id.toLowerCase().replace(/[^a-z0-9]/g, "")) || e.id.toLowerCase() === qToken)) ||
                          (e.name && (qToken.includes(e.name.toLowerCase().replace(/[^a-z0-9]/g, "")) || e.name.toLowerCase() === qToken));
          if (!matchToken && !matchSecurity && !matchId) return e;
          const nextStatus = isFaculty
            ? e.status
            : (e.status === "Corrections Requested" ? "Corrections Submitted" : "Form Submitted");
          return {
            ...e,
            status: nextStatus,
            section: form.section || e.section || "",
            house: form.house || e.house || "",
            admissionForm: { ...(e.admissionForm || {}), ...form },
            customValues: form.customValues || e.customValues || {},
            formSubmittedAt: e.formSubmittedAt || todayISO(),
            ...(e.status === "Corrections Requested" && !isFaculty
              ? {
                correctionsSubmittedAt: todayISO(),
                lastCorrectionNotes: e.correctionNotes || "",
                correctionNotes: "",
              }
              : {}),
          };
        }),
      };
    }
    case "REQUEST_ADMISSION_CORRECTIONS": {
      const { id, notes } = action.payload;
      return {
        ...state,
        enquiries: state.enquiries.map((e) =>
          e.id === id || e.name === id
            ? {
              ...e,
              status: "Corrections Requested",
              correctionNotes: notes || "",
              correctionsSubmittedAt: "",
            }
            : e
        ),
      };
    }
    case "VERIFY_ADMISSION": {
      const targetId = action.payload;
      return {
        ...state,
        enquiries: state.enquiries.map((e) =>
          e.id === targetId || e.name === targetId
            ? {
              ...e,
              status: "Verified",
              verifiedAt: todayISO(),
              correctionNotes: "",
            }
            : e
        ),
      };
    }
    case "CREATE_ADMISSION_ACCOUNTS": {
      const { id, admissionNumber, studentPassword, parentActivationToken } =
        action.payload;
      return {
        ...state,
        enquiries: state.enquiries.map((e) =>
          e.id === id || e.name === id
            ? {
              ...e,
              status: "Accounts Created",
              converted: true,
              leadType: "Closed",
              admissionNumber,
              studentPassword,
              parentActivationToken,
              accountsCreatedAt: todayISO(),
            }
            : e
        ),
      };
    }
    case "ADD_VISITOR": {
      const visitor = {
        ...action.payload,
        id: action.payload.id || uid("vis"),
        checkOut: action.payload.checkOut ?? null,
      };
      return { ...state, visitors: [visitor, ...state.visitors] };
    }
    case "UPDATE_VISITOR": {
      const { id, id_new, ...rest } = action.payload;
      return {
        ...state,
        visitors: state.visitors.map((v) =>
          v.id === id ? { ...v, ...rest, id: id_new || v.id } : v
        ),
      };
    }
    case "DELETE_VISITOR": {
      const ids = new Set(
        Array.isArray(action.payload) ? action.payload : [action.payload]
      );
      return {
        ...state,
        visitors: state.visitors.filter((v) => !ids.has(v.id)),
      };
    }
    case "RESET_VISITORS": {
      return {
        ...state,
        visitors: action.payload.map((v) => ({ ...v })),
      };
    }
    case "CHECK_OUT_VISITOR": {
      const { id, checkOut } = action.payload;
      return {
        ...state,
        visitors: state.visitors.map((v) =>
          v.id === id ? { ...v, checkOut } : v
        ),
      };
    }
    case "ADD_COMPLAINT": {
      const complaint = {
        ...action.payload,
        id: action.payload.id || uid("cmp"),
        createdAt: action.payload.createdAt || todayISO(),
        status: action.payload.status || "New",
        mode: action.payload.mode || "Offline",
        raisedBy: action.payload.raisedBy || "Front Office",
        recordedBy: action.payload.recordedBy ?? "",
        resolutionNotes: action.payload.resolutionNotes ?? "",
      };
      return { ...state, complaints: [complaint, ...state.complaints] };
    }
    case "UPDATE_COMPLAINT": {
      const { id, id_new, ...rest } = action.payload;
      return {
        ...state,
        complaints: state.complaints.map((c) =>
          c.id === id ? { ...c, ...rest, id: id_new || c.id } : c
        ),
      };
    }
    case "DELETE_COMPLAINT": {
      const ids = new Set(
        Array.isArray(action.payload) ? action.payload : [action.payload]
      );
      return {
        ...state,
        complaints: state.complaints.filter((c) => !ids.has(c.id)),
      };
    }
    case "ADD_CUSTOM_FIELD": {
      const field = {
        ...action.payload,
        id: uid("cf"),
        active: true,
        system: false,
      };
      return {
        ...state,
        customFields: [...state.customFields, field],
      };
    }
    case "UPDATE_CUSTOM_FIELD": {
      return {
        ...state,
        customFields: state.customFields.map((f) =>
          f.id === action.payload.id ? { ...f, ...action.payload } : f
        ),
      };
    }
    case "DELETE_CUSTOM_FIELD": {
      return {
        ...state,
        customFields: state.customFields.filter((f) => f.id !== action.payload),
      };
    }
    case "REORDER_CUSTOM_FIELDS": {
      return { ...state, customFields: action.payload };
    }
    case "UPDATE_SYSTEM_FIELD": {
      return {
        ...state,
        systemFields: state.systemFields.map((f) =>
          f.id === action.payload.id ? { ...f, ...action.payload } : f
        ),
      };
    }
    case "DELETE_SYSTEM_FIELD": {
      return {
        ...state,
        systemFields: state.systemFields.filter((f) => f.id !== action.payload),
      };
    }
    case "REORDER_SYSTEM_FIELDS": {
      return { ...state, systemFields: action.payload };
    }
    case "ADD_STAFF": {
      return {
        ...state,
        staff: [...state.staff, { ...action.payload, id: uid("staff"), active: true }],
      };
    }
    case "UPDATE_STAFF": {
      return {
        ...state,
        staff: state.staff.map((s) =>
          s.id === action.payload.id ? { ...s, ...action.payload } : s
        ),
      };
    }
    case "TOGGLE_ASSIGNABLE_STAFF": {
      const id = action.payload;
      const has = state.assignableStaffIds.includes(id);
      return {
        ...state,
        assignableStaffIds: has
          ? state.assignableStaffIds.filter((x) => x !== id)
          : [...state.assignableStaffIds, id],
      };
    }
    case "SET_ASSIGNABLE_STAFF": {
      return { ...state, assignableStaffIds: action.payload };
    }
    case "ADD_CLASS": {
      return {
        ...state,
        classes: [...state.classes, { ...action.payload, id: uid("cls") }],
      };
    }
    case "UPDATE_CLASS": {
      return {
        ...state,
        classes: state.classes.map((c) =>
          c.id === action.payload.id ? { ...c, ...action.payload } : c
        ),
      };
    }
    case "ADD_FEE": {
      return {
        ...state,
        feeStructures: [
          ...state.feeStructures,
          { ...action.payload, id: uid("fee") },
        ],
      };
    }
    case "UPDATE_FEE": {
      return {
        ...state,
        feeStructures: state.feeStructures.map((f) =>
          f.id === action.payload.id ? { ...f, ...action.payload } : f
        ),
      };
    }
    case "UPDATE_SCHOOL_PROFILE": {
      return {
        ...state,
        schoolProfile: { ...state.schoolProfile, ...action.payload },
      };
    }
    case "ADD_BRANCH": {
      return {
        ...state,
        branches: [...state.branches, { ...action.payload, id: action.payload.id || uid("br") }],
      };
    }
    case "UPDATE_BRANCH": {
      return {
        ...state,
        branches: state.branches.map((b) =>
          b.id === action.payload.id ? { ...b, ...action.payload } : b
        ),
      };
    }
    case "DELETE_BRANCH": {
      return {
        ...state,
        branches: state.branches.filter((b) => b.id !== action.payload),
      };
    }
    default:
      return state;
  }
}

const defaultSchoolProfile = {
  name: "Delhi Public School",
  logo: "",
  affiliationCode: "CBSE-123456",
  website: "www.dpsmain.edu.in",
  email: "info@dpsmain.edu.in",
  phone: "+91 11 2345 6789",
  address: "Sector 12, Dwarka, New Delhi, India",
  establishedYear: "1998"
};

const defaultBranches = [
  { id: "dps_main", name: "Delhi Public School - Main Campus", code: "DPS-MAIN", principalName: "Dr. Sunita Sharma", email: "principal.main@dps.edu", phone: "+91 98765 43210", address: "Sector 12, Dwarka, New Delhi", status: "Active" },
  { id: "dps_south", name: "Delhi Public School - South Branch", code: "DPS-SOUTH", principalName: "Mrs. Ritu Verma", email: "principal.south@dps.edu", phone: "+91 98765 43211", address: "JP Nagar, Phase 2, Bangalore", status: "Active" },
  { id: "dps_north", name: "Delhi Public School - North Branch", code: "DPS-NORTH", principalName: "Mr. Alok Gupta", email: "principal.north@dps.edu", phone: "+91 98765 43212", address: "VIP Road, Zirakpur, Chandigarh", status: "Active" }
];

function readFromStorage(key, defaultVal) {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : defaultVal;
  } catch {
    return defaultVal;
  }
}

function isStoredImageLogo(logo) {
  return Boolean(
    logo &&
    (String(logo).startsWith("data:") ||
      String(logo).startsWith("http") ||
      String(logo).startsWith("/"))
  );
}

function readSchoolProfile() {
  const stored = readFromStorage("bodhya_school_profile", defaultSchoolProfile);
  return {
    ...defaultSchoolProfile,
    ...stored,
    logo: isStoredImageLogo(stored?.logo) ? stored.logo : "",
  };
}

function readCustomFields() {
  const stored = readFromStorage("bodhya_custom_fields", null);
  let fields = initialCustomFields;
  if (Array.isArray(stored)) {
    const cleanStored = stored.filter(
      (f) => f.label !== "Test Field 1" && f.label !== "Test Field 2"
    );
    const seen = new Set(cleanStored.map((f) => (f.label || "").toLowerCase()));
    const missing = initialCustomFields.filter(
      (f) => !seen.has((f.label || "").toLowerCase())
    );
    fields = [...cleanStored, ...missing];
  }
  return fields.filter((f) => f.label !== "Test Field 1" && f.label !== "Test Field 2");
}

const getInitialCurrentUser = () => {
  try {
    const localName = localStorage.getItem("bodhya_user_name");
    const localEmail = localStorage.getItem("bodhya_user_email");
    const localRole = localStorage.getItem("bodhya_user_role");
    if (localName || localEmail) {
      return {
        id: localEmail || "user",
        name: localName || "User",
        role: localRole === "Parent" ? "Guardian" : (localRole || "Staff"),
        email: localEmail || "",
      };
    }
  } catch {}
  return CURRENT_USER;
};

function readCachedEnquiries() {
  try {
    const raw = sessionStorage.getItem("bodhya_enquiries_cache");
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

const initialState = {
  currentUser: getInitialCurrentUser(),
  staff: [],
  assignableStaffIds: [],
  classes: initialClasses.map((c) => ({ ...c, source: "demo" })),
  feeStructures: [], // loaded from ERP Fee Structure only
  customFields: readCustomFields(),
  systemFields: readFromStorage("bodhya_system_fields", initialSystemFields).filter(
    (f) => f.id !== "sys-assignedTo" && f.key !== "assignedTo"
  ),
  students: [],
  visitors: [],
  complaints: [],
  mastersSource: "demo", // "backend" | "demo"
  schoolProfile: readSchoolProfile(),
  branches: readFromStorage("bodhya_branches", defaultBranches),
  enquiries: readCachedEnquiries(),
};

export function FrontOfficeProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [mastersLoading, setMastersLoading] = useState(true);
  const [mastersError, setMastersError] = useState("");

  useEffect(() => {
    try {
      localStorage.removeItem("bodhya_enquiries");
      localStorage.removeItem("bodhya_enquiries_seed_version");
      sessionStorage.removeItem("fo_enquiries_seed_version");
      sessionStorage.removeItem("fo_visitors_seed_version");
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("bodhya_school_profile", JSON.stringify(state.schoolProfile));
  }, [state.schoolProfile]);

  useEffect(() => {
    localStorage.setItem("bodhya_branches", JSON.stringify(state.branches));
  }, [state.branches]);

  useEffect(() => {
    localStorage.setItem("bodhya_custom_fields", JSON.stringify(state.customFields));
  }, [state.customFields]);

  useEffect(() => {
    localStorage.setItem("bodhya_system_fields", JSON.stringify(state.systemFields));
  }, [state.systemFields]);

  useEffect(() => {
    try {
      if (state.enquiries && state.enquiries.length > 0) {
        sessionStorage.setItem("bodhya_enquiries_cache", JSON.stringify(state.enquiries));
      }
    } catch {}
  }, [state.enquiries]);

  const refreshMasters = useCallback(async () => {
    setMastersLoading(true);
    setMastersError("");
    try {
      const data = await fetchMasters();
      dispatch({
        type: "SET_MASTERS",
        payload: {
          staff: data.staff || [],
          classes: data.classes || [],
          feeStructures: data.feeStructures || [],
          students: data.students || [],
          mastersSource: "backend",
          replaceMasters: true,
        },
      });
    } catch (err) {
      setMastersError(
        err.message ||
        "Could not load masters from backend. Using demo data."
      );
      dispatch({
        type: "SET_MASTERS",
        payload: { mastersSource: "demo" },
      });
    } finally {
      setMastersLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshMasters();
    (async () => {
      try {
        const user = await fetchMe();
        if (user?.is_authenticated && user.user !== "Guest") {
          dispatch({
            type: "SET_CURRENT_USER",
            payload: {
              id: user.user,
              name: user.full_name || user.user,
              role: (() => {
                const found = (user.roles || []).find(
                  (r) => !["All", "Guest", "Desk User"].includes(r)
                ) || "Staff";
                return found === "Parent" ? "Guardian" : found;
              })(),
              email: user.email || user.user,
            },
          });
        } else {
          const storedName = localStorage.getItem("bodhya_user_name");
          const storedEmail = localStorage.getItem("bodhya_user_email");
          const storedRole = localStorage.getItem("bodhya_user_role");
          if (storedName || storedEmail) {
            dispatch({
              type: "SET_CURRENT_USER",
              payload: {
                id: storedEmail || "user",
                name: storedName || "User",
                role: storedRole || "Student",
                email: storedEmail || "",
              },
            });
          }
        }
      } catch {
        const storedName = localStorage.getItem("bodhya_user_name");
        const storedEmail = localStorage.getItem("bodhya_user_email");
        const storedRole = localStorage.getItem("bodhya_user_role");
        if (storedName || storedEmail) {
          dispatch({
            type: "SET_CURRENT_USER",
            payload: {
              id: storedEmail || "user",
              name: storedName || "User",
              role: storedRole || "Student",
              email: storedEmail || "",
            },
          });
        }
      }

      // Load enquiries in background — don't block page render (page 1, limit 20 only)
      frontOfficeService.getEnquiries({ page: 1, limit: 20 }).then((enqRes) => {
        const rawEnq = Array.isArray(enqRes)
          ? enqRes
          : (Array.isArray(enqRes?.data?.enquiries) ? enqRes.data.enquiries : (Array.isArray(enqRes?.data) ? enqRes.data : (Array.isArray(enqRes?.message?.data?.enquiries) ? enqRes.message.data.enquiries : (Array.isArray(enqRes?.message?.data) ? enqRes.message.data : (Array.isArray(enqRes?.message) ? enqRes.message : [])))));

        if (Array.isArray(rawEnq)) {
          const list = rawEnq.map((item) => {
            const studentFirstName = item.student_first_name || item.student_name?.split(" ")[0] || "";
            const studentLastName = item.student_last_name || item.student_name?.split(" ").slice(1).join(" ") || "";
            const studentName = `${studentFirstName} ${studentLastName}`.trim() || item.student_name || "Student";

            const guardianFirstName = item.guardian_first_name || item.parent_name?.split(" ")[0] || "";
            const guardianLastName = item.guardian_last_name || item.parent_name?.split(" ").slice(1).join(" ") || "";
            const guardianName = `${guardianFirstName} ${guardianLastName}`.trim() || item.parent_name || "Parent";
            const mobile = item.guardian_mobile || item.parent_mobile || item.contact || "";
            const className = item.class_applying_for || "Class 10";

            const parsedCF = (() => {
              let cf = null;
              if (typeof item.custom_fields === "string") {
                try { cf = JSON.parse(item.custom_fields); } catch { cf = null; }
              } else {
                cf = item.custom_fields || null;
              }
              // Strip base64 docs/photos to avoid 22MB+ memory bloat in list view
              if (cf && typeof cf === "object") {
                const { docs, ...cfWithoutDocs } = cf;
                // Also strip base64 photo fields from father/mother/guardian
                const strip = (obj) => {
                  if (!obj || typeof obj !== "object") return obj;
                  const { photo, ...rest } = obj;
                  return rest;
                };
                return {
                  ...cfWithoutDocs,
                  ...(cfWithoutDocs.father ? { father: strip(cfWithoutDocs.father) } : {}),
                  ...(cfWithoutDocs.mother ? { mother: strip(cfWithoutDocs.mother) } : {}),
                  ...(cfWithoutDocs.guardian ? { guardian: strip(cfWithoutDocs.guardian) } : {}),
                };
              }
              return cf;
            })();

            const admissionFormObj = (parsedCF && (parsedCF.firstName || parsedCF.academicYear || parsedCF.section || parsedCF.house || parsedCF.father || parsedCF.mother || parsedCF.currentAddress || parsedCF.religion || parsedCF.category || parsedCF.customValues))
              ? parsedCF
              : (item.admissionForm || null);

            const customValuesObj = (parsedCF && parsedCF.customValues)
              ? parsedCF.customValues
              : (parsedCF && typeof parsedCF === "object" && !parsedCF.firstName ? parsedCF : (item.customValues && typeof item.customValues === "object" ? item.customValues : {}));

            return {
              id: item.name || item.id,
              name: item.name || item.id,
              studentFirstName,
              studentLastName,
              studentName,
              className,
              classId: item.class_applying_for || item.classId || "class-1",
              academicYear: item.academic_year || "2026-27",
              guardianFirstName,
              guardianLastName,
              guardianName,
              guardianRelation: item.guardian_relation || "Father",
              contact: mobile,
              parentMobile: mobile,
              parentEmail: item.guardian_email || item.parent_email || "",
              studentMobile: item.student_mobile || "",
              gender: item.gender || item.student_gender || "",
              studentGender: item.gender || item.student_gender || "",
              section: parsedCF?.section || item.section || "",
              house: parsedCF?.house || item.house || "",
              correctionNotes: item.enquiry_details || item.correctionNotes || "",
              leadType: resolveLeadType(item.status, item.lead_temperature || item.lead_type || item.leadType),
              status: item.status || "Inquiry",
              admissionToken: item.security_token || item.admissionToken || item.admission_token || "",
              admissionForm: admissionFormObj,
              createdAt: item.creation?.split(" ")[0] || todayISO(),
              followUps: item.follow_ups || [],
              customValues: customValuesObj,
            };
          });
          dispatch({ type: "SET_ENQUIRIES", payload: list });
        }
      }).catch((err) => {
        console.warn("Could not sync backend enquiries to React state:", err);
      });

      try {
        const visRes = await frontOfficeService.getVisitors();
        const rawVis = Array.isArray(visRes?.data?.visitors)
          ? visRes.data.visitors
          : (visRes?.data || visRes?.message?.data || (Array.isArray(visRes?.message) ? visRes.message : (Array.isArray(visRes) ? visRes : [])));
        if (Array.isArray(rawVis)) {
          const list = rawVis.map((item) => ({
            id: item.name,
            visitorName: item.visitor_name,
            name: item.visitor_name,
            contact: item.contact_number || "",
            purpose: item.purpose_of_visit || "General Inquiry",
            relation: item.relation_to_student || "",
            whomToMeet: item.whom_to_meet || "",
            studentName: item.student || "",
            remarks: item.remarks || "",
            checkIn: item.check_in_time || todayISO(),
            checkInTime: item.check_in_time || todayISO(),
            checkOut: item.check_out_time || null,
            checkOutTime: item.check_out_time || null,
          }));
          dispatch({ type: "SET_VISITORS", payload: list });
        }
      } catch (err) {
        console.warn("Could not sync backend visitors:", err);
      }

      try {
        const cmpRes = await frontOfficeService.getComplaints();
        const rawCmp = Array.isArray(cmpRes)
          ? cmpRes
          : (Array.isArray(cmpRes?.data?.complaints) ? cmpRes.data.complaints : (Array.isArray(cmpRes?.data) ? cmpRes.data : (Array.isArray(cmpRes?.message?.data?.complaints) ? cmpRes.message.data.complaints : (Array.isArray(cmpRes?.message?.data) ? cmpRes.message.data : (Array.isArray(cmpRes?.message) ? cmpRes.message : [])))));
        if (Array.isArray(rawCmp)) {
          const list = rawCmp.map((item) => ({
            id: item.name,
            complainantName: item.complainant_name,
            complainant: item.complainant_name,
            relation: item.relation_to_student || "Mother",
            contact: item.mobile_number || "",
            mobile: item.mobile_number || "",
            nature: item.nature_of_complaint || "Others",
            source: item.source || "Offline · Parent / Guardian",
            description: item.brief_discussion || "",
            briefDiscussion: item.brief_discussion || "",
            resolutionNotes: item.resolution_notes || "",
            recordedBy: item.recorded_by || "",
            status: item.status || "New",
            createdAt: typeof item.creation === "string" ? item.creation.split(" ")[0] : todayISO(),
          }));
          dispatch({ type: "SET_COMPLAINTS", payload: list });
        }
      } catch (err) {
        console.warn("Could not sync backend complaints:", err);
      }

      try {
        const cfRes = await frontOfficeService.getCustomFields();
        const rawCF = cfRes?.fields || cfRes?.data || cfRes?.message?.fields || cfRes?.message;
        if (Array.isArray(rawCF)) {
          const cleanCF = rawCF.filter(f => f.label !== "Test Field 1" && f.label !== "Test Field 2");
          dispatch({ type: "REORDER_CUSTOM_FIELDS", payload: cleanCF.length ? cleanCF : initialCustomFields });
          if (cleanCF.length !== rawCF.length) {
            frontOfficeService.saveCustomFields(cleanCF.length ? cleanCF : initialCustomFields).catch(() => { });
          }
        }
      } catch (err) {
        console.warn("Could not sync custom fields from backend:", err);
      }
    })();
  }, [refreshMasters]);

  const allStudents = useMemo(() => {
    const enquiryStudents = (state.enquiries || []).map((e) => {
      const f = e.admissionForm || {};
      const rawCF = e.customValues || (typeof e.custom_fields === "object" ? e.custom_fields : {}) || (typeof e.custom_fields === "string" ? (() => { try { return JSON.parse(e.custom_fields); } catch { return {}; } })() : {});
      const cf = typeof rawCF === "object" && rawCF !== null ? rawCF : {};

      const gRel = f.guardian?.relation || cf.guardian?.relation || cf.guardianRelation || e.guardianRelation || f.guardianIs || "Father";
      const gFullName = f.guardian?.name || cf.guardian?.name || e.guardianName || (e.guardianFirstName ? `${e.guardianFirstName} ${e.guardianLastName || ""}`.trim() : "") || e.parentName || "";
      const gMobile = f.guardian?.phone || cf.guardian?.phone || e.parentMobile || e.guardianMobile || e.contact || "";
      const gEmail = f.guardian?.email || cf.guardian?.email || e.parentEmail || e.guardianEmail || "";

      const fName = f.father?.name || cf.father?.name || cf.fatherName || (gRel === "Father" ? gFullName : "") || e.fatherName || "";
      const fPhone = f.father?.phone || cf.father?.phone || cf.fatherMobile || (gRel === "Father" ? gMobile : "") || e.fatherMobile || "";
      const fEmail = f.father?.email || cf.father?.email || cf.fatherEmail || (gRel === "Father" ? gEmail : "") || e.fatherEmail || "";
      const fOcc = f.father?.occupation || cf.father?.occupation || cf.fatherOccupation || "";

      const mName = f.mother?.name || cf.mother?.name || cf.motherName || (gRel === "Mother" ? gFullName : "") || e.motherName || "";
      const mPhone = f.mother?.phone || cf.mother?.phone || cf.motherMobile || (gRel === "Mother" ? gMobile : "") || e.motherMobile || "";
      const mEmail = f.mother?.email || cf.mother?.email || cf.motherEmail || (gRel === "Mother" ? gEmail : "") || e.motherEmail || "";
      const mOcc = f.mother?.occupation || cf.mother?.occupation || cf.motherOccupation || "";

      const currentAddress = f.currentAddress || f.address || cf.currentAddress || cf.address || e.currentAddress || e.address || "";
      const permanentAddress = f.permanentAddress || cf.permanentAddress || currentAddress || "";
      const religion = f.religion || cf.religion || e.religion || "";
      const category = f.category || f.socialCategory || cf.category || cf.socialCategory || e.category || e.socialCategory || "";
      const motherTongue = f.motherTongue || cf.motherTongue || e.motherTongue || "";
      const languages = (f.languages && f.languages.length) ? f.languages : (cf.languages && cf.languages.length ? cf.languages : (e.languages || []));

      const customValues = {
        ...(typeof cf === "object" ? cf : {}),
        ...(e.customValues || {}),
        ...(f.customValues || {}),
      };

      return {
        id: e.id || e.name,
        name: e.studentName || `${e.studentFirstName || ""} ${e.studentLastName || ""}`.trim() || "Student",
        studentFirstName: e.studentFirstName || "",
        studentLastName: e.studentLastName || "",
        admissionNumber: e.admissionNumber || e.id || e.name,
        scholarNumber: e.admissionNumber || e.id || e.name,
        className: e.className || e.classId || "Class 10",
        section: e.section || f.section || cf.section || "",
        gender: e.gender || f.gender || cf.gender || "",
        studentMobile: e.studentMobile || cf.studentMobile || "",
        parentMobile: gMobile,
        parentEmail: gEmail,
        guardianName: gFullName,
        guardianRelation: gRel,
        guardianIs: f.guardianIs || cf.guardianIs || (gRel === "Mother" ? "Mother" : gRel === "Father" ? "Father" : "Other"),
        father: {
          photo: f.father?.photo || cf.father?.photo || "",
          name: fName,
          phone: fPhone,
          email: fEmail,
          occupation: fOcc,
        },
        mother: {
          photo: f.mother?.photo || cf.mother?.photo || "",
          name: mName,
          phone: mPhone,
          email: mEmail,
          occupation: mOcc,
        },
        guardian: {
          photo: f.guardian?.photo || cf.guardian?.photo || "",
          name: gFullName || fName || mName,
          relation: gRel,
          phone: gMobile,
          email: gEmail,
          occupation: f.guardian?.occupation || cf.guardian?.occupation || "",
        },
        currentAddress,
        permanentAddress,
        religion,
        category,
        motherTongue,
        languages,
        customValues,
        admissionForm: f,
      };
    });

    const base = state.students || [];
    const combined = [...base, ...enquiryStudents];
    const seen = new Set();
    return combined.filter((s) => {
      if (!s || !s.name || seen.has(s.id)) return false;
      seen.add(s.id);
      return true;
    });
  }, [state.students, state.enquiries]);

  const api = useMemo(
    () => ({
      ...state,
      students: allStudents,
      assignableStaff: state.staff.filter(
        (s) =>
          state.assignableStaffIds.includes(s.id) && s.active !== false
      ),
      mastersLoading,
      mastersError,
      refreshMasters,
      addEnquiry: (payload) => {
        const id =
          payload.id ||
          `enq-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

        // Live Backend REST API call to MariaDB!
        frontOfficeService.createEnquiry({
          student_first_name: payload.studentFirstName || payload.studentName?.split(" ")[0] || "Student",
          student_middle_name: payload.studentMiddleName || "",
          student_last_name: payload.studentLastName || payload.studentName?.split(" ").slice(1).join(" ") || "Applicant",
          class_applying_for: payload.className || payload.classId || "Class 1",
          academic_year: payload.academicYear || "2026-27",
          guardian_relation: payload.guardianRelation || "Father",
          guardian_first_name: payload.guardianFirstName || payload.parentName?.split(" ")[0] || "Guardian",
          guardian_middle_name: payload.guardianMiddleName || "",
          guardian_last_name: payload.guardianLastName || payload.parentName?.split(" ").slice(1).join(" ") || "Parent",
          guardian_mobile: payload.parentMobile ? (payload.parentMobile.startsWith("+") ? payload.parentMobile : `+91${payload.parentMobile}`) : "+919876543210",
          guardian_email: payload.parentEmail || "parent@email.com",
          gender: payload.gender || "",
          student_gender: payload.gender || "",
          lead_temperature: payload.leadType || "Warm Lead",
          status: payload.status || "Inquiry",
          custom_fields: payload.customValues || payload.customFields || {},
        }).then((res) => {
          console.log("[FrontOffice REST API] Live Enquiry created in MariaDB:", res);
          const savedData = res?.data || res?.message?.data || res?.message || res;
          if (savedData?.name && savedData.name !== id) {
            dispatch({ type: "UPDATE_ENQUIRY", payload: { id, id_new: savedData.name, name: savedData.name } });
          }
        }).catch((err) => {
          console.warn("[FrontOffice REST API Error] Could not save enquiry:", err.message);
        });

        dispatch({ type: "ADD_ENQUIRY", payload: { ...payload, id } });
        return id;
      },
      updateEnquiry: (payload) => {
        frontOfficeService.updateEnquiry({
          id: payload.id,
          enquiry_id: payload.id,
          student_first_name: payload.studentFirstName,
          student_middle_name: payload.studentMiddleName,
          student_last_name: payload.studentLastName,
          gender: payload.gender || "",
          student_gender: payload.gender || "",
          class_applying_for: payload.className || payload.classId,
          academic_year: payload.academicYear,
          guardian_relation: payload.guardianRelation,
          guardian_first_name: payload.guardianFirstName,
          guardian_middle_name: payload.guardianMiddleName,
          guardian_last_name: payload.guardianLastName,
          guardian_mobile: payload.parentMobile,
          guardian_email: payload.parentEmail,
          student_mobile: payload.studentMobile,
          lead_temperature: payload.leadType,
          status: payload.status,
          custom_fields: payload.customValues || payload.customFields || {},
        }).then((res) => {
          console.log("[FrontOffice REST API] Live Enquiry updated in MariaDB:", res);
        }).catch((err) => {
          console.warn("[FrontOffice REST API Error] Could not update enquiry:", err.message);
        });
        dispatch({ type: "UPDATE_ENQUIRY", payload });
      },
      deleteEnquiries: (ids) => {
        const idsList = Array.isArray(ids) ? ids : [ids];
        frontOfficeService.deleteEnquiry(idsList).catch((err) =>
          console.warn("[FrontOffice API Error] Could not delete enquiry from backend:", err.message)
        );
        dispatch({ type: "DELETE_ENQUIRIES", payload: idsList });
      },
      addFollowUp: (enquiryId, followUp) => {
        frontOfficeService.addFollowup({
          enquiry_id: enquiryId,
          date_to_call: followUp.dateToCall || followUp.date,
          notes: followUp.notes,
          call_outcome: followUp.outcome,
        }).catch((err) =>
          console.warn("[FrontOffice API Error] Could not add followup to backend:", err.message)
        );
        dispatch({ type: "ADD_FOLLOW_UP", payload: { enquiryId, followUp } });
      },
      updateFollowUp: (enquiryId, followUpId, patch) =>
        dispatch({
          type: "UPDATE_FOLLOW_UP",
          payload: { enquiryId, followUpId, patch },
        }),
      convertEnquiry: async (id) => {
        try {
          const res = await frontOfficeService.approveAdmission(id);
          const data = res?.data || res;
          dispatch({
            type: "APPROVE_ADMISSION",
            payload: id,
            security_token: data?.security_token,
          });
        } catch (err) {
          console.warn("[FrontOffice API Error] Could not approve admission on backend:", err.message);
          dispatch({ type: "APPROVE_ADMISSION", payload: id });
        }
      },
      approveAdmission: async (id) => {
        try {
          const res = await frontOfficeService.approveAdmission(id);
          const data = res?.data || res;
          dispatch({
            type: "APPROVE_ADMISSION",
            payload: id,
            security_token: data?.security_token,
          });
        } catch (err) {
          console.warn("[FrontOffice API Error] Could not approve admission on backend:", err.message);
          dispatch({ type: "APPROVE_ADMISSION", payload: id });
        }
      },
      sendAdmissionForm: (id) => {
        const token = makeAdmissionToken(id);
        frontOfficeService.updateEnquiry({ id, status: "Form Sent", security_token: token }).catch((err) =>
          console.warn("[FrontOffice API Error] Could not update status to Form Sent:", err.message)
        );
        dispatch({ type: "SEND_ADMISSION_FORM", payload: { id, token } });
        return token;
      },
      submitParentAdmissionForm: (token, form, isFaculty = false) => {
        frontOfficeService.submitParentFormByToken({ token, ...form }).catch((err) =>
          console.warn("[FrontOffice API Error] Could not submit parent form by token:", err.message)
        );
        dispatch({
          type: "SUBMIT_PARENT_ADMISSION_FORM",
          payload: { token, form, isFaculty },
        });
      },
      requestAdmissionCorrections: (id, notes) => {
        frontOfficeService.updateEnquiry({ id, status: "Corrections Requested", correction_notes: notes }).catch((err) =>
          console.warn("[FrontOffice API Error] Could not update status to Corrections Requested:", err.message)
        );
        dispatch({
          type: "REQUEST_ADMISSION_CORRECTIONS",
          payload: { id, notes },
        });
      },
      verifyAdmission: (id) => {
        frontOfficeService.updateEnquiry({ id, status: "Verified" }).catch((err) =>
          console.warn("[FrontOffice API Error] Could not update status to Verified:", err.message)
        );
        dispatch({ type: "VERIFY_ADMISSION", payload: id });
      },
      createAdmissionAccounts: (id) => {
        const admissionNumber = makeAdmissionNumber();
        const studentPassword = makeTempPassword();
        const parentActivationToken = makeParentActivationToken();
        frontOfficeService
          .updateEnquiry({
            id,
            enquiry_id: id,
            status: "Accounts Created",
            lead_temperature: "Closed",
          })
          .catch((err) =>
            console.warn("[FrontOffice API Error] Could not update status to Accounts Created:", err.message)
          );
        dispatch({
          type: "CREATE_ADMISSION_ACCOUNTS",
          payload: {
            id,
            admissionNumber,
            studentPassword,
            parentActivationToken,
          },
        });
        return { admissionNumber, studentPassword, parentActivationToken };
      },
      addVisitor: (payload) => {
        const id =
          payload.id ||
          `vis-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

        const formattedContact = payload.contact ? (payload.contact.startsWith("+") ? payload.contact : `+91${payload.contact}`) : "+919876543210";
        frontOfficeService.checkInVisitor({
          visitor_name: payload.visitorName || payload.name,
          contact_number: formattedContact,
          purpose_of_visit: payload.purpose || "General Inquiry",
          relation_to_student: payload.relation || "",
          student: payload.studentName || payload.studentId || "",
          whom_to_meet: payload.whomToMeet || "",
          remarks: payload.remarks || "Visitor check-in",
        }).then((res) => {
          console.log("[FrontOffice REST API] Live Visitor check-in created in MariaDB:", res);
          const savedData = res?.data || res;
          if (savedData?.name && savedData.name !== id) {
            dispatch({
              type: "UPDATE_VISITOR",
              payload: {
                id,
                id_new: savedData.name,
                name: savedData.visitor_name || payload.name,
                visitorName: savedData.visitor_name || payload.name,
              },
            });
          }
        }).catch((err) => {
          console.warn("[FrontOffice REST API Error] Could not check-in visitor:", err.message);
        });

        dispatch({ type: "ADD_VISITOR", payload: { ...payload, id } });
        return id;
      },
      updateVisitor: (payload) => {
        frontOfficeService.updateVisitor({
          id: payload.id,
          visitor_name: payload.visitorName || payload.name,
          contact_number: payload.contact,
          purpose_of_visit: payload.purpose,
          relation_to_student: payload.relation,
          student: payload.studentName || payload.studentId,
          whom_to_meet: payload.whomToMeet,
          remarks: payload.remarks,
        }).catch((err) =>
          console.warn("[FrontOffice API Error] Could not update visitor on backend:", err.message)
        );
        dispatch({ type: "UPDATE_VISITOR", payload });
      },
      deleteVisitor: (id) => {
        frontOfficeService.deleteVisitor([id]).catch((err) =>
          console.warn("[FrontOffice API Error] Could not delete visitor from backend:", err.message)
        );
        dispatch({ type: "DELETE_VISITOR", payload: id });
      },
      deleteVisitors: (ids) => {
        const idsList = Array.isArray(ids) ? ids : [ids];
        frontOfficeService.deleteVisitor(idsList).catch((err) =>
          console.warn("[FrontOffice API Error] Could not delete visitors from backend:", err.message)
        );
        dispatch({ type: "DELETE_VISITOR", payload: idsList });
      },
      checkOutVisitor: (id, checkOut) => {
        frontOfficeService.checkOutVisitor(id).catch((err) =>
          console.warn("[FrontOffice API Error] Could not check out visitor on backend:", err.message)
        );
        dispatch({ type: "CHECK_OUT_VISITOR", payload: { id, checkOut } });
      },
      addComplaint: (payload) => {
        const id =
          payload.id ||
          `cmp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

        const formattedMobile = payload.mobile ? (payload.mobile.startsWith("+") ? payload.mobile : `+91${payload.mobile}`) : "+919876543210";
        frontOfficeService.registerComplaint({
          complainant_name: payload.complainantName || payload.complainant,
          relation_to_student: payload.relation || "Mother",
          student: payload.studentId || payload.student || "",
          mobile_number: formattedMobile,
          nature_of_complaint: payload.nature || "General",
          source: payload.source || "Offline · Parent / Guardian",
          brief_discussion: payload.briefDiscussion || payload.description || "",
        }).then((res) => {
          console.log("[FrontOffice REST API] Live Complaint registered in MariaDB:", res);
          const savedData = res?.data || res;
          if (savedData?.name && savedData.name !== id) {
            dispatch({ type: "UPDATE_COMPLAINT", payload: { id, id_new: savedData.name, name: savedData.name } });
          }
        }).catch((err) => {
          console.warn("[FrontOffice REST API Error] Could not register complaint:", err.message);
        });

        dispatch({ type: "ADD_COMPLAINT", payload: { ...payload, id } });
        return id;
      },
      updateComplaint: (payload) => {
        frontOfficeService.updateComplaint({
          id: payload.id,
          complainant_name: payload.complainantName || payload.complainant,
          relation_to_student: payload.relation,
          mobile_number: payload.mobile || payload.contact,
          nature_of_complaint: payload.nature,
          source: payload.source,
          brief_discussion: payload.briefDiscussion || payload.description,
          status: payload.status,
          resolution_notes: payload.resolutionNotes || payload.resolution_notes || payload.notes,
          assigned_to: payload.assignedTo || payload.assigned_to,
        }).catch((err) =>
          console.warn("[FrontOffice API Error] Could not update complaint on backend:", err.message)
        );
        dispatch({ type: "UPDATE_COMPLAINT", payload });
      },
      deleteComplaint: (id) => {
        frontOfficeService.deleteComplaint([id]).catch((err) =>
          console.warn("[FrontOffice API Error] Could not delete complaint from backend:", err.message)
        );
        dispatch({ type: "DELETE_COMPLAINT", payload: id });
      },
      deleteComplaints: (ids) => {
        const idsList = Array.isArray(ids) ? ids : [ids];
        frontOfficeService.deleteComplaint(idsList).catch((err) =>
          console.warn("[FrontOffice API Error] Could not delete complaints from backend:", err.message)
        );
        dispatch({ type: "DELETE_COMPLAINT", payload: idsList });
      },
      addCustomField: (payload) => {
        dispatch({ type: "ADD_CUSTOM_FIELD", payload });
        setTimeout(() => {
          const list = [...state.customFields, { ...payload, id: uid("cf"), active: true, system: false }];
          frontOfficeService.saveCustomFields(list).catch(() => { });
        }, 50);
      },
      updateCustomField: (payload) => {
        dispatch({ type: "UPDATE_CUSTOM_FIELD", payload });
        setTimeout(() => {
          const list = state.customFields.map((f) => (f.id === payload.id ? { ...f, ...payload } : f));
          frontOfficeService.saveCustomFields(list).catch(() => { });
        }, 50);
      },
      deleteCustomField: (id) => {
        dispatch({ type: "DELETE_CUSTOM_FIELD", payload: id });
        setTimeout(() => {
          const list = state.customFields.filter((f) => f.id !== id);
          frontOfficeService.saveCustomFields(list).catch(() => { });
        }, 50);
      },
      reorderCustomFields: (payload) => {
        dispatch({ type: "REORDER_CUSTOM_FIELDS", payload });
        frontOfficeService.saveCustomFields(payload).catch(() => { });
      },
      updateSystemField: (payload) =>
        dispatch({ type: "UPDATE_SYSTEM_FIELD", payload }),
      deleteSystemField: (id) =>
        dispatch({ type: "DELETE_SYSTEM_FIELD", payload: id }),
      reorderSystemFields: (payload) =>
        dispatch({ type: "REORDER_SYSTEM_FIELDS", payload }),
      addStaff: (payload) => dispatch({ type: "ADD_STAFF", payload }),
      updateStaff: (payload) => dispatch({ type: "UPDATE_STAFF", payload }),
      toggleAssignableStaff: (id) =>
        dispatch({ type: "TOGGLE_ASSIGNABLE_STAFF", payload: id }),
      setAssignableStaff: (ids) =>
        dispatch({ type: "SET_ASSIGNABLE_STAFF", payload: ids }),
      addClass: (payload) => dispatch({ type: "ADD_CLASS", payload }),
      updateClass: (payload) => dispatch({ type: "UPDATE_CLASS", payload }),
      addFee: (payload) => dispatch({ type: "ADD_FEE", payload }),
      updateFee: (payload) => dispatch({ type: "UPDATE_FEE", payload }),
      updateSchoolProfile: (payload) => dispatch({ type: "UPDATE_SCHOOL_PROFILE", payload }),
      addBranch: (payload) => dispatch({ type: "ADD_BRANCH", payload }),
      updateBranch: (payload) => dispatch({ type: "UPDATE_BRANCH", payload }),
      deleteBranch: (id) => dispatch({ type: "DELETE_BRANCH", payload: id }),
    }),
    [state, mastersLoading, mastersError, refreshMasters]
  );

  return (
    <FrontOfficeContext.Provider value={api}>
      {children}
    </FrontOfficeContext.Provider>
  );
}

export function useFrontOffice() {
  const ctx = useContext(FrontOfficeContext);
  if (!ctx) {
    throw new Error("useFrontOffice must be used within FrontOfficeProvider");
  }
  return ctx;
}
