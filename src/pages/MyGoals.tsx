import { useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useDashboardData, PeriodFilter } from "@/hooks/useDashboardData";
import { GamifiedProgressBar } from "@/components/dashboard/GamifiedProgressBar";
import Sidebar from "@/components/layout/Sidebar";
import { Target, Calendar, Award, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function MyGoals() {
  const { profile } = useAuth();
  const [period, setPeriod] = useState<PeriodFilter>("today");
  const { activities, goals, taskTypes } = useDashboardData(period);

  const userGoals = useMemo(() => {
    if (!profile) return [];
    
    // Filtra as metas que pertencem ao ID do perfil logado
    return goals
      .filter((g: any) => g.user_id === profile.id)
      .map((g: any) => {
        const tt = taskTypes.find((t) => t.id === g.task_type_id);
        const act = activities.find((a) => a.user_id === profile.id && a.action_type === tt?.name);
        
        return { 
          label: tt?.description || tt?.name || "Tarefa", 
          current: act?.count || 0, 
          goal: g.daily_goal,
          name: tt?.name 
        };
      });
  }, [goals, taskTypes, activities, profile]);

  if (!profile) return null;

  return (
    <div className="flex min-h-screen bg-background overflow-hidden">
      {/* Sidebar fixa à esquerda */}
      <Sidebar />
      
      {/* Área de conteúdo que ocupa o resto da tela */}
      <main className="flex-1 overflow-y-auto bg-background/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8">
          
          {/* Header Gamer Style */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 glass-card p-6 border-primary/20 shadow-2xl shadow-primary/5">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 border-2 border-primary/30 flex items-center justify-center shadow-inner">
                <Award className="w-10 h-10 text-primary animate-pulse" />
              </div>
              <div>
                <h1 className="text-3xl font-display font-bold text-foreground tracking-tight">
                  Status de Batalha
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 capitalize font-bold">
                    {profile.role || "Player"}
                  </Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                    <Rocket className="w-3 h-3 text-primary" /> Nível Operacional: Ativo
                  </span>
                </div>
              </div>
            </div>

            {/* Seletor de Período Estilizado */}
            <div className="flex bg-secondary/30 p-1 rounded-xl border border-border/50 backdrop-blur-sm">
              {(['today', 'week', 'month'] as PeriodFilter[]).map((p) => (
                <Button
                  key={p}
                  variant={period === p ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setPeriod(p)}
                  className={cn(
                    "rounded-lg px-6 capitalize transition-all duration-300",
                    period === p ? "shadow-lg scale-105" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {p === 'today' ? 'Hoje' : p === 'week' ? 'Semana' : 'Mês'}
                </Button>
              ))}
            </div>
          </div>

          {/* Grid de Metas individuais */}
          <div className="grid grid-cols-1 gap-6">
            {userGoals.length === 0 ? (
              <div className="glass-card p-16 text-center space-y-4 border-dashed border-2 bg-secondary/5">
                <Target className="w-12 h-12 text-muted-foreground mx-auto opacity-10" />
                <p className="text-xl font-display text-muted-foreground italic">
                  "Nenhum desafio atribuído para este período... ainda."
                </p>
              </div>
            ) : (
              userGoals.map((g) => (
                <div 
                  key={g.label} 
                  className="glass-card p-8 relative overflow-hidden group hover:border-primary/40 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5"
                >
                  {/* Efeito Visual de Fundo */}
                  <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />
                  
                  <div className="relative z-10">
                    <GamifiedProgressBar 
                      label={g.label} 
                      current={g.current} 
                      goal={g.goal} 
                    />
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer de Integridade */}
          <div className="text-center pt-8 border-t border-border/10">
            <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-2 uppercase tracking-widest font-bold">
              <Calendar className="w-3 h-3" /> 
              Sincronizado via Webhook • {new Date().toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}