import React from "react";

export default function StudentDashboardPage() {
  const userName = localStorage.getItem("bodhya_user_name") || "Student";

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Student Dashboard</h2>
        <p className="mt-1 text-sm text-gray-500">
          Welcome back, <strong className="font-semibold text-gray-800">{userName}</strong>. Select an option from the sidebar to get started.
        </p>
      </div>

      <div className="min-h-[360px] rounded-lg border border-gray-200 bg-white p-8" />
    </div>
  );
}
