import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { NavLink, useLocation } from "react-router-dom";
import { SIDEBAR_GROUPS_KEY } from "../../nav/sidebarConfig";
import NavIcon from "./NavIcon";

function itemActive(pathname, search, item) {
  if (!item?.to) return false;
  const [path, query] = item.to.split("?");
  if (item.end) {
    return pathname === path || pathname === `${path}/`;
  }
  if (path === "/front-office/coming-soon") {
    const want = new URLSearchParams(query || "").get("module");
    const have = new URLSearchParams(search).get("module");
    return pathname.startsWith("/front-office/coming-soon") && want === have;
  }
  return pathname === path || pathname.startsWith(`${path}/`);
}

function groupHasActive(items, pathname, search) {
  return (items || []).some((item) => {
    if (item.to && itemActive(pathname, search, item)) return true;
    return (item.children || []).some((c) =>
      itemActive(pathname, search, c)
    );
  });
}

function readGroupOpenMap() {
  try {
    const raw = localStorage.getItem(SIDEBAR_GROUPS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeGroupOpen(label, open) {
  const map = readGroupOpenMap();
  map[label] = open;
  localStorage.setItem(SIDEBAR_GROUPS_KEY, JSON.stringify(map));
}

function Flyout({ anchorEl, title, children, onClose, onKeepOpen }) {
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const panelRef = useRef(null);

  useEffect(() => {
    if (!anchorEl) return;
    const update = () => {
      const rect = anchorEl.getBoundingClientRect();
      const panelH = panelRef.current?.offsetHeight || 200;
      const top = Math.min(
        rect.top,
        Math.max(8, window.innerHeight - panelH - 8)
      );
      setPos({ top, left: rect.right + 8 });
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [anchorEl]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return createPortal(
    <div
      ref={panelRef}
      className="fixed z-[60] min-w-[200px] max-w-[260px] rounded-md border border-gray-200 bg-white py-1 shadow-md"
      style={{ top: pos.top, left: pos.left }}
      onMouseEnter={onKeepOpen}
      onMouseLeave={onClose}
    >
      {title ? (
        <p className="border-b border-gray-100 px-3 py-1.5 text-[11px] font-medium text-gray-500">
          {title}
        </p>
      ) : null}
      <div className="max-h-[70vh] overflow-y-auto py-1">{children}</div>
    </div>,
    document.body
  );
}

function useFlyout() {
  const [open, setOpen] = useState(false);
  const timer = useRef(null);
  const keepOpen = () => {
    clearTimeout(timer.current);
    setOpen(true);
  };
  const scheduleClose = () => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(false), 180);
  };
  const closeNow = () => {
    clearTimeout(timer.current);
    setOpen(false);
  };
  useEffect(() => () => clearTimeout(timer.current), []);
  return { open, keepOpen, scheduleClose, closeNow, setOpen };
}

function LeafLink({ item, collapsed, onNavigate, nested }) {
  const location = useLocation();
  const { open: flyout, keepOpen, scheduleClose, closeNow } = useFlyout();
  const btnRef = useRef(null);
  if (!item.to) return null;
  const active = itemActive(location.pathname, location.search, item);

  if (collapsed && !nested) {
    return (
      <div
        ref={btnRef}
        className="relative flex justify-center"
        onMouseEnter={keepOpen}
        onMouseLeave={scheduleClose}
      >
        <NavLink
          to={item.to}
          end={Boolean(item.end)}
          onClick={onNavigate}
          title={item.label}
          className={() =>
            `flex h-9 w-9 items-center justify-center rounded-md transition ${
              active
                ? "bg-green-50 text-green-700"
                : "text-gray-600 hover:bg-gray-50"
            }`
          }
        >
          <NavIcon name={item.icon || "dashboard"} className="h-5 w-5" />
        </NavLink>
        {flyout ? (
          <Flyout
            anchorEl={btnRef.current}
            onClose={scheduleClose}
            onKeepOpen={keepOpen}
          >
            <NavLink
              to={item.to}
              end={Boolean(item.end)}
              onClick={() => {
                closeNow();
                onNavigate?.();
              }}
              className={() =>
                `block px-3 py-2 text-sm ${
                  active
                    ? "bg-green-50 font-medium text-green-700"
                    : "text-gray-700 hover:bg-gray-50"
                }`
              }
            >
              {item.label}
            </NavLink>
          </Flyout>
        ) : null}
      </div>
    );
  }

  return (
    <NavLink
      to={item.to}
      end={Boolean(item.end)}
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      className={() =>
        `flex items-center gap-2 rounded-md text-[12.5px] transition ${
          nested ? "py-1.5 pl-8 pr-2" : "px-2.5 py-1.5"
        } ${
          active
            ? "bg-green-50 font-medium text-green-700"
            : nested
              ? "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        }`
      }
    >
      {!nested && item.icon ? (
        <NavIcon name={item.icon} className="h-4 w-4 shrink-0" />
      ) : !nested ? (
        <span className="inline-block h-4 w-4 shrink-0" aria-hidden />
      ) : null}
      <span className="truncate">{item.label}</span>
    </NavLink>
  );
}

function SubMenu({ item, collapsed, onNavigate }) {
  const location = useLocation();
  const childActive = (item.children || []).some((c) =>
    itemActive(location.pathname, location.search, c)
  );
  const [open, setOpen] = useState(childActive);
  const { open: flyout, keepOpen, scheduleClose, closeNow, setOpen: setFlyout } =
    useFlyout();
  const btnRef = useRef(null);

  useEffect(() => {
    if (childActive) setOpen(true);
  }, [childActive, location.pathname, location.search]);

  if (collapsed) {
    return (
      <div
        ref={btnRef}
        className="relative flex justify-center"
        onMouseEnter={keepOpen}
        onMouseLeave={scheduleClose}
      >
        <button
          type="button"
          title={item.label}
          onClick={() => setFlyout((v) => !v)}
          className={`flex h-9 w-9 items-center justify-center rounded-md transition ${
            childActive || flyout
              ? "bg-green-50 text-green-700"
              : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          <NavIcon name={item.icon || "dashboard"} className="h-5 w-5" />
        </button>
        {flyout ? (
          <Flyout
            anchorEl={btnRef.current}
            title={item.label}
            onClose={scheduleClose}
            onKeepOpen={keepOpen}
          >
            {(item.children || []).map((child) => {
              const active = itemActive(
                location.pathname,
                location.search,
                child
              );
              return (
                <NavLink
                  key={`${child.label}-${child.to}`}
                  to={child.to}
                  end={Boolean(child.end)}
                  onClick={() => {
                    closeNow();
                    onNavigate?.();
                  }}
                  className={() =>
                    `block px-3 py-2 text-sm ${
                      active
                        ? "bg-green-50 font-medium text-green-700"
                        : "text-gray-700 hover:bg-gray-50"
                    }`
                  }
                >
                  {child.label}
                </NavLink>
              );
            })}
          </Flyout>
        ) : null}
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[12.5px] transition ${
          childActive
            ? "bg-green-50 font-medium text-green-700"
            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        }`}
      >
        <NavIcon name={item.icon || "dashboard"} className="h-4 w-4 shrink-0" />
        <span className="min-w-0 flex-1 truncate">{item.label}</span>
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`h-3.5 w-3.5 shrink-0 text-gray-400 transition-transform ${
            open ? "rotate-90" : ""
          }`}
          aria-hidden
        >
          <path
            fillRule="evenodd"
            d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      {open ? (
        <div className="py-0.5">
          {(item.children || []).map((child) => (
            <LeafLink
              key={`${child.label}-${child.to}`}
              item={child}
              collapsed={false}
              onNavigate={onNavigate}
              nested
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function renderItems(items, collapsed, onNavigate) {
  return items.map((item) =>
    item.children?.length ? (
      <SubMenu
        key={item.label}
        item={item}
        collapsed={collapsed}
        onNavigate={onNavigate}
      />
    ) : (
      <LeafLink
        key={`${item.label}-${item.to}`}
        item={item}
        collapsed={collapsed}
        onNavigate={onNavigate}
      />
    )
  );
}

export default function NavGroup({ group, collapsed, onNavigate }) {
  const location = useLocation();

  const flattenToChildren =
    group.items.length === 1 &&
    group.items[0].children?.length &&
    group.items[0].label === group.label;

  const displayItems = flattenToChildren
    ? group.items[0].children
    : group.items;

  const hasActive = groupHasActive(
    flattenToChildren ? group.items : displayItems,
    location.pathname,
    location.search
  );

  const [sectionOpen, setSectionOpen] = useState(() => {
    if (hasActive) return true;
    const saved = readGroupOpenMap()[group.label];
    if (typeof saved === "boolean") return saved;
    return group.label === "Main" || group.label === "Front Office";
  });

  useEffect(() => {
    if (hasActive) setSectionOpen(true);
  }, [hasActive, location.pathname, location.search]);

  const toggleSection = () => {
    setSectionOpen((prev) => {
      const next = !prev;
      writeGroupOpen(group.label, next);
      return next;
    });
  };

  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-0.5 py-1">
        {renderItems(
          flattenToChildren ? group.items : displayItems,
          true,
          onNavigate
        )}
      </div>
    );
  }

  return (
    <div className="mb-1">
      <button
        type="button"
        onClick={toggleSection}
        className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-gray-700 hover:bg-gray-50"
        aria-expanded={sectionOpen}
      >
        <span className="min-w-0 flex-1 text-[12px] font-medium">
          {group.label}
        </span>
        {hasActive && !sectionOpen ? (
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-green-600" />
        ) : null}
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`h-3.5 w-3.5 shrink-0 text-gray-400 transition-transform ${
            sectionOpen ? "rotate-90" : ""
          }`}
          aria-hidden
        >
          <path
            fillRule="evenodd"
            d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {sectionOpen ? (
        <div className="space-y-0.5 pb-1">
          {flattenToChildren
            ? displayItems.map((child) => (
                <LeafLink
                  key={`${child.label}-${child.to}`}
                  item={child}
                  collapsed={false}
                  onNavigate={onNavigate}
                />
              ))
            : renderItems(displayItems, false, onNavigate)}
        </div>
      ) : null}
    </div>
  );
}
