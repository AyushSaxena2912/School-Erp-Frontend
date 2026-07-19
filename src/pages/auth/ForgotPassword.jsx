import React, { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../../api/auth";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};

    if (!email.trim()) {
      newErrors.email = "Email is required.";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Please enter a valid email.";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    setIsLoading(true);
    setApiError("");

    try {
      await forgotPassword({ email });
      setEmailSent(true);
    } catch (err) {
      setApiError(err.message || "Failed to send reset link.");
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
          <h1 className="mb-2 text-left text-3xl font-bold">Check your email</h1>
          <p className="mb-6 text-left text-base font-normal text-gray-500">
            We sent a password reset link to{" "}
            <span className="font-medium text-gray-700">{email}</span>. Click
            the link in the email to create a new password.
          </p>

          {/* Demo-only: real flow opens this via email link */}
          <Link
            to="/reset-password"
            className="mb-4 block w-full rounded-md bg-green-700 py-2 text-center font-medium text-white hover:bg-green-800"
          >
            Open Reset Link
          </Link>

          <Link
            to="/login"
            className="block text-center text-sm text-green-700 hover:underline"
          >
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-2 text-left text-3xl font-bold">Forgot Password</h1>

        <p className="mb-6 text-left text-base font-normal text-gray-500">
          Enter your registered email address to receive a password reset link.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {apiError && (
            <p className="mb-4 rounded bg-red-100 p-2 text-sm text-red-600">
              {apiError}
            </p>
          )}

          <div>
            <label className="mb-2 block font-medium">Email</label>

            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrors((prev) => ({
                  ...prev,
                  email: "",
                }));
                setApiError("");
              }}
              className="w-full rounded-md border border-gray-300 p-2 outline-none focus:border-green-700"
            />

            {errors.email && (
              <p className="mt-1 text-sm text-red-500">{errors.email}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-md bg-green-700 py-2 font-medium text-white hover:bg-green-800 disabled:opacity-60"
          >
            {isLoading ? "Sending..." : "Send Reset Link"}
          </button>

          <Link
            to="/login"
            className="block text-center text-sm text-green-700 hover:underline"
          >
            Back to Login
          </Link>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
