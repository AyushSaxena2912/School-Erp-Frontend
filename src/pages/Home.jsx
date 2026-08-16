import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { me, logout } from "../api/auth";

const Home = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await me();
        if (cancelled) return;
        if (!data?.is_authenticated) {
          navigate("/login", { replace: true });
          return;
        }
        setUser(data);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Could not load session");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // clear locally even if API fails
    }
    navigate("/login", { replace: true });
  };

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 p-6">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-6">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-2 text-2xl font-bold">Logged in</h1>
        <p className="mb-6 text-gray-600">
          Welcome, {user.full_name || user.user}.
        </p>
        <div className="space-y-3">
          <Link
            to="/change-password"
            className="block w-full rounded-md border border-gray-300 py-2 text-center hover:bg-gray-50"
          >
            Change Password
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full rounded-md bg-green-700 py-2 font-medium text-white hover:bg-green-800"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
