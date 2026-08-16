import React from "react";
import { Field, inputClass, selectClass } from "./ui";

export const CALL_TIME_TYPES = [
  { value: "", label: "Any time" },
  { value: "at", label: "At exact time" },
  { value: "after", label: "After this time" },
  { value: "between", label: "Between times" },
];

/** Normalize legacy follow-ups that only had timeToCall. */
export function normalizeCallTime(fu = {}) {
  if (fu.timeType) {
    return {
      timeType: fu.timeType,
      timeToCall: fu.timeToCall || "",
      timeToCallEnd: fu.timeToCallEnd || "",
    };
  }
  if (fu.timeToCall) {
    return {
      timeType: "at",
      timeToCall: fu.timeToCall,
      timeToCallEnd: "",
    };
  }
  return { timeType: "", timeToCall: "", timeToCallEnd: "" };
}

export function emptyCallTime() {
  return { timeType: "", timeToCall: "", timeToCallEnd: "" };
}

/**
 * Compact call-time preference: Any / At / After / Between.
 */
export function CallTimePicker({ value, onChange, error }) {
  const timeType = value?.timeType || "";
  const timeToCall = value?.timeToCall || "";
  const timeToCallEnd = value?.timeToCallEnd || "";

  const set = (patch) => onChange({ ...value, ...patch });

  return (
    <Field label="Preferred call time" error={error}>
      <div className="flex flex-wrap items-center gap-2">
        <select
          className={`${selectClass} max-w-[11rem]`}
          value={timeType}
          onChange={(e) => {
            const next = e.target.value;
            set({
              timeType: next,
              timeToCall: next ? timeToCall || "10:00" : "",
              timeToCallEnd:
                next === "between" ? timeToCallEnd || "12:00" : "",
            });
          }}
        >
          {CALL_TIME_TYPES.map((o) => (
            <option key={o.value || "any"} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        {timeType === "at" || timeType === "after" ? (
          <input
            type="time"
            className={`${inputClass} max-w-[9rem]`}
            value={timeToCall}
            onChange={(e) => set({ timeToCall: e.target.value })}
            required
          />
        ) : null}

        {timeType === "between" ? (
          <>
            <input
              type="time"
              className={`${inputClass} max-w-[9rem]`}
              value={timeToCall}
              onChange={(e) => set({ timeToCall: e.target.value })}
              required
              aria-label="From time"
            />
            <span className="text-sm text-gray-500">to</span>
            <input
              type="time"
              className={`${inputClass} max-w-[9rem]`}
              value={timeToCallEnd}
              onChange={(e) => set({ timeToCallEnd: e.target.value })}
              required
              aria-label="To time"
            />
          </>
        ) : null}
      </div>
    </Field>
  );
}

export function validateCallTime(value) {
  const timeType = value?.timeType || "";
  if (!timeType) return "";
  if (!value?.timeToCall) return "Select a time.";
  if (timeType === "between") {
    if (!value?.timeToCallEnd) return "Select end time.";
    if (value.timeToCallEnd <= value.timeToCall) {
      return "End time must be after start time.";
    }
  }
  return "";
}
