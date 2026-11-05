import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Sun, Earth } from "lucide-react";
import { PageHeader, Panel, EmptyState } from "@/components/AppShell";
import { SiteSelect, inputToIsoUtc, utcInputNow } from "@/components/SiteSelect";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AZIMUTH_CONVENTION, ELEVATION_CONVENTION, fetchAnalysis, fmtAngle, scienceApiUrl, type BodyGeometry, type SiteId } from "@/lib/science";

export const Route = createFileRoute("/_authenticated/analysis")({
  head: () => ({ meta: [{ title: "Scientific Analysis — Lunar Landing Site Navigator" }, { name: "description", content: "Sun and Earth elevation/azimuth for a study area at a UTC time." }] }),
  component: AnalysisPage,
});

function vis(v: boolean | null) {
  if (v === null) return <Badge variant="pending">Unavailable</Badge>;
  return v ? <Badge variant="live">Above ideal horizon</Badge> : <Badge variant="outline">Below ideal horizon</Badge>;
}

function BodyPanel({ name, icon, g, note }: { name: string; icon: React.ReactNode; g: BodyGeometry | null; note: string }) {
  return (
    <Panel title={name} action={icon}>
      <dl className="grid grid-cols-2 gap-3">
        <div><dt className="label-eyebrow">Elevation</dt><dd className="mt-1 font-mono text-2xl">{fmtAngle(g?.elevation_deg)}</dd></div>
        <div><dt className="label-eyebrow">Azimuth</dt><dd className="mt-1 font-mono text-2xl">{fmtAngle(g?.azimuth_deg)}</dd></div>
        <div><dt className="label-eyebrow">Geometric</dt><dd className="mt-1">{vis(g?.geometric_visible ?? null)}</dd></div>
        <div><dt className="label-eyebrow">Terrain</dt><dd className="mt-1"><Badge variant="pending">Not computed</Badge></dd></div>
      </dl>
      <p className="mt-3 text-xs text-muted-foreground">{note}</p>
    </Panel>
  );
}

function AnalysisPage() {
  const [site, setSite] = useState<SiteId>("shackleton");
  const [t, setT] = useState(utcInputNow);
  const iso = inputToIsoUtc(t);
  const configured = !!scienceApiUrl();
  const q = useQuery({ queryKey: ["analysis", site, iso], queryFn: () => fetchAnalysis(site, iso), enabled: configured && !!iso });
  const data = q.data?.kind === "ok" ? q.data.data : null;

  return (
    <>
      <PageHeader eyebrow="Geometry · SPICE" title="Scientific Analysis">
        <SiteSelect value={site} onChange={setSite} />
        <div className="flex items-center gap-2">
          <Label htmlFor="utc" className="font-mono text-xs">UTC</Label>
          <Input id="utc" type="datetime-local" value={t} onChange={(e) => setT(e.target.value)} className="w-52" />
        </div>
      </PageHeader>

      {!configured && (
        <div className="mb-4"><EmptyState title="SPICE backend not connected">Values stay “Unavailable” until the Python/SpiceyPy API (PY-08) is deployed and VITE_SCIENCE_API_URL is set. Nothing on this page is estimated.</EmptyState></div>
      )}
      {q.data?.kind === "error" && <div className="mb-4"><EmptyState title="API error">{q.data.message}</EmptyState></div>}
      {q.isFetching && <p className="mb-4 text-sm text-muted-foreground">Computing…</p>}

      <div className="grid gap-4 md:grid-cols-2">
        <BodyPanel name="Sun" icon={<Sun className="size-4 text-warning" />} g={data?.sun ?? null} note="Sun above the ideal horizon is not proof of power availability — terrain may block it." />
        <BodyPanel name="Earth" icon={<Earth className="size-4 text-primary" />} g={data?.earth ?? null} note="Geometric visibility is not communications availability — terrain may block line of sight." />
      </div>

      <Panel title="Metadata" className="mt-4">
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div><dt className="label-eyebrow">Timestamp</dt><dd className="font-mono">{iso || "—"}</dd></div>
          <div><dt className="label-eyebrow">Reference frame</dt><dd className="font-mono">{data?.reference_frame ?? "Pending (e.g. MOON_ME / topocentric)"}</dd></div>
          <div><dt className="label-eyebrow">Kernel provenance</dt><dd className="font-mono">{data?.kernel_provenance?.join(", ") ?? "Pending"}</dd></div>
          <div><dt className="label-eyebrow">Data status</dt><dd className="font-mono">{data?.data_status ?? "uncomputed"}</dd></div>
          <div className="sm:col-span-2"><dt className="label-eyebrow">Azimuth convention</dt><dd className="text-muted-foreground">{AZIMUTH_CONVENTION}</dd></div>
          <div className="sm:col-span-2"><dt className="label-eyebrow">Elevation convention</dt><dd className="text-muted-foreground">{ELEVATION_CONVENTION}</dd></div>
          <div className="sm:col-span-2"><dt className="label-eyebrow">Observer point</dt><dd className="text-muted-foreground">Pending verification — the API must reject requests until a sourced reference point exists for the study area.</dd></div>
        </dl>
      </Panel>
    </>
  );
}
