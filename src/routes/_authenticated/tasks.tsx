import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useTasks, useTaskMutations, type TaskInput } from "@/hooks/use-tasks";
import { PageHeader, EmptyState } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PRIORITIES, ROLES, STATUSES, TRACKS, sourceLabel, type Task, type TaskStatus, type TeamRole } from "@/lib/team";

export const Route = createFileRoute("/_authenticated/tasks")({
  head: () => ({ meta: [{ title: "Team Tasks — Lunar Landing Site Navigator" }, { name: "description", content: "Shared task board for the three-person team." }] }),
  component: TasksPage,
});

const EMPTY: TaskInput = { code: "", title: "", description: "", deliverables: "", owner_role: "WEB", priority: "medium", status: "todo", due_date: "2026-11-12", track: "core", source_links: [] };

const prioClass: Record<string, string> = {
  high: "border-destructive/50 text-destructive",
  medium: "border-warning/50 text-warning",
  low: "border-border text-muted-foreground",
};

function TasksPage() {
  const { data: tasks = [], isLoading, error } = useTasks();
  const { create, update, remove } = useTaskMutations();
  const [member, setMember] = useState<"all" | TeamRole>("all");
  const [prio, setPrio] = useState<string>("all");
  const [track, setTrack] = useState<string>("all");
  const [editing, setEditing] = useState<Task | null>(null);
  const [form, setForm] = useState<TaskInput>(EMPTY);
  const [open, setOpen] = useState(false);

  const filtered = tasks.filter((t) => (member === "all" || t.owner_role === member) && (prio === "all" || t.priority === prio) && (track === "all" || t.track === track));

  function openNew() { setEditing(null); setForm(EMPTY); setOpen(true); }
  function openEdit(t: Task) {
    setEditing(t);
    setForm({ code: t.code, title: t.title, description: t.description, deliverables: t.deliverables, owner_role: t.owner_role, priority: t.priority, status: t.status, due_date: t.due_date, track: t.track, source_links: t.source_links });
    setOpen(true);
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editing) await update.mutateAsync({ id: editing.id, patch: form, label: `edited ${form.code} “${form.title}”` });
      else await create.mutateAsync(form);
      setOpen(false);
      toast.success("Saved for the whole team");
    } catch (err) { toast.error((err as Error).message); }
  }
  function move(t: Task, status: TaskStatus) {
    update.mutate(
      { id: t.id, patch: { status }, label: `moved ${t.code} to ${STATUSES.find((s) => s.id === status)?.label}` },
      { onError: (e) => toast.error((e as Error).message) },
    );
  }
  function del(t: Task) {
    if (!confirm(`Delete ${t.code} “${t.title}”?`)) return;
    remove.mutate(t, { onError: (e) => toast.error((e as Error).message) });
  }

  return (
    <>
      <PageHeader eyebrow="Shared · syncs live across the team" title="Team Tasks">
        <Select value={member} onValueChange={(v) => setMember(v as typeof member)}>
          <SelectTrigger className="w-44" aria-label="Filter by member"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All members</SelectItem>
            {(Object.keys(ROLES) as TeamRole[]).map((r) => <SelectItem key={r} value={r}>{ROLES[r].member} · {r}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={prio} onValueChange={setPrio}>
          <SelectTrigger className="w-36" aria-label="Filter by priority"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priorities</SelectItem>
            {PRIORITIES.map((p) => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={track} onValueChange={setTrack}>
          <SelectTrigger className="w-56" aria-label="Filter by track"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All tracks</SelectItem>
            {Object.entries(TRACKS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button onClick={openNew}><Plus /> New task</Button>
      </PageHeader>

      {error && <EmptyState title="Could not load tasks">{(error as Error).message}</EmptyState>}
      {isLoading && <div className="text-sm text-muted-foreground">Loading shared board…</div>}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {STATUSES.map((col) => {
          const items = filtered.filter((t) => t.status === col.id);
          return (
            <section key={col.id} className="rounded-lg border border-border bg-card/60 p-3">
              <h2 className="mb-3 flex items-center justify-between px-1">
                <span className="label-eyebrow text-foreground/80!">{col.label}</span>
                <span className="font-mono text-xs text-muted-foreground">{items.length}</span>
              </h2>
              <div className="space-y-2">
                {items.length === 0 && <div className="rounded-md border border-dashed border-border p-3 text-center text-xs text-muted-foreground">Empty</div>}
                {items.map((t) => (
                  <article key={t.id} className="rounded-md border border-border bg-background/70 p-3 transition-colors hover:border-primary/40">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs text-primary">{t.code}</span>
                      <div className="flex gap-0.5">
                        <Button size="icon" variant="ghost" className="size-7" aria-label={`Edit ${t.code}`} onClick={() => openEdit(t)}><Pencil /></Button>
                        <Button size="icon" variant="ghost" className="size-7" aria-label={`Delete ${t.code}`} onClick={() => del(t)}><Trash2 /></Button>
                      </div>
                    </div>
                    <p className="mt-1 text-sm leading-snug">{t.title}</p>
                    {t.track === "learning" && <Badge variant="info" className="mt-1">Learning track</Badge>}
                    {t.deliverables && <p className="mt-1 text-xs text-muted-foreground">↳ {t.deliverables}</p>}
                    {t.source_links.length > 0 && (
                      <ul className="mt-1.5 space-y-0.5">
                        {t.source_links.map((u) => (
                          <li key={u}><a href={u} target="_blank" rel="noreferrer" className="font-mono text-[10px] text-primary hover:underline">Source: {sourceLabel(u)} ↗</a></li>
                        ))}
                      </ul>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <Badge variant="outline" className="font-mono text-[10px]">{t.owner_role}</Badge>
                      <Badge variant="outline" className={`text-[10px] capitalize ${prioClass[t.priority]}`}>{t.priority}</Badge>
                      {t.due_date && <span className="ml-auto font-mono text-[10px] text-muted-foreground">Due {t.due_date}</span>}
                    </div>
                    <Select value={t.status} onValueChange={(v) => move(t, v as TaskStatus)}>
                      <SelectTrigger className="mt-2 h-7 text-xs" aria-label={`Status of ${t.code}`}><SelectValue /></SelectTrigger>
                      <SelectContent>{STATUSES.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? `Edit ${editing.code}` : "New task"}</DialogTitle></DialogHeader>
          <form onSubmit={save} className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5"><Label htmlFor="code">Code</Label><Input id="code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="WEB-08" /></div>
              <div className="col-span-2 space-y-1.5"><Label htmlFor="title">Title</Label><Input id="title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            </div>
            <div className="space-y-1.5"><Label htmlFor="desc">Description</Label><Textarea id="desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="space-y-1.5"><Label htmlFor="deliv">Deliverables</Label><Input id="deliv" value={form.deliverables} onChange={(e) => setForm({ ...form, deliverables: e.target.value })} /></div>
            <div className="space-y-1.5"><Label htmlFor="src">Source links (one URL per line)</Label>
              <Textarea id="src" className="font-mono text-xs" value={form.source_links.join("\n")} onChange={(e) => setForm({ ...form, source_links: e.target.value.split("\n").map((x) => x.trim()).filter(Boolean) })} />
            </div>
            <div className="space-y-1.5"><Label>Track</Label>
              <Select value={form.track} onValueChange={(v) => setForm({ ...form, track: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(TRACKS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Owner</Label>
                <Select value={form.owner_role} onValueChange={(v) => setForm({ ...form, owner_role: v as TeamRole })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{(Object.keys(ROLES) as TeamRole[]).map((r) => <SelectItem key={r} value={r}>{ROLES[r].member} · {r}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Priority</Label>
                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v as TaskInput["priority"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PRIORITIES.map((p) => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as TaskStatus })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUSES.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label htmlFor="due">Due date</Label><Input id="due" type="date" value={form.due_date ?? ""} onChange={(e) => setForm({ ...form, due_date: e.target.value || null })} /></div>
            </div>
            <DialogFooter><Button type="submit" disabled={create.isPending || update.isPending}>Save</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
