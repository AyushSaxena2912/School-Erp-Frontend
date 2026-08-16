import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useFrontOffice } from "../context/FrontOfficeContext";
import { formatFollowUpTimeLabel, followUpSortKey, getFollowUpUrgency, getNextPendingFollowUp, todayISO } from "../data/seed";
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

  const data = useMemo(() => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekIso = weekAgo.toISOString().slice(0, 10);

    const dueCalls = enquiries
      .filter((e) => {
        if (e.converted || e.status === "Lost" || e.status === "Admitted")
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

    return {
      dueCalls,
      overdueCount,
      todayVisitors,
      stillInside,
      openComplaints,
      newThisWeek,
    };
  }, [enquiries, visitors, complaints, today]);

  const className = (id) => classes.find((c) => c.id === id)?.name || "—";

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
