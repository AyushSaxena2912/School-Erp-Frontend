/**
 * The session context object, in its own module.
 *
 * Kept separate from the provider so `SessionContext.jsx` exports components
 * only — a file that mixes component and non-component exports cannot be
 * hot-reloaded by React Fast Refresh.
 */
import { createContext } from "react";

export const SessionContext = createContext(null);
