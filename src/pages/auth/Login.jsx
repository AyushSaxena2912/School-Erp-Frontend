import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSession } from "@/lib/auth/useSession";
import { EyeIcon, EyeOffIcon } from "../../components/PasswordToggleIcon";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};

    if (!email.trim()) {
      newErrors.email = "Email or username is required.";
    }

    if (!password.trim()) {
      newErrors.password = "Password is required.";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    setIsLoading(true);
    setApiError("");

    try {
      const session = await login(email.trim(), password.trim());

      if (session?.status === "verification_required") {
        setApiError("Additional verification is required to sign in.");
        setIsLoading(false);
        return;
      }

      // Roles come from the server. They are never inferred from the login id —
      // that heuristic was removed from both sides.
      const roles = session?.roles ?? [];
      const destination = roles.includes("Student")
        ? "/front-office/student-dashboard"
        : "/front-office";

      navigate(destination, { replace: true });
    } catch (err) {
      // 401 arrives as a real status code now; the message is server-supplied.
      setApiError(err?.message || "Invalid credentials. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-2 text-left text-3xl font-bold">Welcome Back!</h1>
        <p className="mb-6 text-left text-base font-normal text-gray-500">
          Please enter your details to login
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {apiError && (
            <p className="mb-4 rounded bg-red-100 p-2 text-sm text-red-600">
              {apiError}
            </p>
          )}

          {/* User ID */}
          <div>
            <label className="mb-2 block font-medium">User ID</label>

            <input
              type="text"
              autoComplete="username"
              placeholder="Enter your User ID"
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

          {/* Password */}
          <div>
            <label className="mb-2 block font-medium">Password</label>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);

                  setErrors((prev) => ({
                    ...prev,
                    password: "",
                  }));

                  setApiError("");
                }}
                className="w-full rounded-md border border-gray-300 p-2 pr-10 outline-none focus:border-green-700"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
              >
                {showPassword ? <EyeOffIcon size={20} /> : <EyeIcon size={20} />}
              </button>
            </div>

            {errors.password && (
              <p className="mt-1 text-sm text-red-500">{errors.password}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-md bg-green-700 py-2 font-medium text-white hover:bg-green-800 disabled:opacity-60"
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>

          <Link
            to={"/forgot-password"}
            className="block text-center text-sm text-green-700 hover:underline"
          >
            Forgot Password?
          </Link>
        </form>
      </div>
    </div>
  );
};

export default Login;
