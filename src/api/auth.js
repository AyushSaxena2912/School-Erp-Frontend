import api from "./client";

function getErrorMessage(error) {
  return (
    error.response?.data?.message ||
    error.response?.data?._error_message ||
    error.message ||
    "Something went wrong"
  );
}

export async function login({ email, password }) {
  try {
    // TODO: confirm path/body with Frappe backend
    const { data } = await api.post("/api/method/login", {
      usr: email,
      pwd: password,
    });
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function forgotPassword({ email }) {
  try {
    // TODO: replace with your Frappe method path
    const { data } = await api.post("/api/method/forgot_password", {
      email,
    });
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function resetPassword({ key, newPassword }) {
  try {
    // TODO: replace with your Frappe method path
    const { data } = await api.post("/api/method/reset_password", {
      key,
      new_password: newPassword,
    });
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function changePassword({ currentPassword, newPassword }) {
  try {
    // TODO: replace with your Frappe method path
    const { data } = await api.post("/api/method/update_password", {
      old_password: currentPassword,
      new_password: newPassword,
    });
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}
