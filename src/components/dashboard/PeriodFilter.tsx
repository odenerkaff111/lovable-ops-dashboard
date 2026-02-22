import { cn } from "@/lib/utils";
import type { PeriodFilter as PeriodType } from "@/hooks/useDashboardData";

interface PeriodFilterProps {
  value: PeriodType;
  onChange: (v: PeriodType) => void;
}

const options: { value: PeriodType; label: string }[] = [
  { value: "today", label: "Hoje" },
  { value: "week", label: "Semana" },
  { value: "month", label: "Mês" },
];

export function PeriodFilter({ value, onChange }: PeriodFilterProps) {
  return (
    <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            "px-4 py-1.5 text-sm font-medium rounded-md transition-all",
            value === opt.value
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
