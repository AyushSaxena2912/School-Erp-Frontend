let csrfToken = localStorage.getItem("csrf_token") || null;
let sidToken = localStorage.getItem("frappe_sid") || null;

export function setCsrfToken(token) {
  csrfToken = token;
  if (token) {
    localStorage.setItem("csrf_token", token);
  } else {
    localStorage.removeItem("csrf_token");
  }
}

export function setSidToken(sid) {
  sidToken = sid;
  if (sid && sid !== "Guest") {
    localStorage.setItem("frappe_sid", sid);
  } else {
    localStorage.removeItem("frappe_sid");
  }
}

export function clearSessionTokens() {
  setCsrfToken(null);
  setSidToken(null);
}

export function getCsrfToken() {
  return csrfToken;
}

export function getSidToken() {
  return sidToken;
}

const API_URL =
  import.meta.env.VITE_API_URL !== undefined
    ? import.meta.env.VITE_API_URL
    : "http://education.local:8002";

const DEFAULT_SITE = import.meta.env.VITE_FRAPPE_SITE || "education.local";

async function request(method, url, body) {
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  if (DEFAULT_SITE) {
    headers["X-Frappe-Site-Name"] = DEFAULT_SITE;
  }

  if (sidToken) {
    headers["X-Frappe-Session-Id"] = sidToken;
  }

  if (csrfToken && method.toUpperCase() !== "GET") {
    headers["X-Frappe-CSRF-Token"] = csrfToken;
  }

  const response = await fetch(`${API_URL}${url}`, {
    method,
    credentials: "include",
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  const text = await response.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
  }

  // Frappe packages endpoint responses as { message: { ... } } or { message: "..." }
  const resultData = data?.message !== undefined ? data.message : data;

  if (resultData && typeof resultData === "object") {
    if (resultData.csrf_token) {
      setCsrfToken(resultData.csrf_token);
    }
    if (resultData.sid) {
      setSidToken(resultData.sid);
    }
  }

  if (!response.ok) {
    const errorMsg =
      data?.message?.message ||
      (typeof data?.message === "string" ? data.message : null) ||
      data?._error_message ||
      data?.exception ||
      "Request failed";
    const error = new Error(errorMsg);
    error.response = { data, status: response.status };
    throw error;
  }

  return { data: resultData, raw: data };
}

const api = {
  post: (url, body) => request("POST", url, body),
  get: (url) => request("GET", url),
  put: (url, body) => request("PUT", url, body),
  delete: (url) => request("DELETE", url),
};

export default api;
