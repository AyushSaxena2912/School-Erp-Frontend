import React from "react";
import { useSession } from "@/lib/auth/useSession";

export default function StudentDashboardPage() {
  // The name comes from the session, not localStorage: login no longer writes
  // the `bodhya_*` mirror of the user, and the server is the only authority on
  // who is signed in.
  const { session } = useSession();
  const userName = session?.full_name || session?.user || "Student";

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
