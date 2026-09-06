import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCheckOutVisitor, useDashboard } from "@/lib/api/queries";
import { formatFollowUpTimeLabel } from "../data/seed";
import { StatusBadge, btnPrimary, btnSecondary } from "../components/ui";

function StatCard({ label, value, hint, to, color }) {
  return (
    <Link
      to={to}
      className="rounded-lg border border-gray-200 bg-white px-4 py-3 transition hover:border-green-700"
    >
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className={`mt-1 text-2xl font-bold ${color || "text-gray-900"}`}>{value}</p>
      {hint ? <p className="mt-0.5 text-xs text-gray-500">{hint}</p> : null}
    </Link>
  );
}

function SectionHeader({ title, to, linkLabel }) {
  return (
    <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
      <h3 className="text-sm font-bold text-gray-900">{title}</h3>
      {to ? (
        <Link
          to={to}
          className="text-xs font-medium text-green-700 hover:underline"
        >
          {linkLabel || "View all"}
        </Link>
      ) : null}
    </div>
  );
}

const joinName = (...parts) => parts.filter(Boolean).join(" ").trim();

/**
 * The backend speaks snake_case; this view was written against camelCase.
 * Mapping happens here, at the edge — the API contract has one spelling per
 * field and the UI adapts, never the other way round.
 */
function adaptCall(row) {
  return {
    id: row.enquiry,
    studentName: row.student_name,
    classId: row.class_applying_for,
    guardianName: row.guardian_name,
    parentName: row.guardian_name,
    contact: row.guardian_mobile,
    overdue: row.is_overdue,
    next: { dateToCall: row.date_to_call, timeType: row.time_preference, notes: row.notes },
  };
}

function adaptVisitor(row) {
  return {
    id: row.name,
    name: row.visitor_name,
    purpose: row.purpose_of_visit,
    whomToMeet: row.whom_to_meet,
    checkIn: row.check_in_time,
  };
}

function adaptComplaint(row) {
  return {
    id: row.name,
    complainantName: row.complainant_name,
    studentName: row.student,
    nature: row.nature_of_complaint,
    natureOther: null,
    status: row.status,
  };
}

function adaptLead(row) {
  return {
    id: row.name,
    studentName: joinName(row.student_first_name, row.student_last_name),
    classId: row.class_applying_for,
    guardianName: joinName(row.guardian_first_name, row.guardian_last_name),
    parentName: joinName(row.guardian_first_name, row.guardian_last_name),
    contact: row.guardian_mobile,
    leadType: row.lead_temperature,
    status: row.status,
  };
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: summary, isLoading, isError, error } = useDashboard();
  const checkOut = useCheckOutVisitor();
  const [selectedLeadTab, setSelectedLeadTab] = useState("all");

  // Counters and worklists are computed server-side in one round trip; this
  // view no longer derives them from the full enquiry/visitor/complaint arrays.
  const data = useMemo(() => {
    const counters = summary?.counters ?? {};
    const leads = (summary?.active_leads ?? []).map(adaptLead);
    return {
      dueCalls: (summary?.calls_due ?? []).map(adaptCall),
      overdueCount: counters.calls_overdue ?? 0,
      stillInside: (summary?.visitors_inside ?? []).map(adaptVisitor),
      // "Checked in today" is a different question from "still inside" — the
      // aggregate counts it server-side, so use the counter rather than the
      // length of the still-inside list.
      todayVisitorCount: counters.visitors_today ?? 0,
      openComplaints: (summary?.open_complaints ?? []).map(adaptComplaint),
      newThisWeek: counters.new_enquiries_this_week ?? 0,
      activeLeads: leads,
      hotLeads: leads.filter((l) => l.leadType === "Hot Lead"),
      warmLeads: leads.filter((l) => l.leadType === "Warm Lead"),
      coldLeads: leads.filter((l) => l.leadType === "Cold Lead"),
    };
  }, [summary]);

  // Grade names are the Grade record's own name, so no lookup is needed.
  const className = (id) => id || "—";

  const checkOutVisitor = (id) => checkOut.mutate(id);

  const displayedLeads = useMemo(() => {
    if (selectedLeadTab === "Hot Lead") return data.hotLeads;
    if (selectedLeadTab === "Warm Lead") return data.warmLeads;
    if (selectedLeadTab === "Cold Lead") return data.coldLeads;
    return data.activeLeads;
  }, [selectedLeadTab, data]);

  // Frappe datetimes are "YYYY-MM-DD HH:mm:ss"; the old shape used a "T".
  const formatTime = (value) => {
    if (!value) return "—";
    const [, time] = String(value).split(/[T ]/);
    return time ? time.slice(0, 5) : value;
  };

  if (isLoading) {
    return (
      <div className="p-6 text-sm text-gray-500">Loading dashboard…</div>
    );
  }

  if (isError) {
    return (
      <div className="p-6">
        <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error?.message || "Could not load the dashboard."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-sm text-gray-500">Your work for today</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/front-office/visitors" className={btnSecondary}>
            + Log Visitor
          </Link>
          <Link to="/front-office/complaints/new" className={btnSecondary}>
            + Complaint
          </Link>
          <Link to="/front-office/enquiries/new" className={btnPrimary}>
            + New Inquiry
          </Link>
        </div>
      </div>

      {/* Top Stat Summary Grid */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Calls due"
          value={data.dueCalls.length}
          hint={
            data.overdueCount
              ? `${data.overdueCount} overdue`
              : "Follow-ups to call today"
          }
          to="/front-office/enquiries?urgency=today"
          color="text-amber-700"
        />
        <StatCard
          label="Visitors inside"
          value={data.stillInside.length}
          hint={`${data.todayVisitorCount} checked in today`}
          to="/front-office/visitors"
          color="text-sky-700"
        />
        <StatCard
          label="Open complaints"
          value={data.openComplaints.length}
          hint="Need action"
          to="/front-office/complaints"
          color="text-red-700"
        />
        <StatCard
          label="New enquiries"
          value={data.newThisWeek}
          hint="This week"
          to="/front-office/enquiries"
          color="text-green-700"
        />
      </div>

      {/* Lead Temperature & Pipeline Card - Matching ERP Portal Theme */}
      <div className="rounded-lg border border-gray-200 bg-white">
        <SectionHeader
          title="Lead Temperature & Pipeline"
          to="/front-office/enquiries"
          linkLabel="View all enquiries"
        />

        {/* 3 Native ERP Stat Cards */}
        <div className="grid gap-3 p-4 sm:grid-cols-3">
          {/* Hot Leads */}
          <div
            onClick={() => setSelectedLeadTab(selectedLeadTab === "Hot Lead" ? "all" : "Hot Lead")}
            className={`cursor-pointer rounded-lg border px-4 py-3 transition ${
              selectedLeadTab === "Hot Lead"
                ? "border-green-700 bg-gray-50/70 ring-1 ring-green-700"
                : "border-gray-200 bg-white hover:border-green-700"
            }`}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Hot Leads
              </p>
              <StatusBadge status="Hot Lead" />
            </div>
            <p className="mt-1 text-2xl font-bold text-gray-900">{data.hotLeads.length}</p>
            <p className="mt-0.5 text-xs text-gray-500">Ready to decide</p>
          </div>

          {/* Warm Leads */}
          <div
            onClick={() => setSelectedLeadTab(selectedLeadTab === "Warm Lead" ? "all" : "Warm Lead")}
            className={`cursor-pointer rounded-lg border px-4 py-3 transition ${
              selectedLeadTab === "Warm Lead"
                ? "border-green-700 bg-gray-50/70 ring-1 ring-green-700"
                : "border-gray-200 bg-white hover:border-green-700"
            }`}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Warm Leads
              </p>
              <StatusBadge status="Warm Lead" />
            </div>
            <p className="mt-1 text-2xl font-bold text-gray-900">{data.warmLeads.length}</p>
            <p className="mt-0.5 text-xs text-gray-500">Interested, evaluating</p>
          </div>

          {/* Cold Leads */}
          <div
            onClick={() => setSelectedLeadTab(selectedLeadTab === "Cold Lead" ? "all" : "Cold Lead")}
            className={`cursor-pointer rounded-lg border px-4 py-3 transition ${
              selectedLeadTab === "Cold Lead"
                ? "border-green-700 bg-gray-50/70 ring-1 ring-green-700"
                : "border-gray-200 bg-white hover:border-green-700"
            }`}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Cold Leads
              </p>
              <StatusBadge status="Cold Lead" />
            </div>
            <p className="mt-1 text-2xl font-bold text-gray-900">{data.coldLeads.length}</p>
            <p className="mt-0.5 text-xs text-gray-500">Early enquiry / low urgency</p>
          </div>
        </div>

        {/* Sub-filter Tabs matching ERP design */}
        <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 bg-gray-50/50 px-4 py-2.5">
          <span className="text-xs font-medium text-gray-500">Preview:</span>
          <button
            type="button"
            onClick={() => setSelectedLeadTab("all")}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
              selectedLeadTab === "all"
                ? "bg-green-700 text-white"
                : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            All Active ({data.activeLeads.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedLeadTab("Hot Lead")}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
              selectedLeadTab === "Hot Lead"
                ? "bg-green-700 text-white"
                : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            Hot ({data.hotLeads.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedLeadTab("Warm Lead")}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
              selectedLeadTab === "Warm Lead"
                ? "bg-green-700 text-white"
                : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            Warm ({data.warmLeads.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedLeadTab("Cold Lead")}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
              selectedLeadTab === "Cold Lead"
                ? "bg-green-700 text-white"
                : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            Cold ({data.coldLeads.length})
          </button>
        </div>

        {/* Lead Rows Preview */}
        {displayedLeads.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-gray-500">
            No {selectedLeadTab === "all" ? "active" : selectedLeadTab.toLowerCase()} inquiries found.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100 border-t border-gray-100">
            {displayedLeads.slice(0, 5).map((e) => (
              <li
                key={e.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900">{e.studentName}</p>
                  <p className="text-sm text-gray-500">
                    {e.guardianName || e.parentName} · {className(e.classId)} · {e.contact}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={e.leadType || "Warm Lead"} />
                  <StatusBadge status={e.status} />
                  <button
                    type="button"
                    className={btnSecondary}
                    onClick={() =>
                      navigate(
                        `/front-office/enquiries?open=${e.id}&followUp=${e.id}`
                      )
                    }
                  >
                    Log follow-up
                  </button>
                  <button
                    type="button"
                    className={btnPrimary}
                    onClick={() =>
                      navigate(`/front-office/enquiries?open=${e.id}`)
                    }
                  >
                    View
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {displayedLeads.length > 5 && (
          <div className="border-t border-gray-100 px-4 py-3 text-center">
            <Link
              to={
                selectedLeadTab === "all"
                  ? "/front-office/enquiries"
                  : `/front-office/enquiries?leadType=${encodeURIComponent(selectedLeadTab)}`
              }
              className="text-xs font-medium text-green-700 hover:underline"
            >
              View all {displayedLeads.length} {selectedLeadTab === "all" ? "active" : selectedLeadTab} inquiries →
            </Link>
          </div>
        )}
      </div>

      {/* Calls to make */}
      <div className="rounded-lg border border-gray-200 bg-white">
        <SectionHeader
          title="Calls to make"
          to="/front-office/enquiries?urgency=today"
        />
        {data.dueCalls.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-gray-500">
            No calls due. You&apos;re clear for now.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {data.dueCalls.map((e) => (
              <li
                key={e.id}
                className="flex flex-wrap items-center gap-3 px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900">{e.studentName}</p>
                  <p className="text-sm text-gray-500">
                    {e.guardianName || e.parentName} · {className(e.classId)} · {e.contact}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-400">
                    {e.next?.dateToCall}
                    {formatFollowUpTimeLabel(e.next)
                      ? ` · ${formatFollowUpTimeLabel(e.next)}`
                      : " · Any time"}
                  </p>
                </div>
                <StatusBadge status={e.overdue ? "Overdue" : "Today"} />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className={btnPrimary}
                    onClick={() =>
                      navigate(
                        `/front-office/enquiries?open=${e.id}&followUp=${e.id}`
                      )
                    }
                  >
                    Log follow-up
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Visitors still inside */}
        <div className="rounded-lg border border-gray-200 bg-white">
          <SectionHeader title="Visitors still inside" to="/front-office/visitors" />
          {data.stillInside.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-gray-500">
              No visitors currently inside.
            </p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {data.stillInside.map((v) => (
                <li
                  key={v.id}
                  className="flex flex-wrap items-center gap-3 px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900">{v.name}</p>
                    <p className="text-sm text-gray-500">
                      {v.purpose}
                      {v.whomToMeet ? ` · Meet: ${v.whomToMeet}` : ""}
                      {" · In "}
                      {formatTime(v.checkIn)}
                    </p>
                  </div>
                  <button
                    type="button"
                    className={btnPrimary}
                    onClick={() => checkOutVisitor(v.id)}
                  >
                    Check Out
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Open complaints */}
        <div className="rounded-lg border border-gray-200 bg-white">
          <SectionHeader
            title="Open complaints"
            to="/front-office/complaints"
          />
          {data.openComplaints.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-gray-500">
              No open complaints.
            </p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {data.openComplaints.slice(0, 6).map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    className="flex w-full flex-wrap items-center gap-3 px-4 py-3 text-left hover:bg-gray-50"
                    onClick={() => navigate("/front-office/complaints")}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900">
                        {c.complainantName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {c.nature === "Others" ? c.natureOther : c.nature}
                        {c.studentName ? ` · ${c.studentName}` : ""}
                      </p>
                    </div>
                    <StatusBadge status={c.status} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
