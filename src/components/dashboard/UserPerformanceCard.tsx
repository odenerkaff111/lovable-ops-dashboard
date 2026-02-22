import { GamifiedProgressBar } from "./GamifiedProgressBar";

interface TaskProgress {
  label: string;
  current: number;
  goal: number;
}

interface UserPerformanceCardProps {
  userName: string;
  userFunction: string;
  tasks: TaskProgress[];
}

const functionLabels: Record<string, string> = {
  sdr: "SDR",
  closer: "Closer",
  social_seller: "Social Seller",
  gestor: "Gestor",
  outro: "Outro",
};

export function UserPerformanceCard({ userName, userFunction, tasks }: UserPerformanceCardProps) {
  return (
    <div className="glass-card p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
          <span className="text-sm font-bold text-primary">
            {userName.charAt(0).toUpperCase()}
          </span>
        </div>
        <div>
          <h3 className="font-display font-semibold text-foreground">{userName}</h3>
          <span className="text-xs text-muted-foreground">{functionLabels[userFunction] ?? userFunction}</span>
        </div>
      </div>
      <div className="space-y-3">
        {tasks.map((task) => (
          <GamifiedProgressBar
            key={task.label}
            label={task.label}
            current={task.current}
            goal={task.goal}
          />
        ))}
        {tasks.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhuma meta configurada</p>
        )}
      </div>
    </div>
  );
}
