import { NavLink } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LayoutDashboard, Target, ShieldCheck, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function Sidebar() {
  const { isAdmin, profile } = useAuth();

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <aside className="w-64 h-screen hidden md:block border-r border-border/40 bg-card/30 backdrop-blur-md sticky top-0 left-0 overflow-y-auto">
      <nav className="flex flex-col h-full p-6">
        {/* Header da Sidebar */}
        <div className="mb-8 px-2">
          <h3 className="text-xs font-bold uppercase tracking-widest text-primary/70">Kaff CRM</h3>
          <div className="mt-2">
            <div className="text-sm font-semibold text-foreground truncate">{profile?.full_name ?? "Usuário"}</div>
            <div className="text-[10px] text-muted-foreground uppercase">{profile?.role ?? "Player"}</div>
          </div>
        </div>

        <ul className="space-y-2 flex-1">
          <li>
            <NavLink to="/" className={({ isActive }) => 
              cn("flex items-center gap-3 px-3 py-2 rounded-lg transition-all", 
              isActive ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'hover:bg-secondary text-muted-foreground hover:text-foreground')
            }>
              <LayoutDashboard className="w-4 h-4" />
              <span className="text-sm font-medium">Dashboard</span>
            </NavLink>
          </li>
          
          <li>
            <NavLink to="/me" className={({ isActive }) => 
              cn("flex items-center gap-3 px-3 py-2 rounded-lg transition-all", 
              isActive ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'hover:bg-secondary text-muted-foreground hover:text-foreground')
            }>
              <Target className="w-4 h-4" />
              <span className="text-sm font-medium">Minhas Metas</span>
            </NavLink>
          </li>

          {isAdmin && (
            <li>
              <NavLink to="/admin" className={({ isActive }) => 
                cn("flex items-center gap-3 px-3 py-2 rounded-lg transition-all", 
                isActive ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'hover:bg-secondary text-muted-foreground hover:text-foreground')
              }>
                <ShieldCheck className="w-4 h-4" />
                <span className="text-sm font-medium">Painel Admin</span>
              </NavLink>
            </li>
          )}
        </ul>

        {/* Footer da Sidebar com Logout */}
        <div className="pt-4 mt-4 border-t border-border/40">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            Sair do Sistema
          </button>
        </div>
      </nav>
    </aside>
  );
}

// Função auxiliar para classes (se não tiver importado, pode usar string simples)
function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}