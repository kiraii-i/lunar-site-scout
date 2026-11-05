import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel, EmptyState } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { SITES } from "@/lib/science";

export const Route = createFileRoute("/_authenticated/compare")({
  head: () => ({ meta: [{ title: "Site Comparison — Lunar Landing Site Navigator" }, { name: "description", content: "Transparent criteria comparison of Shackleton Crater and Malapert Massif." }] }),
  component: ComparePage,
});

const CRITERIA = [
  { name: "Terrain slope", method: "Slope from LOLA DEM (GIS-02); report units, resolution, and DEM source.", owner: "GIS" },
  { name: "Illumination", method: "Sun geometric windows (PY-06) + terrain occlusion via horizon profile (GIS-04).", owner: "PY + GIS" },
  { name: "Earth visibility", method: "Earth elevation over time (PY-05) + terrain occlusion.", owner: "PY + GIS" },
  { name: "Communications geometry", method: "Earth line-of-sight geometry only; actual link availability is out of scope.", owner: "PY" },
  { name: "Data coverage", method: "DEM/imagery coverage and resolution over the study area, from product metadata.", owner: "GIS" },
  { name: "Operational constraints", method: "Documented qualitative constraints with citations.", owner: "Team" },
];

function ComparePage() {
  return (
    <>
      <PageHeader eyebrow="Evidence first" title="Site Comparison" />
      <div className="mb-4">
        <EmptyState title="No overall winner or suitability score">
          This page deliberately does not rank sites. Each criterion shows a value only once it is sourced, with its provenance.
        </EmptyState>
      </div>
      <Panel className="overflow-x-auto p-0!">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="label-eyebrow p-4">Criterion</th>
              {SITES.map((s) => <th key={s.site_id} className="label-eyebrow p-4">{s.name}</th>)}
              <th className="label-eyebrow p-4">Method · owner</th>
            </tr>
          </thead>
          <tbody>
            {CRITERIA.map((c) => (
              <tr key={c.name} className="border-b border-border/60 align-top last:border-0">
                <td className="p-4 font-medium">{c.name}</td>
                {SITES.map((s) => <td key={s.site_id} className="p-4"><Badge variant="pending">Pending data</Badge></td>)}
                <td className="p-4 text-xs text-muted-foreground">{c.method} <span className="font-mono text-primary">[{c.owner}]</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </>
  );
}
