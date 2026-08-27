import { useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Building2, Camera, Upload } from "lucide-react";
import { useFrontOffice } from "../context/FrontOfficeContext";
import {
  Field,
  btnPrimary,
  btnSecondary,
  inputClass,
  selectClass,
} from "../components/ui";

const COUNTRY_CODES = [
  { code: "+91", label: "🇮🇳 +91", country: "India" },
  { code: "+1",  label: "🇺🇸 +1",  country: "USA/Canada" },
  { code: "+44", label: "🇬🇧 +44", country: "UK" },
  { code: "+971",label: "🇦🇪 +971",country: "UAE" },
  { code: "+61", label: "🇦🇺 +61", country: "Australia" },
  { code: "+65", label: "🇸🇬 +65", country: "Singapore" },
  { code: "+60", label: "🇲🇾 +60", country: "Malaysia" },
  { code: "+92", label: "🇵🇰 +92", country: "Pakistan" },
  { code: "+880",label: "🇧🇩 +880",country: "Bangladesh" },
  { code: "+94", label: "🇱🇰 +94", country: "Sri Lanka" },
  { code: "+977",label: "🇳🇵 +977",country: "Nepal" },
  { code: "+49", label: "🇩🇪 +49", country: "Germany" },
  { code: "+33", label: "🇫🇷 +33", country: "France" },
  { code: "+81", label: "🇯🇵 +81", country: "Japan" },
  { code: "+86", label: "🇨🇳 +86", country: "China" },
];

function splitPhone(raw) {
  if (!raw) return { code: "+91", number: "" };
  const sRaw = String(raw).trim();
  const match = COUNTRY_CODES.find((c) => sRaw.startsWith(c.code));
  if (match) {
    return {
      code: match.code,
      number: sRaw.slice(match.code.length).replace(/\D/g, "").slice(0, 10),
    };
  }
  return {
    code: "+91",
    number: sRaw.replace(/^\+?91/, "").replace(/\D/g, "").slice(0, 10),
  };
}

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
  const parsedPhone = splitPhone(editing?.phone || "");
  const [countryCode, setCountryCode] = useState(parsedPhone.code);
  const [phoneNumber, setPhoneNumber] = useState(parsedPhone.number);
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
      phone: phoneNumber.trim() ? `${countryCode} ${phoneNumber.trim()}` : "",
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
          <section className="flex items-center gap-5">
            <div className="relative group">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-white p-1 text-gray-400 transition group-hover:border-green-600 shadow-xs">
                {form.logo ? (
                  <img
                    src={form.logo}
                    alt="Branch logo"
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <Building2 className="h-8 w-8 text-gray-300 group-hover:text-green-600 transition" />
                )}
              </div>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="absolute -bottom-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-green-700 text-white shadow-md hover:bg-green-800 transition cursor-pointer"
                title="Upload logo"
              >
                <Camera className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="space-y-1">
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                className="hidden"
                onChange={handleLogoFile}
              />
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  className={btnSecondary}
                  onClick={() => fileRef.current?.click()}
                >
                  <Upload className="h-3.5 w-3.5 text-gray-500 mr-1.5 inline" />
                  {form.logo ? "Change logo" : "Upload logo"}
                </button>
                {form.logo ? (
                  <button
                    type="button"
                    className="text-xs font-semibold text-red-600 hover:text-red-700 hover:underline px-1.5 py-1 cursor-pointer"
                    onClick={clearLogo}
                  >
                    Remove
                  </button>
                ) : null}
              </div>
              <p className="text-xs text-gray-500">
                Recommended: PNG, JPG, or SVG up to 1.5 MB
              </p>
            </div>
          </section>

          <section className="space-y-4 border-t border-gray-100 pt-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                Branch details
              </h3>
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
                  placeholder="Enter branch name"
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
                  placeholder="e.g. BR-01"
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
                  placeholder="Enter in-charge name"
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
                  placeholder="name@example.com"
                />
              </Field>

              <Field label="Phone">
                <div style={{ display: "flex", border: "1px solid #d1d5db", borderRadius: "8px", overflow: "hidden", background: "#ffffff" }}>
                  <div style={{ position: "relative", flexShrink: 0, borderRight: "1px solid #e5e7eb", background: "#ffffff" }}>
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      style={{
                        width: "100px",
                        border: "none",
                        padding: "9px 24px 9px 10px",
                        fontSize: "13px",
                        fontWeight: 600,
                        background: "#ffffff",
                        cursor: "pointer",
                        outline: "none",
                        appearance: "none",
                        WebkitAppearance: "none",
                      }}
                    >
                      {COUNTRY_CODES.map((c) => (
                        <option key={c.code} value={c.code} title={c.country}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                    <svg
                      style={{
                        position: "absolute",
                        right: "8px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        pointerEvents: "none",
                        color: "#6b7280",
                      }}
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) =>
                      setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 10))
                    }
                    placeholder="Phone number"
                    style={{
                      flex: 1,
                      border: "none",
                      padding: "9px 12px",
                      fontSize: "14px",
                      outline: "none",
                      background: "#ffffff",
                    }}
                  />
                </div>
              </Field>

              <Field label="Address" className="sm:col-span-2">
                <textarea
                  className={`${inputClass} min-h-[96px] resize-y`}
                  value={form.address}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, address: e.target.value }))
                  }
                  placeholder="Enter branch address"
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
