/**
 * Session hook, split from the provider so the module exports components only —
 * otherwise React Fast Refresh cannot hot-reload the provider file.
 */
import { useContext } from "react";

import { SessionContext } from "./context";

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used inside a <SessionProvider>");
  }
  return context;
}
