import React from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useFrontOffice } from "../context/FrontOfficeContext";
import EnquiryForm from "../components/EnquiryForm";

export default function EnquiryFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { enquiries, addEnquiry, updateEnquiry } = useFrontOffice();
  const editing = id ? enquiries.find((e) => e.id === id) : null;
  const isEdit = Boolean(id);

  const lockedStatuses = [
    "Form Submitted",
    "Corrections Submitted",
    "Verified",
    "Accounts Created",
  ];

  if (isEdit && !editing) {
    return (
      <div className="rounded-lg bg-white p-8 shadow-sm">
        <h2 className="mb-2 text-xl font-bold text-gray-900">Inquiry not found</h2>
        <Link
          to="/front-office/enquiries"
          className="text-sm font-medium text-green-700 hover:underline"
        >
          Back to inquiries
        </Link>
      </div>
    );
  }

  if (
    isEdit &&
    (editing?.converted || lockedStatuses.includes(editing?.status))
  ) {
    return (
      <div className="rounded-lg bg-white p-8 shadow-sm">
        <h2 className="mb-2 text-xl font-bold text-gray-900">Inquiry locked</h2>
        <p className="mb-4 text-sm text-gray-500">
          This inquiry can no longer be edited from Front Office.
        </p>
        <Link
          to={`/front-office/enquiries?open=${editing.id}`}
          className="text-sm font-medium text-green-700 hover:underline"
        >
          View inquiry
        </Link>
      </div>
    );
  }

  const handleSave = (payload) => {
    if (isEdit) {
      updateEnquiry({ ...editing, ...payload, id: editing.id });
      navigate(`/front-office/enquiries?open=${editing.id}`, { replace: true });
      return;
    }
    const newId = addEnquiry({
      ...payload,
      status: "Inquiry",
      followUps: [],
    });
    navigate(`/front-office/enquiries?open=${newId}`, { replace: true });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate("/front-office/enquiries")}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 shadow-xs hover:bg-gray-50 hover:border-gray-300 hover:text-green-700 transition-all cursor-pointer"
          title="Back"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">
            {isEdit ? "Edit Inquiry" : "New Admission Inquiry"}
          </h2>
          <p className="text-xs text-gray-500">
            Step 1 — capture student name, class, and parent contact details.
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-5 sm:p-6">
        <EnquiryForm
          initial={editing}
          onCancel={() => navigate("/front-office/enquiries")}
          onSave={handleSave}
        />
      </div>
    </div>
  );
}
