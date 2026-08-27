/**
 * API Client for ERP Frontend -> School-ERP-Backend (Frappe Framework)
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
const SITE_NAME = import.meta.env.VITE_FRAPPE_SITE || "education.local";

let sessionId = localStorage.getItem("frappe_sid") || null;
let csrfToken = localStorage.getItem("frappe_csrf_token") || null;

export const setAuthSession = (sid, csrf) => {
  sessionId = sid;
  csrfToken = csrf;
  if (sid) localStorage.setItem("frappe_sid", sid);
  else localStorage.removeItem("frappe_sid");

  if (csrf) localStorage.setItem("frappe_csrf_token", csrf);
  else localStorage.removeItem("frappe_csrf_token");
};

export const getAuthSession = () => ({
  sessionId,
  csrfToken,
});

/**
 * Generic API request executor
 */
export async function apiRequest(methodName, { method = "GET", params = {}, body = null, headers = {} } = {}) {
  const baseUrl = BASE_URL || (typeof window !== "undefined" ? window.location.origin : "http://127.0.0.1:5173");
  const url = new URL(`/api/method/${methodName}`, baseUrl);

  if (method === "GET" && params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") {
        url.searchParams.append(k, v);
      }
    });
  }

  const reqHeaders = {
    "X-Frappe-Site-Name": SITE_NAME,
    "Content-Type": "application/json",
    ...headers,
  };

  if (sessionId) {
    reqHeaders["X-Frappe-Session-Id"] = sessionId;
  }
  if (csrfToken && method !== "GET") {
    reqHeaders["X-Frappe-CSRF-Token"] = csrfToken;
  }

  const options = {
    method,
    headers: reqHeaders,
    credentials: "include",
  };

  if (body && method !== "GET") {
    options.body = typeof body === "string" ? body : JSON.stringify(body);
  }

  try {
    const res = await fetch(url.toString(), options);
    const contentType = res.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const data = await res.json();
      
      // Update CSRF token if returned in headers/session metadata
      if (data.message?.csrf_token) {
        csrfToken = data.message.csrf_token;
        localStorage.setItem("frappe_csrf_token", csrfToken);
      }
      if (data.message?.sid) {
        sessionId = data.message.sid;
        localStorage.setItem("frappe_sid", sessionId);
      }

      if (!res.ok || data.exc || data.status === "error") {
        let errMsg = data.message || data.exception;
        if (data._server_messages) {
          try {
            const msgs = JSON.parse(data._server_messages);
            const parsed = JSON.parse(msgs[0]);
            if (parsed.message) errMsg = parsed.message;
          } catch {}
        }
        throw new Error(errMsg || `HTTP Error ${res.status}`);
      }

      return data.message || data;
    } else {
      const text = await res.text();
      if (!res.ok) throw new Error(`HTTP Error ${res.status}: ${text}`);
      return text;
    }
  } catch (err) {
    console.warn(`[API Client Warning] Call to '${methodName}' failed:`, err.message);
    throw err;
  }
}
