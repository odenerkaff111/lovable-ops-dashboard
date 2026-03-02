import React from "react";
import { PieChart } from "lucide-react";

interface LeadOriginData {
  label: string;
  value: number;
  color: string;
}

export const LeadOriginChart = ({ data }: { data: LeadOriginData[] }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  return (
    <div className="bg-white p-5 rounded-md border border-gray-200 shadow-sm h-full">
      <h3 className="text-sm font-bold text-slate-800 mb-6 uppercase tracking-wider flex items-center gap-2">
        <PieChart className="w-4 h-4" /> Origem dos Leads
      </h3>
      <div className="flex flex-col md:flex-row items-center gap-8">
        <div className="relative w-32 h-32 shrink-0">
          <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
            {data.map((item, i) => {
              const percentage = total > 0 ? (item.value / total) * 100 : 0;
              const offset = data.slice(0, i).reduce((sum, prev) => sum + (total > 0 ? (prev.value / total) * 100 : 0), 0);
              return (
                <circle
                  key={item.label}
                  cx="18" cy="18" r="16"
                  fill="none"
                  stroke={item.color}
                  strokeWidth="4"
                  strokeDasharray={`${percentage} 100`}
                  strokeDashoffset={-offset}
                />
              );
            })}
            <circle cx="18" cy="18" r="12" fill="white" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-bold text-slate-800">{total}</span>
            <span className="text-[10px] text-slate-400 uppercase font-bold">Total</span>
          </div>
        </div>
        <div className="flex-1 space-y-2 w-full">
          {data.map((item) => (
            <div key={item.label} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-xs font-medium text-slate-600 truncate">{item.label}</span>
              </div>
              <span className="text-xs font-bold text-slate-800">
                {total > 0 ? Math.round((item.value / total) * 100) : 0}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
