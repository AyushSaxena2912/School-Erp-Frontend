import api, { setCsrfToken, setSidToken, clearSessionTokens } from "./client";

function getErrorMessage(error) {
  const excType = error.response?.data?.exc_type;
  if (excType === "CSRFTokenError") {
    return "Session expired. Please try logging in again.";
  }
  return (
    error.response?.data?.message?.message ||
    (typeof error.response?.data?.message === "string"
      ? error.response.data.message
      : null) ||
    error.response?.data?._error_message ||
    error.message ||
    "Something went wrong"
  );
}

/** Match CSRF header to the browser's sid cookie (avoids CSRFTokenError). */
async function syncCsrfWithSession() {
  clearSessionTokens();
  try {
    await api.get("/api/method/education.api.auth.me");
  } catch {
    // Guest / expired session — login can still proceed
  }
}

export async function login({ email, password }) {
  try {
    await syncCsrfWithSession();
    const { data } = await api.post("/api/method/education.api.auth.login", {
      usr: email,
      pwd: password,
    });
    if (data?.csrf_token) {
      setCsrfToken(data.csrf_token);
    }
    if (data?.sid) {
      setSidToken(data.sid);
    }
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function me() {
  try {
    const { data } = await api.get("/api/method/education.api.auth.me");
    if (data?.csrf_token) {
      setCsrfToken(data.csrf_token);
    }
    if (data?.sid) {
      setSidToken(data.sid);
    }
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function logout() {
  try {
    const { data } = await api.post("/api/method/education.api.auth.logout");
    clearSessionTokens();
    return data;
  } catch (error) {
    clearSessionTokens();
    throw new Error(getErrorMessage(error));
  }
}

export async function forgotPassword({ email }) {
  try {
    await syncCsrfWithSession();
    const { data } = await api.post(
      "/api/method/education.api.auth.forgot_password",
      {
        user: email,
        email,
      }
    );
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function resetPassword({ key, newPassword }) {
  try {
    await syncCsrfWithSession();
    const { data } = await api.post(
      "/api/method/education.api.auth.reset_password",
      {
        key,
        new_password: newPassword,
      }
    );
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function changePassword({ currentPassword, newPassword }) {
  try {
    const { data } = await api.post(
      "/api/method/education.api.auth.change_password",
      {
        old_password: currentPassword,
        new_password: newPassword,
      }
    );
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}
