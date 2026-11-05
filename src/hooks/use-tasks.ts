import { useEffect } from "react";
import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Task } from "@/lib/team";

export const tasksQuery = queryOptions({
  queryKey: ["tasks"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .order("due_date", { ascending: true })
      .order("code", { ascending: true });
    if (error) throw error;
    return data as Task[];
  },
});

export const activityQuery = queryOptions({
  queryKey: ["activity"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("activity")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(15);
    if (error) throw error;
    return data;
  },
});

/** Live team sync: refetch whenever a teammate changes tasks/activity. */
export function useTeamRealtime() {
  const qc = useQueryClient();
  useEffect(() => {
    const ch = supabase
      .channel(`team-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, () =>
        qc.invalidateQueries({ queryKey: ["tasks"] }),
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "activity" }, () =>
        qc.invalidateQueries({ queryKey: ["activity"] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [qc]);
}

export function useTasks() {
  useTeamRealtime();
  return useQuery(tasksQuery);
}

async function logActivity(message: string) {
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return;
  const { data: p } = await supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle();
  await supabase
    .from("activity")
    .insert({ actor_id: user.id, actor_name: p?.display_name || user.email || "Teammate", message });
}

export type TaskInput = Omit<Task, "id" | "updated_at">;

export function useTaskMutations() {
  const qc = useQueryClient();
  const done = () => {
    qc.invalidateQueries({ queryKey: ["tasks"] });
    qc.invalidateQueries({ queryKey: ["activity"] });
  };
  const create = useMutation({
    mutationFn: async (t: TaskInput) => {
      const { error } = await supabase.from("tasks").insert(t);
      if (error) throw error;
      await logActivity(`created ${t.code || "task"} “${t.title}”`);
    },
    onSuccess: done,
  });
  const update = useMutation({
    mutationFn: async ({ id, patch, label }: { id: string; patch: Partial<TaskInput>; label: string }) => {
      const { error } = await supabase
        .from("tasks")
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      await logActivity(label);
    },
    onSuccess: done,
  });
  const remove = useMutation({
    mutationFn: async (t: Task) => {
      const { error } = await supabase.from("tasks").delete().eq("id", t.id);
      if (error) throw error;
      await logActivity(`deleted ${t.code} “${t.title}”`);
    },
    onSuccess: done,
  });
  return { create, update, remove };
}
