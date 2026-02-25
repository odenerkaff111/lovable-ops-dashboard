import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { UserPlus, Trash2, X, Loader2 } from "lucide-react";
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

interface CompanyGoals {
  id: string;
  revenue_goal: number;
  sales_goal: number;
  daily_appointments_goal: number;
  daily_conversations_goal: number;
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
  const [companyGoals, setCompanyGoals] = useState<CompanyGoals | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);

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
    const [pRes, tRes, gRes, cRes] = await Promise.all([
      supabase.from("profiles").select("*").order("full_name", { ascending: true }),
      supabase.from("task_types").select("*"),
      supabase.from("user_goals").select("*"),
      supabase.from("company_goals").select("*").limit(1).maybeSingle(),
    ]);

    setProfiles((pRes.data ?? []) as Profile[]);
    setTaskTypes((tRes.data ?? []) as TaskType[]);
    setGoals((gRes.data ?? []) as UserGoal[]);
    if (cRes.data) setCompanyGoals(cRes.data as CompanyGoals);
  }

  async function createUser() {
    if (!newEmail || !newName || !newPassword) {
      toast({ title: "Erro", description: "Preencha os campos obrigatórios.", variant: "destructive" });
      return;
    }
    setCreating(true);

    try {
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
        fetchData();
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
    toast({ title: "Meta individual salva!" });
    fetchData();
  }

  async function handleSaveCompanyGoal(field: keyof CompanyGoals, val: string) {
    if (!companyGoals?.id) return;
    const value = parseFloat(val) || 0;
    if (companyGoals[field] === value) return;

    setCompanyGoals(prev => prev ? { ...prev, [field]: value } : null);

    const { error } = await supabase
      .from("company_goals")
      .update({ [field]: value })
      .eq("id", companyGoals.id);

    if (error) {
      toast({ title: "Erro", description: "Falha ao salvar a meta.", variant: "destructive" });
      fetchData();
    } else {
      toast({ title: "Meta atualizada!" });
    }
  }

  function getTaskLabel(name: string) {
    if (name === 'lead_criado') return 'Criação';
    if (name === 'lead_engajado') return 'Engajamento';
    if (name === 'follow_up') return 'Follow';
    return name;
  }

  if (!isAdmin) return null;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-8 space-y-6">

          {/* FORMULÁRIO DE CRIAÇÃO (SÓ APARECE AO CLICAR NO BOTÃO) */}
          {showCreateForm && (
            <section className="bg-white p-6 rounded-md border border-blue-200 shadow-sm animate-in fade-in slide-in-from-top-2">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Novo Acesso</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowCreateForm(false)}><X className="w-4 h-4" /></Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase font-bold text-slate-500">Nome</Label>
                  <Input value={newName} onChange={(e) => setNewName(e.target.value)} className="h-9 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase font-bold text-slate-500">Email</Label>
                  <Input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="h-9 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase font-bold text-slate-500">Senha</Label>
                  <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="h-9 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase font-bold text-slate-500">Função</Label>
                  <Select value={newFunction} onValueChange={setNewFunction}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {functionOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={createUser} disabled={creating} className="mt-4 bg-slate-800 hover:bg-slate-700 text-xs h-9 px-8">
                {creating ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : "Confirmar Cadastro"}
              </Button>
            </section>
          )}

          {/* METAS GLOBAIS DA EMPRESA */}
          {companyGoals && (
            <section className="bg-white border border-gray-200 rounded-md shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">Metas Globais da Empresa</h2>
              </div>
              
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase font-bold text-slate-500">Faturamento (Mês)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-xs">R$</span>
                    <Input 
                      type="number" 
                      className="pl-9 h-10 font-bold text-slate-800"
                      defaultValue={companyGoals.revenue_goal} 
                      onBlur={(e) => handleSaveCompanyGoal('revenue_goal', e.target.value)} 
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase font-bold text-slate-500">Vendas (Mês)</Label>
                  <Input type="number" className="h-10 font-bold text-slate-800" defaultValue={companyGoals.sales_goal} onBlur={(e) => handleSaveCompanyGoal('sales_goal', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase font-bold text-slate-500">Agendamentos (Dia)</Label>
                  <Input type="number" className="h-10 font-bold text-slate-800" defaultValue={companyGoals.daily_appointments_goal} onBlur={(e) => handleSaveCompanyGoal('daily_appointments_goal', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase font-bold text-slate-500">Conversas (Dia)</Label>
                  <Input type="number" className="h-10 font-bold text-slate-800" defaultValue={companyGoals.daily_conversations_goal} onBlur={(e) => handleSaveCompanyGoal('daily_conversations_goal', e.target.value)} />
                </div>
              </div>
            </section>
          )}

          {/* EQUIPE (MATRIZ INDIVIDUAL) */}
          <section className="bg-white border border-gray-200 rounded-md shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">Equipe</h2>
              <Button 
                onClick={() => setShowCreateForm(true)} 
                variant="outline" 
                size="sm" 
                className="h-8 text-[10px] font-bold uppercase gap-2 border-slate-300"
              >
                <UserPlus className="w-3 h-3" /> Novo Usuário
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 text-[10px] uppercase font-bold border-b border-gray-100">
                    <th className="px-6 py-4 text-left">Colaborador</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-center">Metas Diárias</th>
                    <th className="px-6 py-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {profiles.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-800">{p.full_name}</div>
                        <div className="text-[10px] text-slate-400 uppercase font-medium">{p.role}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Badge variant={p.active ? "default" : "secondary"} className="h-5 text-[9px] uppercase font-bold bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-50">
                          {p.active ? "Ativo" : "Inativo"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-6">
                          {taskTypes.map((tt) => {
                            const goal = goals.find(g => g.user_id === p.id && g.task_type_id === tt.id);
                            return (
                              <div key={tt.id} className="flex flex-col items-center gap-1">
                                <span className="text-[9px] font-bold text-slate-400 uppercase">{getTaskLabel(tt.name)}</span>
                                <Input
                                  type="number"
                                  className="h-8 w-14 text-center text-xs border-gray-200 focus:border-blue-400"
                                  defaultValue={goal?.daily_goal || ""}
                                  onBlur={(e) => handleSaveGoal(p.id, tt.id, e.target.value)}
                                />
                              </div>
                            );
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="ghost" size="icon" className="text-slate-300 hover:text-red-500 transition-colors">
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
