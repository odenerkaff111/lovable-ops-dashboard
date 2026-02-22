import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { UserPlus, Target, Trash2, X, ShieldCheck, Loader2 } from "lucide-react"; // Loader2 adicionado aqui
import Sidebar from "@/components/layout/Sidebar";
import { Badge } from "@/components/ui/badge";

interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  active: boolean;
}

interface TaskType {
  id: string;
  name: string;
}

interface UserGoal {
  id: string;
  user_id: string;
  task_type_id: string;
  daily_goal: number;
}

const functionOptions = [
  { value: "sdr", label: "SDR" },
  { value: "closer", label: "Closer" },
  { value: "social_seller", label: "Social Seller" },
  { value: "manager", label: "Gestor" },
  { value: "admin", label: "Administrador" },
];

export default function Admin() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);
  const [goals, setGoals] = useState<UserGoal[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);

  // Estados para novo usuário
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newFunction, setNewFunction] = useState("sdr");
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    if (!isAdmin) {
      navigate("/");
      return;
    }
    fetchData();
  }, [isAdmin, navigate]);

  async function fetchData() {
    const [pRes, tRes, gRes] = await Promise.all([
      supabase.from("profiles").select("*").order("full_name", { ascending: true }),
      supabase.from("task_types").select("*"),
      supabase.from("user_goals").select("*"),
    ]);

    setProfiles((pRes.data ?? []) as Profile[]);
    setTaskTypes((tRes.data ?? []) as TaskType[]);
    setGoals((gRes.data ?? []) as UserGoal[]);
  }

  // FUNÇÃO ATUALIZADA: Agora usa o signUp direto para evitar o erro 404 da Edge Function
  async function createUser() {
    if (!newEmail || !newName || !newPassword) {
      toast({ title: "Erro", description: "Preencha os campos obrigatórios.", variant: "destructive" });
      return;
    }
    setCreating(true);

    try {
      // Usamos signUp em vez de invoke para criar o acesso direto
      const { data, error } = await supabase.auth.signUp({
        email: newEmail,
        password: newPassword,
        options: {
          data: {
            full_name: newName,
            role: newFunction,
          },
        },
      });

      if (error) throw error;

      if (data?.user) {
        toast({ title: "Usuário criado!", description: "O acesso já está ativo." });
        setNewEmail(""); setNewName(""); setNewPassword("");
        setShowCreateForm(false);
        fetchData(); // Recarrega para aparecer na matriz
      }
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  }

  async function handleSaveGoal(userId: string, taskTypeId: string, val: string) {
    const value = parseInt(val) || 0;
    const existing = goals.find((g) => g.user_id === userId && g.task_type_id === taskTypeId);
    
    if (existing) {
      if (existing.daily_goal === value) return;
      await supabase.from("user_goals").update({ daily_goal: value }).eq("id", existing.id);
    } else {
      if (value === 0) return;
      await supabase.from("user_goals").insert({ user_id: userId, task_type_id: taskTypeId, daily_goal: value });
    }
    toast({ title: "Meta salva!" });
    fetchData();
  }

  function getTaskLabel(name: string) {
    if (name === 'lead_criado') return 'Criação';
    if (name === 'lead_engajado') return 'Engajamento';
    if (name === 'follow_up') return 'Follow';
    return name;
  }

  if (!isAdmin) return null;

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6">
          
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-display font-bold">Painel Admin</h1>
            </div>
            <Button 
              onClick={() => setShowCreateForm(!showCreateForm)}
              variant={showCreateForm ? "outline" : "default"}
              className="gap-2 shadow-lg shadow-primary/20"
            >
              {showCreateForm ? <X className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
              {showCreateForm ? "Cancelar" : "Novo Usuário"}
            </Button>
          </div>

          {showCreateForm && (
            <section className="glass-card p-6 border-primary/20 animate-in fade-in slide-in-from-top-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="space-y-2">
                  <Label className="text-xs uppercase font-bold tracking-wider">Nome</Label>
                  <Input value={newName} onChange={(e) => setNewName(e.target.value)} className="bg-background" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase font-bold tracking-wider">Email</Label>
                  <Input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="bg-background" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase font-bold tracking-wider">Senha</Label>
                  <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="bg-background" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase font-bold tracking-wider">Função</Label>
                  <Select value={newFunction} onValueChange={setNewFunction}>
                    <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {functionOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={createUser} disabled={creating} className="mt-6 w-full md:w-auto px-12">
                {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {creating ? "Salvando..." : "Confirmar Cadastro"}
              </Button>
            </section>
          )}

          <section className="glass-card border-border/40 overflow-hidden shadow-2xl">
            <div className="p-4 bg-secondary/20 border-b border-border/40">
              <h2 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" /> Matriz de Performance Individual
              </h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-secondary/10 text-muted-foreground text-[10px] uppercase font-bold">
                    <th className="px-6 py-4 text-left">Colaborador</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-center">Metas Diárias</th>
                    <th className="px-6 py-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {profiles.map((p) => (
                    <tr key={p.id} className="hover:bg-primary/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-foreground">{p.full_name}</div>
                        <div className="text-[10px] text-muted-foreground">{p.email}</div>
                        <Badge variant="outline" className="mt-1 text-[9px] h-4 uppercase">{p.role}</Badge>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Badge variant={p.active ? "default" : "secondary"} className="h-5">
                          {p.active ? "Ativo" : "Inativo"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-4">
                          {taskTypes.map((tt) => {
                            const goal = goals.find(g => g.user_id === p.id && g.task_type_id === tt.id);
                            return (
                              <div key={tt.id} className="flex flex-col items-center gap-1">
                                <span className="text-[9px] font-bold text-muted-foreground uppercase">{getTaskLabel(tt.name)}</span>
                                <Input 
                                  type="number"
                                  className="h-8 w-16 text-center text-xs bg-background/50"
                                  defaultValue={goal?.daily_goal || ""}
                                  onBlur={(e) => handleSaveGoal(p.id, tt.id, e.target.value)}
                                />
                              </div>
                            );
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}