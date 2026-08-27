import { useMemo, useState, useRef, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Calendar, ChevronDown, KeyRound, LogOut, User, ShieldCheck } from "lucide-react";
import { formatFollowUpTimeLabel, getFollowUpUrgency, getNextPendingFollowUp } from "../data/seed";
import { useFrontOffice } from "../context/FrontOfficeContext";
import { authService } from "../../services/authService";
import Sidebar from "./sidebar/Sidebar";
import ChangePasswordModal from "./ChangePasswordModal";

function useDueFollowUps(enquiries, currentUser) {
  return useMemo(() => {
    return enquiries.filter((e) => {
      if (e.converted || e.status === "Admitted" || e.status === "Lost")
        return false;
      const nextFu = getNextPendingFollowUp(e);
      if (!nextFu) return false;
      const urgency = getFollowUpUrgency(nextFu);
      if (urgency !== "Today" && urgency !== "Overdue") return false;
      const mine =
        e.assignedTo === currentUser.id ||
        String(currentUser.role || "").toLowerCase().includes("admin");
      return mine;
    });
  }, [enquiries, currentUser]);
}

export default function FrontOfficeLayout() {
  const { currentUser, enquiries, visitors } = useFrontOffice();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [showNotifs, setShowNotifs] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [academicYear, setAcademicYear] = useState("2026 / 2027");
  const userMenuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const due = useDueFollowUps(enquiries, currentUser);
  const overdueCount = due.filter((e) => {
    const nextFu = getNextPendingFollowUp(e);
    return nextFu && getFollowUpUrgency(nextFu) === "Overdue";
  }).length;

  const globalResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (q.length < 2) return { enquiries: [], visitors: [] };
    return {
      enquiries: enquiries
        .filter(
          (e) =>
            e.studentName.toLowerCase().includes(q) ||
            e.parentName.toLowerCase().includes(q) ||
            e.contact.includes(q)
        )
        .slice(0, 5),
      visitors: visitors
        .filter(
          (v) =>
            v.name.toLowerCase().includes(q) ||
            (v.contact || "").includes(q)
        )
        .slice(0, 5),
    };
  }, [search, enquiries, visitors]);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <Sidebar
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-20 shrink-0 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-3 px-4 py-3 lg:px-6">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md border border-gray-300 p-2 text-gray-700 hover:bg-gray-50 lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>

            <div className="relative min-w-0 flex-1">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search enquiries or visitors..."
                className="w-full max-w-md rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-700"
              />
              {search.trim().length >= 2 ? (
                <div className="absolute left-0 top-full z-30 mt-1 w-full max-w-md rounded-md border border-gray-200 bg-white shadow-lg">
                  <div className="border-b border-gray-100 px-3 py-2 text-xs font-semibold uppercase text-gray-400">
                    Enquiries
                  </div>
                  {globalResults.enquiries.length === 0 ? (
                    <p className="px-3 py-2 text-sm text-gray-500">No matches</p>
                  ) : (
                    globalResults.enquiries.map((e) => (
                      <button
                        key={e.id}
                        type="button"
                        className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                        onClick={() => {
                          setSearch("");
                          navigate(`/front-office/enquiries?open=${e.id}`);
                        }}
                      >
                        {e.studentName} · {e.parentName} · {e.contact}
                      </button>
                    ))
                  )}
                  <div className="border-b border-t border-gray-100 px-3 py-2 text-xs font-semibold uppercase text-gray-400">
                    Visitors
                  </div>
                  {globalResults.visitors.length === 0 ? (
                    <p className="px-3 py-2 text-sm text-gray-500">No matches</p>
                  ) : (
                    globalResults.visitors.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                        onClick={() => {
                          setSearch("");
                          navigate("/front-office/visitors");
                        }}
                      >
                        {v.name} · {v.purpose}
                      </button>
                    ))
                  )}
                </div>
              ) : null}
            </div>

            {/* Academic Year Selector */}
            <div className="relative flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700 hover:border-gray-300 transition-colors shrink-0">
              <Calendar className="h-3.5 w-3.5 text-gray-500 shrink-0" />
              <span className="text-gray-500 font-medium hidden md:inline">
                Academic Year :
              </span>
              <div className="relative flex items-center">
                <select
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="appearance-none bg-transparent font-semibold text-gray-900 outline-none cursor-pointer pr-4 text-xs"
                  aria-label="Academic Year"
                >
                  <option value="2026 / 2027">2026 / 2027</option>
                  <option value="2025 / 2026">2025 / 2026</option>
                  <option value="2024 / 2025">2024 / 2025</option>
                  <option value="2027 / 2028">2027 / 2028</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-0 h-3 w-3 text-gray-400" />
              </div>
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => setShowNotifs((v) => !v)}
                className="relative inline-flex items-center justify-center rounded-md border border-gray-300 p-2 text-gray-700 hover:bg-gray-50"
                aria-label="Notifications"
                title="Notifications"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0a3 3 0 11-6 0m6 0H9"
                  />
                </svg>
                {due.length > 0 ? (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
                    {due.length}
                  </span>
                ) : null}
              </button>
              {showNotifs ? (
                <div className="absolute right-0 top-full z-30 mt-1 w-80 rounded-md border border-gray-200 bg-white shadow-lg">
                  <div className="border-b border-gray-100 px-3 py-2 text-sm font-semibold">
                    Follow-ups due ({due.length})
                    {overdueCount > 0 ? (
                      <span className="ml-2 text-xs font-medium text-red-600">
                        {overdueCount} overdue
                      </span>
                    ) : null}
                  </div>
                  {due.length === 0 ? (
                    <p className="px-3 py-4 text-sm text-gray-500">
                      No follow-ups due today.
                    </p>
                  ) : (
                    <ul className="max-h-72 overflow-y-auto">
                      {due.map((e) => {
                        const nextFu = getNextPendingFollowUp(e);
                        const overdue =
                          nextFu && getFollowUpUrgency(nextFu) === "Overdue";
                        return (
                          <li key={e.id}>
                            <button
                              type="button"
                              className="w-full border-b border-gray-50 px-3 py-2 text-left hover:bg-gray-50"
                              onClick={() => {
                                setShowNotifs(false);
                                navigate(
                                  `/front-office/enquiries?open=${e.id}`
                                );
                              }}
                            >
                              <p className="text-sm font-medium text-gray-900">
                                {e.studentName}
                              </p>
                              <p className="text-xs text-gray-500">
                                {nextFu?.dateToCall}
                                {formatFollowUpTimeLabel(nextFu)
                                  ? ` · ${formatFollowUpTimeLabel(nextFu)}`
                                  : " · Any time"}
                                {overdue ? (
                                  <span className="ml-2 text-red-600">
                                    Overdue
                                  </span>
                                ) : null}
                              </p>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              ) : null}
            </div>

            {/* User Profile Avatar Dropdown */}
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setShowUserMenu((v) => !v)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-700 text-xs font-semibold tracking-wide text-white transition-all hover:ring-2 hover:ring-green-600 hover:ring-offset-2 focus:outline-none cursor-pointer"
                title={`${currentUser.name} · ${currentUser.role}`}
                aria-label={`${currentUser.name}, ${currentUser.role}`}
              >
                {(currentUser.name || "A")
                  .split(/\s+/)
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((w) => w[0]?.toUpperCase())
                  .join("") || "A"}
              </button>

              {showUserMenu && (
                <div className="absolute right-0 top-full z-30 mt-2 w-64 rounded-xl border border-gray-200 bg-white p-2 shadow-xl animate-in fade-in zoom-in-95 duration-150">
                  {/* User Details */}
                  <div className="flex items-center gap-3 border-b border-gray-100 px-3 py-2.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-700 text-sm font-bold text-white">
                      {(currentUser.name || "A")
                        .split(/\s+/)
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((w) => w[0]?.toUpperCase())
                        .join("") || "A"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-gray-900">
                        {currentUser.name || "Administrator"}
                      </p>
                      <p className="truncate text-xs text-gray-500">
                        {currentUser.email || currentUser.role || "User"}
                      </p>
                      <span className="mt-0.5 inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                        {currentUser.role === "Parent" ? "Guardian" : (currentUser.role || "Staff")}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-1.5 space-y-1">
                    <button
                      type="button"
                      onClick={() => {
                        setShowUserMenu(false);
                        setShowChangePasswordModal(true);
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900 cursor-pointer"
                    >
                      <KeyRound className="h-4 w-4 text-gray-500" />
                      <span>Change Password</span>
                    </button>

                    <button
                      type="button"
                      onClick={async () => {
                        setShowUserMenu(false);
                        localStorage.removeItem("bodhya_user_name");
                        localStorage.removeItem("bodhya_user_email");
                        localStorage.removeItem("bodhya_user_role");
                        localStorage.removeItem("bodhya_logged_in");
                        localStorage.removeItem("frappe_sid");
                        localStorage.removeItem("frappe_csrf_token");
                        try {
                          await authService.logout();
                        } catch {
                          // ignore
                        }
                        window.location.href = "/login";
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 cursor-pointer"
                    >
                      <LogOut className="h-4 w-4 text-red-500" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        open={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
        userEmail={currentUser.email}
        userName={currentUser.name}
      />
    </div>
  );
}
