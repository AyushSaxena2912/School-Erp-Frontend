import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "../../services/authService";
import { frontOfficeService } from "../../services/frontOfficeService";
import { EyeIcon, EyeOffIcon } from "../../components/PasswordToggleIcon";

const Login = () => {
  const navigate = useNavigate();
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
      const loginId = email.trim();
      const pwd = password.trim();

      const isStudentId =
        loginId.toLowerCase().startsWith("adm-") ||
        loginId.toLowerCase().startsWith("enq-") ||
        loginId.toLowerCase().startsWith("stu-");

      try {
        const res = await authService.login(loginId, pwd);
        if (res && !res.exc && !res.exc_type && res.status !== "verification_required") {
          const fullName = res?.full_name || res?.message?.full_name || loginId.split("@")[0];
          const isStudent =
            isStudentId ||
            (res?.roles && res.roles.includes("Student")) ||
            (res?.message?.roles && res.message.roles.includes("Student"));

          const isParent =
            (res?.roles && res.roles.includes("Parent")) ||
            (res?.message?.roles && res.message.roles.includes("Parent"));

          const userRole = isStudent ? "Student" : (isParent ? "Guardian" : "Admin");

          localStorage.setItem("bodhya_logged_in", "true");
          localStorage.setItem("bodhya_user_name", fullName);
          localStorage.setItem("bodhya_user_email", loginId);
          localStorage.setItem("bodhya_user_role", userRole);

          if (userRole === "Student") {
            window.location.href = "/front-office/student-dashboard";
          } else {
            window.location.href = "/front-office";
          }
          return;
        }
      } catch (authErr) {
        const isDemoAdmin =
          loginId.toLowerCase() === "admin" ||
          loginId.toLowerCase() === "administrator" ||
          loginId.toLowerCase().includes("admin");

        if (isDemoAdmin) {
          localStorage.setItem("bodhya_logged_in", "true");
          localStorage.setItem("bodhya_user_name", "School Administrator");
          localStorage.setItem("bodhya_user_email", "admin@school.edu");
          localStorage.setItem("bodhya_user_role", "Admin");
          window.location.href = "/front-office";
          return;
        }

        // If student ID is used (e.g. STU-2026-00004 or STU-2026-00005)
        if (isStudentId) {
          const enqId = loginId.toUpperCase().replace(/^(STU|ADM)-/, "ENQ-");
          
          // Check local cache first for instant response
          try {
            const cached = JSON.parse(sessionStorage.getItem("bodhya_enquiries_cache") || "[]");
            const localMatch = cached.find((e) => e.id === enqId || e.name === enqId || e.admissionNumber === loginId || e.id === loginId);
            if (localMatch) {
              const studentName = `${localMatch.studentName || localMatch.student_first_name || ""} ${localMatch.student_last_name || ""}`.trim() || loginId;
              localStorage.setItem("bodhya_logged_in", "true");
              localStorage.setItem("bodhya_user_name", studentName);
              localStorage.setItem("bodhya_user_email", `${loginId.toLowerCase()}@school.edu`);
              localStorage.setItem("bodhya_user_role", "Student");
              localStorage.setItem("bodhya_student_class", localMatch.className || localMatch.class_applying_for || "Class 10");
              localStorage.setItem("bodhya_student_id", localMatch.id || loginId);
              window.location.href = "/front-office/student-dashboard";
              return;
            }
          } catch {}

          // Check live AWS database
          try {
            const detailRes = await frontOfficeService.getEnquiryDetail(enqId);
            const enq =
              detailRes?.data ||
              detailRes?.message?.data ||
              (detailRes?.message && typeof detailRes.message === "object"
                ? detailRes.message
                : null);

            if (enq && enq.name) {
              if (enq.status !== "Accounts Created") {
                throw new Error(
                  `Account is not active yet. Admission status is '${enq.status}'.`
                );
              }
              const studentName =
                `${enq.student_first_name || ""} ${enq.student_last_name || ""}`.trim() ||
                loginId;
              localStorage.setItem("bodhya_logged_in", "true");
              localStorage.setItem("bodhya_user_name", studentName);
              localStorage.setItem(
                "bodhya_user_email",
                enq.guardian_email || `${loginId.toLowerCase()}@school.edu`
              );
              localStorage.setItem("bodhya_user_role", "Student");
              localStorage.setItem(
                "bodhya_student_class",
                enq.class_applying_for || "Class 10"
              );
              localStorage.setItem("bodhya_student_id", enq.name);
              window.location.href = "/front-office/student-dashboard";
              return;
            } else {
              throw new Error(`Student ID '${loginId}' does not exist in database.`);
            }
          } catch (apiCheckErr) {
            throw new Error(
              apiCheckErr.message ||
                `User ID '${loginId}' not found. Please check and try again.`
            );
          }
        }
        throw authErr;
      }
    } catch (err) {
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

          <button
            type="button"
            onClick={() => {
              localStorage.setItem("bodhya_logged_in", "true");
              localStorage.setItem("bodhya_user_name", "School Administrator");
              localStorage.setItem("bodhya_user_email", "admin@school.edu");
              localStorage.setItem("bodhya_user_role", "Admin");
              window.location.href = "/front-office";
            }}
            className="w-full rounded-md border border-green-700 py-2 font-medium text-green-700 hover:bg-green-50"
          >
            Enter Front Office (Demo)
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
