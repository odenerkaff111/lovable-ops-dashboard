import { cn } from "@/lib/utils";
import { Calendar, User, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

interface AppointmentCardProps {
  leadName: string;
  scheduledDate: string;
  responsibleName: string;
  status: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  pendente: { label: "Pendente", className: "bg-warning/20 text-warning border-warning/30" },
  no_show: { label: "No Show", className: "bg-danger/20 text-danger border-danger/30" },
  venda_realizada: { label: "Venda Realizada", className: "bg-success/20 text-success border-success/30" },
  venda_nao_realizada: { label: "Não Realizada", className: "bg-muted text-muted-foreground border-border" },
};

export function AppointmentCard({ leadName, scheduledDate, responsibleName, status }: AppointmentCardProps) {
  const config = statusConfig[status] ?? statusConfig.pendente;

  return (
    <div className="glass-card p-4 space-y-3">
      <div className="flex items-start justify-between">
        <h4 className="font-display font-semibold text-foreground">{leadName}</h4>
        <Badge variant="outline" className={cn("text-xs", config.className)}>
          {config.label}
        </Badge>
      </div>
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-3.5 h-3.5" />
          <span>{format(new Date(scheduledDate), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <User className="w-3.5 h-3.5" />
          <span>{responsibleName}</span>
        </div>
      </div>
    </div>
  );
}
