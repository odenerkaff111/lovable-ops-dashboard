import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useDashboardData, PeriodFilter as PeriodType } from "@/hooks/useDashboardData";
import { PeriodFilter } from "@/components/dashboard/PeriodFilter";
import { StatCard } from "@/components/dashboard/StatCard";
import AppointmentCardInteractive from "@/components/dashboard/AppointmentCardInteractive";
import SalesFunnel from "@/components/dashboard/SalesFunnel";
import { LeadOriginChart, ProspectingComboChart, AnnualSummaryChart } from "@/components/dashboard/Charts";
import {
  Target,
  Phone,
  PhoneOff,
  TrendingUp,
  LayoutDashboard,
  DollarSign
} from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import { cn } from "@/lib/utils";

const ptMonths = ['Jan', 'Fev', 'Mar', 'Abr', 'Maio', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export default function Dashboard() {
  const { isAdmin } = useAuth();
  const [period, setPeriod] = useState<PeriodType>("month");

  const { activities, appointments, profiles, goals, taskTypes, companyGoals, dailyHistory, annualSummary, leadOrigins, loading } = useDashboardData(period);

  const stats = useMemo(() => {
    const totalByType = (type: string) =>
      activities.filter((a) => a.action_type === type).reduce((sum, a) => sum + a.count, 0);

    const realLeadsCreated = totalByType("lead_criado");
    const realFirstContact = totalByType("primeiro_contato");
    const realRespostas = totalByType("respostas");
    const realEngaged = totalByType("lead_engajado");
    const realFollowUp = totalByType("follow_up");
    const realAbordagem = totalByType("abordagem");
    const realQualificacao = totalByType("qualificacao");

    const totalVenda = appointments.filter(a => a.status === "venda_realizada").length;
    const totalRealizada = appointments.filter(a => a.status !== "pendente").length;
    const totalAgendada = appointments.length;

    const totalRevenue = appointments
      .filter(a => a.status === "venda_realizada")
      .reduce((sum, a) => sum + (Number(a.revenue_received) || 0), 0);

    const totalQualificacaoFunnel = realQualificacao + totalAgendada;
    const totalEngajadoFunnel = realEngaged + totalQualificacaoFunnel;
    const totalRespostasFunnel = realRespostas + totalEngajadoFunnel;
    const totalPrimeiroContatoFunnel = realFirstContact + totalRespostasFunnel;
    const totalLeadsFunnel = realLeadsCreated + totalPrimeiroContatoFunnel;

    const safeCompanyGoals = companyGoals || { revenue_goal: 50000, sales_goal: 4, daily_appointments_goal: 1, daily_conversations_goal: 10 };

    let daysMultiplier = 30;
    if (period === "today") daysMultiplier = 1;
    if (period === "week") daysMultiplier = 7;
    if (period === "year") daysMultiplier = 365;

    const formatCurrency = (val: number) =>
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);

    const businessMetrics = [
      { label: "Faturamento", current: formatCurrency(totalRevenue), goal: formatCurrency(safeCompanyGoals.revenue_goal), pct: safeCompanyGoals.revenue_goal > 0 ? Math.round((totalRevenue / safeCompanyGoals.revenue_goal) * 100) : 0, color: "text-emerald-600", bar: "bg-emerald-500" },
      { label: "Vendas (Mês)", current: totalVenda.toString(), goal: safeCompanyGoals.sales_goal.toString(), pct: safeCompanyGoals.sales_goal > 0 ? Math.round((totalVenda / safeCompanyGoals.sales_goal) * 100) : 0, color: "text-blue-600", bar: "bg-blue-500" },
      { label: "Agendamentos", current: totalAgendada.toString(), goal: (safeCompanyGoals.daily_appointments_goal * daysMultiplier).toString(), pct: (safeCompanyGoals.daily_appointments_goal * daysMultiplier) > 0 ? Math.round((totalAgendada / (safeCompanyGoals.daily_appointments_goal * daysMultiplier)) * 100) : 0, color: "text-purple-600", bar: "bg-purple-500" },
      { label: "Oportunidades", current: realEngaged.toString(), goal: (safeCompanyGoals.daily_conversations_goal * daysMultiplier).toString(), pct: (safeCompanyGoals.daily_conversations_goal * daysMultiplier) > 0 ? Math.round((realEngaged / (safeCompanyGoals.daily_conversations_goal * daysMultiplier)) * 100) : 0, color: "text-amber-500", bar: "bg-amber-500" }
    ];

    const mockInvestimento = 2000;
    const cpl = realLeadsCreated > 0 ? mockInvestimento / realLeadsCreated : 0;
    const cpa = totalAgendada > 0 ? mockInvestimento / totalAgendada : 0;
    const cac = totalVenda > 0 ? mockInvestimento / totalVenda : 0;
    const ticketMedio = totalVenda > 0 ? totalRevenue / totalVenda : 0;

    const financialMetrics = [
      { label: "CPL (Custo por Lead)", current: formatCurrency(cpl) },
      { label: "CPA (Custo p/ Agendar)", current: formatCurrency(cpa) },
      { label: "CAC (Custo de Aquisição)", current: formatCurrency(cac) },
      { label: "Ticket Médio (TM)", current: formatCurrency(ticketMedio) }
    ];

    const taxaAgendamento = realLeadsCreated > 0 ? Math.round((totalAgendada / realLeadsCreated) * 100) : 0;
    const conversaoCall = totalRealizada > 0 ? Math.round((totalVenda / totalRealizada) * 100) : 0;
    const conversaoVendaGeral = realLeadsCreated > 0 ? Math.round((totalVenda / realLeadsCreated) * 100) : 0;

    return {
      businessMetrics,
      financialMetrics,
      tentativasConversa: realAbordagem + realFollowUp,
      conversasGeradas: realRespostas,
      taxaAgendamento,
      conversaoCall,
      conversaoVendaGeral,
      noShowRate: totalRealizada > 0 ? Math.round((appointments.filter(a => a.status === "no_show").length / totalRealizada) * 100) : 0,
      funnelData: {
        leads: totalLeadsFunnel,
        contatoFeito: totalPrimeiroContatoFunnel,
        respostas: totalRespostasFunnel,
        engajada: totalEngajadoFunnel,
        qualificacao: totalQualificacaoFunnel,
        agendada: totalAgendada,
        realizada: totalRealizada,
        venda: totalVenda
      }
    };
  }, [activities, appointments, goals, taskTypes, companyGoals, period]);

  const profileMap = useMemo(() => {
    const map = new Map<string, string>();
    profiles.forEach((p) => map.set(p.id, p.full_name));
    return map;
  }, [profiles]);

  const userPerformances = useMemo(() => {
    return profiles.filter(p => p.active === true).map((p) => {
      const userGoals = goals.filter((g) => g.user_id === p.id);
      const tasks = userGoals.map((g) => {
        const tt = taskTypes.find((t) => t.id === g.task_type_id);
        const act = activities.find((a) => a.user_id === p.id && a.action_type === tt?.name);
        let label = tt?.name || "?";
        if (label === 'lead_criado') label = 'Criação';
        if (label === 'primeiro_contato') label = '1º Contato';
        if (label === 'respostas') label = 'Respostas';
        if (label === 'lead_engajado') label = 'Engajamento';
        if (label === 'follow_up') label = 'Follow';
        if (label === 'abordagem') label = 'Abordagem';
        return { label, current: act?.count ?? 0, goal: g.period_goal || g.daily_goal };
      }).filter(task => task.goal > 0);
      return { profile: p, tasks };
    }).filter(u => u.tasks.length > 0);
  }, [profiles, goals, taskTypes, activities]);

  const formattedAnnualSummary = useMemo(() => {
    return annualSummary.map((m, index) => ({ ...m, month: ptMonths[index] || m.month }));
  }, [annualSummary]);

  if (loading) return <div className="flex h-screen items-center justify-center text-slate-500 font-medium bg-slate-50 italic">Sincronizando Kyra...</div>;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden text-slate-800 font-sans">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40 p-4 shadow-sm">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <h1 className="font-semibold text-lg text-slate-800 flex items-center gap-2">
               <LayoutDashboard className="w-5 h-5 text-slate-500" /> Comando Central
            </h1>
            <PeriodFilter value={period} onChange={setPeriod} />
          </div>
        </header>

        <div className="max-w-7xl mx-auto p-6 flex flex-col lg:flex-row gap-6">
          <aside className="w-full lg:w-[280px] shrink-0">
            <SalesFunnel data={stats.funnelData} />
          </aside>

          <div className="flex-1 space-y-6">
            
            <section className="space-y-4">
              <h2 className="text-base font-semibold text-slate-800">Metas do Comercial</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.businessMetrics.map((m) => (
                  <div key={m.label} className="bg-white p-4 rounded-md border border-gray-200 shadow-sm flex flex-col justify-between hover:border-emerald-300 transition-colors">
                    <div className="flex justify-between items-start gap-2 mb-4">
                      <div className="flex flex-col min-w-0">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">{m.label}</span>
                        <div className="mt-1 flex flex-wrap items-baseline gap-1">
                           <span className="text-base font-bold text-slate-800 whitespace-nowrap">{m.current}</span>
                           <span className="text-slate-400 text-[10px] font-medium whitespace-nowrap">/ {m.goal}</span>
                        </div>
                      </div>
                      <span className={cn("text-base font-bold shrink-0", m.color)}>{m.pct}%</span>
                    </div>
                    <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full transition-all duration-1000 ${m.bar}`} style={{ width: `${Math.min(m.pct, 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                {stats.financialMetrics.map((m) => (
                  <div key={m.label} className="bg-white p-4 rounded-md border border-gray-200 shadow-sm flex flex-col justify-center hover:border-blue-300 transition-colors">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{m.label}</span>
                    <span className="text-lg font-bold text-slate-800">{m.current}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 flex flex-col">
                <ProspectingComboChart data={dailyHistory} />
              </div>
              <div className="lg:col-span-1 flex flex-col">
                <LeadOriginChart data={leadOrigins} />
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-base font-semibold text-slate-800">Conversão e Calls</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Conversão Venda" value={`${stats.conversaoVendaGeral}%`} icon={DollarSign} subtitle="Leads que viraram Vendas" />
                <StatCard label="Conversão Call" value={`${stats.conversaoCall}%`} icon={Target} subtitle="Calls que viraram Vendas" />
                <StatCard label="Taxa Agendamento" value={`${stats.taxaAgendamento}%`} icon={TrendingUp} subtitle="Novos Leads p/ Call" />
                <StatCard label="Taxa No Show" value={`${stats.noShowRate}%`} icon={PhoneOff} subtitle="Faltas em agendamentos" />
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-base font-semibold text-slate-800">Performance da Equipe</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {userPerformances.map(({ profile: p, tasks }) => (
                  <div key={p.id} className="bg-white p-5 rounded-md border border-gray-200 shadow-sm flex flex-col hover:border-blue-200 transition-colors">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                        <span className="text-slate-600 font-bold text-sm">{p.full_name?.charAt(0).toUpperCase()}</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800 text-sm">{p.full_name}</h3>
                        <span className="text-xs text-slate-500 uppercase tracking-wider font-medium">{p.role || "Membro"}</span>
                      </div>
                    </div>
                    <div className="space-y-4">
                      {tasks.map((task) => (
                        <div key={task.label} className="space-y-1.5">
                          <div className="flex justify-between items-end">
                            <span className="text-xs font-semibold text-slate-500">{task.label}</span>
                            <span className="text-xs font-bold text-slate-700">{task.current} / {task.goal}</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div className={cn("h-full transition-all duration-1000", (task.current / task.goal) >= 1 ? "bg-emerald-500" : "bg-blue-500")} style={{ width: `${Math.min((task.current / task.goal) * 100, 100)}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-4 pb-4">
              <h2 className="text-base font-semibold text-slate-800">Próximas Calls</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {appointments.slice(0, 6).map((apt) => (
                  <AppointmentCardInteractive
                    key={apt.id} id={apt.id} leadName={apt.lead_name} scheduledDate={apt.scheduled_date} responsibleName={profileMap.get(apt.user_id) || "Pendente"} status={apt.status}
                  />
                ))}
                {appointments.length === 0 && (
                  <div className="col-span-full bg-white border border-gray-200 rounded-md p-8 text-center">
                    {/* FRASE CORRIGIDA AQUI */}
                    <p className="text-sm text-slate-500 font-medium">Nenhuma call agendada neste período.</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-6 pb-12">
          <section className="bg-white rounded-md shadow-sm overflow-hidden mt-4 border border-gray-200 p-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-800 text-center w-full mb-2">
              Resultado Anual Acumulado
            </h2>
            <AnnualSummaryChart data={formattedAnnualSummary} />
          </section>
        </div>
      </main>
    </div>
  );
}
