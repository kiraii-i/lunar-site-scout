import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Upload } from "lucide-react";
import { PageHeader, Panel, EmptyState } from "@/components/AppShell";
import { SiteSelect } from "@/components/SiteSelect";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { SITES, REQUIRED_LAYER_PROVENANCE, validateLayerMetadata, type SiteId } from "@/lib/science";

export const Route = createFileRoute("/_authenticated/gis")({
  head: () => ({ meta: [{ title: "GIS Explorer — Lunar Landing Site Navigator" }, { name: "description", content: "Study-area map panel with layer controls and data connection workflow." }] }),
  component: GisPage,
});

const LAYERS = ["Landing Sites", "LOLA Elevation", "Hillshade", "Slope", "Aspect", "Sun Visibility", "Earth Visibility", "Candidate Areas"];

type Report = { name: string; ok: boolean; missing: string[]; warnings: string[] } | { name: string; parseError: string };

function GisPage() {
  const [site, setSite] = useState<SiteId>("shackleton");
  const [on, setOn] = useState<Record<string, boolean>>({ "Landing Sites": true, "Candidate Areas": true });
  const [report, setReport] = useState<Report | null>(null);
  const cfg = SITES.find((s) => s.site_id === site)!;
  const active = LAYERS.filter((l) => on[l]);

  async function onFile(f: File | undefined) {
    if (!f) return;
    try {
      const json = JSON.parse(await f.text());
      setReport({ name: f.name, ...validateLayerMetadata(json) });
    } catch {
      setReport({ name: f.name, parseError: "Not valid JSON. Upload the layer's metadata sidecar (.json)." });
    }
  }

  return (
    <>
      <PageHeader eyebrow="Geospatial" title="GIS Explorer">
        <SiteSelect value={site} onChange={setSite} />
      </PageHeader>
      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <Panel className="p-0! overflow-hidden">
          <div className="relative aspect-[4/3] w-full bg-background bg-grid sm:aspect-[16/10]">
            <svg viewBox="0 0 400 250" className="absolute inset-0 h-full w-full" role="img" aria-label={`Schematic placeholder for ${cfg.name}. Not georeferenced.`}>
              <defs>
                <radialGradient id="g" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
                </radialGradient>
              </defs>
              <circle cx="200" cy="125" r="110" fill="url(#g)" />
              {[30, 60, 90].map((r) => <circle key={r} cx="200" cy="125" r={r} fill="none" stroke="var(--primary)" strokeOpacity="0.25" strokeDasharray="3 4" />)}
              <line x1="200" y1="10" x2="200" y2="240" stroke="var(--primary)" strokeOpacity="0.15" />
              <line x1="60" y1="125" x2="340" y2="125" stroke="var(--primary)" strokeOpacity="0.15" />
              {on["Candidate Areas"] && <rect x="150" y="85" width="100" height="80" fill="none" stroke="var(--warning)" strokeDasharray="5 4" strokeOpacity="0.8" />}
              <text x="200" y="128" textAnchor="middle" fill="var(--foreground)" fontSize="11" fontFamily="IBM Plex Sans">{cfg.name}</text>
              <text x="200" y="143" textAnchor="middle" fill="var(--muted-foreground)" fontSize="7" fontFamily="IBM Plex Mono">STUDY AREA · POSITION NOT VERIFIED</text>
            </svg>
            <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
              <Badge variant="demo">Schematic · not to scale</Badge>
              <Badge variant="pending">No terrain data</Badge>
            </div>
            <div className="absolute bottom-3 left-3 right-3 rounded-md border border-border bg-card/90 p-2 font-mono text-[10px] text-muted-foreground backdrop-blur">
              CRS: pending (target Moon polar stereographic, e.g. IAU_2015:30135) · Lat/Lon: {cfg.latitude_deg ?? "Pending verification"} · Not WGS84
            </div>
          </div>
          <div className="border-t border-border p-4 text-sm">
            <div className="label-eyebrow mb-2">Active layers</div>
            {active.length === 0 ? <span className="text-muted-foreground">None selected</span> : (
              <ul className="grid gap-1 sm:grid-cols-2">
                {active.map((l) => (
                  <li key={l} className="flex items-center justify-between gap-2">
                    <span>{l}</span><Badge variant="pending">No data connected</Badge>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel title="Layers">
            <div className="space-y-2.5">
              {LAYERS.map((l) => (
                <div key={l} className="flex items-center justify-between">
                  <Label htmlFor={`l-${l}`} className="text-sm font-normal">{l}</Label>
                  <Switch id={`l-${l}`} checked={!!on[l]} onCheckedChange={(v) => setOn({ ...on, [l]: v })} />
                </div>
              ))}
            </div>
          </Panel>
          <Panel title="Connect data">
            <p className="text-xs text-muted-foreground">Validate a layer's metadata sidecar before integration. Required fields:</p>
            <p className="mt-1 font-mono text-[10px] text-primary">{REQUIRED_LAYER_PROVENANCE.join(", ")}</p>
            <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-primary/40 p-3 text-sm text-primary hover:bg-primary/5">
              <Upload className="size-4" /> Choose metadata .json
              <input type="file" accept="application/json,.json" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} />
            </label>
            {report && (
              <div className="mt-3 text-xs">
                <div className="font-mono">{report.name}</div>
                {"parseError" in report ? <p className="mt-1 text-destructive">{report.parseError}</p> : report.ok ? (
                  <p className="mt-1 text-success">Provenance complete. Ready to hand to WEB-06 for tiling.</p>
                ) : (
                  <ul className="mt-1 space-y-0.5 text-warning">
                    {report.missing.map((m) => <li key={m}>Missing: {m}</li>)}
                    {report.warnings.map((w) => <li key={w}>{w}</li>)}
                  </ul>
                )}
                <p className="mt-2 text-muted-foreground">Checked in your browser only — nothing is uploaded.</p>
              </div>
            )}
          </Panel>
        </div>
      </div>
      <div className="mt-4">
        <EmptyState title="Why no real map yet?">
          Lunar rasters need a Moon coordinate reference system (IAU 2015 lunar CRS, south-polar stereographic). Standard Leaflet/Web Mercator assumes Earth (WGS84) and would distort polar data. Integration plan: GIS lead exports Cloud-Optimized GeoTIFF tiles in a lunar polar stereographic CRS → WEB lead renders with a custom-CRS map (e.g. OpenLayers with a registered proj4 definition).
        </EmptyState>
      </div>
    </>
  );
}
