/**
 * Session state for the SPA.
 *
 * The session itself lives in an HttpOnly cookie the browser sends automatically.
 * This context holds only what the UI needs to render — who you are and what
 * roles you have — plus the CSRF token, which is kept in memory by the client.
 *
 * Nothing here touches localStorage. The old code stored the Frappe session id
 * there and replayed it via a header; that header no longer exists server-side,
 * and storing it made the session stealable by any XSS.
 */

import { useCallback, useEffect, useMemo, useState } from "react";

import { SessionContext } from "./context";
import { setCsrfToken, setUnauthenticatedHandler } from "@/lib/api/client";
import { auth } from "@/lib/api/endpoints";
import { queryClient } from "@/lib/api/queries";

export function SessionProvider({ children }) {
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const applySession = useCallback((next) => {
    setSession(next?.is_authenticated ? next : null);
    setCsrfToken(next?.csrf_token ?? null);
  }, []);

  const clear = useCallback(() => {
    setSession(null);
    setCsrfToken(null);
    queryClient.clear();
  }, []);

  // A 401 from anywhere means the session is gone; drop local state so the
  // router can send the user to /login.
  useEffect(() => {
    setUnauthenticatedHandler(clear);
    return () => setUnauthenticatedHandler(null);
  }, [clear]);

  // Resolve the session once on boot. `me` is guest-callable and reports
  // `is_authenticated: false` rather than erroring.
  useEffect(() => {
    let cancelled = false;
    auth
      .me()
      .then((next) => {
        if (!cancelled) applySession(next);
      })
      .catch(() => {
        if (!cancelled) clear();
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [applySession, clear]);

  const login = useCallback(
    async (username, password) => {
      const next = await auth.login(username, password);
      applySession(next);
      return next;
    },
    [applySession],
  );

  const logout = useCallback(async () => {
    try {
      await auth.logout();
    } finally {
      clear();
    }
  }, [clear]);

  const value = useMemo(() => {
    const roles = session?.roles ?? [];
    return {
      session,
      isLoading,
      isAuthenticated: Boolean(session?.is_authenticated),
      user: session?.user ?? null,
      fullName: session?.full_name ?? null,
      roles,
      /**
       * Convenience for hiding UI. Hiding a control is a courtesy, not a
       * control — the server enforces permissions regardless.
       */
      hasRole: (...names) => names.some((name) => roles.includes(name)),
      login,
      logout,
      refresh: () => auth.me().then(applySession),
    };
  }, [session, isLoading, login, logout, applySession]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
