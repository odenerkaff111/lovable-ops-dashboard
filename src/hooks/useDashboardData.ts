import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";

export type PeriodFilter = "today" | "week" | "month" | "custom";

interface ActivityCount {
  user_id: string;
  action_type: string;
  count: number;
}

interface Appointment {
  id: string;
  lead_id: string;
  lead_name: string;
  scheduled_date: string;
  assigned_user_id: string; // Atualizado para bater com seu banco se necessário
  status: string;
  created_at: string;
}

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  role: string; // Atualizado de user_function para role conforme seu banco
  active: boolean; // Corrigido de is_active para active
}

interface UserGoal {
  user_id: string;
  task_type_id: string;
  daily_goal: number;
}

interface TaskType {
  id: string;
  name: string;
  description: string; // Atualizado de label para description conforme seu banco
}

export function useDashboardData(period: PeriodFilter, customRange?: { start: Date; end: Date }) {
  const [activities, setActivities] = useState<ActivityCount[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [goals, setGoals] = useState<UserGoal[]>([]);
  const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);
  const [loading, setLoading] = useState(true);

  const getDateRange = useCallback(() => {
    const now = new Date();
    switch (period) {
      case "today":
        return { start: startOfDay(now), end: endOfDay(now) };
      case "week":
        return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
      case "month":
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case "custom":
        return customRange ?? { start: startOfDay(now), end: endOfDay(now) };
    }
  }, [period, customRange]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { start, end } = getDateRange();

    console.log("🚀 Iniciando busca de dados para o período:", { start: start.toISOString(), end: end.toISOString() });

    try {
      const [activitiesRes, appointmentsRes, profilesRes, goalsRes, taskTypesRes] = await Promise.all([
        supabase
          .from("activity_logs") // CORREÇÃO: Plural conforme seu banco
          .select("user_id, action_type")
          .gte("timestamp", start.toISOString()) // Ajustado de event_timestamp para timestamp se necessário
          .lte("timestamp", end.toISOString()),
        supabase.from("appointments").select("*"),
        supabase
          .from("profiles")
          .select("*")
          .eq("active", true), // CORREÇÃO: active em vez de is_active
        supabase.from("user_goals").select("*"),
        supabase.from("task_types").select("*"),
      ]);

      // Tratamento de erros no log
      if (activitiesRes.error) console.error("🚨 Erro em activity_logs:", activitiesRes.error.message);
      if (profilesRes.error) console.error("🚨 Erro em profiles:", profilesRes.error.message);

      // Contagem de atividades por usuário e tipo
      const actMap = new Map<string, number>();
      (activitiesRes.data ?? []).forEach((a: any) => {
        const key = `${a.user_id}::${a.action_type}`;
        actMap.set(key, (actMap.get(key) ?? 0) + 1);
      });

      const actCounts: ActivityCount[] = [];
      actMap.forEach((count, key) => {
        const [user_id, action_type] = key.split("::");
        actCounts.push({ user_id, action_type, count });
      });

      setActivities(actCounts);
      setAppointments((appointmentsRes.data ?? []) as Appointment[]);
      setProfiles((profilesRes.data ?? []) as Profile[]);
      setGoals((goalsRes.data ?? []) as UserGoal[]);
      setTaskTypes((taskTypesRes.data ?? []) as TaskType[]);
    } catch (err) {
      console.error("🚨 Falha catastrófica ao carregar Dashboard:", err);
    } finally {
      setLoading(false);
    }
  }, [getDateRange]);

  useEffect(() => {
    fetchData();

    // Inscrições Realtime corrigidas para os nomes novos das tabelas
    const actChannel = supabase
      .channel("activity_logs_changes")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "activity_logs" }, () => {
        fetchData();
      })
      .subscribe();

    const appChannel = supabase
      .channel("appointments_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "appointments" }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(actChannel);
      supabase.removeChannel(appChannel);
    };
  }, [fetchData]);

  return { activities, appointments, profiles, goals, taskTypes, loading, refetch: fetchData };
}