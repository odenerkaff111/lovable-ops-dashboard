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
  default: "border-border/50",
  success: "border-success/30 glow-green",
  warning: "border-warning/30 glow-amber",
  danger: "border-danger/30 glow-red",
};

const iconVariant = {
  default: "text-primary",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
};

export function StatCard({ label, value, icon: Icon, variant = "default", subtitle }: StatCardProps) {
  return (
    <div className={cn("glass-card p-5 space-y-3", variantStyles[variant])}>
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <Icon className={cn("w-5 h-5", iconVariant[variant])} />
      </div>
      <div>
        <p className="text-3xl font-display font-bold text-foreground">{value}</p>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}
