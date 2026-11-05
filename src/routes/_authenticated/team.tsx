import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Panel } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ROLES, type TeamRole } from "@/lib/team";

export const Route = createFileRoute("/_authenticated/team")({
  head: () => ({ meta: [{ title: "Team & Access — Lunar Landing Site Navigator" }, { name: "description", content: "Team members, roles and how to invite teammates." }] }),
  component: TeamPage,
});

function TeamPage() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const profiles = useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").order("created_at");
      if (error) throw error;
      return data;
    },
  });
  const me = profiles.data?.find((p) => p.id === user.id);
  const [name, setName] = useState("");
  const [role, setRole] = useState<string>("");
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);
  useEffect(() => { if (me) { setName(me.display_name); setRole(me.team_role ?? ""); } }, [me]);

  async function save() {
    const { error } = await supabase.from("profiles").upsert({ id: user.id, display_name: name, team_role: (role || null) as TeamRole | null });
    if (error) return toast.error(error.message);
    toast.success("Profile saved");
    qc.invalidateQueries({ queryKey: ["profiles"] });
  }

  return (
    <>
      <PageHeader eyebrow="Collaboration" title="Team & Access" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Your profile">
          <div className="space-y-3">
            <div className="space-y-1.5"><Label htmlFor="dn">Display name</Label><Input id="dn" value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Team role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger><SelectValue placeholder="Choose your role" /></SelectTrigger>
                <SelectContent>{(Object.keys(ROLES) as TeamRole[]).map((r) => <SelectItem key={r} value={r}>{ROLES[r].member} — {ROLES[r].title}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Button onClick={save}>Save</Button>
          </div>
        </Panel>
        <Panel title="Invite teammates">
          <ol className="list-decimal space-y-2 pl-5 text-sm">
            <li>Send them this link:
              <div className="mt-1 flex gap-2">
                <Input readOnly value={`${origin}/auth`} className="font-mono text-xs" />
                <Button size="icon" variant="outline" aria-label="Copy invite link" onClick={() => { navigator.clipboard.writeText(`${origin}/auth`); toast.success("Copied"); }}><Copy /></Button>
              </div>
            </li>
            <li>They choose “Create an account” (or Google), confirm their email, and sign in.</li>
            <li>They open Team &amp; Access and pick their role. The board then syncs live for all three.</li>
            <li>Once all three have joined, the project owner can turn off new sign-ups in the backend's user settings so nobody else can join.</li>
          </ol>
        </Panel>
      </div>
      <Panel title="Members" className="mt-4">
        <ul className="divide-y divide-border">
          {profiles.data?.map((p) => (
            <li key={p.id} className="flex items-center justify-between py-2 text-sm">
              <span>{p.display_name || "Unnamed"} {p.id === user.id && <span className="text-xs text-muted-foreground">(you)</span>}</span>
              <span className="font-mono text-xs text-primary">{p.team_role ? `${p.team_role} · ${ROLES[p.team_role as TeamRole].title}` : "No role yet"}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted-foreground">{profiles.data?.length ?? 0} of 3 teammates joined.</p>
      </Panel>
    </>
  );
}
