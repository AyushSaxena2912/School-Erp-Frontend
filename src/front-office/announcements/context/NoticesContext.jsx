import React, {
  createContext,
  useContext,
  useMemo,
  useReducer,
} from "react";
import { initialNotices, noticeUid } from "../data/notices";

const NoticesContext = createContext(null);

function reducer(state, action) {
  switch (action.type) {
    case "ADD_NOTICE":
      return {
        ...state,
        notices: [
          { id: noticeUid(), ...action.payload },
          ...state.notices,
        ],
      };
    case "UPDATE_NOTICE":
      return {
        ...state,
        notices: state.notices.map((n) =>
          n.id === action.payload.id ? { ...n, ...action.payload } : n
        ),
      };
    case "DELETE_NOTICE":
      return {
        ...state,
        notices: state.notices.filter((n) => n.id !== action.payload),
      };
    default:
      return state;
  }
}

const initialState = {
  notices: initialNotices,
};

export function NoticesProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const api = useMemo(
    () => ({
      ...state,
      addNotice: (payload) =>
        dispatch({ type: "ADD_NOTICE", payload }),
      updateNotice: (payload) =>
        dispatch({ type: "UPDATE_NOTICE", payload }),
      deleteNotice: (id) =>
        dispatch({ type: "DELETE_NOTICE", payload: id }),
    }),
    [state]
  );

  return (
    <NoticesContext.Provider value={api}>{children}</NoticesContext.Provider>
  );
}

export function useNotices() {
  const ctx = useContext(NoticesContext);
  if (!ctx) {
    throw new Error("useNotices must be used within NoticesProvider");
  }
  return ctx;
}
