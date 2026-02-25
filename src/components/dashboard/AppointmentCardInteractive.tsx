import React, { useState } from "react";
import { User, CheckCircle2, XCircle, DollarSign, Clock } from "lucide-react";
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
  const [showRevenueModal, setShowRevenueModal] = useState(false);
  const [revenueValue, setRevenueValue] = useState("");

  const updateStatus = async (newStatus: string, revenue?: number) => {
    const updateData: any = { status: newStatus };
    if (revenue !== undefined) updateData.revenue_received = revenue;

    const { error } = await supabase
      .from("appointments")
      .update(updateData)
      .eq("id", id);

    if (error) {
      toast.error("Erro ao atualizar status");
    } else {
      toast.success(`Status: ${newStatus.replace("_", " ")}`);
    }
  };

  const handleConfirmSale = () => {
    const numericValue = parseFloat(revenueValue.replace(",", "."));
    if (isNaN(numericValue) || numericValue < 0) {
      toast.error("Insira um valor válido.");
      return;
    }
    updateStatus("venda_realizada", numericValue);
    setShowRevenueModal(false);
  };

  const getStatusConfig = (currentStatus: string) => {
    switch (currentStatus) {
      case "venda_realizada": return { accent: "border-l-amber-500", badge: "bg-amber-50 text-amber-700 border-amber-100", label: "Venda" };
      case "no_show": return { accent: "border-l-red-500", badge: "bg-red-50 text-red-700 border-red-100", label: "No-Show" };
      case "realizada": return { accent: "border-l-emerald-500", badge: "bg-emerald-50 text-emerald-700 border-emerald-100", label: "Realizada" };
      default: return { accent: "border-l-slate-300", badge: "bg-slate-50 text-slate-600 border-slate-200", label: "Pendente" };
    }
  };

  const config = getStatusConfig(status);

  return (
    <>
      <div className={cn("bg-white p-4 border border-gray-200 border-l-4 rounded-md shadow-sm transition-all hover:border-slate-300", config.accent)}>
        <div className="flex justify-between items-start mb-3">
          <div className="space-y-0.5">
            <h4 className="font-bold text-sm text-slate-800 uppercase tracking-tight">{leadName}</h4>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase">
              <User className="w-3 h-3" /> {responsibleName}
            </div>
          </div>
          <span className={cn("text-[9px] font-bold uppercase px-2 py-0.5 rounded border", config.badge)}>
            {config.label}
          </span>
        </div>

        <div className="flex items-center gap-2 text-[11px] mb-4 text-slate-500 bg-slate-50 border border-slate-100 px-2 py-1.5 rounded font-bold">
          <Clock className="w-3 h-3 text-slate-400" />
          {format(new Date(scheduledDate), "dd/MM @ HH:mm", { locale: ptBR })}
        </div>

        {status === "pendente" && (
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100">
            <button onClick={() => updateStatus("realizada")} className="flex items-center justify-center gap-1.5 py-2 rounded text-[9px] font-bold uppercase text-emerald-600 hover:bg-emerald-50 transition-colors">
              <CheckCircle2 className="w-3.5 h-3.5" /> OK
            </button>
            <button onClick={() => updateStatus("no_show")} className="flex items-center justify-center gap-1.5 py-2 rounded text-[9px] font-bold uppercase text-red-600 hover:bg-red-50 transition-colors">
              <XCircle className="w-3.5 h-3.5" /> Faltou
            </button>
            <button onClick={() => setShowRevenueModal(true)} className="flex items-center justify-center gap-1.5 py-2 rounded text-[9px] font-bold uppercase text-amber-600 hover:bg-amber-50 transition-colors">
              <DollarSign className="w-3.5 h-3.5" /> Venda
            </button>
          </div>
        )}
      </div>

      {showRevenueModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-[2px] p-4">
          <div className="bg-white border border-gray-200 rounded-md shadow-xl p-6 w-full max-w-sm animate-in zoom-in-95">
            <h3 className="font-bold text-slate-800 text-base mb-1 uppercase tracking-tight">Valor da Venda</h3>
            <p className="text-xs text-slate-500 mb-4">Confirme o faturamento recebido de <span className="font-bold text-slate-700">{leadName}</span>.</p>
            <div className="relative mb-6">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">R$</span>
              <input type="number" step="0.01" className="w-full pl-10 pr-4 py-2.5 rounded border border-gray-200 text-lg font-bold text-slate-800 focus:outline-none focus:border-blue-400" value={revenueValue} onChange={(e) => setRevenueValue(e.target.value)} autoFocus />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowRevenueModal(false)} className="flex-1 py-2 text-xs font-bold uppercase text-slate-500 hover:bg-slate-100 rounded transition-colors">Cancelar</button>
              <button onClick={handleConfirmSale} className="flex-1 py-2 bg-slate-800 text-white text-xs font-bold uppercase rounded hover:bg-slate-700 transition-colors shadow-sm">Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
