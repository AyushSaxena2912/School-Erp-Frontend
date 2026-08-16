import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BRANCH_STORAGE_KEY,
  DEFAULT_BRANCH,
  DEFAULT_ROLE,
  filterGroupsForRole,
  ROLE_STORAGE_KEY,
  SIDEBAR_GROUPS,
  SIDEBAR_STATE_KEY,
} from "../../nav/sidebarConfig";
import { useFrontOffice } from "../../context/FrontOfficeContext";
import NavGroup from "./NavGroup";
import NavIcon from "./NavIcon";

function readRole() {
  return localStorage.getItem(ROLE_STORAGE_KEY) || DEFAULT_ROLE;
}

function readBranch() {
  return localStorage.getItem(BRANCH_STORAGE_KEY) || DEFAULT_BRANCH;
}

function readCollapsed() {
  return localStorage.getItem(SIDEBAR_STATE_KEY) === "collapsed";
}

function BranchPicker({ branches, value, onChange }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const selected = branches.find((b) => b.id === value) || branches[0];

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 rounded-md border border-gray-200 bg-white px-2.5 py-2 text-left text-xs text-gray-800 hover:bg-gray-50"
        aria-expanded={open}
        aria-haspopup="listbox"
        title={selected?.name}
      >
        <span className="min-w-0 flex-1 truncate">
          <span className="font-medium text-gray-900">
            {selected?.code || selected?.name || "Branch"}
          </span>
          {selected?.code ? (
            <span className="text-gray-500"> · {selected.name}</span>
          ) : null}
        </span>
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`h-3.5 w-3.5 shrink-0 text-gray-400 transition-transform ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open ? (
        <ul
          role="listbox"
          className="absolute left-0 right-0 z-50 mt-1 max-h-56 overflow-y-auto rounded-md border border-gray-200 bg-white py-1 shadow-md"
        >
          {branches.map((b) => {
            const isActive = b.id === (selected?.id || value);
            return (
              <li key={b.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  className={`w-full px-3 py-2 text-left text-xs ${
                    isActive
                      ? "bg-green-50 font-medium text-green-800"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                  onClick={() => {
                    onChange(b.id);
                    setOpen(false);
                  }}
                >
                  <span className="font-medium">{b.code || b.name}</span>
                  {b.code ? (
                    <span className="mt-0.5 block truncate text-[11px] text-gray-500">
                      {b.name}
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

export default function Sidebar({ mobileOpen, onCloseMobile }) {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [role] = useState(readRole);
  const [branch, setBranch] = useState(readBranch);
  const { branches } = useFrontOffice();

  const groups = useMemo(
    () => filterGroupsForRole(SIDEBAR_GROUPS, role),
    [role]
  );

  const activeBranches = useMemo(() => {
    return (branches || []).filter(
      (b) => b.status === "Active" || b.id === branch
    );
  }, [branches, branch]);

  const branchLabel = useMemo(() => {
    const found = (branches || []).find((b) => b.id === branch);
    return found
      ? found.name
      : branches?.[0]?.name || "Main Campus";
  }, [branches, branch]);

  const toggleCollapse = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_STATE_KEY, next ? "collapsed" : "expanded");
      return next;
    });
  };

  const onBranchChange = (value) => {
    setBranch(value);
    localStorage.setItem(BRANCH_STORAGE_KEY, value);
  };

  const logout = () => {
    localStorage.removeItem(ROLE_STORAGE_KEY);
    localStorage.removeItem(BRANCH_STORAGE_KEY);
    localStorage.removeItem("bodhya_logged_in");
    localStorage.removeItem("bodhya_user_id");
    localStorage.removeItem("bodhya_user_name");
    navigate("/login");
  };

  const widthClass = collapsed ? "w-[72px] min-w-[72px]" : "w-56 min-w-56";

  return (
    <>
      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          aria-label="Close menu"
          onClick={onCloseMobile}
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex h-full min-h-0 flex-col border-r border-gray-200 bg-white transition-[width,transform] duration-300 lg:static lg:h-screen lg:shrink-0 lg:translate-x-0 ${widthClass} ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div
          className={`flex shrink-0 items-center border-b border-gray-200 ${
            collapsed ? "justify-center px-0 py-3" : "justify-between px-4 py-3.5"
          }`}
        >
          {collapsed ? (
            <button
              type="button"
              onClick={toggleCollapse}
              className="flex h-9 w-9 items-center justify-center rounded-md text-gray-600 hover:bg-gray-50"
              aria-label="Expand sidebar"
              title="Expand sidebar"
            >
              <NavIcon name="menu" className="h-5 w-5" />
            </button>
          ) : (
            <>
              <div className="flex items-center gap-2 text-sm font-semibold text-green-700">
                <NavIcon name="school" className="h-5 w-5" />
                <span>BodhyaMarg</span>
              </div>
              <button
                type="button"
                onClick={toggleCollapse}
                className="hidden rounded-md p-1 text-gray-400 hover:bg-gray-50 hover:text-gray-700 lg:inline-flex"
                aria-label="Collapse sidebar"
                title="Collapse to icons"
              >
                <NavIcon name="menu" className="h-4 w-4" />
              </button>
            </>
          )}
        </div>

        {!collapsed ? (
          <div className="shrink-0 border-b border-gray-200 px-3 py-2.5">
            <p className="mb-1.5 text-[11px] text-gray-500">Branch</p>
            <BranchPicker
              branches={activeBranches}
              value={branch}
              onChange={onBranchChange}
            />
          </div>
        ) : null}

        <nav
          className={`erp-sidebar-scroll min-h-0 flex-1 overflow-y-auto overflow-x-hidden py-2 ${
            collapsed ? "px-1" : "px-2"
          }`}
        >
          {groups.map((group) => (
            <NavGroup
              key={group.label}
              group={group}
              collapsed={collapsed}
              onNavigate={onCloseMobile}
            />
          ))}
        </nav>

        <div className="mt-auto shrink-0 border-t border-gray-200 py-2">
          <button
            type="button"
            onClick={logout}
            className={`flex items-center gap-2 text-[12.5px] font-medium text-red-600 hover:bg-red-50 ${
              collapsed
                ? "mx-auto h-9 w-9 justify-center rounded-md"
                : "mx-2 w-[calc(100%-1rem)] rounded-md px-2.5 py-2"
            }`}
            title="Logout"
          >
            <NavIcon name="logout" className="h-4 w-4" />
            {!collapsed ? <span>Logout</span> : null}
          </button>
          {!collapsed ? (
            <p className="px-4 pb-2 text-[10px] text-gray-400">{branchLabel}</p>
          ) : null}
        </div>
      </aside>
    </>
  );
}
