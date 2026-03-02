import React from "react";
import { BarChart } from "lucide-react";

interface ProspectingChartProps {
  tentativas: number;
  geradas: number;
}

export const ProspectingChart = ({ tentativas, geradas }: ProspectingChartProps) => {
  const percentage = tentativas > 0 ? Math.round((geradas / tentativas) * 100) : 0;
  return (
    <div className="bg-white p-5 rounded-md border border-gray-200 shadow-sm flex-1">
      <h3 className="text-sm font-bold text-slate-800 mb-6 uppercase tracking-wider flex items-center gap-2">
        <BarChart className="w-4 h-4" /> Volume de Prospecção
      </h3>
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between items-end">
            <span className="text-xs font-bold text-slate-400 uppercase">Tentativas de Conversa</span>
            <span className="text-lg font-bold text-slate-800">{tentativas}</span>
          </div>
          <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-slate-400 w-full" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-end">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-400 uppercase">Conversas Geradas</span>
              <span className="text-[10px] text-blue-600 font-bold">{percentage}% de conversão</span>
            </div>
            <span className="text-lg font-bold text-blue-600">{geradas}</span>
          </div>
          <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${Math.min(percentage, 100)}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
};
