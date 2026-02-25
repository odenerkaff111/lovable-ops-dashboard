import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  variant?: "default" | "success" | "warning" | "danger";
  subtitle?: string;
}

const variantStyles = {
  default: "border-gray-200",
  success: "border-emerald-100 bg-emerald-50/30",
  warning: "border-amber-100 bg-amber-50/30",
  danger: "border-red-100 bg-red-50/30",
};

const iconVariant = {
  default: "text-slate-400",
  success: "text-emerald-500",
  warning: "text-amber-500",
  danger: "text-red-500",
};

export function StatCard({ label, value, icon: Icon, variant = "default", subtitle }: StatCardProps) {
  return (
    <div className={cn(
      "bg-white p-5 rounded-md border shadow-sm transition-all hover:border-slate-300", 
      variantStyles[variant]
    )}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
        <Icon className={cn("w-5 h-5", iconVariant[variant])} />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-800 tabular-nums">{value}</p>
        {subtitle && <p className="text-[10px] text-slate-400 font-medium mt-1 uppercase tracking-tight">{subtitle}</p>}
      </div>
    </div>
  );
}
