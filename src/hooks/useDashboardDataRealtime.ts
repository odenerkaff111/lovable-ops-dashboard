import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from "date-fns";

export type PeriodFilter = "today" | "week" | "month" | "custom";

interface ActivityMetrics {
  user_id: string;
  action_type: string;
  count: number;
}

interface Appointment {
  id: string;
  lead_id: string;
  lead_name: string;
  assigned_user_id: string;
  scheduled_date: string;
  status: "pendente" | "no_show" | "venda_realizada" | "venda_nao_realizada";
  created_at: string;
}

interface UserProfile {
  id: string;
  full_name: string;
  role: string;
  active: boolean;
}

interface DailyGoal {
  id: string;
  user_id: string;
  task_type_id: string;
  goal_value: number;
  goal_date: string;
}

interface TaskType {
  id: string;
  name: string;
  description?: string;
}

/**
 * Hook para carregar dados do dashboard com suporte a tempo real
 * Usa Supabase subscriptions para atualizar em tempo real
 */
export function useDashboardDataRealtime(
  period: PeriodFilter,
  customRange?: { start: Date; end: Date }
) {
  const [activities, setActivities] = useState<ActivityMetrics[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [goals, setGoals] = useState<DailyGoal[]>([]);
  const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getDateRange = useCallback(() => {
    const now = new Date();
    switch (period) {
      case "today":
        return { start: startOfDay(now), end: endOfDay(now) };
      case "week":
        return {
          start: startOfWeek(now, { weekStartsOn: 1 }),
          end: endOfWeek(now, { weekStartsOn: 1 }),
        };
      case "month":
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case "custom":
        return customRange ?? { start: startOfDay(now), end: endOfDay(now) };
    }
  }, [period, customRange]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { start, end } = getDateRange();

      // Fetch activity logs
      const { data: activityData, error: actError } = await supabase
        .from("activity_logs")
        .select("user_id, action_type")
        .gte("timestamp", start.toISOString())
        .lte("timestamp", end.toISOString());

      if (actError) throw actError;

      // Agregar atividades por usuário e tipo
      const activityMap = new Map<string, number>();
      (activityData || []).forEach((log: any) => {
        const key = `${log.user_id}::${log.action_type}`;
        activityMap.set(key, (activityMap.get(key) || 0) + 1);
      });

      const aggregatedActivities: ActivityMetrics[] = [];
      activityMap.forEach((count, key) => {
        const [user_id, action_type] = key.split("::");
        aggregatedActivities.push({ user_id, action_type, count });
      });

      setActivities(aggregatedActivities);

      // Fetch outros dados
      const [appointmentsRes, profilesRes, goalsRes, taskTypesRes] = await Promise.all([
        supabase
          .from("appointments")
          .select("*")
          .gte("scheduled_date", start.toISOString())
          .lte("scheduled_date", end.toISOString()),
        supabase.from("profiles").select("*").eq("active", true),
        supabase
          .from("daily_goals")
          .select("*")
          .gte("goal_date", start.toISOString().split("T")[0])
          .lte("goal_date", end.toISOString().split("T")[0]),
        supabase.from("task_types").select("*"),
      ]);

      setAppointments((appointmentsRes.data as Appointment[]) || []);
      setProfiles((profilesRes.data as UserProfile[]) || []);
      setGoals((goalsRes.data as DailyGoal[]) || []);
      setTaskTypes((taskTypesRes.data as TaskType[]) || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar dados");
      console.error("Erro em useDashboardDataRealtime:", err);
    } finally {
      setLoading(false);
    }
  }, [getDateRange]);

  // Carregar dados inicialmente
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Subscrever a atualizações em tempo real
  useEffect(() => {
    const subscriptions = [
      supabase
        .channel("activity_logs_changes")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "activity_logs" },
          () => {
            fetchData();
          }
        )
        .subscribe(),

      supabase
        .channel("appointments_changes")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "appointments" },
          () => {
            fetchData();
          }
        )
        .subscribe(),
    ];

    return () => {
      subscriptions.forEach((sub) => {
        supabase.removeChannel(sub);
      });
    };
  }, [fetchData]);

  return {
    activities,
    appointments,
    profiles,
    goals,
    taskTypes,
    loading,
    error,
    refetch: fetchData,
  };
}
