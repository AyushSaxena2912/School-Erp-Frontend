import { useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useFrontOffice } from "../context/FrontOfficeContext";
import {
  Field,
  btnPrimary,
  btnSecondary,
  inputClass,
  selectClass,
} from "../components/ui";

const emptyForm = () => ({
  name: "",
  code: "",
  principalName: "",
  email: "",
  phone: "",
  address: "",
  status: "Active",
  logo: "",
});

function formFromBranch(b) {
  return {
    name: b.name || "",
    code: b.code || "",
    principalName: b.principalName || "",
    email: b.email || "",
    phone: b.phone || "",
    address: b.address || "",
    status: b.status || "Active",
    logo: b.logo || "",
  };
}

export default function BranchFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const { branches, addBranch, updateBranch } = useFrontOffice();
  const editing = id ? branches.find((b) => b.id === id) : null;
  const isEdit = Boolean(id);

  const [form, setForm] = useState(() =>
    editing ? formFromBranch(editing) : emptyForm()
  );
  const [logoName, setLogoName] = useState("");
  const [error, setError] = useState("");

  if (isEdit && !editing) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8">
        <h2 className="mb-2 text-xl font-bold text-gray-900">Branch not found</h2>
        <p className="mb-4 text-sm text-gray-500">
          This branch may have been removed.
        </p>
        <Link
          to="/front-office/branches"
          className="text-sm font-medium text-green-700 hover:underline"
        >
          Back to branches
        </Link>
      </div>
    );
  }

  const handleLogoFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file (PNG, JPG, WEBP or SVG).");
      e.target.value = "";
      return;
    }
    if (file.size > 1.5 * 1024 * 1024) {
      setError("Logo must be under 1.5 MB.");
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setForm((p) => ({ ...p, logo: String(reader.result || "") }));
      setLogoName(file.name);
      setError("");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const clearLogo = () => {
    setForm((p) => ({ ...p, logo: "" }));
    setLogoName("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Branch name is required.");
      return;
    }
    if (!form.code.trim()) {
      setError("Branch code is required.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
      principalName: form.principalName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      status: form.status,
      logo: form.logo || "",
    };

    if (isEdit) {
      updateBranch({ id: editing.id, ...payload });
    } else {
      const codeExists = branches.some((b) => b.code === payload.code);
      if (codeExists) {
        setError(`Branch code "${payload.code}" already exists.`);
        return;
      }
      addBranch(payload);
    }
    navigate("/front-office/branches", { replace: true });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-gray-500">
            <Link
              to="/front-office/branches"
              className="text-green-700 hover:underline"
            >
              Branches
            </Link>
            <span className="mx-1.5 text-gray-300">/</span>
            {isEdit ? "Edit" : "New"}
          </p>
          <h2 className="text-2xl font-bold text-gray-900">
            {isEdit ? "Edit branch" : "Create branch"}
          </h2>
          <p className="text-sm text-gray-500">
            {isEdit
              ? "Update campus details, contact info, and logo."
              : "Add a campus or branch for this school."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={btnSecondary}
            onClick={() => navigate("/front-office/branches")}
          >
            Cancel
          </button>
          <button type="submit" form="branch-form" className={btnPrimary}>
            {isEdit ? "Save changes" : "Create branch"}
          </button>
        </div>
      </div>

      <form
        id="branch-form"
        onSubmit={handleSubmit}
        className="overflow-hidden rounded-lg border border-gray-200 bg-white"
      >
        {error ? (
          <div className="border-b border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700 sm:px-6">
            {error}
          </div>
        ) : null}

        <div className="space-y-6 p-5 sm:p-6 lg:p-7">
          <section className="space-y-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Logo</h3>
              <p className="text-xs text-gray-500">
                Shown on the branches list. PNG, JPG, WEBP or SVG · max 1.5 MB
              </p>
            </div>

            <div className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-gray-50/80 p-4 sm:flex-row sm:items-center">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                {form.logo ? (
                  <img
                    src={form.logo}
                    alt="Branch logo preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="px-2 text-center text-xs text-gray-400">
                    No logo
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1 space-y-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                  className="hidden"
                  onChange={handleLogoFile}
                />
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    className={btnSecondary}
                    onClick={() => fileRef.current?.click()}
                  >
                    {form.logo ? "Change logo" : "Upload logo"}
                  </button>
                  {form.logo ? (
                    <button
                      type="button"
                      className="rounded-md px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                      onClick={clearLogo}
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
                <p className="truncate text-xs text-gray-500">
                  {logoName ||
                    (form.logo
                      ? "Current logo on file"
                      : "No file selected")}
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-4 border-t border-gray-100 pt-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                Branch details
              </h3>
              <p className="text-xs text-gray-500">
                Name, code, and operating status for this campus.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Branch name" required className="sm:col-span-2">
                <input
                  type="text"
                  className={inputClass}
                  value={form.name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, name: e.target.value }))
                  }
                  placeholder="e.g. Delhi Public School - East Campus"
                />
              </Field>

              <Field label="Branch code" required>
                <input
                  type="text"
                  className={inputClass}
                  value={form.code}
                  disabled={isEdit}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, code: e.target.value }))
                  }
                  placeholder="e.g. DPS-EAST"
                />
              </Field>

              <Field label="Status">
                <select
                  className={selectClass}
                  value={form.status}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, status: e.target.value }))
                  }
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </Field>
            </div>
          </section>

          <section className="space-y-4 border-t border-gray-100 pt-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Contact</h3>
              <p className="text-xs text-gray-500">
                Principal and campus contact details.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Principal / in-charge"
                className="sm:col-span-2"
              >
                <input
                  type="text"
                  className={inputClass}
                  value={form.principalName}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, principalName: e.target.value }))
                  }
                  placeholder="e.g. Mrs. Ritu Verma"
                />
              </Field>

              <Field label="Email">
                <input
                  type="email"
                  className={inputClass}
                  value={form.email}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, email: e.target.value }))
                  }
                  placeholder="principal@school.edu"
                />
              </Field>

              <Field label="Phone">
                <input
                  type="text"
                  className={inputClass}
                  value={form.phone}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, phone: e.target.value }))
                  }
                  placeholder="+91 …"
                />
              </Field>

              <Field label="Address" className="sm:col-span-2">
                <textarea
                  className={`${inputClass} min-h-[96px] resize-y`}
                  value={form.address}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, address: e.target.value }))
                  }
                  placeholder="Campus address"
                />
              </Field>
            </div>
          </section>
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-gray-200 bg-gray-50 px-5 py-4 sm:px-6">
          <button
            type="button"
            className={btnSecondary}
            onClick={() => navigate("/front-office/branches")}
          >
            Cancel
          </button>
          <button type="submit" className={btnPrimary}>
            {isEdit ? "Save changes" : "Create branch"}
          </button>
        </div>
      </form>
    </div>
  );
}
