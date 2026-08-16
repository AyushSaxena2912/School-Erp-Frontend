import React from "react";
import { Link, useSearchParams } from "react-router-dom";
import { btnPrimary } from "../components/ui";

export default function ComingSoonPage() {
  const [params] = useSearchParams();
  const moduleName = params.get("module") || "This module";

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white px-6 py-16 text-center shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-green-700">
        Coming soon
      </p>
      <h2 className="mt-2 text-2xl font-bold text-gray-900">{moduleName}</h2>
      <p className="mt-2 max-w-md text-sm text-gray-500">
        This module will be connected as we build it out. Front Office features
        are available now from the sidebar.
      </p>
      <Link to="/front-office" className={`${btnPrimary} mt-6 inline-block`}>
        Back to Front Office
      </Link>
    </div>
  );
}
