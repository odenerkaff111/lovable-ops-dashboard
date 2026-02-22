import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, UserPlus, Settings, Trash2, Edit, Plus, Save } from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  user_function: string;
  is_active: boolean;
}

interface TaskType {
  id: string;
  name: string;
  label: string;
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
  { value: "head_comercial", label: "Head Comercial" },
  { value: "ceo", label: "CEO" },
];

const taskOptions = [
  { value: "lead_criado", label: "Criação" },
  { value: "lead_engajado", label: "Engajamento" },
  { value: "follow_up", label: "Follow" },
];

export default function AdminConfig() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);
  const [goals, setGoals] = useState<UserGoal[]>([]);
  
  // Form states
  const [newUser, setNewUser] = useState({
    email: "",
    name: "",
    function: "sdr",
    password: ""
  });
  const [newTask, setNewTask] = useState({
    name: "",
    label: ""
  });
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [userGoals, setUserGoals] = useState<Record<string, Record<string, number>>>({}); // userId -> taskType -> goal

  useEffect(() => {
    if (!isAdmin) {
      navigate("/");
      return;
    }
    fetchData();
  }, [isAdmin]);

  async function fetchData() {
    const [p, t, g] = await Promise.all([
      supabase.from("profiles").select("*"),
      supabase.from("task_types").select("*"),
      supabase.from("user_goals").select("*"),
    ]);
    setProfiles((p.data ?? []) as Profile[]);
    setTaskTypes((t.data ?? []) as TaskType[]);
    setGoals((g.data ?? []) as UserGoal[]);
    
    // Build user goals map
    const goalsMap: Record<string, Record<string, number>> = {};
    g.data?.forEach(goal => {
      if (!goalsMap[goal.user_id]) goalsMap[goal.user_id] = {};
      goalsMap[goal.user_id][goal.task_type_id] = goal.daily_goal;
    });
    setUserGoals(goalsMap);
  }

  async function createUser() {
    if (!newUser.email || !newUser.name || !newUser.password) {
      toast({ title: "Erro", description: "Preencha todos os campos", variant: "destructive" });
      return;
    }
    
    const { data, error } = await supabase.functions.invoke("create-user", {
      body: { 
        email: newUser.email, 
        password: newUser.password, 
        full_name: newUser.name, 
        user_function: newUser.function 
      },
    });

    if (error) {
      toast({ title: "Erro ao criar usuário", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Usuário criado com sucesso!" });
      setNewUser({ email: "", name: "", function: "sdr", password: "" });
      fetchData();
    }
  }

  async function deleteUser(userId: string) {
    const profile = profiles.find(p => p.user_id === userId);
    if (!profile) return;

    const { error } = await supabase.from("profiles").delete().eq("user_id", userId);
    if (error) {
      toast({ title: "Erro ao deletar usuário", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Usuário deletado com sucesso!" });
      fetchData();
    }
  }

  async function updateUserFunction(userId: string, functionValue: string) {
    const { error } = await supabase.from("profiles").update({ user_function: functionValue as any }).eq("user_id", userId);
    if (error) {
      toast({ title: "Erro ao atualizar função", description: error.message, variant: "destructive" });
    } else {
      fetchData();
    }
  }

  async function createTask() {
    if (!newTask.name || !newTask.label) {
      toast({ title: "Erro", description: "Preencha todos os campos", variant: "destructive" });
      return;
    }
    
    const { error } = await supabase.from("task_types").insert({
      name: newTask.name,
      label: newTask.label
    });

    if (error) {
      toast({ title: "Erro ao criar tarefa", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Tarefa criada com sucesso!" });
      setNewTask({ name: "", label: "" });
      fetchData();
    }
  }

  async function deleteTask(taskId: string) {
    const { error } = await supabase.from("task_types").delete().eq("id", taskId);
    if (error) {
      toast({ title: "Erro ao deletar tarefa", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Tarefa deletada com sucesso!" });
      fetchData();
    }
  }

  async function updateGoal(userId: string, taskTypeId: string, value: number) {
    const existing = goals.find((g) => g.user_id === userId && g.task_type_id === taskTypeId);
    if (existing) {
      await supabase.from("user_goals").update({ daily_goal: value }).eq("id", existing.id);
    } else {
      await supabase.from("user_goals").insert({ user_id: userId, task_type_id: taskTypeId, daily_goal: value });
    }
    fetchData();
  }

  function getGoalValue(userId: string, taskTypeId: string): number {
    return userGoals[userId]?.[taskTypeId] || 0;
  }

  if (!isAdmin) return null;

  // Forçar hot reload
  const forceReload = Math.random();
  const forceReload2 = Math.random();
  const forceReload3 = Math.random();

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 md:grid-cols-[240px,1fr] gap-6">
        <Sidebar />
        <div>
          <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="gap-2">
                <ArrowLeft className="w-4 h-4" /> Voltar
              </Button>
              <h1 className="font-display font-bold text-lg text-foreground">Configurações do Sistema</h1>
            </div>
          </header>

          <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8">
            {/* Usuários */}
            <section>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="w-5 h-5" />
                    Gerenciar Usuários
                  </CardTitle>
                  <CardDescription>Crie, edite e gerencie usuários do sistema</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Formulário de Criação */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border border-border/40 rounded-lg">
                    <div className="space-y-2">
                      <Label>Nome</Label>
                      <Input 
                        value={newUser.name} 
                        onChange={(e) => setNewUser({...newUser, name: e.target.value})} 
                        placeholder="Nome completo" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input 
                        value={newUser.email} 
                        onChange={(e) => setNewUser({...newUser, email: e.target.value})} 
                        placeholder="email@empresa.com" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Função</Label>
                      <Select value={newUser.function} onValueChange={(v) => setNewUser({...newUser, function: v})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {functionOptions.map((o) => (
                            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Senha</Label>
                      <Input 
                        type="password" 
                        value={newUser.password} 
                        onChange={(e) => setNewUser({...newUser, password: e.target.value})} 
                        placeholder="Mínimo 6 caracteres" 
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={createUser} className="gap-2">
                      <UserPlus className="w-4 h-4" />
                      Criar Usuário
                    </Button>
                  </div>

                  {/* Lista de Usuários */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {profiles.map((p) => (
                      <Card key={p.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold">{p.full_name}</h3>
                              <p className="text-sm text-muted-foreground">{p.user_function}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={p.is_active ? "default" : "secondary"}>
                                {p.is_active ? "Ativo" : "Inativo"}
                              </Badge>
                              <Button variant="ghost" size="sm" onClick={() => deleteUser(p.user_id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          
                          {/* Seleção de Função */}
                          <div className="space-y-2">
                            <Label className="text-xs">Função</Label>
                            <Select value={p.user_function} onValueChange={(v) => updateUserFunction(p.user_id, v)}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {functionOptions.map((o) => (
                                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Metas por Tarefa */}
                          <div className="space-y-2">
                            <Label className="text-xs">Metas Diárias</Label>
                            {taskTypes.map((tt) => (
                              <div key={tt.id} className="flex items-center gap-2">
                                <span className="text-xs w-20">{tt.label}:</span>
                                <Input
                                  type="number"
                                  min={0}
                                  defaultValue={getGoalValue(p.user_id, tt.id)}
                                  className="w-20 h-8 text-sm"
                                  onBlur={(e) => updateGoal(p.user_id, tt.id, parseInt(e.target.value) || 0)}
                                />
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Tarefas */}
            <section>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Gerenciar Tarefas
                  </CardTitle>
                  <CardDescription>Crie e gerencie tipos de tarefas do sistema</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Formulário de Criação */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border border-border/40 rounded-lg">
                    <div className="space-y-2">
                      <Label>Nome da Tarefa (interno)</Label>
                      <Input 
                        value={newTask.name} 
                        onChange={(e) => setNewTask({...newTask, name: e.target.value})} 
                        placeholder="lead_criado, lead_engajado, etc" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Label (exibição)</Label>
                      <Input 
                        value={newTask.label} 
                        onChange={(e) => setNewTask({...newTask, label: e.target.value})} 
                        placeholder="Criação, Engajamento, etc" 
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={createTask} className="gap-2">
                      <Plus className="w-4 h-4" />
                      Criar Tarefa
                    </Button>
                  </div>

                  {/* Lista de Tarefas */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {taskTypes.map((tt) => (
                      <Card key={tt.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold">{tt.label}</h3>
                              <p className="text-sm text-muted-foreground">{tt.name}</p>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => deleteTask(tt.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}