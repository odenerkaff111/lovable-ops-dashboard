import React, { useState } from "react";
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
  // Estados para controlar o modal de faturamento
  const [showRevenueModal, setShowRevenueModal] = useState(false);
  const [revenueValue, setRevenueValue] = useState("");

  const updateStatus = async (newStatus: string, revenue?: number) => {
    // Prepara os dados para atualização
    const updateData: any = { status: newStatus };
    
    // Se a receita foi informada (venda), adiciona ao pacote de dados
    if (revenue !== undefined) {
      updateData.revenue_received = revenue;
    }

    const { error } = await supabase
      .from("appointments")
      .update(updateData)
      .eq("id", id);

    if (error) {
      toast.error("Erro ao atualizar status");
    } else {
      toast.success(`Status atualizado para ${newStatus.replace("_", " ")}`);
    }
  };

  const handleConfirmSale = () => {
    // Converte o valor digitado para número
    const numericValue = parseFloat(revenueValue.replace(",", "."));
    
    if (isNaN(numericValue) || numericValue < 0) {
      toast.error("Por favor, insira um valor válido.");
      return;
    }

    // Atualiza com o valor financeiro e fecha o modal
    updateStatus("venda_realizada", numericValue);
    setShowRevenueModal(false);
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
    <>
      <div className={cn("glass-card p-4 border-l-4 transition-all shadow-md relative", config.color)}>
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
              // Muda o evento do clique para abrir o modal em vez de salvar direto
              onClick={() => setShowRevenueModal(true)}
              className="flex flex-col items-center gap-1 p-2 rounded border border-amber-500/30 hover:bg-amber-500 hover:text-white transition-all text-[9px] font-bold uppercase"
            >
              <DollarSign className="w-4 h-4" /> Venda
            </button>
          </div>
        )}
      </div>

      {/* MODAL DE FATURAMENTO (Aparece ao clicar em Venda) */}
      {showRevenueModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-background border border-border rounded-xl shadow-2xl p-6 w-full max-w-sm animate-in fade-in zoom-in-95">
            <h3 className="font-display font-bold text-lg mb-2 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-amber-500" /> Confirmar Venda
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Qual foi o valor recebido (PIX/Cartão) nesta venda para <strong className="text-foreground">{leadName}</strong>?
            </p>
            
            <div className="relative mb-6">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">R$</span>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={revenueValue}
                onChange={(e) => setRevenueValue(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowRevenueModal(false)}
                className="flex-1 py-2 rounded-md border border-input text-sm font-semibold hover:bg-accent transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmSale}
                className="flex-1 py-2 rounded-md bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-colors shadow-sm"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
