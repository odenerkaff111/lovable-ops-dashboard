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
  LayoutDashboard,
  MessageSquare,
  DollarSign
} from "lucide-react";
import { isToday } from "date-fns";
import Sidebar from "@/components/layout/Sidebar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const { isAdmin } = useAuth();
  const [period, setPeriod] = useState<PeriodType>("month");
  const { activities, appointments, profiles, goals, taskTypes, loading } = useDashboardData(period);

  const stats = useMemo(() => {
    // Agora o totalByType pega os dados puros que o novo useDashboardData manda
    const totalByType = (type: string) =>
      activities.filter((a) => a.action_type === type).reduce((sum, a) => sum + a.count, 0);

    // ==========================================
    // 1. DADOS REAIS DO PERÍODO (Esforço isolado)
    // ==========================================
    const realLeadsCreated = totalByType("lead_criado");
    const realFirstContact = totalByType("primeiro_contato");
    const realEngaged = totalByType("lead_engajado");
    const realFollowUp = totalByType("follow_up");
    const realQualificacao = totalByType("qualificacao");

    const getGoalTotal = (taskName: string) => {
      const taskType = taskTypes.find(t => t.name === taskName);
      if (!taskType) return 0;
      return goals
        .filter(g => g.task_type_id === taskType.id)
        .reduce((sum, g) => sum + (g.period_goal || g.daily_goal), 0);
    };

    const goalLeads = getGoalTotal("lead_criado");
    const goalEngaged = getGoalTotal("lead_engajado");
    const goalFollow = getGoalTotal("follow_up");

    // ==========================================
    // 2. ESTADO REAL DO FUNIL (Pipeline Acumulado)
    // ==========================================
    const totalVenda = appointments.filter(a => a.status === "venda_realizada").length;
    const totalRealizada = appointments.filter(a => a.status !== "pendente").length;
    const totalAgendada = appointments.length;

    // Regra do Funil: A soma sobe em cascata para preencher as etapas visuais
    const totalQualificacaoFunnel = realQualificacao + totalAgendada;
    const totalEngajadoFunnel = realEngaged + totalQualificacaoFunnel;
    const totalPrimeiroContatoFunnel = realFirstContact + totalEngajadoFunnel;
    const totalLeadsFunnel = realLeadsCreated + totalPrimeiroContatoFunnel; 

    return {
      // --- OBJETIVOS DO TIME ---
      pctLeads: goalLeads > 0 ? Math.round((realLeadsCreated / goalLeads) * 100) : 0,
      pctEngaged: goalEngaged > 0 ? Math.round((realEngaged / goalEngaged) * 100) : (totalEngajadoFunnel > 0 ? 100 : 0),
      pctFollow: goalFollow > 0 ? Math.round((realFollowUp / goalFollow) * 100) : 0,

      // --- VOLUME DE OPERAÇÃO ---
      totalLeadsTrabalhados: totalLeadsFunnel, // Total em andamento (Cascata)
      totalFirstContactReal: realFirstContact, // Volume puro de contatos
      totalEngagedReal: realEngaged, // Volume puro de engajados
      totalAgendado: totalAgendada,

      // --- DADOS RESTAURADOS: CONVERSÃO E CALLS ---
      todayCallsScheduled: appointments.filter((a) => isToday(new Date(a.scheduled_date))).length,
      callsDone: totalRealizada,
      noShowRate: totalRealizada > 0 ? Math.round((appointments.filter(a => a.status === "no_show").length / totalRealizada) * 100) : 0,
      conversionRate: totalRealizada > 0 ? Math.round((totalVenda / totalRealizada) * 100) : 0,

      // --- FUNIL LATERAL ---
      funnelData: {
        leads: totalLeadsFunnel,
        primeiroContato: totalPrimeiroContatoFunnel,
        engajada: totalEngajadoFunnel,
        qualificacao: totalQualificacaoFunnel,
        agendada: totalAgendada,
        realizada: totalRealizada,
        venda: totalVenda
      }
    };
  }, [activities, appointments, goals, taskTypes]);

  const userPerformances = useMemo(() => {
    return profiles.filter(p => p.active === true).map((p) => {
      const userGoals = goals.filter((g) => g.user_id === p.id);
      const tasks = userGoals.map((g) => {
        const tt = taskTypes.find((t) => t.id === g.task_type_id);
        const act = activities.find((a) => a.user_id === p.id && a.action_type === tt?.name);

        let label = tt?.name || "?";
        if (label === 'lead_criado') label = 'Criação';
        if (label === 'primeiro_contato') label = '1º Contato';
        if (label === 'lead_engajado') label = 'Engajamento';
        if (label === 'follow_up') label = 'Follow';

        return {
          label,
          current: act?.count ?? 0,
          goal: g.period_goal || g.daily_goal,
        };
      }).filter(task => task.goal > 0);
      return { profile: p, tasks };
    }).filter(u => u.tasks.length > 0);
  }, [profiles, goals, taskTypes, activities]);

  const profileMap = useMemo(() => {
    const map = new Map<string, string>();
    profiles.forEach((p) => map.set(p.id, p.full_name));
    return map;
  }, [profiles]);

  if (loading) return <div className="flex h-screen items-center justify-center font-display animate-pulse text-primary italic text-xl text-foreground">Sincronizando Comando Central...</div>;

  return (
    <div className="flex h-screen bg-background overflow-hidden text-foreground">
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
            {/* OBJETIVOS DO TIME */}
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
                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                      <div className={`h-full transition-all duration-1000 ${m.bar}`} style={{ width: `${Math.min(m.pct, 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* VOLUME DE OPERAÇÃO */}
            <section className="space-y-4">
              <h2 className="font-display font-bold text-sm uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <BarChart3 className="w-4 h-4" /> Volume de Operação
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Leads Totais" value={stats.totalLeadsTrabalhados} icon={Users} />
                <StatCard label="1º Contato" value={stats.totalFirstContactReal} icon={MessageSquare} />
                <StatCard label="Engajados" value={stats.totalEngagedReal} icon={Target} />
                <StatCard label="Agendado" value={stats.totalAgendado} icon={CalendarCheck} />
              </div>
            </section>

            {/* PERFORMANCE POR GUERREIRO */}
            <section className="space-y-4">
              <h2 className="font-display font-bold text-sm uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Award className="w-4 h-4" /> Performance por Guerreiro
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {userPerformances.map(({ profile: p, tasks }) => (
                  <div key={p.id} className="glass-card p-6 border-border/40 hover:border-primary/30 transition-all group shadow-xl relative overflow-hidden">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                        <span className="text-primary font-black text-lg">{p.full_name?.charAt(0).toUpperCase()}</span>
                      </div>
                      <div>
                        <h3 className="font-display font-bold">{p.full_name}</h3>
                        <Badge variant="outline" className="text-[10px] h-4 uppercase">{p.role || "Membro"}</Badge>
                      </div>
                    </div>
                    <div className="space-y-5">
                      {tasks.map((task) => (
                        <div key={task.label} className="space-y-2">
                          <div className="flex justify-between items-end">
                            <span className="text-[11px] font-bold text-muted-foreground uppercase">{task.label}</span>
                            <span className="text-xs font-black">{task.current} / {task.goal}</span>
                          </div>
                          <div className="h-2 w-full bg-secondary/50 rounded-full overflow-hidden">
                            <div className={cn("h-full transition-all duration-1000", (task.current / task.goal) >= 1 ? "bg-emerald-500" : "bg-primary")} style={{ width: `${Math.min((task.current / task.goal) * 100, 100)}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* SEÇÃO RESTAURADA: CONVERSÃO E CALLS */}
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

            {/* SEÇÃO RESTAURADA: PRÓXIMAS CALLS AGENDADAS */}
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
