import React, { useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useFrontOffice } from "../context/FrontOfficeContext";
import {
  Field,
  StatusBadge,
  inputClass,
  selectClass,
  btnPrimary,
  btnSecondary,
  EmptyState,
} from "../components/ui";

function isImageLogo(logo) {
  return Boolean(
    logo &&
      (logo.startsWith("data:") ||
        logo.startsWith("http") ||
        logo.startsWith("/"))
  );
}

function normalizeProfileLogo(logo) {
  return isImageLogo(logo) ? logo : "";
}

export default function BranchesPage() {
  const navigate = useNavigate();
  const profileFileRef = useRef(null);
  const {
    schoolProfile,
    branches,
    updateSchoolProfile,
    updateBranch,
    deleteBranch,
  } = useFrontOffice();

  const [activeTab, setActiveTab] = useState("branches");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [profileForm, setProfileForm] = useState(() => ({
    ...schoolProfile,
    logo: normalizeProfileLogo(schoolProfile.logo),
  }));
  const [profileLogoName, setProfileLogoName] = useState("");
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");

  const filteredBranches = useMemo(() => {
    return (branches || []).filter((b) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !q ||
        b.name.toLowerCase().includes(q) ||
        b.code.toLowerCase().includes(q) ||
        (b.principalName || "").toLowerCase().includes(q) ||
        (b.address || "").toLowerCase().includes(q);

      const matchStatus =
        statusFilter === "All" || b.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [branches, searchQuery, statusFilter]);

  const branchCount = (branches || []).length;

  const handleProfileLogoFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setProfileError("Please upload an image file (PNG, JPG, WEBP or SVG).");
      e.target.value = "";
      return;
    }
    if (file.size > 1.5 * 1024 * 1024) {
      setProfileError("Logo must be under 1.5 MB.");
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setProfileForm((p) => ({ ...p, logo: String(reader.result || "") }));
      setProfileLogoName(file.name);
      setProfileError("");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const clearProfileLogo = () => {
    setProfileForm((p) => ({ ...p, logo: "" }));
    setProfileLogoName("");
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    setProfileError("");
    if (!profileForm.name.trim()) {
      setProfileError("Institution name is required.");
      return;
    }
    if (!profileForm.phone.trim()) {
      setProfileError("Primary contact phone is required.");
      return;
    }
    if (!profileForm.email.trim()) {
      setProfileError("Primary contact email is required.");
      return;
    }
    updateSchoolProfile({
      ...profileForm,
      name: profileForm.name.trim(),
      affiliationCode: (profileForm.affiliationCode || "").trim(),
      phone: profileForm.phone.trim(),
      email: profileForm.email.trim(),
      website: (profileForm.website || "").trim(),
      establishedYear: (profileForm.establishedYear || "").trim(),
      address: (profileForm.address || "").trim(),
      logo: normalizeProfileLogo(profileForm.logo),
    });
    setProfileMessage("School profile updated successfully.");
    setTimeout(() => setProfileMessage(""), 3000);
  };

  const handleDeleteBranch = (id, name) => {
    if (window.confirm(`Delete branch "${name}"?`)) {
      deleteBranch(id);
    }
  };

  const handleToggleStatus = (b) => {
    updateBranch({
      id: b.id,
      status: b.status === "Active" ? "Inactive" : "Active",
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {schoolProfile.name} Setup
          </h2>
          <p className="text-sm text-gray-500">
            Institution profile and school branches
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={activeTab === "branches" ? btnPrimary : btnSecondary}
            onClick={() => setActiveTab("branches")}
          >
            Branches ({branchCount})
          </button>
          <button
            type="button"
            className={activeTab === "profile" ? btnPrimary : btnSecondary}
            onClick={() => setActiveTab("profile")}
          >
            School Profile
          </button>
        </div>
      </div>

      {activeTab === "branches" && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="flex flex-1 flex-wrap items-end gap-3 min-w-[240px]">
              <div className="min-w-[220px] flex-1 max-w-md">
                <label className="mb-1.5 block text-sm font-medium text-gray-800">
                  Search
                </label>
                <input
                  type="text"
                  placeholder="Name, code, principal…"
                  className={inputClass}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="w-40">
                <label className="mb-1.5 block text-sm font-medium text-gray-800">
                  Status
                </label>
                <select
                  className={selectClass}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="All">All</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
            <Link to="/front-office/branches/new" className={btnPrimary}>
              + Create Branch
            </Link>
          </div>

          {filteredBranches.length === 0 ? (
            <EmptyState message="No branches found. Create a branch to get started." />
          ) : (
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-gray-200 bg-gray-50 text-xs font-medium uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="px-4 py-3">Logo</th>
                      <th className="px-4 py-3">Code</th>
                      <th className="px-4 py-3">Branch</th>
                      <th className="px-4 py-3">Principal</th>
                      <th className="px-4 py-3">Contact</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredBranches.map((b) => (
                      <tr key={b.id} className="hover:bg-gray-50/80">
                        <td className="px-4 py-3">
                          {b.logo ? (
                            <img
                              src={b.logo}
                              alt=""
                              className="h-9 w-9 rounded-md border border-gray-200 object-cover bg-white"
                            />
                          ) : (
                            <div className="flex h-9 w-9 items-center justify-center rounded-md border border-dashed border-gray-300 bg-gray-50 text-xs text-gray-400">
                              —
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {b.code}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{b.name}</p>
                          <p className="mt-0.5 text-xs text-gray-500">
                            {b.address || "No address"}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-gray-800">
                          {b.principalName || "—"}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          <div className="space-y-0.5">
                            {b.email ? (
                              <p className="truncate max-w-[200px]">{b.email}</p>
                            ) : null}
                            {b.phone ? <p>{b.phone}</p> : null}
                            {!b.email && !b.phone ? <span>—</span> : null}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(b)}
                            title={`Mark as ${
                              b.status === "Active" ? "Inactive" : "Active"
                            }`}
                          >
                            <StatusBadge status={b.status} />
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              className={btnSecondary}
                              onClick={() =>
                                navigate(`/front-office/branches/${b.id}/edit`)
                              }
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="rounded-md border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                              onClick={() => handleDeleteBranch(b.id, b.name)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "profile" && (
        <form
          onSubmit={handleSaveProfile}
          className="overflow-hidden rounded-lg border border-gray-200 bg-white"
        >
          {profileMessage ? (
            <div className="border-b border-green-200 bg-green-50 px-5 py-3 text-sm text-green-800 sm:px-6">
              {profileMessage}
            </div>
          ) : null}
          {profileError ? (
            <div className="border-b border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700 sm:px-6">
              {profileError}
            </div>
          ) : null}

          <div className="space-y-6 p-5 sm:p-6 lg:p-7">
            <div>
              <h3 className="text-base font-semibold text-gray-900">
                Institution profile
              </h3>
              <p className="text-sm text-gray-500">
                Defaults used across branches and communications.
              </p>
            </div>

            <section className="space-y-3">
              <div>
                <h4 className="text-sm font-semibold text-gray-900">Logo</h4>
                <p className="text-xs text-gray-500">
                  School / group logo. PNG, JPG, WEBP or SVG · max 1.5 MB
                </p>
              </div>

              <div className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-gray-50/80 p-4 sm:flex-row sm:items-center">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                  {isImageLogo(profileForm.logo) ? (
                    <img
                      src={profileForm.logo}
                      alt="Institution logo preview"
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
                    ref={profileFileRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                    className="hidden"
                    onChange={handleProfileLogoFile}
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      className={btnSecondary}
                      onClick={() => profileFileRef.current?.click()}
                    >
                      {isImageLogo(profileForm.logo)
                        ? "Change logo"
                        : "Upload logo"}
                    </button>
                    {isImageLogo(profileForm.logo) ? (
                      <button
                        type="button"
                        className="rounded-md px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                        onClick={clearProfileLogo}
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>
                  <p className="truncate text-xs text-gray-500">
                    {profileLogoName ||
                      (isImageLogo(profileForm.logo)
                        ? "Current logo on file"
                        : "No file selected")}
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-4 border-t border-gray-100 pt-6">
              <div>
                <h4 className="text-sm font-semibold text-gray-900">
                  Institution details
                </h4>
                <p className="text-xs text-gray-500">
                  Legal / group name and affiliation.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Institution / school group name"
                  required
                  className="sm:col-span-2"
                >
                  <input
                    type="text"
                    className={inputClass}
                    value={profileForm.name}
                    onChange={(e) =>
                      setProfileForm((p) => ({ ...p, name: e.target.value }))
                    }
                    placeholder="e.g. Delhi Public School"
                  />
                </Field>

                <Field label="Affiliation / registry code">
                  <input
                    type="text"
                    className={inputClass}
                    value={profileForm.affiliationCode}
                    onChange={(e) =>
                      setProfileForm((p) => ({
                        ...p,
                        affiliationCode: e.target.value,
                      }))
                    }
                    placeholder="e.g. CBSE-123456"
                  />
                </Field>

                <Field label="Established year">
                  <input
                    type="text"
                    className={inputClass}
                    value={profileForm.establishedYear}
                    onChange={(e) =>
                      setProfileForm((p) => ({
                        ...p,
                        establishedYear: e.target.value,
                      }))
                    }
                    placeholder="e.g. 1998"
                  />
                </Field>
              </div>
            </section>

            <section className="space-y-4 border-t border-gray-100 pt-6">
              <div>
                <h4 className="text-sm font-semibold text-gray-900">Contact</h4>
                <p className="text-xs text-gray-500">
                  Primary HQ contact used in communications.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Primary contact phone" required>
                  <input
                    type="text"
                    className={inputClass}
                    value={profileForm.phone}
                    onChange={(e) =>
                      setProfileForm((p) => ({ ...p, phone: e.target.value }))
                    }
                    placeholder="+91 …"
                  />
                </Field>

                <Field label="Primary contact email" required>
                  <input
                    type="email"
                    className={inputClass}
                    value={profileForm.email}
                    onChange={(e) =>
                      setProfileForm((p) => ({ ...p, email: e.target.value }))
                    }
                    placeholder="info@school.edu"
                  />
                </Field>

                <Field label="Website URL" className="sm:col-span-2">
                  <input
                    type="text"
                    className={inputClass}
                    value={profileForm.website}
                    onChange={(e) =>
                      setProfileForm((p) => ({ ...p, website: e.target.value }))
                    }
                    placeholder="www.school.edu"
                  />
                </Field>

                <Field
                  label="HQ / registered office address"
                  className="sm:col-span-2"
                >
                  <textarea
                    className={`${inputClass} min-h-[96px] resize-y`}
                    value={profileForm.address}
                    onChange={(e) =>
                      setProfileForm((p) => ({ ...p, address: e.target.value }))
                    }
                    placeholder="Registered office address"
                  />
                </Field>
              </div>
            </section>
          </div>

          <div className="flex flex-wrap justify-end gap-2 border-t border-gray-200 bg-gray-50 px-5 py-4 sm:px-6">
            <button type="submit" className={btnPrimary}>
              Save profile
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
