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
      <div>
        <p className="text-sm text-gray-500">
          <Link
            to="/front-office/enquiries"
            className="text-green-700 hover:underline"
          >
            Admission Inquiry
          </Link>
          <span className="mx-1.5 text-gray-300">/</span>
          {isEdit ? "Edit" : "New"}
        </p>
        <h2 className="text-2xl font-bold text-gray-900">
          {isEdit ? "Edit Inquiry" : "New Admission Inquiry"}
        </h2>
        <p className="text-sm text-gray-500">
          Step 1 — capture student name, class, and parent contact only.
        </p>
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
