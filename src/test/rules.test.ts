import { describe, expect, it } from "vitest";
import { fmtAngle, SITES, validateLayerMetadata, EXAMPLE_ANALYSIS } from "@/lib/science";
import { countdownParts, HACKATHON_START_UTC } from "@/lib/team";

describe("scientific integrity rules", () => {
  it("study-area coordinates stay null until verified", () => {
    for (const s of SITES) {
      expect(s.latitude_deg).toBeNull();
      expect(s.longitude_deg).toBeNull();
      expect(s.verification_status).toBe("pending_verification");
    }
  });
  it("null angles render as Unavailable, never 0", () => {
    expect(fmtAngle(null)).toBe("Unavailable");
    expect(fmtAngle(0)).toBe("0.00°");
  });
  it("terrain visibility is null in the example contract", () => {
    expect(EXAMPLE_ANALYSIS.sun.terrain_visible).toBeNull();
    expect(EXAMPLE_ANALYSIS.earth.terrain_visible).toBeNull();
  });
  it("rejects Earth CRS for lunar layers", () => {
    const r = validateLayerMetadata({ source: "x", coordinate_frame: "x", projection: "EPSG:4326", units: "m", resolution_m: 5, timestamp_utc: "2026-11-06T00:00:00Z", verification_status: "verified" });
    expect(r.ok).toBe(false);
  });
  it("countdown targets Nov 13, 2026 UTC", () => {
    expect(new Date(HACKATHON_START_UTC).toISOString()).toBe("2026-11-13T00:00:00.000Z");
    expect(countdownParts(HACKATHON_START_UTC, Date.UTC(2026, 10, 12, 0, 0)).days).toBe(1);
  });
});
