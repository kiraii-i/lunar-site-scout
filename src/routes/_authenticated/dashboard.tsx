import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { activityQuery, useTasks } from "@/hooks/use-tasks";
import { PageHeader, Panel, EmptyState } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { HACKATHON_START_UTC, ROLES, countdownParts, progress, type TeamRole } from "@/lib/team";
import { scienceApiUrl } from "@/lib/science";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Overview — Lunar Landing Site Navigator" }, { name: "description", content: "Team status, deadline countdown, roadmap and workload." }] }),
  component: Dashboard,
});

function Countdown() {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);
  if (now === null) return <div className="h-16" />;
  const c = countdownParts(HACKATHON_START_UTC, now);
  if (c.done) return <div className="text-2xl font-semibold text-primary">Hackathon is live</div>;
  return (
    <div className="flex gap-4 font-mono">
      {[["days", c.days], ["hrs", c.hours], ["min", c.minutes]].map(([l, v]) => (
        <div key={l}>
          <div className="text-4xl font-medium text-primary tabular-nums">{String(v).padStart(2, "0")}</div>
          <div className="label-eyebrow">{l}</div>
        </div>
      ))}
    </div>
  );
}

function Dashboard() {
  const { data: tasks = [], isLoading, error } = useTasks();
  const activity = useQuery(activityQuery);
  const pct = progress(tasks);
  const open = tasks.filter((t) => t.status !== "done");
  const roadmap = open.filter((t) => t.priority === "high").slice(0, 6);

  return (
    <>
      <PageHeader eyebrow="Mission overview" title="Team Dashboard">
        <Badge variant="info">UTC</Badge>
      </PageHeader>
      {error && <EmptyState title="Could not load tasks">{(error as Error).message}</EmptyState>}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Panel title="Countdown to Nov 13, 2026 00:00 UTC" className="xl:col-span-2">
          <Countdown />
          <p className="mt-3 text-xs text-muted-foreground">Feature freeze Nov 12 · Hackathon Nov 13–14, 2026</p>
        </Panel>
        <Panel title="Task progress">
          <div className="text-4xl font-semibold tabular-nums">{isLoading ? "—" : `${pct}%`}</div>
          <Progress value={pct} className="mt-3" />
          <p className="mt-2 text-xs text-muted-foreground">
            {tasks.filter((t) => t.status === "done").length} of {tasks.length} tasks done
          </p>
        </Panel>
        <Panel title="Integration status">
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between">Shared task DB <Badge variant="live">Live</Badge></li>
            <li className="flex justify-between">SPICE / Python API {scienceApiUrl() ? <Badge variant="live">Configured</Badge> : <Badge variant="pending">Not connected</Badge>}</li>
            <li className="flex justify-between">GIS layers <Badge variant="pending">Not connected</Badge></li>
            <li className="flex justify-between">Horizon profile <Badge variant="pending">Not computed</Badge></li>
          </ul>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Panel title="Priority roadmap" className="lg:col-span-2" action={<Link to="/tasks" className="text-xs text-primary hover:underline">Open board →</Link>}>
          {roadmap.length === 0 ? (
            <EmptyState title="No open high-priority tasks" />
          ) : (
            <ul className="divide-y divide-border">
              {roadmap.map((t) => (
                <li key={t.id} className="flex items-center gap-3 py-2 text-sm">
                  <span className="w-16 font-mono text-xs text-primary">{t.code}</span>
                  <span className="flex-1 truncate">{t.title}</span>
                  <span className="hidden font-mono text-xs text-muted-foreground sm:block">{t.due_date}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Team workload">
          <div className="space-y-4">
            {(Object.keys(ROLES) as TeamRole[]).map((r) => {
              const mine = tasks.filter((t) => t.owner_role === r);
              const p = progress(mine);
              return (
                <div key={r}>
                  <div className="flex justify-between text-sm">
                    <span>{ROLES[r].member} · <span className="text-muted-foreground">{r}</span></span>
                    <span className="font-mono text-xs text-muted-foreground">{mine.filter((t) => t.status !== "done").length} open</span>
                  </div>
                  <Progress value={p} className="mt-1.5 h-1.5" />
                </div>
              );
            })}
          </div>
        </Panel>
      </div>

      <Panel title="Recent activity" className="mt-4">
        {activity.data && activity.data.length > 0 ? (
          <ul className="space-y-2 text-sm">
            {activity.data.map((a) => (
              <li key={a.id} className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
                <span className="font-mono text-xs text-muted-foreground sm:w-44">{new Date(a.created_at).toISOString().replace("T", " ").slice(0, 16)} UTC</span>
                <span><span className="text-primary">{a.actor_name}</span> {a.message}</span>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="No activity yet">Changes on the task board will appear here for the whole team.</EmptyState>
        )}
      </Panel>
    </>
  );
}
