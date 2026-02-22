import { useMemo, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trophy, PartyPopper } from "lucide-react";

interface GamifiedProgressBarProps {
  current: number;
  goal: number;
  label: string;
  className?: string;
}

function getMessage(pct: number): string {
  if (pct >= 100) return "Booooa caralho, conseguiu mais uma vez. Ou dá desculpa ou dá resultado. Parabéns! 🏆";
  if (pct >= 80) return "Representou demais... já tá quase! 🔥";
  if (pct >= 40) return "Boa vencedor, é isso. Vamo chegar lá! 💪";
  return "Bora bater os primeiros, campeão. 🚀";
}

function getColor(pct: number): { bar: string; glow: string; text: string } {
  if (pct >= 100) return { bar: "bg-success", glow: "glow-green", text: "text-success" };
  if (pct >= 40) return { bar: "bg-warning", glow: "glow-amber", text: "text-warning" };
  return { bar: "bg-danger", glow: "glow-red", text: "text-danger" };
}

export function GamifiedProgressBar({ current, goal, label, className }: GamifiedProgressBarProps) {
  const pct = goal > 0 ? Math.round((current / goal) * 100) : 0;
  const colors = useMemo(() => getColor(pct), [pct]);
  const message = useMemo(() => getMessage(pct), [pct]);

  // Estados para o Pop-up de vitória
  const [showVictory, setShowVictory] = useState(false);
  const [hasCelebrated, setHasCelebrated] = useState(false);

  // Monitora se a meta foi batida
  useEffect(() => {
    if (pct >= 100 && goal > 0 && !hasCelebrated) {
      setShowVictory(true);
      setHasCelebrated(true);
    }
    // Reseta a celebração se a meta subir ou o progresso cair (opcional)
    if (pct < 100) {
      setHasCelebrated(false);
    }
  }, [pct, goal, hasCelebrated]);

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className={cn("text-sm font-bold", colors.text)}>
          {current}/{goal} ({pct}%)
        </span>
      </div>
      <div className={cn("h-3 rounded-full bg-secondary overflow-hidden", colors.glow)}>
        <div
          className={cn("h-full rounded-full transition-all duration-700 ease-out", colors.bar)}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground italic">{message}</p>

      {/* Pop-up de Vitória Estilizado */}
      <Dialog open={showVictory} onOpenChange={setShowVictory}>
        <DialogContent className="sm:max-w-md border-primary/50 bg-card/95 backdrop-blur-xl shadow-[0_0_50px_rgba(var(--primary),0.2)]">
          <DialogHeader className="flex flex-col items-center justify-center space-y-4 pt-4">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center animate-bounce">
              <Trophy className="w-10 h-10 text-primary" />
            </div>
            <DialogTitle className="text-3xl font-display font-bold text-center">
              META BATIDA!
            </DialogTitle>
            <DialogDescription className="text-center text-lg font-medium text-foreground px-4 italic leading-relaxed">
              "Booooa caralho, conseguiu mais uma vez. Ou dá desculpa ou dá resultado. Parabéns!"
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 pb-4">
            <Button 
              onClick={() => setShowVictory(false)} 
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-6 text-lg"
            >
              CONTINUAR VOANDO 🚀
            </Button>
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <PartyPopper className="w-4 h-4" />
              <span>Você atingiu {pct}% da meta de {label}</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}