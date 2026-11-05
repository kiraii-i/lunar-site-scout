# Lunar Landing Site Navigator

Mission-planning and study-area comparison dashboard (Shackleton Crater, Malapert Massif) for a 3-person NASA Space Apps team (Nov 13–14, 2026).

## Working now
- Sign in (email/password with email confirmation, or Google).
- Shared task board (create/edit/delete, status, filters), stored in the Lovable Cloud database with live sync between teammates; activity feed.
- Dashboard (UTC countdown, progress, roadmap, workload), Deliverables, Team & Access, GIS Explorer scaffold, Analysis/Timeline empty states, Comparison (Pending data), Resources & Methodology.

## Inviting the other two teammates
1. Share `<app URL>/auth`.
2. Each creates an account (or uses Google) and confirms their email.
3. Each opens **Team & Access** and selects their role.
4. When all three have joined, disable new sign-ups: Lovable → More → Users → Auth settings. (Until then, anyone with the link can register and edit tasks.)

## Pending integrations
- **SPICE/Python API**: deploy FastAPI with `GET /analysis?site_id&timestamp_utc` and `GET /timeline?site_id&start_utc&end_utc` returning the schemas in `src/lib/science.ts` (CORS on), then set `VITE_SCIENCE_API_URL`.
- **GIS layers**: export lunar south-polar stereographic COG tiles (IAU 2015 lunar CRS, not WGS84) + metadata JSON; render with a custom-CRS map (e.g. OpenLayers + proj4).
- **Reference points**: study-area coordinates stay `null` until sourced and verified.
- **Terrain visibility**: stays `null` until a verified local horizon profile (GIS-03) is integrated.

## Scientific rules
UTC everywhere; unknown values are `null`, never 0; geometric visibility ≠ comms availability; Sun above ideal horizon ≠ power; no overall suitability score.

## Dev
`bun install`, `bun run dev`, tests: `bunx vitest run`.
