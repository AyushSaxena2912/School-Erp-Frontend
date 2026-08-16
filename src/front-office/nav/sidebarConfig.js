/** BodhyaMarg sidebar nav config. Live FO routes + coming-soon for the rest. */

const cs = (module) =>
  `/front-office/coming-soon?module=${encodeURIComponent(module)}`;

const ALL = ["student", "teacher", "parent", "staff", "admin", "superadmin"];
const ADMINS = ["admin", "superadmin"];
const STAFF_PLUS = ["staff", "admin", "superadmin"];

export const BRANCHES = [
  { id: "dps_main", label: "Delhi Public School - Main Campus" },
  { id: "dps_south", label: "Delhi Public School - South Branch" },
  { id: "dps_north", label: "Delhi Public School - North Branch" },
];

export const ROLES = [
  { id: "student", label: "Student" },
  { id: "teacher", label: "Teacher" },
  { id: "parent", label: "Parent" },
  { id: "staff", label: "Staff" },
  { id: "admin", label: "Admin" },
  { id: "superadmin", label: "Superadmin" },
];

export const ROLE_STORAGE_KEY = "bodhya_user_role";
export const BRANCH_STORAGE_KEY = "bodhya_branch";
export const SIDEBAR_STATE_KEY = "sidebarState";
export const SIDEBAR_GROUPS_KEY = "bodhya_sidebar_groups";

export const DEFAULT_ROLE = "staff";
export const DEFAULT_BRANCH = "dps_main";

/**
 * @typedef {{ label: string, to?: string, end?: boolean, roles?: string[], icon?: string, children?: NavItem[] }} NavItem
 * @typedef {{ label: string, roles?: string[], items: NavItem[] }} NavGroup
 */

/** @type {NavGroup[]} */
export const SIDEBAR_GROUPS = [
  {
    label: "Main",
    items: [
      {
        label: "Dashboard",
        icon: "dashboard",
        roles: ALL,
        children: [
          { label: "HQ Dashboard", to: cs("HQ Dashboard"), roles: ["superadmin"] },
          { label: "Admin Dashboard", to: cs("Admin Dashboard"), roles: ["admin"] },
          { label: "Teacher Dashboard", to: cs("Teacher Dashboard"), roles: ["teacher"] },
          { label: "Parent Dashboard", to: cs("Parent Dashboard"), roles: ["parent"] },
          { label: "Staff Dashboard", to: cs("Staff Dashboard"), roles: STAFF_PLUS },
          { label: "Student Dashboard", to: cs("Student Dashboard"), roles: ["student"] },
        ],
      },
    ],
  },
  {
    label: "Front Office",
    roles: STAFF_PLUS,
    items: [
      {
        label: "Front Office",
        icon: "enquiry",
        roles: STAFF_PLUS,
        children: [
          { label: "Dashboard", to: "/front-office", end: true, roles: STAFF_PLUS },
          { label: "Admission Enquiry", to: "/front-office/enquiries", roles: STAFF_PLUS },
          { label: "Visitor Log", to: "/front-office/visitors", roles: STAFF_PLUS },
          { label: "Complaint Register", to: "/front-office/complaints", roles: STAFF_PLUS },
          { label: "FO Settings", to: "/front-office/settings", roles: STAFF_PLUS },
        ],
      },
    ],
  },
  {
    label: "People",
    roles: ADMINS,
    items: [
      {
        label: "Students",
        icon: "students",
        roles: ADMINS,
        children: [
          { label: "All Students", to: cs("All Students"), roles: ADMINS },
          { label: "Student Promotion", to: cs("Student Promotion"), roles: ADMINS },
        ],
      },
      {
        label: "Parents/Guardians",
        icon: "parents",
        roles: ADMINS,
        children: [
          { label: "All Parents/Guardians", to: cs("All Parents"), roles: ADMINS },
        ],
      },
      {
        label: "Teachers",
        icon: "teachers",
        roles: ADMINS,
        children: [
          { label: "All Teachers", to: cs("All Teachers"), roles: ADMINS },
        ],
      },
    ],
  },
  {
    label: "Academic",
    items: [
      {
        label: "Class Structure",
        icon: "classes",
        roles: [...ADMINS, "teacher"],
        children: [
          { label: "Classes", to: cs("Classes"), roles: ADMINS },
          { label: "Sections", to: cs("Sections"), roles: ADMINS },
          { label: "Classrooms", to: cs("Classrooms"), roles: [...ADMINS, "teacher"] },
          { label: "Subject", to: cs("Subject"), roles: ADMINS },
          { label: "Syllabus", to: cs("Syllabus"), roles: [...ADMINS, "teacher"] },
        ],
      },
      { label: "Class Allocation", to: cs("Class Allocation"), icon: "link", roles: ADMINS },
      { label: "Class Routine", to: cs("Class Routine"), icon: "calendar", roles: [...ADMINS, "teacher"] },
      { label: "Academic Calendar", to: cs("Academic Calendar"), icon: "table", roles: [...ADMINS, "teacher", "student"] },
      {
        label: "Home Work",
        icon: "homework",
        roles: [...ADMINS, "teacher", "student"],
        children: [
          { label: "Homework List", to: cs("Homework List"), roles: [...ADMINS, "teacher", "student"] },
          { label: "Upload Assignment", to: cs("Upload Assignment"), roles: ["student"] },
        ],
      },
      {
        label: "Examinations",
        icon: "exam",
        roles: [...ADMINS, "teacher", "student"],
        children: [
          { label: "Exam List", to: cs("Exam List"), roles: ADMINS },
          { label: "Exam Schedule", to: cs("Exam Schedule"), roles: [...ADMINS, "teacher"] },
          { label: "Grade", to: cs("Grade"), roles: ADMINS },
          { label: "Exam Attendance", to: cs("Exam Attendance"), roles: [...ADMINS, "teacher"] },
          { label: "Exam Results", to: cs("Exam Results"), roles: [...ADMINS, "teacher"] },
          { label: "Search Results", to: cs("Search Results"), roles: [...ADMINS, "teacher", "student"] },
          { label: "Exam Settings", to: cs("Exam Settings"), roles: ADMINS },
        ],
      },
    ],
  },
  {
    label: "My Finance",
    roles: ["student", "parent", "teacher", "staff"],
    items: [
      { label: "Pay Fees", to: cs("Pay Fees"), icon: "fees", roles: ["student", "parent", "teacher", "staff"] },
    ],
  },
  {
    label: "Management",
    items: [
      {
        label: "Fees Collection",
        icon: "receipt",
        roles: ADMINS,
        children: [
          { label: "Fees Structure", to: cs("Fees Structure"), roles: ADMINS },
          { label: "Fees Group", to: cs("Fees Group"), roles: ADMINS },
          { label: "Fees Type", to: cs("Fees Type"), roles: ADMINS },
          { label: "Fees Master", to: cs("Fees Master"), roles: ADMINS },
          { label: "Fees Assign", to: cs("Fees Assign"), roles: ADMINS },
          { label: "Collect Fees", to: cs("Collect Fees"), roles: ADMINS },
          { label: "Receipt Designer", to: cs("Receipt Designer"), roles: ADMINS },
        ],
      },
      {
        label: "Hostel",
        icon: "hostel",
        roles: [...ADMINS, "student"],
        children: [
          { label: "Hostel List", to: cs("Hostel List"), roles: ADMINS },
          { label: "Hostel Rooms", to: cs("Hostel Rooms"), roles: ADMINS },
          { label: "Apply for Hostel", to: cs("Apply for Hostel"), roles: ["student"] },
        ],
      },
      {
        label: "Transport",
        icon: "transport",
        roles: [...ADMINS, "student"],
        children: [
          { label: "Routes", to: cs("Routes"), roles: ADMINS },
          { label: "Pickup Points", to: cs("Pickup Points"), roles: ADMINS },
          { label: "Vehicle Drivers", to: cs("Vehicle Drivers"), roles: ADMINS },
          { label: "Vehicles", to: cs("Vehicles"), roles: ADMINS },
          { label: "Assign Vehicle", to: cs("Assign Vehicle"), roles: ADMINS },
          { label: "Vehicle Occupancy", to: cs("Vehicle Occupancy"), roles: ADMINS },
          { label: "Apply for Bus", to: cs("Apply for Bus"), roles: ["student"] },
        ],
      },
    ],
  },
  {
    label: "HRM",
    roles: [...ADMINS, "teacher", "student", "parent"],
    items: [
      { label: "Staffs", to: cs("Staffs"), icon: "staffs", roles: ADMINS },
      { label: "Designation", to: cs("Designation"), icon: "designation", roles: ADMINS },
      { label: "Department", to: cs("Department"), icon: "department", roles: ADMINS },
      {
        label: "Attendance",
        icon: "attendance",
        roles: [...ADMINS, "teacher"],
        children: [
          { label: "Student Attendance", to: cs("Student Attendance"), roles: [...ADMINS, "teacher"] },
          { label: "Teacher Attendance", to: cs("Teacher Attendance"), roles: [...ADMINS, "teacher"] },
          { label: "Staff Attendance", to: cs("Staff Attendance"), roles: ADMINS },
        ],
      },
      {
        label: "Leaves",
        icon: "leaves",
        roles: [...ADMINS, "teacher", "student", "parent"],
        children: [
          { label: "List of leaves", to: cs("List of leaves"), roles: [...ADMINS, "teacher"] },
          { label: "Approve Request", to: cs("Approve Request"), roles: ADMINS },
          { label: "Apply for Leave", to: cs("Apply for Leave"), roles: ["student", "parent"] },
        ],
      },
    ],
  },
  {
    label: "Finance & Accounts",
    roles: ADMINS,
    items: [
      {
        label: "Accounts",
        icon: "accounts",
        roles: ADMINS,
        children: [
          { label: "Income", to: cs("Income"), roles: ADMINS },
          { label: "Expenses", to: cs("Expenses"), roles: ADMINS },
          { label: "Expense Category", to: cs("Expense Category"), roles: ADMINS },
          { label: "Transactions Ledger", to: cs("Transactions Ledger"), roles: ADMINS },
        ],
      },
    ],
  },
  {
    label: "Announcements",
    roles: [...ADMINS, "teacher", "student"],
    items: [
      { label: "Notice Board", to: cs("Notice Board"), icon: "notice", roles: [...ADMINS, "teacher", "student"] },
    ],
  },
  {
    label: "Settings",
    roles: ADMINS,
    items: [
      {
        label: "School Settings",
        icon: "school",
        roles: ADMINS,
        children: [
          { label: "Manage Schools / Branches", to: "/front-office/branches", roles: ["superadmin", "admin"] },
          { label: "CMS & UI Settings", to: cs("CMS & UI Settings"), roles: ADMINS },
        ],
      },
      { label: "Payment Gateways", to: cs("Payment Gateways"), icon: "payment", roles: ADMINS },
      { label: "Roles & Permissions", to: cs("Roles & Permissions"), icon: "roles", roles: ADMINS },
      { label: "Ban IP Address", to: cs("Ban IP Address"), icon: "ban", roles: ADMINS },
      { label: "Bulk Import / Migration", to: cs("Bulk Import"), icon: "import", roles: ADMINS },
    ],
  },
  {
    label: "System Pages",
    roles: ADMINS,
    items: [
      {
        label: "Error Pages",
        icon: "error",
        roles: ADMINS,
        children: [
          { label: "401 Unauthorized", to: cs("401 Unauthorized"), roles: ADMINS },
          { label: "403 Forbidden", to: cs("403 Forbidden"), roles: ADMINS },
          { label: "404 Not Found", to: cs("404 Not Found"), roles: ADMINS },
          { label: "500 Server Error", to: cs("500 Server Error"), roles: ADMINS },
          { label: "503 Maintenance", to: cs("503 Maintenance"), roles: ADMINS },
        ],
      },
    ],
  },
];

export function roleAllowed(roles, role) {
  if (!roles || roles.length === 0) return true;
  return roles.includes(role);
}

/** Demo shell: show every group/item so the full BodhyaMarg menu is visible. */
export const SHOW_ALL_NAV = true;

export function filterGroupsForRole(groups, role) {
  if (SHOW_ALL_NAV) return groups;

  return groups
    .filter((g) => roleAllowed(g.roles, role))
    .map((g) => ({
      ...g,
      items: g.items
        .filter((item) => roleAllowed(item.roles, role))
        .map((item) => {
          if (!item.children) return item;
          const children = item.children.filter((c) =>
            roleAllowed(c.roles, role)
          );
          if (children.length === 0 && !item.to) return null;
          return { ...item, children };
        })
        .filter(Boolean),
    }))
    .filter((g) => g.items.length > 0);
}
