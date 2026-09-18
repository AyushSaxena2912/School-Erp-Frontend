import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Building2, Camera, MoreVertical, Pencil, Trash2, Upload } from "lucide-react";
import {
  useBranches,
  useDeleteBranch,
  useSchoolProfile,
  useUpdateBranch,
  useUpdateSchoolProfile,
} from "@/lib/api/queries";
import {
  Field,
  StatusBadge,
  inputClass,
  selectClass,
  btnPrimary,
  btnSecondary,
  EmptyState,
  PhoneInput,
} from "../components/ui";

/** Menu width in px — kept in sync with the portal panel's `w-32` below. */
const BRANCH_MENU_WIDTH = 128;

function BranchActionMenu({ branch, onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const updatePosition = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      setPos({ top: rect.bottom + 4, left: rect.right - BRANCH_MENU_WIDTH });
    };
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (
        buttonRef.current?.contains(e.target) ||
        panelRef.current?.contains(e.target)
      ) {
        return;
      }
      setOpen(false);
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  return (
    <div className="inline-block text-left">
      <button
        type="button"
        ref={buttonRef}
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors cursor-pointer"
        title="Actions"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {open &&
        createPortal(
          <div
            ref={panelRef}
            className="fixed z-50 w-32 origin-top-right rounded-lg border border-gray-200 bg-white py-1 shadow-lg ring-1 ring-black/5 focus:outline-none"
            style={{ top: pos.top, left: pos.left }}
          >
            <button
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors cursor-pointer"
              onClick={() => {
                setOpen(false);
                onEdit();
              }}
            >
              <Pencil className="h-3.5 w-3.5 text-gray-500" />
              <span>Edit</span>
            </button>
            <button
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer"
              onClick={() => {
                setOpen(false);
                onDelete();
              }}
            >
              <Trash2 className="h-3.5 w-3.5 text-red-500" />
              <span>Delete</span>
            </button>
          </div>,
          document.body,
        )}
    </div>
  );
}

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
  const [searchParams, setSearchParams] = useSearchParams();
  const profileFileRef = useRef(null);
  const { data: branchRecords } = useBranches();
  const { data: profile } = useSchoolProfile();
  const updateBranchMutation = useUpdateBranch();
  const removeBranch = useDeleteBranch();
  const updateProfile = useUpdateSchoolProfile();

  const branches = useMemo(
    () =>
      (branchRecords ?? []).map((b) => ({
        id: b.name,
        name: b.branch_name,
        code: b.branch_code || "",
        principalName: b.principal_name || "",
        email: b.email || "",
        phone: b.contact_number || "",
        address: b.address_line || "",
        status: b.is_active ? "Active" : "Inactive",
        logo: "",
      })),
    [branchRecords],
  );

  const schoolProfile = useMemo(
    () => ({
      name: profile?.school_name || "",
      affiliationNumber: profile?.affiliation_number || "",
      establishedYear: profile?.established_year || "",
      email: profile?.email || "",
      phone: profile?.contact_number || "",
      website: profile?.website || "",
      address: profile?.address_line || "",
      city: profile?.city || "",
      state: profile?.state || "",
      logo: "",
    }),
    [profile],
  );

  const updateSchoolProfile = (values, options) =>
    updateProfile.mutate(
      {
        school_name: values.name,
        affiliation_number: values.affiliationNumber,
        established_year: values.establishedYear,
        email: values.email,
        contact_number: values.phone,
        website: values.website,
        address_line: values.address,
        city: values.city,
        state: values.state,
      },
      options,
    );

  const updateBranch = ({ id, ...form }) =>
    updateBranchMutation.mutate({
      name: id,
      values: {
        ...(form.name !== undefined ? { branch_name: form.name } : {}),
        ...(form.status !== undefined ? { is_active: form.status === "Active" ? 1 : 0 } : {}),
      },
    });

  const deleteBranch = (id) => removeBranch.mutate(id);

  const activeTab = searchParams.get("tab") === "profile" ? "profile" : "branches";

  const setActiveTab = (tab) => {
    if (tab === "profile") {
      setSearchParams({ tab: "profile" }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [profileForm, setProfileForm] = useState(() => ({
    ...schoolProfile,
    logo: normalizeProfileLogo(schoolProfile?.logo),
  }));

  useEffect(() => {
    if (schoolProfile) {
      setProfileForm({
        ...schoolProfile,
        logo: normalizeProfileLogo(schoolProfile.logo),
      });
    }
  }, [schoolProfile]);

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
    updateSchoolProfile(
      {
        ...profileForm,
        name: profileForm.name.trim(),
        affiliationNumber: (profileForm.affiliationNumber || "").trim(),
        establishedYear: (profileForm.establishedYear || "").trim(),
        phone: profileForm.phone.trim(),
        email: profileForm.email.trim(),
        website: (profileForm.website || "").trim(),
        address: (profileForm.address || "").trim(),
        logo: normalizeProfileLogo(profileForm.logo),
      },
      {
        onSuccess: () => {
          setProfileMessage("School profile updated successfully.");
          setTimeout(() => setProfileMessage(""), 3000);
          setSearchParams({}, { replace: true });
        },
      },
    );
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {schoolProfile.name} Setup
          </h2>
          <p className="text-sm text-gray-500">
            Institution profile and school branches
          </p>
        </div>
        {activeTab === "branches" && (
          <Link to="/front-office/branches/new" className={btnPrimary}>
            + Create Branch
          </Link>
        )}
      </div>

      {/* Sleek Horizontal Tab Bar */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-6">
          <button
            type="button"
            onClick={() => setActiveTab("branches")}
            className={`cursor-pointer pb-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === "branches"
                ? "border-green-700 text-green-800"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Branches ({branchCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("profile")}
            className={`cursor-pointer pb-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === "profile"
                ? "border-green-700 text-green-800"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            School Profile
          </button>
        </nav>
      </div>

      {activeTab === "branches" && (
        <div className="space-y-4">
          <div className="rounded-lg bg-white p-4 border border-gray-200">
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
              <Field label="Search">
                <input
                  type="text"
                  placeholder="Search branch name, code..."
                  className={inputClass}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </Field>
              <Field label="Status">
                <select
                  className={selectClass}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="All">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </Field>
            </div>
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
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end">
                            <BranchActionMenu
                              branch={b}
                              onEdit={() =>
                                navigate(`/front-office/branches/${b.id}/edit`)
                              }
                              onDelete={() => handleDeleteBranch(b.id, b.name)}
                            />
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
            </div>

            <section className="flex items-center gap-5">
              <div className="relative group">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-white p-1 text-gray-400 transition group-hover:border-green-600 shadow-xs">
                  {isImageLogo(profileForm.logo) ? (
                    <img
                      src={profileForm.logo}
                      alt="Institution logo"
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <Building2 className="h-8 w-8 text-gray-300 group-hover:text-green-600 transition" />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => profileFileRef.current?.click()}
                  className="absolute -bottom-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-green-700 text-white shadow-md hover:bg-green-800 transition cursor-pointer"
                  title="Upload logo"
                >
                  <Camera className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="space-y-1">
                <input
                  ref={profileFileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                  className="hidden"
                  onChange={handleProfileLogoFile}
                />
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    className={btnSecondary}
                    onClick={() => profileFileRef.current?.click()}
                  >
                    <Upload className="h-3.5 w-3.5 text-gray-500 mr-1.5 inline" />
                    {isImageLogo(profileForm.logo) ? "Change logo" : "Upload logo"}
                  </button>
                  {isImageLogo(profileForm.logo) ? (
                    <button
                      type="button"
                      className="text-xs font-semibold text-red-600 hover:text-red-700 hover:underline px-1.5 py-1 cursor-pointer"
                      onClick={clearProfileLogo}
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
                <h4 className="text-sm font-semibold text-gray-900">
                  Institution details
                </h4>
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
                    placeholder="Enter institution name"
                  />
                </Field>

                <Field label="Affiliation / registry code">
                  <input
                    type="text"
                    className={inputClass}
                    value={profileForm.affiliationNumber || ""}
                    onChange={(e) =>
                      setProfileForm((p) => ({
                        ...p,
                        affiliationNumber: e.target.value,
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
                    placeholder="e.g. 2000"
                  />
                </Field>
              </div>
            </section>

            <section className="space-y-4 border-t border-gray-100 pt-6">
              <div>
                <h4 className="text-sm font-semibold text-gray-900">Contact</h4>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Primary contact phone" required>
                  <PhoneInput
                    value={profileForm.phone}
                    onChange={(val) =>
                      setProfileForm((p) => ({ ...p, phone: val }))
                    }
                    placeholder="Phone number"
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
                    placeholder="info@example.com"
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
                    placeholder="https://example.com"
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
                    placeholder="Enter registered office address"
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
