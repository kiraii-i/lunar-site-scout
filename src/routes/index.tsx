import { createFileRoute, Link } from "@tanstack/react-router";
import { Moon } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lunar Landing Site Navigator — NASA Space Apps team" },
      { name: "description", content: "Mission-planning and study-area comparison dashboard for Shackleton Crater and Malapert Massif." },
      { property: "og:title", content: "Lunar Landing Site Navigator" },
      { property: "og:description", content: "Team dashboard for lunar south-pole study areas: tasks, GIS, Sun/Earth geometry and transparent comparison." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-background bg-stars px-6">
      <div className="absolute inset-0 bg-grid opacity-60" aria-hidden />
      <div className="relative max-w-2xl text-center">
        <div className="mx-auto mb-6 grid size-14 place-items-center rounded-full border border-primary/50 bg-primary/10 text-primary shadow-glow">
          <Moon className="size-6" aria-hidden />
        </div>
        <div className="label-eyebrow">NASA Space Apps Challenge · Nov 13–14, 2026</div>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Lunar Landing Site Navigator</h1>
        <p className="mt-4 text-muted-foreground">
          Team mission control for the Shackleton Crater and Malapert Massif study areas — shared tasks,
          GIS layers, Sun/Earth geometry and a transparent, evidence-first site comparison.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Button asChild size="lg"><Link to="/dashboard">Enter mission control</Link></Button>
          <Button asChild size="lg" variant="outline"><Link to="/auth">Sign in</Link></Button>
        </div>
        <p className="mt-8 font-mono text-xs text-muted-foreground">
          No NASA measurements are shown until sourced and verified.
        </p>
      </div>
    </div>
  );
}
