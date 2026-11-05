import { createFileRoute } from "@tanstack/react-router";
import { ExternalLink } from "lucide-react";
import { PageHeader, Panel } from "@/components/AppShell";
import { AZIMUTH_CONVENTION, ELEVATION_CONVENTION, EXAMPLE_ANALYSIS, EXAMPLE_SITE_CONFIG } from "@/lib/science";

export const Route = createFileRoute("/_authenticated/resources")({
  head: () => ({ meta: [{ title: "Resources & Methodology — Lunar Landing Site Navigator" }, { name: "description", content: "Sources, provenance, conventions, limitations and API data contract." }] }),
  component: ResourcesPage,
});

const LINKS: [string, string, string][] = [
  ["Data", "NASA PGDA — LOLA South Pole data", "https://pgda.gsfc.nasa.gov/products/78"],
  ["Data", "LOLA PDS archive", "https://pds-geosciences.wustl.edu/missions/lro/lola.htm"],
  ["Data", "LROC archive", "https://pds.lroc.im-ldi.com/data/"],
  ["Data", "LRO data products", "https://science.nasa.gov/mission/lro/data-products/"],
  ["Data", "NASA Moon Trek", "https://trek.nasa.gov/moon/"],
  ["GIS", "QGIS", "https://qgis.org/"],
  ["GIS", "QGIS documentation", "https://docs.qgis.org/latest/en/docs/user_manual/"],
  ["Geometry", "NAIF SPICE", "https://naif.jpl.nasa.gov/naif/"],
  ["Geometry", "NAIF tutorials", "https://naif.jpl.nasa.gov/naif/tutorials.html"],
  ["Geometry", "SpiceyPy", "https://spiceypy.readthedocs.io/"],
  ["Web", "FastAPI tutorial", "https://fastapi.tiangolo.com/tutorial/"],
  ["Web", "React", "https://react.dev/learn"],
];

function Code({ children }: { children: string }) {
  return <pre className="overflow-x-auto rounded-md border border-border bg-background p-3 font-mono text-xs text-primary/90">{children}</pre>;
}

function ResourcesPage() {
  return (
    <>
      <PageHeader eyebrow="Provenance & method" title="Resources & Methodology" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Sources">
          <ul className="divide-y divide-border">
            {LINKS.map(([cat, name, url]) => (
              <li key={url}>
                <a href={url} target="_blank" rel="noreferrer" className="flex items-center gap-3 py-2 text-sm hover:text-primary">
                  <span className="w-20 font-mono text-[10px] uppercase text-muted-foreground">{cat}</span>
                  <span className="flex-1">{name}</span>
                  <ExternalLink className="size-3.5 text-muted-foreground" aria-hidden />
                </a>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Conventions">
          <dl className="space-y-3 text-sm">
            <div><dt className="label-eyebrow">Time</dt><dd>All scientific timestamps are UTC (ISO 8601, “Z” suffix).</dd></div>
            <div><dt className="label-eyebrow">Azimuth</dt><dd>{AZIMUTH_CONVENTION}</dd></div>
            <div><dt className="label-eyebrow">Elevation</dt><dd>{ELEVATION_CONVENTION}</dd></div>
            <div><dt className="label-eyebrow">Coordinates</dt><dd>Moon body-fixed (planetocentric, IAU 2015 lunar CRS). Study-area points stay null until a sourced, verified value exists.</dd></div>
            <div><dt className="label-eyebrow">Map projection</dt><dd>South-polar stereographic on the lunar sphere — never Earth WGS84 / Web Mercator.</dd></div>
            <div><dt className="label-eyebrow">Unknown values</dt><dd>Always <code className="font-mono text-primary">null</code>, never 0.</dd></div>
          </dl>
        </Panel>
        <Panel title="Limitations">
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
            <li>Geometric visibility is not actual communications availability.</li>
            <li>Sun above the ideal horizon is not proof of power availability.</li>
            <li>Terrain may block Sun or Earth; terrain_visible stays null until a verified local horizon profile is integrated.</li>
            <li>No validated landing suitability is claimed. Comparison shows criteria, not a winner.</li>
            <li>Any seeded/example numbers are labelled DEMO DATA.</li>
          </ul>
        </Panel>
        <Panel title="Provenance fields (required per dataset)">
          <p className="font-mono text-xs text-muted-foreground">source · coordinate_frame · projection · units · resolution_m · timestamp_utc · kernel_provenance (SPICE) · azimuth_convention · verification_status</p>
        </Panel>
        <Panel title="Site config schema (example)" className="lg:col-span-2">
          <Code>{JSON.stringify(EXAMPLE_SITE_CONFIG, null, 2)}</Code>
        </Panel>
        <Panel title="Analysis output schema (example, uncomputed)" className="lg:col-span-2">
          <Code>{JSON.stringify(EXAMPLE_ANALYSIS, null, 2)}</Code>
        </Panel>
        <Panel title="API integration boundary" className="lg:col-span-2">
          <ol className="list-decimal space-y-1.5 pl-5 text-sm">
            <li>Python lead serves FastAPI with <code className="font-mono text-primary">GET /analysis?site_id&amp;timestamp_utc</code> and <code className="font-mono text-primary">GET /timeline?site_id&amp;start_utc&amp;end_utc</code> returning the schemas above (CORS enabled for this app's domain).</li>
            <li>Set the environment variable <code className="font-mono text-primary">VITE_SCIENCE_API_URL</code> to the API base URL.</li>
            <li>Analysis and Timeline pages switch from “Unavailable” to live values automatically — no redesign.</li>
            <li>GIS lead exports lunar polar-stereographic COG tiles + metadata JSON; validate via GIS Explorer → Connect data.</li>
          </ol>
        </Panel>
      </div>
    </>
  );
}
