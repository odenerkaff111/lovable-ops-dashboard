import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Calendar, User, Clock, CheckCircle, XCircle, PhoneOff } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface AppointmentCardInteractiveProps {
  leadId: string;
  leadName: string;
  scheduledDate: string;
  responsibleName: string;
  status: "pendente" | "no_show" | "venda_realizada" | "venda_nao_realizada";
  onStatusChange?: (newStatus: string) => void;
}

const statusConfig: Record<string, { label: string; className: string; color: string }> = {
  pendente: {
    label: "Pendente",
    className: "bg-yellow-50 border-yellow-200",
    color: "text-yellow-600",
  },
  no_show: {
    label: "No Show",
    className: "bg-red-50 border-red-200",
    color: "text-red-600",
  },
  venda_realizada: {
    label: "Venda Realizada ✓",
    className: "bg-green-50 border-green-200",
    color: "text-green-600",
  },
  venda_nao_realizada: {
    label: "Não Realizada",
    className: "bg-gray-50 border-gray-200",
    color: "text-gray-600",
  },
};

export function AppointmentCardInteractive({
  leadId,
  leadName,
  scheduledDate,
  responsibleName,
  status,
  onStatusChange,
}: AppointmentCardInteractiveProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();
  const config = statusConfig[status] ?? statusConfig.pendente;

  const handleStatusUpdate = async (newStatus: string) => {
    if (status !== "pendente") return; // Só permite mudar de pendente

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from("appointments")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("lead_id", leadId);

      if (error) throw error;

      toast({
        title: "Status atualizado",
        description: `Agendamento marcado como ${statusConfig[newStatus].label}`,
      });

      onStatusChange?.(newStatus);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const isPending = status === "pendente";

  return (
    <div
      className={cn(
        "rounded-lg border p-4 transition-all hover:shadow-md",
        config.className
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="font-display font-semibold text-foreground">{leadName}</h4>
          <Badge
            variant="outline"
            className={cn("text-xs mt-1", config.color)}
          >
            {config.label}
          </Badge>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          <span>
            {format(new Date(scheduledDate), "dd/MM/yyyy 'às' HH:mm", {
              locale: ptBR,
            })}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <User className="w-4 h-4" />
          <span>{responsibleName}</span>
        </div>
      </div>

      {isPending && (
        <div className="flex gap-2 pt-3 border-t border-current border-opacity-10">
          <Button
            size="sm"
            variant="ghost"
            className="flex-1 text-xs h-8 text-green-600 hover:bg-green-100"
            onClick={() => handleStatusUpdate("venda_realizada")}
            disabled={isUpdating}
          >
            <CheckCircle className="w-3 h-3 mr-1" />
            Venda
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="flex-1 text-xs h-8 text-red-600 hover:bg-red-100"
            onClick={() => handleStatusUpdate("no_show")}
            disabled={isUpdating}
          >
            <PhoneOff className="w-3 h-3 mr-1" />
            No Show
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="flex-1 text-xs h-8 text-gray-600 hover:bg-gray-100"
            onClick={() => handleStatusUpdate("venda_nao_realizada")}
            disabled={isUpdating}
          >
            <XCircle className="w-3 h-3 mr-1" />
            Não
          </Button>
        </div>
      )}
    </div>
  );
}
