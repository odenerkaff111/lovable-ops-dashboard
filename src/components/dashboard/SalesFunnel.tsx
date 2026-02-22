import React from "react";
import { ArrowDown, Users, MessageSquare, Search, CalendarCheck, PhoneCall, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

interface FunnelStepProps {
  label: string;
  value: number;
  icon: React.ElementType;
  conversion?: number;
  color: string;
}

const FunnelStep = ({ label, value, icon: Icon, conversion, color }: FunnelStepProps) => (
  <div className="flex flex-col items-center w-full">
    <div className={cn("w-full p-4 rounded-xl border flex items-center justify-between shadow-sm", color)}>
      <div className="flex items-center gap-3">
        <div className="p-2 bg-white/20 rounded-lg">
          <Icon className="w-5 h-5" />
        </div>
        <span className="font-bold text-sm uppercase tracking-tight">{label}</span>
      </div>
      <span className="text-2xl font-display font-bold">{value}</span>
    </div>
    <div className="flex items-center justify-between w-full px-4 py-1 min-h-[28px]">
      {conversion !== undefined ? (
        <>
          <ArrowDown className="w-3 h-3 text-muted-foreground" />
          <span className="text-[10px] font-bold italic text-muted-foreground">{conversion}% de conversão</span>
          <div className="w-3" />
        </>
      ) : <div className="h-4" />}
    </div>
  </div>
);

export default function SalesFunnel({ data }: { data: any }) {
  const calcConv = (current: number, prev: number) => 
    prev > 0 ? Math.round((current / prev) * 100) : 0;

  return (
    <div className="flex flex-col gap-0 w-full max-w-[280px] p-4 glass-card border-primary/10 h-fit sticky top-4">
      <h3 className="text-xs font-bold uppercase tracking-widest text-primary mb-6 flex items-center gap-2">
        <DollarSign className="w-4 h-4" /> Performance de Funil (Mês)
      </h3>
      
      <FunnelStep 
        label="Leads" 
        value={data?.leads || 0} 
        icon={Users} 
        color="bg-blue-500/10 border-blue-200 text-blue-700" 
        conversion={calcConv(data?.preCall, data?.leads)} 
      />
      <FunnelStep 
        label="Pré-Call" 
        value={data?.preCall || 0} 
        icon={MessageSquare} 
        color="bg-indigo-500/10 border-indigo-200 text-indigo-700" 
        conversion={calcConv(data?.qualificacao, data?.preCall)}
      />
      <FunnelStep 
        label="Qualificação" 
        value={data?.qualificacao || 0} 
        icon={Search} 
        color="bg-violet-500/10 border-violet-200 text-violet-700" 
        conversion={calcConv(data?.agendada, data?.qualificacao)}
      />
      <FunnelStep 
        label="Agendada" 
        value={data?.agendada || 0} 
        icon={CalendarCheck} 
        color="bg-purple-500/10 border-purple-200 text-purple-700" 
        conversion={calcConv(data?.realizada, data?.agendada)}
      />
      <FunnelStep 
        label="Realizada" 
        value={data?.realizada || 0} 
        icon={PhoneCall} 
        color="bg-emerald-500/10 border-emerald-200 text-emerald-700" 
        conversion={calcConv(data?.venda, data?.realizada)}
      />
      <FunnelStep 
        label="Venda" 
        value={data?.venda || 0} 
        icon={DollarSign} 
        color="bg-amber-500/10 border-amber-200 text-amber-700" 
      />
    </div>
  );
}