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

function applyFollowUpStatus(enquiry, followUp) {
  let status = enquiry.status;
  let leadType = enquiry.leadType;
  if (followUp.outcome === "Admitted") {
    status = "Admitted";
    leadType = "Closed";
  } else if (followUp.outcome === "Not Interested") {
    status = "Lost";
    leadType = "Closed";
  } else if (followUp.outcome === "Interested") {
    status = enquiry.converted ? enquiry.status : "Follow-up Pending";
    leadType = enquiry.converted ? "Closed" : "Hot Lead";
  } else if (
    followUp.outcome === "Needs Another Follow-up" ||
    followUp.outcome === "Call Not Picked" ||
    followUp.outcome === "Not Called Yet"
  ) {
    status = enquiry.converted ? enquiry.status : "Follow-up Pending";
    if (enquiry.converted) leadType = "Closed";
  }
  return { status, leadType };
}

function mergeByName(erpList, demoList) {
  const erp = (erpList || []).map((item) => ({ ...item, source: "erp" }));
  const seen = new Set(erp.map((item) => (item.name || "").toLowerCase()));
  const demo = demoList
    .filter((item) => !seen.has((item.name || "").toLowerCase()))
    .map((item) => ({ ...item, source: "demo" }));
  return [...erp, ...demo];
}

/** Keep ERP records and append seed data so Settings / forms have demo options. */
function mergeStaffWithDemo(erpStaff) {
  return mergeByName(erpStaff, initialStaff);
}

function mergeClassesWithDemo(erpClasses) {
  return mergeByName(erpClasses, initialClasses);
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
      return {
        ...state,
        enquiries: state.enquiries.map((e) =>
          e.id === action.payload.id
            ? normalizeEnquiryNames({ ...e, ...action.payload })
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
      return {
        ...state,
        enquiries: state.enquiries.map((e) =>
          e.id === action.payload
            ? {
                ...e,
                status: "Admission Approved",
                leadType: "Closed",
                converted: false,
                approvedAt: todayISO(),
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
          e.id === id
            ? {
                ...e,
                status: "Form Sent",
                admissionToken: token,
                formSentAt: todayISO(),
                correctionNotes: "",
              }
            : e
        ),
      };
    }
    case "SUBMIT_PARENT_ADMISSION_FORM": {
      const { token, form } = action.payload;
      return {
        ...state,
        enquiries: state.enquiries.map((e) => {
          if (e.admissionToken !== token) return e;
          const wasCorrection = e.status === "Corrections Requested";
          return {
            ...e,
            status: wasCorrection ? "Corrections Submitted" : "Form Submitted",
            admissionForm: form,
            formSubmittedAt: todayISO(),
            correctionNotes: "",
            ...(wasCorrection
              ? {
                  correctionsSubmittedAt: todayISO(),
                  lastCorrectionNotes: e.correctionNotes || "",
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
          e.id === id
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
    case "SET_ENQUIRIES": {
      return {
        ...state,
        enquiries: (action.payload || []).map(normalizeEnquiryNames),
      };
    }
    case "VERIFY_ADMISSION": {
      return {
        ...state,
        enquiries: state.enquiries.map((e) =>
          e.id === action.payload
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
          e.id === id
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
      return {
        ...state,
        visitors: state.visitors.map((v) =>
          v.id === action.payload.id ? { ...v, ...action.payload } : v
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
      return {
        ...state,
        complaints: state.complaints.map((c) =>
          c.id === action.payload.id ? { ...c, ...action.payload } : c
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

const initialState = {
  currentUser: CURRENT_USER,
  staff: initialStaff.map((s) => ({ ...s, source: "demo" })),
  // Users who can appear in Assigned To dropdowns
  assignableStaffIds: ["staff-1", "staff-2", "staff-3"],
  classes: initialClasses.map((c) => ({ ...c, source: "demo" })),
  feeStructures: [], // loaded from ERP Fee Structure only
  customFields: initialCustomFields,
  systemFields: initialSystemFields,
  students: initialStudents,
  visitors: initialVisitors,
  complaints: initialComplaints,
  mastersSource: "demo", // "backend" | "demo"
  schoolProfile: readSchoolProfile(),
  branches: readFromStorage("bodhya_branches", defaultBranches),
  // NEVER persist enquiries — refresh always restores seed.
  enquiries: initialEnquiries.map(normalizeEnquiryNames),
};

const VISITORS_SEED_VERSION = "v4-meet-student-no-whom";

export function FrontOfficeProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [mastersLoading, setMastersLoading] = useState(true);
  const [mastersError, setMastersError] = useState("");

  useEffect(() => {
    try {
      localStorage.removeItem("bodhya_enquiries");
      localStorage.removeItem("bodhya_enquiries_seed_version");
      sessionStorage.removeItem("fo_enquiries_seed_version");
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
    const key = "fo_visitors_seed_version";
    if (sessionStorage.getItem(key) !== VISITORS_SEED_VERSION) {
      dispatch({ type: "RESET_VISITORS", payload: initialVisitors });
      sessionStorage.setItem(key, VISITORS_SEED_VERSION);
    }
  }, []);

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
        if (user?.is_authenticated) {
          dispatch({
            type: "SET_CURRENT_USER",
            payload: {
              id: user.user,
              name: user.full_name || user.user,
              role: (user.roles || []).find(
                (r) => !["All", "Guest", "Desk User"].includes(r)
              ) || "Staff",
              email: user.email,
            },
          });
        }
      } catch {
        // keep demo current user
      }
    })();
  }, [refreshMasters]);

  const api = useMemo(
    () => ({
      ...state,
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
        dispatch({ type: "ADD_ENQUIRY", payload: { ...payload, id } });
        return id;
      },
      updateEnquiry: (payload) => dispatch({ type: "UPDATE_ENQUIRY", payload }),
      deleteEnquiries: (ids) =>
        dispatch({ type: "DELETE_ENQUIRIES", payload: ids }),
      addFollowUp: (enquiryId, followUp) =>
        dispatch({ type: "ADD_FOLLOW_UP", payload: { enquiryId, followUp } }),
      updateFollowUp: (enquiryId, followUpId, patch) =>
        dispatch({
          type: "UPDATE_FOLLOW_UP",
          payload: { enquiryId, followUpId, patch },
        }),
      convertEnquiry: (id) =>
        dispatch({ type: "APPROVE_ADMISSION", payload: id }),
      approveAdmission: (id) =>
        dispatch({ type: "APPROVE_ADMISSION", payload: id }),
      sendAdmissionForm: (id) => {
        const token = makeAdmissionToken();
        dispatch({ type: "SEND_ADMISSION_FORM", payload: { id, token } });
        return token;
      },
      submitParentAdmissionForm: (token, form) =>
        dispatch({
          type: "SUBMIT_PARENT_ADMISSION_FORM",
          payload: { token, form },
        }),
      requestAdmissionCorrections: (id, notes) =>
        dispatch({
          type: "REQUEST_ADMISSION_CORRECTIONS",
          payload: { id, notes },
        }),
      verifyAdmission: (id) =>
        dispatch({ type: "VERIFY_ADMISSION", payload: id }),
      createAdmissionAccounts: (id) => {
        const admissionNumber = makeAdmissionNumber();
        const studentPassword = makeTempPassword();
        const parentActivationToken = makeParentActivationToken();
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
        dispatch({ type: "ADD_VISITOR", payload: { ...payload, id } });
        return id;
      },
      updateVisitor: (payload) =>
        dispatch({ type: "UPDATE_VISITOR", payload }),
      deleteVisitor: (id) => dispatch({ type: "DELETE_VISITOR", payload: id }),
      deleteVisitors: (ids) =>
        dispatch({ type: "DELETE_VISITOR", payload: ids }),
      checkOutVisitor: (id, checkOut) =>
        dispatch({ type: "CHECK_OUT_VISITOR", payload: { id, checkOut } }),
      addComplaint: (payload) => {
        const id =
          payload.id ||
          `cmp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        dispatch({ type: "ADD_COMPLAINT", payload: { ...payload, id } });
        return id;
      },
      updateComplaint: (payload) =>
        dispatch({ type: "UPDATE_COMPLAINT", payload }),
      deleteComplaint: (id) =>
        dispatch({ type: "DELETE_COMPLAINT", payload: id }),
      deleteComplaints: (ids) =>
        dispatch({ type: "DELETE_COMPLAINT", payload: ids }),
      addCustomField: (payload) =>
        dispatch({ type: "ADD_CUSTOM_FIELD", payload }),
      updateCustomField: (payload) =>
        dispatch({ type: "UPDATE_CUSTOM_FIELD", payload }),
      deleteCustomField: (id) =>
        dispatch({ type: "DELETE_CUSTOM_FIELD", payload: id }),
      reorderCustomFields: (payload) =>
        dispatch({ type: "REORDER_CUSTOM_FIELDS", payload }),
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
