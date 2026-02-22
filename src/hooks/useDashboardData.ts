import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, differenceInDays } from "date-fns";

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
  user_id: string; 
  status: "pendente" | "realizada" | "no_show" | "venda_realizada" | "venda_nao_realizada";
  created_at: string;
}

interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  active: boolean;
}

interface UserGoal {
  user_id: string;
  task_type_id: string;
  daily_goal: number;
}

interface TaskType {
  id: string;
  name: string;
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
      default:
        return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  }, [period, customRange]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { start, end } = getDateRange();

    try {
      const [activitiesRes, appointmentsRes, profilesRes, goalsRes, taskTypesRes] = await Promise.all([
        // 1. Busca ATIVIDADES (Funil e Volume): O que foi feito NESTE período
        supabase
          .from("activity_logs")
          .select("user_id, action_type")
          .gte("timestamp", start.toISOString())
          .lte("timestamp", end.toISOString()),
        
        // 2. Busca AGENDAMENTOS: O que está na agenda para este período
        supabase
          .from("appointments")
          .select("*")
          .gte("scheduled_date", start.toISOString())
          .lte("scheduled_date", end.toISOString()),

        // 3. Cadastros base
        supabase.from("profiles").select("*").eq("active", true),
        supabase.from("user_goals").select("*"),
        supabase.from("task_types").select("*"),
      ]);

      if (activitiesRes.error) throw activitiesRes.error;

      // Agrupamento para contagem (Leads, Engajamento, Qualificação, etc)
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
    } catch (err: any) {
      console.error("🚨 Erro ao carregar Dashboard:", err.message);
    } finally {
      setLoading(false);
    }
  }, [getDateRange]);

  useEffect(() => {
    fetchData();

    const actChannel = supabase
      .channel("activity_changes")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "activity_logs" }, () => fetchData())
      .subscribe();

    const appChannel = supabase
      .channel("appointment_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "appointments" }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(actChannel);
      supabase.removeChannel(appChannel);
    };
  }, [fetchData]);

  return { activities, appointments, profiles, goals, taskTypes, loading, refetch: fetchData };
}