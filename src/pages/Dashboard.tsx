import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useDashboardData, PeriodFilter as PeriodType } from "@/hooks/useDashboardData";
import { PeriodFilter } from "@/components/dashboard/PeriodFilter";
import { StatCard } from "@/components/dashboard/StatCard";
import AppointmentCardInteractive from "@/components/dashboard/AppointmentCardInteractive";
import SalesFunnel from "@/components/dashboard/SalesFunnel";
import { 
  Users, 
  Target, 
  Phone, 
  PhoneOff, 
  TrendingUp, 
  CalendarCheck, 
  BarChart3, 
  Rocket,
  Award,
  LayoutDashboard
} from "lucide-react";
import { isToday } from "date-fns";
import Sidebar from "@/components/layout/Sidebar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const { isAdmin } = useAuth();
  const [period, setPeriod] = useState<PeriodType>("month");
  const { activities, appointments, profiles, goals, taskTypes, loading } = useDashboardData(period);

  const periodMultiplier = useMemo(() => {
    if (period === "week") return 7;
    if (period === "month") return 30;
    return 1;
  }, [period]);

  const stats = useMemo(() => {
    const totalByType = (type: string) =>
      activities.filter((a) => a.action_type === type).reduce((sum, a) => sum + a.count, 0);

    const totalLeads = totalByType("lead_criado");
    const totalEngaged = totalByType("lead_engajado");
    const totalFollowUp = totalByType("follow_up");
    const totalQualificacao = totalByType("qualificacao");

    const getGoalTotal = (taskName: string) => {
      const taskType = taskTypes.find(t => t.name === taskName);
      if (!taskType) return 0;
      const sumDailyGoals = goals.filter(g => g.task_type_id === taskType.id).reduce((sum, g) => sum + g.daily_goal, 0);
      return sumDailyGoals * periodMultiplier;
    };

    const goalLeads = getGoalTotal("lead_criado");
    const goalEngaged = getGoalTotal("lead_engajado");
    const goalFollow = getGoalTotal("follow_up");

    const doneAppointments = appointments.filter((a) => a.status !== "pendente");
    const noShows = appointments.filter((a) => a.status === "no_show");
    const sales = appointments.filter((a) => a.status === "venda_realizada");

    return {
      totalLeads, 
      pctLeads: goalLeads > 0 ? Math.round((totalLeads / goalLeads) * 100) : 0,
      totalEngaged, 
      pctEngaged: goalEngaged > 0 ? Math.round((totalEngaged / goalEngaged) * 100) : 0,
      totalFollowUp, 
      pctFollow: goalFollow > 0 ? Math.round((totalFollowUp / goalFollow) * 100) : 0,
      totalQualificacao,
      todayCallsScheduled: appointments.filter((a) => isToday(new Date(a.scheduled_date))).length,
      callsDone: doneAppointments.length,
      pendingAppointments: appointments.filter((a) => a.status === "pendente").length,
      noShowRate: doneAppointments.length > 0 ? Math.round((noShows.length / doneAppointments.length) * 100) : 0,
      conversionRate: doneAppointments.length > 0 ? Math.round((sales.length / doneAppointments.length) * 100) : 0,
      funnelData: {
        leads: totalLeads,
        preCall: totalEngaged,
        qualificacao: totalQualificacao,
        agendada: appointments.length,
        realizada: doneAppointments.length,
        venda: sales.length
      }
    };
  }, [activities, appointments, goals, taskTypes, periodMultiplier]);

  const userPerformances = useMemo(() => {
    return profiles
      .filter(p => p.active === true)
      .map((p) => {
        const userGoals = goals.filter((g) => g.user_id === p.id);
        const tasks = userGoals.map((g) => {
          const tt = taskTypes.find((t) => t.id === g.task_type_id);
          const act = activities.find((a) => a.user_id === p.id && a.action_type === tt?.name);
          
          let label = tt?.name || "?";
          if (label === 'lead_criado') label = 'Criação';
          if (label === 'lead_engajado') label = 'Engajamento';
          if (label === 'follow_up') label = 'Follow';

          return {
            label,
            current: act?.count ?? 0,
            goal: (g.daily_goal || 0) * periodMultiplier,
          };
        }).filter(task => task.goal > 0);
        
        return { profile: p, tasks };
      }).filter(u => u.tasks.length > 0);
  }, [profiles, goals, taskTypes, activities, periodMultiplier]);

  const profileMap = useMemo(() => {
    const map = new Map<string, string>();
    profiles.forEach((p) => map.set(p.id, p.full_name));
    return map;
  }, [profiles]);

  if (loading) return <div className="flex h-screen items-center justify-center font-display animate-pulse text-primary italic">Sincronizando Comando Central...</div>;

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <header className="border-b border-border/40 bg-card/50 backdrop-blur-md sticky top-0 z-50 p-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <h1 className="font-display font-bold text-xl uppercase tracking-tighter flex items-center gap-2">
               <LayoutDashboard className="w-5 h-5 text-primary" /> Comando Central
            </h1>
            <PeriodFilter value={period} onChange={setPeriod} />
          </div>
        </header>

        <div className="max-w-7xl mx-auto p-6 flex flex-col lg:flex-row gap-8">
          
          <aside className="w-full lg:w-[280px] shrink-0">
            <SalesFunnel data={stats.funnelData} />
          </aside>

          <div className="flex-1 space-y-10">
            
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <Rocket className="w-5 h-5" />
                <h2 className="font-display font-bold text-sm uppercase tracking-widest">Objetivos do Time</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { label: "Criação de Leads", pct: stats.pctLeads, color: "text-blue-500", bar: "bg-blue-500" },
                  { label: "Engajamento", pct: stats.pctEngaged, color: "text-emerald-500", bar: "bg-emerald-500" },
                  { label: "Follow Ups", pct: stats.pctFollow, color: "text-amber-500", bar: "bg-amber-500" }
                ].map((m) => (
                  <div key={m.label} className="glass-card p-6 border-l-4 border-l-primary flex flex-col justify-between shadow-xl group hover:scale-[1.02] transition-transform">
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-xs font-bold text-muted-foreground uppercase">{m.label}</span>
                      <span className={`text-2xl font-black ${m.color}`}>{m.pct}%</span>
                    </div>
                    <div className="space-y-2">
                      <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-1000 ${m.bar} shadow-[0_0_10px_rgba(0,0,0,0.1)]`} 
                          style={{ width: `${Math.min(m.pct, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="font-display font-bold text-sm uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <BarChart3 className="w-4 h-4" /> Volume de Operação
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Leads Criados" value={stats.totalLeads} icon={Users} />
                <StatCard label="Leads Engajados" value={stats.totalEngaged} icon={Target} />
                <StatCard label="Follow Ups" value={stats.totalFollowUp} icon={TrendingUp} />
                <StatCard label="Agendado" value={stats.pendingAppointments} icon={CalendarCheck} />
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="font-display font-bold text-sm uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Award className="w-4 h-4" /> Performance do Time
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {userPerformances.map(({ profile: p, tasks }) => (
                  <div key={p.id} className="glass-card p-6 border-border/40 hover:border-primary/30 transition-all group shadow-xl relative overflow-hidden">
                    {p.role?.toLowerCase() === 'admin' && (
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-primary shadow-[2px_0_10px_rgba(var(--primary),0.3)]" />
                    )}
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shadow-inner">
                          <span className="text-primary font-black text-lg">
                            {p.full_name ? p.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : "UN"}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-display font-bold text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
                            {p.full_name}
                            {p.role?.toLowerCase() === 'admin' && <Rocket className="w-3.5 h-3.5 text-primary animate-pulse" />}
                          </h3>
                          <Badge variant="outline" className="text-[10px] h-4 uppercase bg-secondary/30 border-none text-muted-foreground font-bold">
                            {p.role || "Membro"}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-tighter">Em Operação</span>
                      </div>
                    </div>
                    <div className="space-y-5">
                      {tasks.map((task) => {
                        const taskPct = Math.round((task.current / task.goal) * 100);
                        return (
                          <div key={task.label} className="space-y-2">
                            <div className="flex justify-between items-end">
                              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-tight">{task.label}</span>
                              <span className="text-xs font-black text-foreground">
                                {task.current} <span className="text-muted-foreground font-medium">/ {task.goal}</span>
                              </span>
                            </div>
                            <div className="relative h-2 w-full bg-secondary/50 rounded-full overflow-hidden">
                              <div 
                                className={cn(
                                  "h-full rounded-full transition-all duration-1000 ease-out",
                                  taskPct >= 100 ? "bg-emerald-500" : "bg-primary"
                                )}
                                style={{ width: `${Math.min(taskPct, 100)}%` }}
                              />
                            </div>
                            <div className="flex justify-between items-center">
                               <span className="text-[9px] text-muted-foreground italic font-medium">
                                  {taskPct >= 100 ? "Meta atingida! 🏆" : `${Math.max(0, task.goal - task.current)} para o objetivo`}
                               </span>
                               <span className={cn(
                                 "text-[10px] font-black px-2 py-0.5 rounded",
                                 taskPct >= 100 ? "text-white bg-emerald-500" : "text-primary bg-primary/10"
                               )}>
                                 {taskPct}%
                               </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="font-display font-bold text-sm uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Phone className="w-4 h-4" /> Conversão e Calls
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Conversão Venda" value={`${stats.conversionRate}%`} icon={TrendingUp} variant="success" />
                <StatCard label="Taxa No Show" value={`${stats.noShowRate}%`} icon={PhoneOff} variant={stats.noShowRate > 25 ? "danger" : "default"} />
                <StatCard label="Calls Hoje" value={stats.todayCallsScheduled} icon={Phone} />
                <StatCard label="Realizadas" value={stats.callsDone} icon={Phone} variant="success" />
              </div>
            </section>

            <section className="space-y-4 pb-12">
              <h2 className="font-display font-bold text-sm uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <CalendarCheck className="w-4 h-4" /> Próximas Calls
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {appointments.slice(0, 6).map((apt) => (
                  <AppointmentCardInteractive
                    key={apt.id}
                    id={apt.id}
                    leadName={apt.lead_name}
                    scheduledDate={apt.scheduled_date}
                    responsibleName={profileMap.get(apt.user_id) || "Pendente"}
                    status={apt.status}
                  />
                ))}
                {appointments.length === 0 && <p className="text-xs text-muted-foreground italic col-span-full text-center py-8 glass-card">Nenhuma call registrada.</p>}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}