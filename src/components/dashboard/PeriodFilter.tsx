import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Calendar, ChevronDown } from "lucide-react";
import type { PeriodFilter as PeriodType } from "@/hooks/useDashboardData";

interface PeriodFilterProps {
  value: PeriodType;
  onChange: (v: PeriodType, customRange?: { start: Date; end: Date }) => void;
}

const options: { value: PeriodType; label: string }[] = [
  { value: "today", label: "Hoje" },
  { value: "week", label: "Semana" },
  { value: "month", label: "Mês" },
  { value: "year", label: "Último Ano" },
];

export function PeriodFilter({ value, onChange }: PeriodFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLabel = options.find((o) => o.value === value)?.label || "Personalizado";

  // Fecha o menu ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (val: PeriodType) => {
    onChange(val);
    setIsOpen(false);
  };

  const handleCustomApply = () => {
    if (customStart && customEnd) {
      // Ajuste de fuso horário local para o input nativo de data
      const start = new Date(`${customStart}T00:00:00`);
      const end = new Date(`${customEnd}T23:59:59`);
      onChange("custom", { start, end });
      setIsOpen(false);
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-white border border-gray-200 text-slate-700 px-4 py-2 rounded-md shadow-sm hover:bg-slate-50 transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
      >
        <Calendar className="w-4 h-4 text-emerald-600" />
        {currentLabel}
        <ChevronDown className="w-4 h-4 text-slate-400 ml-2" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-50 p-2">
          <div className="flex flex-col gap-1 mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2 py-1">Atalhos</span>
            {options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleSelect(opt.value)}
                className={cn(
                  "text-left px-3 py-2 text-sm rounded-md transition-colors",
                  value === opt.value
                    ? "bg-emerald-50 text-emerald-700 font-medium"
                    : "text-slate-700 hover:bg-slate-50"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
          
          <div className="border-t border-gray-100 pt-3 flex flex-col gap-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2">Data Personalizada</span>
            <div className="px-2 flex flex-col gap-2">
              <input 
                type="date" 
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-md px-2 py-1.5 focus:outline-none focus:border-emerald-400 text-slate-700"
              />
              <input 
                type="date" 
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-md px-2 py-1.5 focus:outline-none focus:border-emerald-400 text-slate-700"
              />
              <button 
                onClick={handleCustomApply}
                disabled={!customStart || !customEnd}
                className="mt-1 w-full bg-slate-800 text-white text-xs font-medium py-2 rounded-md hover:bg-slate-700 disabled:opacity-50 transition-colors"
              >
                Aplicar Período
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
