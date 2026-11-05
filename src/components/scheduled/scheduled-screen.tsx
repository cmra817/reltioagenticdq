import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import { Plus, Search } from "lucide-react";
import { useDomainState } from "@/components/domain-context";
import { newChatId, useChatThreads } from "@/components/chat/chat-context";
import { PrimaryButton, RunPill, StatTile, Tabs, Tag } from "@/components/workspace/primitives";
import { ME, type Run, type RunStatus, type Schedule } from "@/lib/mock-ops";
import { useRuns, useSchedules } from "@/lib/ops-store";
import { ago } from "./format";
import { useScheduledNav, type ScheduledSearch } from "./nav";
import { RunView } from "./run-view";
import { ScheduleView } from "./schedule-view";

export function ScheduledScreen({ search }: { search: ScheduledSearch }) {
  if (search.run) return <RunView runId={search.run} />;
  if (search.schedule) return <ScheduleView scheduleId={search.schedule} />;
  return <ScheduledHome tab={search.tab ?? "schedules"} />;
}

function ScheduledHome({ tab }: { tab: "schedules" | "runs" }) {
  const go = useScheduledNav();
  const navigate = useNavigate();
  const { createThread } = useChatThreads();
  const { selected } = useDomainState();

  function newSchedule() {
    const id = newChatId();
    createThread({ id, title: "New schedule", domain: selected });
    void navigate({
      to: "/chat/$chatId",
      params: { chatId: id },
      search: { q: "Set up a new schedule for my tables" },
    });
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 pb-10 pt-5">
      <div className="mx-auto w-full max-w-[980px]">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-[22px] font-semibold" style={{ color: "var(--ink-900)" }}>
            Scheduled
          </h1>
          <div className="ml-2">
            <Tabs
              label="Scheduled views"
              value={tab}
              onChange={(t) => go({ tab: t })}
              tabs={[
                { id: "schedules", label: "Schedules" },
                { id: "runs", label: "Runs" },
              ]}
            />
          </div>
          <PrimaryButton onClick={newSchedule} className="ml-auto flex items-center gap-1.5">
            <Plus size={14} /> New schedule
          </PrimaryButton>
        </div>
        <p className="mt-1 text-[13.5px]" style={{ color: "var(--ink-500)" }}>
          {tab === "schedules"
            ? "Each schedule says which tables to profile or check, with which rules, and how often."
            : "Every time a schedule ran, newest first, with failures on top."}
        </p>

        <div className="mt-5">{tab === "schedules" ? <SchedulesTab /> : <RunsTab />}</div>
      </div>
    </div>
  );
}

const selectStyle: React.CSSProperties = {
  border: "1px solid var(--hairline)",
  background: "#fff",
  color: "var(--ink-700)",
};

function SearchBox({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
}) {
  return (
    <label
      className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[13px]"
      style={selectStyle}
    >
      <Search size={14} aria-hidden="true" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        placeholder={label}
        className="w-44 bg-transparent outline-none"
      />
    </label>
  );
}

function SchedulesTab() {
  const go = useScheduledNav();
  const { domains } = useDomainState();
  const { schedules } = useSchedules();
  const { runs } = useRuns(schedules);
  const [domain, setDomain] = React.useState("all");
  const [failedOnly, setFailedOnly] = React.useState(false);
  const [query, setQuery] = React.useState("");

  const lastRun = (s: Schedule): Run | undefined => runs.find((r) => r.scheduleId === s.id);

  const visible = schedules.filter((s) => {
    if (domain !== "all" && s.domain !== domain) return false;
    if (failedOnly) {
      const r = lastRun(s);
      if (!r || (r.status !== "failed" && r.status !== "attention")) return false;
    }
    if (query && !`${s.name} ${s.tables.join(" ")}`.toLowerCase().includes(query.toLowerCase()))
      return false;
    return true;
  });

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <SearchBox value={query} onChange={setQuery} label="Search schedules" />
        <select
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          aria-label="Filter by domain"
          className="rounded-lg px-2.5 py-1.5 text-[13px]"
          style={selectStyle}
        >
          <option value="all">All domains</option>
          {domains.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-[13px]" style={{ color: "var(--ink-700)" }}>
          <input
            type="checkbox"
            checked={failedOnly}
            onChange={(e) => setFailedOnly(e.target.checked)}
          />
          Last run failed
        </label>
      </div>

      {visible.length === 0 ? (
        <p className="mt-8 text-[14px]" style={{ color: "var(--ink-500)" }}>
          No schedules match these filters.
        </p>
      ) : (
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {visible.map((s) => {
            const r = lastRun(s);
            return (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => go({ schedule: s.id })}
                  className="flex h-full w-full flex-col gap-2 rounded-xl border bg-white p-4 text-left transition-shadow hover:shadow-md"
                  style={{ borderColor: "var(--hairline)" }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className="text-[14.5px] font-semibold"
                      style={{ color: "var(--ink-900)" }}
                    >
                      {s.name}
                    </span>
                    {r ? <RunPill status={r.status} /> : <Tag>No runs yet</Tag>}
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Tag>{s.domain}</Tag>
                    <Tag>{s.kind}</Tag>
                    {!s.active && <Tag>Paused</Tag>}
                  </div>
                  <div className="text-[12.5px]" style={{ color: "var(--ink-500)" }}>
                    {s.tables.length} {s.tables.length === 1 ? "table" : "tables"} ·{" "}
                    {s.ruleIds.length} {s.ruleIds.length === 1 ? "check" : "checks"} · {s.repeats}
                  </div>
                  <div className="mt-auto text-[12px]" style={{ color: "var(--ink-300)" }}>
                    {r ? `Last run ${ago(r.hoursAgo)}` : "Never run"} · Next: {s.nextRun}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

type StatusFilter = "all" | RunStatus;
type Window = "all" | "24h" | "7d";

const RANK: Record<RunStatus, number> = { running: 0, failed: 1, attention: 2, passed: 3 };

function RunsTab() {
  const go = useScheduledNav();
  const { schedules } = useSchedules();
  const { runs } = useRuns(schedules);
  const [who, setWho] = React.useState<"mine" | "team">("team");
  const [status, setStatus] = React.useState<StatusFilter>("all");
  const [win, setWin] = React.useState<Window>("all");
  const [query, setQuery] = React.useState("");

  const scheduleOf = (r: Run) => schedules.find((s) => s.id === r.scheduleId);
  const scoped = runs.filter((r) => who === "team" || scheduleOf(r)?.owner === ME);

  const count = (s: RunStatus, hours: number) =>
    scoped.filter((r) => r.status === s && r.hoursAgo <= hours).length;

  function pick(s: StatusFilter, w: Window) {
    const same = status === s && win === w;
    setStatus(same ? "all" : s);
    setWin(same ? "all" : w);
  }

  const visible = scoped
    .filter((r) => (status === "all" ? true : r.status === status))
    .filter((r) => (win === "24h" ? r.hoursAgo <= 24 : win === "7d" ? r.hoursAgo <= 168 : true))
    .filter((r) => {
      const s = scheduleOf(r);
      return query
        ? `${s?.name ?? ""} ${s?.domain ?? ""}`.toLowerCase().includes(query.toLowerCase())
        : true;
    })
    .sort((a, b) => RANK[a.status] - RANK[b.status] || a.hoursAgo - b.hoursAgo);

  return (
    <>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile
          label="Passed, 24 hours"
          value={String(count("passed", 24))}
          pressed={status === "passed" && win === "24h"}
          onClick={() => pick("passed", "24h")}
        />
        <StatTile
          label="Failed, 24 hours"
          value={String(count("failed", 24))}
          pressed={status === "failed" && win === "24h"}
          onClick={() => pick("failed", "24h")}
        />
        <StatTile
          label="Passed, 7 days"
          value={String(count("passed", 168))}
          pressed={status === "passed" && win === "7d"}
          onClick={() => pick("passed", "7d")}
        />
        <StatTile
          label="Failed, 7 days"
          value={String(count("failed", 168))}
          pressed={status === "failed" && win === "7d"}
          onClick={() => pick("failed", "7d")}
        />
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <Tabs
          label="Whose runs"
          value={who}
          onChange={setWho}
          tabs={[
            { id: "mine", label: "Mine" },
            { id: "team", label: "Team" },
          ]}
        />
        <SearchBox value={query} onChange={setQuery} label="Search runs" />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as StatusFilter)}
          aria-label="Filter by status"
          className="rounded-lg px-2.5 py-1.5 text-[13px]"
          style={selectStyle}
        >
          <option value="all">Any status</option>
          <option value="failed">Failed</option>
          <option value="attention">Needs attention</option>
          <option value="passed">Passed</option>
          <option value="running">Running</option>
        </select>
        {(status !== "all" || win !== "all") && (
          <button
            type="button"
            onClick={() => {
              setStatus("all");
              setWin("all");
            }}
            className="text-[12.5px] underline"
            style={{ color: "var(--ink-500)" }}
          >
            Clear filters
          </button>
        )}
      </div>

      {visible.length === 0 ? (
        <p className="mt-8 text-[14px]" style={{ color: "var(--ink-500)" }}>
          No runs match these filters.
        </p>
      ) : (
        <ul
          className="mt-4 divide-y rounded-xl border bg-white"
          style={{ borderColor: "var(--hairline)" }}
        >
          {visible.map((r) => {
            const s = scheduleOf(r);
            return (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => go({ run: r.id })}
                  className="flex w-full flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-left hover:bg-[color:var(--surface-soft)]"
                >
                  <span className="w-[120px] shrink-0">
                    <RunPill status={r.status} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className="block truncate text-[14px] font-medium"
                      style={{ color: "var(--ink-900)" }}
                    >
                      {s?.name ?? "Deleted schedule"}
                    </span>
                    <span className="block text-[12.5px]" style={{ color: "var(--ink-500)" }}>
                      {s?.domain}
                      {r.checksRun > 0 && ` · ${r.checksFailed} of ${r.checksRun} checks failed`}
                    </span>
                  </span>
                  <span className="text-[12.5px]" style={{ color: "var(--ink-300)" }}>
                    {ago(r.hoursAgo)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
