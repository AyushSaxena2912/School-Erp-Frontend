import React, { createContext, useContext, useMemo, useReducer } from "react";
import {
  initialAcademicClasses,
  initialCalendarEvents,
  initialClassrooms,
  initialClassSubjects,
  initialMappings,
  initialRoutineSlots,
  initialSections,
  initialSubjects,
  initialTeachers,
  uid,
} from "../data/academic";

const AcademicContext = createContext(null);

function reducer(state, action) {
  switch (action.type) {
    case "ADD_CLASS":
      return {
        ...state,
        classes: [
          ...state.classes,
          { id: uid("acls"), status: "Active", ...action.payload },
        ],
      };
    case "UPDATE_CLASS":
      return {
        ...state,
        classes: state.classes.map((c) =>
          c.id === action.payload.id ? { ...c, ...action.payload } : c
        ),
      };
    case "DELETE_CLASS":
      return {
        ...state,
        classes: state.classes.filter((c) => c.id !== action.payload),
        mappings: state.mappings.filter((m) => m.classId !== action.payload),
        classSubjects: state.classSubjects.filter(
          (cs) => cs.classId !== action.payload
        ),
        routineSlots: state.routineSlots.filter(
          (s) => s.classId !== action.payload
        ),
      };
    case "ADD_SECTION":
      return {
        ...state,
        sections: [
          ...state.sections,
          { id: uid("sec"), status: "Active", ...action.payload },
        ],
      };
    case "UPDATE_SECTION":
      return {
        ...state,
        sections: state.sections.map((s) =>
          s.id === action.payload.id ? { ...s, ...action.payload } : s
        ),
      };
    case "DELETE_SECTION":
      return {
        ...state,
        sections: state.sections.filter((s) => s.id !== action.payload),
        mappings: state.mappings.filter((m) => m.sectionId !== action.payload),
        routineSlots: state.routineSlots.filter(
          (s) => s.sectionId !== action.payload
        ),
      };
    case "ADD_ROOM":
      return {
        ...state,
        classrooms: [
          ...state.classrooms,
          { id: uid("room"), status: "Available", ...action.payload },
        ],
      };
    case "UPDATE_ROOM":
      return {
        ...state,
        classrooms: state.classrooms.map((r) =>
          r.id === action.payload.id ? { ...r, ...action.payload } : r
        ),
      };
    case "DELETE_ROOM":
      return {
        ...state,
        classrooms: state.classrooms.filter((r) => r.id !== action.payload),
        mappings: state.mappings.map((m) =>
          m.roomId === action.payload ? { ...m, roomId: "" } : m
        ),
      };
    case "ADD_MAPPING":
      return {
        ...state,
        mappings: [
          ...state.mappings,
          {
            id: uid("map"),
            enrolled: 0,
            roomId: "",
            teacherId: "",
            ...action.payload,
          },
        ],
      };
    case "UPDATE_MAPPING":
      return {
        ...state,
        mappings: state.mappings.map((m) =>
          m.id === action.payload.id ? { ...m, ...action.payload } : m
        ),
      };
    case "DELETE_MAPPING":
      return {
        ...state,
        mappings: state.mappings.filter((m) => m.id !== action.payload),
      };
    case "ADD_SUBJECT":
      return {
        ...state,
        subjects: [
          ...state.subjects,
          { id: uid("sub"), status: "Active", type: "Theory", ...action.payload },
        ],
      };
    case "UPDATE_SUBJECT":
      return {
        ...state,
        subjects: state.subjects.map((s) =>
          s.id === action.payload.id ? { ...s, ...action.payload } : s
        ),
      };
    case "DELETE_SUBJECT":
      return {
        ...state,
        subjects: state.subjects.filter((s) => s.id !== action.payload),
        classSubjects: state.classSubjects.filter(
          (cs) => cs.subjectId !== action.payload
        ),
      };
    case "SET_CLASS_SUBJECTS": {
      const { classId, subjectIds } = action.payload;
      const rest = state.classSubjects.filter((cs) => cs.classId !== classId);
      const next = subjectIds.map((subjectId) => ({
        id: uid("cs"),
        classId,
        subjectId,
      }));
      return { ...state, classSubjects: [...rest, ...next] };
    }
    case "CLEAR_CLASS_SUBJECTS":
      return {
        ...state,
        classSubjects: state.classSubjects.filter(
          (cs) => cs.classId !== action.payload
        ),
      };
    case "ADD_ROUTINE_SLOT":
      return {
        ...state,
        routineSlots: [
          ...state.routineSlots,
          { id: uid("rt"), type: "lecture", color: "math", ...action.payload },
        ],
      };
    case "UPDATE_ROUTINE_SLOT":
      return {
        ...state,
        routineSlots: state.routineSlots.map((s) =>
          s.id === action.payload.id ? { ...s, ...action.payload } : s
        ),
      };
    case "DELETE_ROUTINE_SLOT":
      return {
        ...state,
        routineSlots: state.routineSlots.filter(
          (s) => s.id !== action.payload
        ),
      };
    case "SET_CLASS_SECTION_ROUTINE": {
      const { classId, sectionId, slots } = action.payload;
      const rest = state.routineSlots.filter(
        (s) => !(s.classId === classId && s.sectionId === sectionId)
      );
      const next = slots.map((slot) => ({
        id: uid("rt"),
        type: "lecture",
        color: "math",
        classId,
        sectionId,
        ...slot,
      }));
      return { ...state, routineSlots: [...rest, ...next] };
    }
    case "ADD_CALENDAR_EVENT": {
      const { academicYear, event } = action.payload;
      const list = state.calendarByYear[academicYear] || [];
      return {
        ...state,
        calendarByYear: {
          ...state.calendarByYear,
          [academicYear]: [
            ...list,
            { id: uid("cev"), color: "blue", cat: "Other", desc: "", ...event },
          ],
        },
      };
    }
    case "UPDATE_CALENDAR_EVENT": {
      const { academicYear, event } = action.payload;
      const list = state.calendarByYear[academicYear] || [];
      return {
        ...state,
        calendarByYear: {
          ...state.calendarByYear,
          [academicYear]: list.map((e) =>
            e.id === event.id ? { ...e, ...event } : e
          ),
        },
      };
    }
    case "DELETE_CALENDAR_EVENT": {
      const { academicYear, id } = action.payload;
      const list = state.calendarByYear[academicYear] || [];
      return {
        ...state,
        calendarByYear: {
          ...state.calendarByYear,
          [academicYear]: list.filter((e) => e.id !== id),
        },
      };
    }
    default:
      return state;
  }
}

const initialState = {
  classes: initialAcademicClasses,
  sections: initialSections,
  classrooms: initialClassrooms,
  mappings: initialMappings,
  teachers: initialTeachers,
  subjects: initialSubjects,
  classSubjects: initialClassSubjects,
  routineSlots: initialRoutineSlots,
  calendarByYear: {
    "2025-2026": [],
    "2026-2027": initialCalendarEvents,
    "2027-2028": [],
  },
};

export function AcademicProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const api = useMemo(
    () => ({
      ...state,
      addClass: (payload) => dispatch({ type: "ADD_CLASS", payload }),
      updateClass: (payload) => dispatch({ type: "UPDATE_CLASS", payload }),
      deleteClass: (id) => dispatch({ type: "DELETE_CLASS", payload: id }),
      addSection: (payload) => dispatch({ type: "ADD_SECTION", payload }),
      updateSection: (payload) => dispatch({ type: "UPDATE_SECTION", payload }),
      deleteSection: (id) => dispatch({ type: "DELETE_SECTION", payload: id }),
      addRoom: (payload) => dispatch({ type: "ADD_ROOM", payload }),
      updateRoom: (payload) => dispatch({ type: "UPDATE_ROOM", payload }),
      deleteRoom: (id) => dispatch({ type: "DELETE_ROOM", payload: id }),
      addMapping: (payload) => dispatch({ type: "ADD_MAPPING", payload }),
      updateMapping: (payload) => dispatch({ type: "UPDATE_MAPPING", payload }),
      deleteMapping: (id) => dispatch({ type: "DELETE_MAPPING", payload: id }),
      addSubject: (payload) => dispatch({ type: "ADD_SUBJECT", payload }),
      updateSubject: (payload) => dispatch({ type: "UPDATE_SUBJECT", payload }),
      deleteSubject: (id) => dispatch({ type: "DELETE_SUBJECT", payload: id }),
      setClassSubjects: (classId, subjectIds) =>
        dispatch({
          type: "SET_CLASS_SUBJECTS",
          payload: { classId, subjectIds },
        }),
      clearClassSubjects: (classId) =>
        dispatch({ type: "CLEAR_CLASS_SUBJECTS", payload: classId }),
      addRoutineSlot: (payload) =>
        dispatch({ type: "ADD_ROUTINE_SLOT", payload }),
      updateRoutineSlot: (payload) =>
        dispatch({ type: "UPDATE_ROUTINE_SLOT", payload }),
      deleteRoutineSlot: (id) =>
        dispatch({ type: "DELETE_ROUTINE_SLOT", payload: id }),
      setClassSectionRoutine: (classId, sectionId, slots) =>
        dispatch({
          type: "SET_CLASS_SECTION_ROUTINE",
          payload: { classId, sectionId, slots },
        }),
      addCalendarEvent: (academicYear, event) =>
        dispatch({
          type: "ADD_CALENDAR_EVENT",
          payload: { academicYear, event },
        }),
      updateCalendarEvent: (academicYear, event) =>
        dispatch({
          type: "UPDATE_CALENDAR_EVENT",
          payload: { academicYear, event },
        }),
      deleteCalendarEvent: (academicYear, id) =>
        dispatch({
          type: "DELETE_CALENDAR_EVENT",
          payload: { academicYear, id },
        }),
    }),
    [state]
  );

  return (
    <AcademicContext.Provider value={api}>{children}</AcademicContext.Provider>
  );
}

export function useAcademic() {
  const ctx = useContext(AcademicContext);
  if (!ctx) {
    throw new Error("useAcademic must be used within AcademicProvider");
  }
  return ctx;
}
