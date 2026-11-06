export type TeamRole = "GIS" | "PY" | "WEB" | "AI";
export type TaskStatus = "todo" | "in_progress" | "review" | "done";
export type TaskPriority = "high" | "medium" | "low";

export const ROLES: Record<TeamRole, { member: string; title: string; focus: string }> = {
  GIS: {
    member: "Member 1",
    title: "GIS & Remote Sensing Lead",
    focus:
      "Lunar GIS, coordinate systems/projections, LOLA/LROC DEMs, QGIS, hillshade/slope/aspect, local horizon profile, terrain occlusion, candidate areas, web map layers.",
  },
  PY: {
    member: "Member 2",
    title: "Python & Scientific Computing Lead",
    focus:
      "Python/NumPy/Pandas, SpiceyPy & SPICE kernels, Sun/Earth position, elevation/azimuth, geometric visibility, UTC timeline, horizon integration, JSON/API.",
  },
  AI: {
    member: "Member 4",
    title: "AI Workflow & Data Management Lead",
    focus: "AI-assisted development, prompt engineering, structured data validation, file organization, Claude, Manus handoffs, and human review of generated code.",
  },
  WEB: {
    member: "Member 3",
    title: "Web/UI/UX & Integration Lead",
    focus:
      "App UI, responsive layout, map/chart integration, Python API connection, testing, presentation and demo backup.",
  },
};

export const STATUSES: { id: TaskStatus; label: string }[] = [
  { id: "todo", label: "To Do" },
  { id: "in_progress", label: "In Progress" },
  { id: "review", label: "Review" },
  { id: "done", label: "Done" },
];

export const PRIORITIES: TaskPriority[] = ["high", "medium", "low"];

/** Hackathon kickoff (start of Nov 13, 2026, UTC). */
export const HACKATHON_START_UTC = Date.UTC(2026, 10, 13, 0, 0, 0);
export const FEATURE_FREEZE = "2026-11-12";

export interface Task {
  id: string;
  code: string;
  title: string;
  description: string;
  deliverables: string;
  owner_role: TeamRole;
  priority: TaskPriority;
  status: TaskStatus;
  due_date: string | null;
  track: string;
  source_links: string[];
  updated_at: string;
}

export function progress(tasks: Pick<Task, "status">[]) {
  if (tasks.length === 0) return 0;
  return Math.round((tasks.filter((t) => t.status === "done").length / tasks.length) * 100);
}

export function countdownParts(targetMs: number, nowMs: number) {
  const diff = Math.max(0, targetMs - nowMs);
  return {
    done: diff === 0,
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff % 86_400_000) / 3_600_000),
    minutes: Math.floor((diff % 3_600_000) / 60_000),
  };
}

export const TRACKS: Record<string, string> = {
  core: "Core work",
  learning: "Lunar Science & Site Familiarization",
};

export function sourceLabel(url: string) {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; }
}
