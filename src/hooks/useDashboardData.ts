import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, differenceInDays } from "date-fns";

export type PeriodFilter = "today" | "week" | "month" | "custom";

interface ActivityCount {
  user_id: string;
  action_type: string;
  count: number;
}

export interface Appointment {
  id: string;
  lead_id: string;
  lead_name: string;
  scheduled_date: string;
  user_id: string;
  status: "pendente" | "realizada" | "no_show" | "venda_realizada" | "venda_nao_realizada";
  created_at: string;
  revenue_received?: number; // Traz o valor que entrou no caixa
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
  period_goal?: number;
}

interface TaskType {
  id: string;
  name: string;
}

// Interface para as novas Metas Globais da Empresa
export interface CompanyGoals {
  revenue_goal: number;
  sales_goal: number;
  daily_appointments_goal: number;
  daily_conversations_goal: number;
}

export function useDashboardData(period: PeriodFilter, customRange?: { start: Date; end: Date }) {
  const [activities, setActivities] = useState<ActivityCount[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [goals, setGoals] = useState<UserGoal[]>([]);
  const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);
  
  // Estado para armazenar as Metas da Empresa com valores padrão seguros
  const [companyGoals, setCompanyGoals] = useState<CompanyGoals>({
    revenue_goal: 50000,
    sales_goal: 4,
    daily_appointments_goal: 1,
    daily_conversations_goal: 10
  });
  
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
    const daysInPeriod = Math.max(1, differenceInDays(end, start) + 1);

    try {
      const [
        activitiesRes, 
        appointmentsRes, 
        profilesRes, 
        goalsRes, 
        taskTypesRes,
        companyGoalsRes // Busca as metas dinâmicas no Supabase
      ] = await Promise.all([
        supabase
          .from("activity_logs")
          .select("user_id, action_type")
          .gte("timestamp", start.toISOString())
          .lte("timestamp", end.toISOString()),
        supabase
          .from("appointments")
          .select("*")
          .gte("scheduled_date", start.toISOString())
          .lte("scheduled_date", end.toISOString()),
        supabase.from("profiles").select("*").eq("active", true),
        supabase.from("user_goals").select("*"),
        supabase.from("task_types").select("*"),
        supabase.from("company_goals").select("*").limit(1).maybeSingle()
      ]);

      if (activitiesRes.error) throw activitiesRes.error;

      // Se encontrou as metas da empresa no banco, atualiza o estado
      if (companyGoalsRes.data) {
        setCompanyGoals({
          revenue_goal: Number(companyGoalsRes.data.revenue_goal) || 50000,
          sales_goal: Number(companyGoalsRes.data.sales_goal) || 4,
          daily_appointments_goal: Number(companyGoalsRes.data.daily_appointments_goal) || 1,
          daily_conversations_goal: Number(companyGoalsRes.data.daily_conversations_goal) || 10
        });
      }

      const rawActivities = activitiesRes.data ?? [];
      const rawAppointments = (appointmentsRes.data ?? []) as Appointment[];

      // 1. Criar um mapa de contagem real por usuário e tipo
      const userStats = new Map<string, Record<string, number>>();

      // Inicializa estrutura para cada perfil ativo
      (profilesRes.data ?? []).forEach(p => {
        userStats.set(p.id, {
          venda_realizada: 0,
          qualificacao: 0,
          lead_engajado: 0,
          primeiro_contato: 0,
          lead_criado: 0,
          follow_up: 0
        });
      });

      // Contar Vendas e Atividades normalmente
      rawAppointments.forEach(app => {
        if (app.status === "venda_realizada" && userStats.has(app.user_id)) {
          userStats.get(app.user_id)!.venda_realizada++;
        }
      });

      rawActivities.forEach(act => {
        if (userStats.has(act.user_id)) {
          const stats = userStats.get(act.user_id)!;
          if (stats[act.action_type] !== undefined) {
            stats[act.action_type]++;
          } else {
            stats[act.action_type] = 1;
          }
        }
      });

      // 2. Extrair dados REAIS (Sem Cascata)
      const realCounts: ActivityCount[] = [];
      userStats.forEach((stats, userId) => {
        Object.entries(stats).forEach(([action, count]) => {
          realCounts.push({ user_id: userId, action_type: action, count });
        });
      });

      const processedGoals = (goalsRes.data ?? []).map((goal: any) => ({
        ...goal,
        period_goal: goal.daily_goal * daysInPeriod
      }));

      setActivities(realCounts);
      setAppointments(rawAppointments);
      setProfiles((profilesRes.data ?? []) as Profile[]);
      setGoals(processedGoals as UserGoal[]);
      setTaskTypes((taskTypesRes.data ?? []) as TaskType[]);
      
    } catch (err: any) {
      console.error("🚨 Erro ao carregar Dashboard:", err.message);
    } finally {
      setLoading(false);
    }
  }, [getDateRange]);

  useEffect(() => {
    fetchData();
    const actChannel = supabase.channel("activity_changes")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "activity_logs" }, () => fetchData())
      .subscribe();
      
    // Agora o canal "escuta" também a tabela de metas da empresa
    const goalsChannel = supabase.channel("company_goals_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "company_goals" }, () => fetchData())
      .subscribe();

    const appChannel = supabase.channel("appointment_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "appointments" }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(actChannel);
      supabase.removeChannel(goalsChannel);
      supabase.removeChannel(appChannel);
    };
  }, [fetchData]);

  // Retorna tudo, incluindo a nova propriedade companyGoals
  return { activities, appointments, profiles, goals, taskTypes, companyGoals, loading, refetch: fetchData };
}
