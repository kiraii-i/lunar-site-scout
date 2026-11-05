import { useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard, KanbanSquare, Map, Telescope, CalendarClock, Scale, BookOpen, Flag, Users, Menu, LogOut, Moon,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

const NAV = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/tasks", label: "Team Tasks", icon: KanbanSquare },
  { to: "/gis", label: "GIS Explorer", icon: Map },
  { to: "/analysis", label: "Scientific Analysis", icon: Telescope },
  { to: "/timeline", label: "Mission Timeline", icon: CalendarClock },
  { to: "/compare", label: "Site Comparison", icon: Scale },
  { to: "/deliverables", label: "Deliverables", icon: Flag },
  { to: "/resources", label: "Resources & Method", icon: BookOpen },
  { to: "/team", label: "Team & Access", icon: Users },
] as const;

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-0.5" aria-label="Main">
      {NAV.map(({ to, label, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
          activeProps={{ className: "bg-sidebar-accent text-sidebar-primary! font-medium" }}
        >
          <Icon className="size-4" aria-hidden />
          {label}
        </Link>
      ))}
    </nav>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2.5 px-3">
      <div className="grid size-8 place-items-center rounded-full border border-primary/50 bg-primary/10 text-primary">
        <Moon className="size-4" aria-hidden />
      </div>
      <div className="leading-tight">
        <div className="text-sm font-semibold">Lunar Landing</div>
        <div className="label-eyebrow">Site Navigator</div>
      </div>
    </div>
  );
}

export function AppShell({ email, children }: { email: string | null; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const navigate = useNavigate();
  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }
  const footer = (
    <div className="space-y-2 border-t border-sidebar-border p-3">
      <div className="truncate px-1 font-mono text-xs text-muted-foreground">{email}</div>
      <Button variant="ghost" size="sm" className="w-full justify-start" onClick={signOut}>
        <LogOut /> Sign out
      </Button>
    </div>
  );
  return (
    <div className="min-h-screen bg-background bg-stars">
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
        <div className="py-5"><Brand /></div>
        <div className="flex-1 overflow-y-auto px-2"><NavList /></div>
        {footer}
      </aside>
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-sidebar/90 px-4 py-3 backdrop-blur lg:hidden">
        <Brand />
        <Button variant="ghost" size="icon" aria-label="Open navigation" onClick={() => setOpen(true)}>
          <Menu />
        </Button>
      </header>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="flex w-64 flex-col bg-sidebar p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <div className="py-5"><Brand /></div>
          <div className="flex-1 px-2"><NavList onNavigate={() => setOpen(false)} /></div>
          {footer}
        </SheetContent>
      </Sheet>
      <main className="lg:pl-60">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">{children}</div>
      </main>
    </div>
  );
}

export function PageHeader({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className="label-eyebrow">{eyebrow}</div>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

export function Panel({ title, action, children, className = "" }: { title?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-lg border border-border bg-card/80 p-4 backdrop-blur sm:p-5 ${className}`}>
      {(title || action) && (
        <div className="mb-3 flex items-center justify-between gap-2">
          {title && <h2 className="label-eyebrow text-foreground/80!">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-md border border-dashed border-border bg-muted/30 p-4 text-sm">
      <div className="font-medium">{title}</div>
      {children && <div className="mt-1 text-muted-foreground">{children}</div>}
    </div>
  );
}
