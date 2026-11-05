/**
 * Data contract + integration boundary for the future FastAPI/SpiceyPy backend.
 * RULE: unknown / uncomputed values are `null`, never 0. Coordinates stay null until verified.
 */

export type SiteId = "shackleton" | "malapert";
export type VerificationStatus = "pending_verification" | "verified";

export interface SiteConfig {
  site_id: SiteId;
  name: string;
  kind: "study_area";
  description: string;
  latitude_deg: number | null;
  longitude_deg: number | null;
  elevation_m: number | null;
  coordinate_frame: string | null;
  coordinate_source: string | null;
  verification_status: VerificationStatus;
}

export const SITES: SiteConfig[] = [
  {
    site_id: "shackleton",
    name: "Shackleton Crater",
    kind: "study_area",
    description: "Named study area near the lunar south pole. No reference point selected yet.",
    latitude_deg: null,
    longitude_deg: null,
    elevation_m: null,
    coordinate_frame: null,
    coordinate_source: null,
    verification_status: "pending_verification",
  },
  {
    site_id: "malapert",
    name: "Malapert Massif",
    kind: "study_area",
    description: "Named study area in the south polar region. No reference point selected yet.",
    latitude_deg: null,
    longitude_deg: null,
    elevation_m: null,
    coordinate_frame: null,
    coordinate_source: null,
    verification_status: "pending_verification",
  },
];

export const AZIMUTH_CONVENTION =
  "Degrees clockwise from local North (0° = N, 90° = E), measured in the local topocentric horizon plane — to be confirmed against the SPICE pipeline.";
export const ELEVATION_CONVENTION =
  "Degrees above the ideal (geometric) horizon plane; terrain not included.";

export interface BodyGeometry {
  elevation_deg: number | null;
  azimuth_deg: number | null;
  geometric_visible: boolean | null;
  /** Always null until a verified local horizon profile is integrated. */
  terrain_visible: boolean | null;
}

export interface AnalysisResult {
  site_id: SiteId;
  timestamp_utc: string;
  reference_frame: string | null;
  kernel_provenance: string[] | null;
  units: { angles: "deg" };
  azimuth_convention: string;
  sun: BodyGeometry;
  earth: BodyGeometry;
  data_status: "computed" | "partial" | "uncomputed";
}

export interface TimelineWindow {
  start_utc: string;
  end_utc: string;
}
export interface TimelineResult {
  site_id: SiteId;
  start_utc: string;
  end_utc: string;
  sun_geometric: TimelineWindow[] | null;
  earth_geometric: TimelineWindow[] | null;
  terrain: null;
  data_status: "computed" | "uncomputed";
}

export type ApiState<T> =
  | { kind: "not_configured" }
  | { kind: "error"; message: string }
  | { kind: "ok"; data: T };

/** Set VITE_SCIENCE_API_URL to the deployed FastAPI base URL to activate. */
export function scienceApiUrl(): string | null {
  const url = import.meta.env.VITE_SCIENCE_API_URL as string | undefined;
  return url && url.length > 0 ? url.replace(/\/$/, "") : null;
}

async function getJson<T>(path: string): Promise<ApiState<T>> {
  const base = scienceApiUrl();
  if (!base) return { kind: "not_configured" };
  try {
    const res = await fetch(`${base}${path}`);
    if (!res.ok) return { kind: "error", message: `API responded ${res.status}` };
    return { kind: "ok", data: (await res.json()) as T };
  } catch (e) {
    return { kind: "error", message: e instanceof Error ? e.message : "Network error" };
  }
}

export function fetchAnalysis(site: SiteId, timestampUtc: string) {
  return getJson<AnalysisResult>(
    `/analysis?site_id=${site}&timestamp_utc=${encodeURIComponent(timestampUtc)}`,
  );
}

export function fetchTimeline(site: SiteId, startUtc: string, endUtc: string) {
  return getJson<TimelineResult>(
    `/timeline?site_id=${site}&start_utc=${encodeURIComponent(startUtc)}&end_utc=${encodeURIComponent(endUtc)}`,
  );
}

/** Formats an angle or returns the honest unavailable label. Never coerces null to 0. */
export function fmtAngle(v: number | null | undefined) {
  return v === null || v === undefined || Number.isNaN(v) ? "Unavailable" : `${v.toFixed(2)}°`;
}

export const EXAMPLE_SITE_CONFIG: SiteConfig = SITES[0];

export const EXAMPLE_ANALYSIS: AnalysisResult = {
  site_id: "shackleton",
  timestamp_utc: "2026-11-13T12:00:00Z",
  reference_frame: null,
  kernel_provenance: null,
  units: { angles: "deg" },
  azimuth_convention: AZIMUTH_CONVENTION,
  sun: { elevation_deg: null, azimuth_deg: null, geometric_visible: null, terrain_visible: null },
  earth: { elevation_deg: null, azimuth_deg: null, geometric_visible: null, terrain_visible: null },
  data_status: "uncomputed",
};

export const REQUIRED_LAYER_PROVENANCE = [
  "source",
  "coordinate_frame",
  "projection",
  "units",
  "resolution_m",
  "timestamp_utc",
  "verification_status",
] as const;

export function validateLayerMetadata(obj: unknown) {
  const o = (obj ?? {}) as Record<string, unknown>;
  const missing = REQUIRED_LAYER_PROVENANCE.filter(
    (k) => o[k] === undefined || o[k] === null || o[k] === "",
  );
  const proj = String(o.projection ?? "").toLowerCase();
  const warnings: string[] = [];
  if (proj.includes("4326") || proj.includes("wgs84") || proj.includes("3857"))
    warnings.push("Earth CRS detected (WGS84/Web Mercator). Lunar data needs a Moon CRS, e.g. IAU_2015:30135 polar stereographic.");
  return { ok: missing.length === 0 && warnings.length === 0, missing, warnings };
}
