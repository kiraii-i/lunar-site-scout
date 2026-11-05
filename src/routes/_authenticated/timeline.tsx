import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, Panel, EmptyState } from "@/components/AppShell";
import { SiteSelect } from "@/components/SiteSelect";
import { Badge } from "@/components/ui/badge";
import { fetchTimeline, scienceApiUrl, type SiteId, type TimelineWindow } from "@/lib/science";

export const Route = createFileRoute("/_authenticated/timeline")({
  head: () => ({ meta: [{ title: "Mission Timeline — Lunar Landing Site Navigator" }, { name: "description", content: "UTC sunlight and Earth geometric visibility windows." }] }),
  component: TimelinePage,
});

const START = "2026-11-13T00:00:00Z";
const END = "2026-11-15T00:00:00Z";
const t0 = Date.parse(START), t1 = Date.parse(END);
const TICKS = Array.from({ length: 9 }, (_, i) => t0 + (i * (t1 - t0)) / 8);

function Track({ label, windows, empty, tone }: { label: string; windows: TimelineWindow[] | null; empty: string; tone: string }) {
  return (
    <div className="grid gap-2 sm:grid-cols-[180px_1fr] sm:items-center">
      <div className="text-sm">{label}</div>
      <div className="relative h-9 overflow-hidden rounded-md border border-border bg-muted/30">
        {windows === null ? (
          <div className="flex h-full items-center px-3 text-xs text-muted-foreground">{empty}</div>
        ) : windows.map((w, i) => {
          const a = Math.max(0, (Date.parse(w.start_utc) - t0) / (t1 - t0));
          const b = Math.min(1, (Date.parse(w.end_utc) - t0) / (t1 - t0));
          return <div key={i} className={`absolute inset-y-1 rounded-sm ${tone}`} style={{ left: `${a * 100}%`, width: `${(b - a) * 100}%` }} />;
        })}
      </div>
    </div>
  );
}

function TimelinePage() {
  const [site, setSite] = useState<SiteId>("shackleton");
  const configured = !!scienceApiUrl();
  const q = useQuery({ queryKey: ["timeline", site], queryFn: () => fetchTimeline(site, START, END), enabled: configured });
  const d = q.data?.kind === "ok" ? q.data.data : null;

  return (
    <>
      <PageHeader eyebrow="UTC · Nov 13–14, 2026" title="Mission Timeline">
        <SiteSelect value={site} onChange={setSite} />
      </PageHeader>
      {!configured && <div className="mb-4"><EmptyState title="Uncomputed">Windows appear only after the Python timeline (PY-06) is served by the API. No illustrative windows are drawn.</EmptyState></div>}
      <Panel>
        <div className="space-y-3">
          <div className="hidden grid-cols-[180px_1fr] sm:grid">
            <div />
            <div className="flex justify-between font-mono text-[10px] text-muted-foreground">
              {TICKS.map((t) => <span key={t}>{new Date(t).toISOString().slice(5, 13).replace("T", " ")}h</span>)}
            </div>
          </div>
          <Track label="Sun · geometric" windows={d?.sun_geometric ?? null} empty="Not computed — awaiting SPICE output" tone="bg-warning/70" />
          <Track label="Earth · geometric" windows={d?.earth_geometric ?? null} empty="Not computed — awaiting SPICE output" tone="bg-primary/70" />
          <div className="grid gap-2 sm:grid-cols-[180px_1fr] sm:items-center">
            <div className="text-sm">Terrain visibility</div>
            <div className="flex h-9 items-center rounded-md border border-border hatch px-3 text-xs text-muted-foreground">
              Not computed — local horizon profile required
            </div>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge variant="info">All times UTC</Badge>
          <Badge variant="outline">Geometric ≠ comms availability</Badge>
          <Badge variant="outline">Sun above ideal horizon ≠ power</Badge>
        </div>
      </Panel>
    </>
  );
}
