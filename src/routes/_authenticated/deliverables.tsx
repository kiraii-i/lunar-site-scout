import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { useTasks } from "@/hooks/use-tasks";
import { ROLES, STATUSES, progress, type TeamRole } from "@/lib/team";

export const Route = createFileRoute("/_authenticated/deliverables")({
  head: () => ({ meta: [{ title: "Deliverables & Milestones — Lunar Landing Site Navigator" }, { name: "description", content: "Due dates and outputs for each team member." }] }),
  component: DeliverablesPage,
});

const MILESTONES = [
  { date: "Nov 6–11, 2026", label: "Preparation sprint", note: "Data, SPICE pipeline, app scaffolding" },
  { date: "Nov 12, 2026", label: "Feature freeze", note: "Only fixes, docs, presentation after this" },
  { date: "Nov 13–14, 2026", label: "NASA Space Apps hackathon", note: "Demo, submission, backup video" },
];

function DeliverablesPage() {
  const { data: tasks = [] } = useTasks();
  return (
    <>
      <PageHeader eyebrow="Schedule" title="Deliverables & Milestones" />
      <Panel title="Milestones">
        <ol className="grid gap-3 sm:grid-cols-3">
          {MILESTONES.map((m) => (
            <li key={m.label} className="rounded-md border border-border bg-background/60 p-3">
              <div className="font-mono text-xs text-primary">{m.date}</div>
              <div className="mt-1 font-medium">{m.label}</div>
              <div className="text-xs text-muted-foreground">{m.note}</div>
            </li>
          ))}
        </ol>
      </Panel>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {(Object.keys(ROLES) as TeamRole[]).map((r) => {
          const mine = tasks.filter((t) => t.owner_role === r);
          return (
            <Panel key={r} title={`${ROLES[r].member} · ${r}`} action={<span className="font-mono text-xs text-muted-foreground">{progress(mine)}%</span>}>
              <div className="mb-3 text-sm font-medium">{ROLES[r].title}</div>
              <ul className="space-y-2">
                {mine.map((t) => (
                  <li key={t.id} className="text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs text-primary">{t.code}</span>
                      <span className="font-mono text-[10px] text-muted-foreground">{t.due_date}</span>
                    </div>
                    <div className="text-muted-foreground">{t.deliverables || t.title}</div>
                    <Badge variant={t.status === "done" ? "live" : "pending"} className="mt-1">{STATUSES.find((s) => s.id === t.status)?.label}</Badge>
                  </li>
                ))}
              </ul>
            </Panel>
          );
        })}
      </div>
    </>
  );
}
