import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  startOfDay, endOfDay, 
  startOfWeek, endOfWeek, 
  startOfMonth, endOfMonth, 
  startOfYear, endOfYear, 
  differenceInDays, format, eachDayOfInterval, eachMonthOfInterval 
} from "date-fns";

export type PeriodFilter = "today" | "week" | "month" | "year" | "custom";

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
  revenue_received?: number;
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

export interface CompanyGoals {
  revenue_goal: number;
  sales_goal: number;
  daily_appointments_goal: number;
  daily_conversations_goal: number;
}

// Novos tipos para os gráficos avançados
export interface DailyHistory {
  date: string;
  tentativas: number;
  respostas: number;
}

export interface AnnualSummary {
  month: string;
  leads: number;
  vendas: number;
  faturamento: number;
}

export function useDashboardData(period: PeriodFilter, customRange?: { start: Date; end: Date }) {
  const [activities, setActivities] = useState<ActivityCount[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [goals, setGoals] = useState<UserGoal[]>([]);
  const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);
  const [dailyHistory, setDailyHistory] = useState<DailyHistory[]>([]);
  const [annualSummary, setAnnualSummary] = useState<AnnualSummary[]>([]);
  const [leadOrigins, setLeadOrigins] = useState<{label: string, value: number, color: string}[]>([]);

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
      case "year":
        return { start: startOfYear(now), end: endOfYear(now) };
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
    
    // Datas para o Resumo Anual (Janeiro a Dezembro)
    const yearStart = startOfYear(new Date());
    const yearEnd = endOfYear(new Date());

    try {
      const [
        activitiesRes,
        appointmentsRes,
        profilesRes,
        goalsRes,
        taskTypesRes,
        companyGoalsRes,
        annualActivitiesRes,
        annualAppointmentsRes
      ] = await Promise.all([
        supabase.from("activity_logs").select("user_id, action_type, timestamp").gte("timestamp", start.toISOString()).lte("timestamp", end.toISOString()),
        supabase.from("appointments").select("*").gte("scheduled_date", start.toISOString()).lte("scheduled_date", end.toISOString()),
        supabase.from("profiles").select("*").eq("active", true),
        supabase.from("user_goals").select("*"),
        supabase.from("task_types").select("*"),
        supabase.from("company_goals").select("*").limit(1).maybeSingle(),
        // Queries para o Resumo Anual
        supabase.from("activity_logs").select("action_type, timestamp").eq("action_type", "lead_criado").gte("timestamp", yearStart.toISOString()).lte("timestamp", yearEnd.toISOString()),
        supabase.from("appointments").select("status, revenue_received, scheduled_date").gte("scheduled_date", yearStart.toISOString()).lte("scheduled_date", yearEnd.toISOString())
      ]);

      if (activitiesRes.error) throw activitiesRes.error;

      // 1. Processar Metas Globais
      if (companyGoalsRes.data) {
        setCompanyGoals({
          revenue_goal: Number(companyGoalsRes.data.revenue_goal) || 50000,
          sales_goal: Number(companyGoalsRes.data.sales_goal) || 4,
          daily_appointments_goal: Number(companyGoalsRes.data.daily_appointments_goal) || 1,
          daily_conversations_goal: Number(companyGoalsRes.data.daily_conversations_goal) || 10
        });
      }

      // 2. Processar Atividades do Período e Histórico Diário (Combo Chart)
      const rawActivities = activitiesRes.data ?? [];
      const daysInterval = eachDayOfInterval({ start, end });
      const historyMap = new Map<string, {tentativas: number, respostas: number}>();
      
      daysInterval.forEach(day => {
        historyMap.set(format(day, "yyyy-MM-dd"), { tentativas: 0, respostas: 0 });
      });

      const userStats = new Map<string, Record<string, number>>();
      (profilesRes.data ?? []).forEach(p => {
        userStats.set(p.id, { venda_realizada: 0, qualificacao: 0, lead_engajado: 0, primeiro_contato: 0, lead_criado: 0, follow_up: 0, abordagem: 0, respostas: 0 });
      });

      rawActivities.forEach(act => {
        const dateKey = format(new Date(act.timestamp), "yyyy-MM-dd");
        
        // Alimentar Gráfico de Combinação
        if (historyMap.has(dateKey)) {
          const dayData = historyMap.get(dateKey)!;
          if (act.action_type === 'abordagem' || act.action_type === 'follow_up') dayData.tentativas++;
          if (act.action_type === 'respostas') dayData.respostas++;
        }

        // Alimentar Stats por Usuário
        if (userStats.has(act.user_id)) {
          const stats = userStats.get(act.user_id)!;
          if (stats[act.action_type] !== undefined) stats[act.action_type]++;
        }
      });

      setDailyHistory(Array.from(historyMap.entries()).map(([date, data]) => ({
        date: format(new Date(date), "dd/MM"),
        ...data
      })));

      // 3. Processar Appointments e Vendas
      const rawAppointments = (appointmentsRes.data ?? []) as Appointment[];
      rawAppointments.forEach(app => {
        if (app.status === "venda_realizada" && userStats.has(app.user_id)) {
          userStats.get(app.user_id)!.venda_realizada++;
        }
      });

      // 4. Processar Resumo Anual (Bônus Quadro Horizontal)
      const monthsInterval = eachMonthOfInterval({ start: yearStart, end: yearEnd });
      const annualMap = new Map<string, AnnualSummary>();
      
      monthsInterval.forEach(m => {
        annualMap.set(format(m, "MMMM"), { month: format(m, "MMM"), leads: 0, vendas: 0, faturamento: 0 });
      });

      (annualActivitiesRes.data ?? []).forEach(act => {
        const mKey = format(new Date(act.timestamp), "MMMM");
        if (annualMap.has(mKey)) annualMap.get(mKey)!.leads++;
      });

      (annualAppointmentsRes.data ?? []).forEach(app => {
        const mKey = format(new Date(app.scheduled_date), "MMMM");
        if (annualMap.has(mKey)) {
          const entry = annualMap.get(mKey)!;
          if (app.status === "venda_realizada") {
            entry.vendas++;
            entry.faturamento += (Number(app.revenue_received) || 0);
          }
        }
      });
      setAnnualSummary(Array.from(annualMap.values()));

      // 5. Mock de Origens (Para ser integrado com a tabela origin_id no futuro)
      setLeadOrigins([
        { label: "Instagram", value: 43, color: "#E1306C" },
        { label: "WhatsApp", value: 30, color: "#25D366" },
        { label: "Indicação", value: 16, color: "#4A90E2" },
        { label: "Site/Orgânico", value: 11, color: "#F5A623" }
      ]);

      // Finalização
      const realCounts: ActivityCount[] = [];
      userStats.forEach((stats, userId) => {
        Object.entries(stats).forEach(([action, count]) => {
          realCounts.push({ user_id: userId, action_type: action, count });
        });
      });

      setActivities(realCounts);
      setAppointments(rawAppointments);
      setProfiles((profilesRes.data ?? []) as Profile[]);
      setGoals((goalsRes.data ?? []).map((g: any) => ({ ...g, period_goal: g.daily_goal * daysInPeriod })) as UserGoal[]);
      setTaskTypes((taskTypesRes.data ?? []) as TaskType[]);

    } catch (err: any) {
      console.error("🚨 Erro ao carregar Dashboard:", err.message);
    } finally {
      setLoading(false);
    }
  }, [getDateRange]);

  useEffect(() => {
    fetchData();
    const channels = [
      supabase.channel("act").on("postgres_changes", { event: "INSERT", schema: "public", table: "activity_logs" }, () => fetchData()).subscribe(),
      supabase.channel("goals").on("postgres_changes", { event: "*", schema: "public", table: "company_goals" }, () => fetchData()).subscribe(),
      supabase.channel("apps").on("postgres_changes", { event: "*", schema: "public", table: "appointments" }, () => fetchData()).subscribe()
    ];
    return () => { channels.forEach(c => supabase.removeChannel(c)); };
  }, [fetchData]);

  return { activities, appointments, profiles, goals, taskTypes, companyGoals, dailyHistory, annualSummary, leadOrigins, loading, refetch: fetchData };
}
