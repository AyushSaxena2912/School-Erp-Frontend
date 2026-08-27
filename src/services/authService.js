/**
 * Authentication Service connecting to education.api.auth endpoints
 */

import { apiRequest, setAuthSession } from "./apiClient";

export const authService = {
  /**
   * Login user with username/email & password
   */
  async login(username, password) {
    const res = await apiRequest("education.api.auth.login", {
      method: "POST",
      body: { usr: username, pwd: password },
    });

    if (!res || res.exc || res.exc_type || res.status === "verification_required") {
      throw new Error(res?.message || "Invalid username or password");
    }

    const payload = res.message || res;
    if (payload.sid) {
      setAuthSession(payload.sid, payload.csrf_token);
    }

    return payload;
  },

  /**
   * Get logged-in user context
   */
  async getMe() {
    try {
      const res = await apiRequest("education.api.auth.me", {
        method: "GET",
      });
      return res;
    } catch (err) {
      console.warn("[AuthService] GetMe offline fallback");
      return {
        user: "Guest",
        is_authenticated: false,
      };
    }
  },

  /**
   * Logout user
   */
  async logout() {
    try {
      const res = await apiRequest("education.api.auth.logout", {
        method: "POST",
      });
      setAuthSession(null, null);
      return res;
    } catch (err) {
      setAuthSession(null, null);
      return { status: "logged_out" };
    }
  },

  /**
   * Request password reset email
   */
  async forgotPassword(email) {
    return await apiRequest("education.api.auth.forgot_password", {
      method: "POST",
      body: { email },
    });
  },

  /**
   * Reset password with key
   */
  async resetPassword(key, newPassword) {
    return await apiRequest("education.api.auth.reset_password", {
      method: "POST",
      body: { key, new_password: newPassword, logout_all_sessions: 1 },
    });
  },

  /**
   * Change password (authenticated or user specified)
   */
  async changePassword(oldPassword, newPassword, user = null) {
    return await apiRequest("education.api.auth.change_password", {
      method: "POST",
      body: { old_password: oldPassword, new_password: newPassword, user },
    });
  },
};
