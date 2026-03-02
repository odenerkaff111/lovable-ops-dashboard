import React from "react";
import { 
  ArrowDown, 
  Users, 
  MessageSquare, 
  Target, 
  Search, 
  CalendarCheck, 
  PhoneCall, 
  DollarSign,
  MessageCircle,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FunnelStepProps {
  label: string;
  value: number;
  icon: React.ElementType;
  conversion?: number;
  color: string;
}

const FunnelStep = ({ label, value, icon: Icon, conversion, color }: FunnelStepProps) => (
  <div className="flex flex-col items-center w-full group">
    <div className={cn(
      "w-full p-3 rounded-md border flex items-center justify-between transition-all duration-200",
      color
    )}>
      <div className="flex items-center gap-3">
        <div className="p-1.5 bg-white rounded border border-inherit shadow-sm">
          <Icon className="w-4 h-4" />
        </div>
        <span className="font-semibold text-xs uppercase tracking-tight">{label}</span>
      </div>
      <span className="text-xl font-bold tabular-nums">{value}</span>
    </div>

    <div className="flex items-center justify-center w-full py-1.5 min-h-[28px]">
      {conversion !== undefined ? (
        <div className="flex items-center gap-2">
          <ArrowDown className="w-3 h-3 text-slate-300" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
            {conversion}% conversão
          </span>
        </div>
      ) : <div className="h-4" />}
    </div>
  </div>
);

export default function SalesFunnel({ data }: { data: any }) {
  const calcConv = (current: number, prev: number) =>
    prev > 0 ? Math.round((current / prev) * 100) : 0;

  return (
    <div className="flex flex-col gap-0 w-full max-w-[280px] p-5 bg-white border border-gray-200 rounded-md shadow-sm h-fit sticky top-4">
      <h3 className="text-sm font-bold text-slate-800 mb-6 uppercase tracking-wider text-center w-full">
        Estatística de Conversão
      </h3>

      <div className="space-y-0">
        <FunnelStep label="Leads Gerados" value={data?.leads || 0} icon={Users} color="bg-slate-50 border-slate-200 text-slate-700" conversion={calcConv(data?.contatoFeito, data?.leads)} />
        <FunnelStep label="Contato Feito" value={data?.contatoFeito || 0} icon={MessageSquare} color="bg-blue-50/50 border-blue-100 text-blue-700" conversion={calcConv(data?.respostas, data?.contatoFeito)} />
        <FunnelStep label="Conversas" value={data?.respostas || 0} icon={MessageCircle} color="bg-indigo-50/50 border-indigo-100 text-indigo-700" conversion={calcConv(data?.engajada, data?.respostas)} />
        <FunnelStep label="Engajados" value={data?.engajada || 0} icon={Zap} color="bg-pink-50/50 border-pink-100 text-pink-700" conversion={calcConv(data?.qualificacao, data?.engajada)} />
        <FunnelStep label="Qualificação" value={data?.qualificacao || 0} icon={Search} color="bg-violet-50/50 border-violet-100 text-violet-700" conversion={calcConv(data?.agendada, data?.qualificacao)} />
        <FunnelStep label="Agendados" value={data?.agendada || 0} icon={CalendarCheck} color="bg-purple-50/50 border-purple-100 text-purple-700" conversion={calcConv(data?.realizada, data?.agendada)} />
        <FunnelStep label="Realizados" value={data?.realizada || 0} icon={PhoneCall} color="bg-emerald-50/50 border-emerald-100 text-emerald-700" conversion={calcConv(data?.venda, data?.realizada)} />
        <FunnelStep label="Venda" value={data?.venda || 0} icon={DollarSign} color="bg-amber-50/50 border-amber-100 text-amber-700" />
      </div>
    </div>
  );
}
