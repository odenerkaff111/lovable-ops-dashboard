import React from "react";
import { Calendar, User, CheckCircle2, XCircle, DollarSign, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AppointmentCardProps {
  id: string;
  leadName: string;
  scheduledDate: string;
  responsibleName: string;
  status: string;
}

export default function AppointmentCardInteractive({ 
  id, 
  leadName, 
  scheduledDate, 
  responsibleName, 
  status 
}: AppointmentCardProps) {
  
  const updateStatus = async (newStatus: string) => {
    const { error } = await supabase
      .from("appointments")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) {
      toast.error("Erro ao atualizar status");
    } else {
      toast.success(`Status atualizado para ${newStatus.replace("_", " ")}`);
    }
  };

  const getStatusConfig = (currentStatus: string) => {
    switch (currentStatus) {
      case "venda_realizada": return { color: "border-amber-500 bg-amber-500/10", label: "Venda " };
      case "no_show": return { color: "border-red-500 bg-red-500/10", label: "No-Show " };
      case "realizada": return { color: "border-emerald-500 bg-emerald-500/10", label: "Realizada " };
      default: return { color: "border-border bg-card", label: "Pendente" };
    }
  };

  const config = getStatusConfig(status);

  return (
    <div className={cn("glass-card p-4 border-l-4 transition-all shadow-md", config.color)}>
      <div className="flex justify-between items-start mb-3">
        <div className="space-y-1">
          <h4 className="font-display font-bold text-sm uppercase tracking-tight">{leadName}</h4>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium">
            <User className="w-3 h-3" /> {responsibleName}
          </div>
        </div>
        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-background/50 border">
          {config.label}
        </span>
      </div>

      <div className="flex items-center gap-2 text-xs mb-4 text-foreground/80 bg-background/40 p-2 rounded">
        <Clock className="w-3 h-3 text-primary" />
        {format(new Date(scheduledDate), "dd/MM @ HH:mm", { locale: ptBR })}
      </div>

      {status === "pendente" && (
        <div className="grid grid-cols-3 gap-2">
          <button 
            onClick={() => updateStatus("realizada")}
            className="flex flex-col items-center gap-1 p-2 rounded border border-emerald-500/30 hover:bg-emerald-500 hover:text-white transition-all text-[9px] font-bold uppercase"
          >
            <CheckCircle2 className="w-4 h-4" /> Realizada
          </button>
          <button 
            onClick={() => updateStatus("no_show")}
            className="flex flex-col items-center gap-1 p-2 rounded border border-red-500/30 hover:bg-red-500 hover:text-white transition-all text-[9px] font-bold uppercase"
          >
            <XCircle className="w-4 h-4" /> No-Show
          </button>
          <button 
            onClick={() => updateStatus("venda_realizada")}
            className="flex flex-col items-center gap-1 p-2 rounded border border-amber-500/30 hover:bg-amber-500 hover:text-white transition-all text-[9px] font-bold uppercase"
          >
            <DollarSign className="w-4 h-4" /> Venda
          </button>
        </div>
      )}
    </div>
  );
}