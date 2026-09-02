import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Flame, Sun, Snowflake, Phone, ArrowRight, Sparkles } from "lucide-react";
import { useFrontOffice } from "../context/FrontOfficeContext";
import { formatFollowUpTimeLabel, followUpSortKey, getFollowUpUrgency, getNextPendingFollowUp, todayISO } from "../data/seed";
import { StatusBadge, btnPrimary, btnSecondary } from "../components/ui";

function StatCard({ label, value, hint, to, color }) {
  return (
    <Link
      to={to}
      className="rounded-lg border border-gray-200 bg-white px-4 py-3 transition hover:border-green-700 hover:shadow-xs"
    >
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className={`mt-1 text-2xl font-bold ${color}`}>{value}</p>
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

export default function Dashboard() {
  const navigate = useNavigate();
  const {
    enquiries,
    visitors,
    complaints,
    classes,
    checkOutVisitor,
  } = useFrontOffice();
  const today = todayISO();
  const [selectedLeadTab, setSelectedLeadTab] = useState("all");

  const data = useMemo(() => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekIso = weekAgo.toISOString().slice(0, 10);

    const dueCalls = enquiries
      .filter((e) => {
        if (e.converted || e.status === "Lost" || e.status === "Admitted" || e.status === "Accounts Created")
          return false;
        const nextFu = getNextPendingFollowUp(e);
        if (!nextFu) return false;
        const urgency = getFollowUpUrgency(nextFu);
        return urgency === "Today" || urgency === "Overdue";
      })
      .map((e) => {
        const nextFu = getNextPendingFollowUp(e);
        const urgency = getFollowUpUrgency(nextFu);
        return {
          ...e,
          next: nextFu,
          overdue: urgency === "Overdue",
        };
      })
      .sort((a, b) =>
        followUpSortKey(a.next).localeCompare(followUpSortKey(b.next))
      );

    const overdueCount = dueCalls.filter((e) => e.overdue).length;

    const todayVisitors = visitors
      .filter((v) => (v.checkIn || "").startsWith(today))
      .sort((a, b) => (b.checkIn || "").localeCompare(a.checkIn || ""));

    const stillInside = todayVisitors.filter((v) => !v.checkOut);

    const openComplaints = complaints
      .filter((c) => c.status === "New" || c.status === "In Progress")
      .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));

    const newThisWeek = enquiries.filter((e) => e.createdAt >= weekIso).length;

    // Active leads breakdown by temperature (Hot, Warm, Cold)
    const activeLeads = enquiries.filter(
      (e) => !e.converted && e.status !== "Lost" && e.status !== "Admitted" && e.status !== "Accounts Created"
    );

    const hotLeads = activeLeads.filter(
      (e) => e.leadType === "Hot Lead" || e.lead_temperature === "Hot Lead"
    );

    const warmLeads = activeLeads.filter(
      (e) => e.leadType === "Warm Lead" || e.lead_temperature === "Warm Lead" || (!e.leadType && !e.lead_temperature)
    );

    const coldLeads = activeLeads.filter(
      (e) => e.leadType === "Cold Lead" || e.lead_temperature === "Cold Lead"
    );

    return {
      dueCalls,
      overdueCount,
      todayVisitors,
      stillInside,
      openComplaints,
      newThisWeek,
      activeLeads,
      hotLeads,
      warmLeads,
      coldLeads,
    };
  }, [enquiries, visitors, complaints, today]);

  const className = (id) => classes.find((c) => c.id === id || c.name === id)?.name || id || "—";

  const displayedLeads = useMemo(() => {
    if (selectedLeadTab === "Hot Lead") return data.hotLeads;
    if (selectedLeadTab === "Warm Lead") return data.warmLeads;
    if (selectedLeadTab === "Cold Lead") return data.coldLeads;
    return data.activeLeads;
  }, [selectedLeadTab, data]);

  const nowLocal = () => {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const formatTime = (value) => {
    if (!value) return "—";
    const time = value.split("T")[1];
    return time || value;
  };

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
          hint={`${data.todayVisitors.length} checked in today`}
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

      {/* Lead Temperature Pipeline Card (Hot / Warm / Cold Leads) */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-4 py-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-gray-900">Lead Temperature & Pipeline</h3>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
              {data.activeLeads.length} Active
            </span>
          </div>
          <Link
            to="/front-office/enquiries"
            className="text-xs font-medium text-green-700 hover:underline"
          >
            View all inquiries →
          </Link>
        </div>

        {/* 3 Interactive Lead Metric Cards */}
        <div className="grid gap-3 p-4 sm:grid-cols-3">
          {/* Hot Leads Card */}
          <div
            onClick={() => setSelectedLeadTab(selectedLeadTab === "Hot Lead" ? "all" : "Hot Lead")}
            className={`cursor-pointer rounded-lg border p-3.5 transition ${
              selectedLeadTab === "Hot Lead"
                ? "border-red-500 bg-red-50/70 ring-2 ring-red-500/20 shadow-xs"
                : "border-red-100 bg-gradient-to-br from-red-50/40 via-white to-red-50/20 hover:border-red-300 hover:shadow-xs"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-red-700">
                <Flame className="h-4 w-4 text-red-600" />
                Hot Leads
              </span>
              <Link
                to="/front-office/enquiries?leadType=Hot+Lead"
                onClick={(e) => e.stopPropagation()}
                className="text-[11px] font-medium text-red-600 hover:underline"
              >
                Filter →
              </Link>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-red-700">{data.hotLeads.length}</span>
              <span className="text-xs text-red-600/80 font-medium">
                {data.activeLeads.length > 0
                  ? `${Math.round((data.hotLeads.length / data.activeLeads.length) * 100)}%`
                  : "0%"}
              </span>
            </div>
            <p className="mt-1 text-xs text-red-800/70">Ready to visit / decide soon</p>
          </div>

          {/* Warm Leads Card */}
          <div
            onClick={() => setSelectedLeadTab(selectedLeadTab === "Warm Lead" ? "all" : "Warm Lead")}
            className={`cursor-pointer rounded-lg border p-3.5 transition ${
              selectedLeadTab === "Warm Lead"
                ? "border-amber-500 bg-amber-50/70 ring-2 ring-amber-500/20 shadow-xs"
                : "border-amber-100 bg-gradient-to-br from-amber-50/40 via-white to-amber-50/20 hover:border-amber-300 hover:shadow-xs"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-800">
                <Sun className="h-4 w-4 text-amber-600" />
                Warm Leads
              </span>
              <Link
                to="/front-office/enquiries?leadType=Warm+Lead"
                onClick={(e) => e.stopPropagation()}
                className="text-[11px] font-medium text-amber-700 hover:underline"
              >
                Filter →
              </Link>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-amber-800">{data.warmLeads.length}</span>
              <span className="text-xs text-amber-700/80 font-medium">
                {data.activeLeads.length > 0
                  ? `${Math.round((data.warmLeads.length / data.activeLeads.length) * 100)}%`
                  : "0%"}
              </span>
            </div>
            <p className="mt-1 text-xs text-amber-900/70">Interested, evaluating options</p>
          </div>

          {/* Cold Leads Card */}
          <div
            onClick={() => setSelectedLeadTab(selectedLeadTab === "Cold Lead" ? "all" : "Cold Lead")}
            className={`cursor-pointer rounded-lg border p-3.5 transition ${
              selectedLeadTab === "Cold Lead"
                ? "border-sky-500 bg-sky-50/70 ring-2 ring-sky-500/20 shadow-xs"
                : "border-sky-100 bg-gradient-to-br from-sky-50/40 via-white to-sky-50/20 hover:border-sky-300 hover:shadow-xs"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-sky-800">
                <Snowflake className="h-4 w-4 text-sky-600" />
                Cold Leads
              </span>
              <Link
                to="/front-office/enquiries?leadType=Cold+Lead"
                onClick={(e) => e.stopPropagation()}
                className="text-[11px] font-medium text-sky-700 hover:underline"
              >
                Filter →
              </Link>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-sky-800">{data.coldLeads.length}</span>
              <span className="text-xs text-sky-700/80 font-medium">
                {data.activeLeads.length > 0
                  ? `${Math.round((data.coldLeads.length / data.activeLeads.length) * 100)}%`
                  : "0%"}
              </span>
            </div>
            <p className="mt-1 text-xs text-sky-900/70">Early enquiry / low urgency</p>
          </div>
        </div>

        {/* Lead Tab Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 border-t border-gray-100 bg-gray-50/50 px-4 py-2 text-xs">
          <span className="font-semibold text-gray-500 mr-1">Preview:</span>
          <button
            type="button"
            onClick={() => setSelectedLeadTab("all")}
            className={`rounded-full px-2.5 py-1 font-medium transition ${
              selectedLeadTab === "all"
                ? "bg-gray-900 text-white shadow-xs"
                : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            All Active ({data.activeLeads.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedLeadTab("Hot Lead")}
            className={`flex items-center gap-1 rounded-full px-2.5 py-1 font-medium transition ${
              selectedLeadTab === "Hot Lead"
                ? "bg-red-600 text-white shadow-xs"
                : "bg-white text-red-700 hover:bg-red-50 border border-red-200"
            }`}
          >
            <Flame className="h-3 w-3" />
            Hot ({data.hotLeads.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedLeadTab("Warm Lead")}
            className={`flex items-center gap-1 rounded-full px-2.5 py-1 font-medium transition ${
              selectedLeadTab === "Warm Lead"
                ? "bg-amber-600 text-white shadow-xs"
                : "bg-white text-amber-700 hover:bg-amber-50 border border-amber-200"
            }`}
          >
            <Sun className="h-3 w-3" />
            Warm ({data.warmLeads.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedLeadTab("Cold Lead")}
            className={`flex items-center gap-1 rounded-full px-2.5 py-1 font-medium transition ${
              selectedLeadTab === "Cold Lead"
                ? "bg-sky-600 text-white shadow-xs"
                : "bg-white text-sky-700 hover:bg-sky-50 border border-sky-200"
            }`}
          >
            <Snowflake className="h-3 w-3" />
            Cold ({data.coldLeads.length})
          </button>
        </div>

        {/* Lead List Preview */}
        {displayedLeads.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-gray-500">
            No {selectedLeadTab === "all" ? "active" : selectedLeadTab.toLowerCase()} inquiries found.
          </div>
        ) : (
          <ul className="divide-y divide-gray-100 border-t border-gray-100">
            {displayedLeads.slice(0, 5).map((e) => (
              <li
                key={e.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 hover:bg-gray-50/70 transition"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-gray-900">{e.studentName}</p>
                    {e.leadType ? (
                      <StatusBadge status={e.leadType} />
                    ) : (
                      <StatusBadge status="Warm Lead" />
                    )}
                    <StatusBadge status={e.status} />
                  </div>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {e.guardianName || e.parentName || "Parent"} · Class: {className(e.classId)} · {e.contact || e.parentMobile || "—"}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
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
          <div className="border-t border-gray-100 bg-gray-50/50 px-4 py-2.5 text-center">
            <Link
              to={
                selectedLeadTab === "all"
                  ? "/front-office/enquiries"
                  : `/front-office/enquiries?leadType=${encodeURIComponent(selectedLeadTab)}`
              }
              className="text-xs font-semibold text-green-700 hover:underline"
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
                    onClick={() => checkOutVisitor(v.id, nowLocal())}
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
