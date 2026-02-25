import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LayoutDashboard, Target, ShieldCheck, LogOut, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils"; // Utilizando o utilitário padrão do projeto

export default function Sidebar() {
  const { isAdmin, profile } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <aside
      className={cn(
        "h-screen hidden md:flex flex-col border-r border-gray-200 bg-white transition-all duration-300 sticky top-0 left-0 z-50",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      <nav className="flex flex-col h-full py-6 px-3">

        {/* Header da Sidebar (Nome do Sistema e Toggle) */}
        <div className={cn("flex items-center mb-8", isCollapsed ? "justify-center" : "justify-between px-2")}>
          {!isCollapsed && (
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">
              Kyra
            </h3>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            title={isCollapsed ? "Expandir menu" : "Recolher menu"}
          >
            {isCollapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
          </button>
        </div>

        {/* Info do Usuário (Oculta quando recolhido para ganhar espaço) */}
        <div className={cn("mb-6 px-2 transition-all duration-200", isCollapsed ? "opacity-0 h-0 overflow-hidden" : "opacity-100 mb-6")}>
          <div className="text-sm font-semibold text-slate-800 truncate">
            {profile?.full_name ?? "Usuário"}
          </div>
          <div className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">
            {profile?.role ?? "Player"}
          </div>
        </div>

        {/* Links de Navegação */}
        <ul className="space-y-1.5 flex-1">
          <li>
            <NavLink
              to="/"
              title="Dashboard"
              className={({ isActive }) =>
                cn(
                  "flex items-center rounded-md transition-all duration-200",
                  isCollapsed ? "justify-center py-3" : "px-3 py-2.5 gap-3",
                  isActive
                    ? "bg-slate-100 text-blue-600 font-semibold"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-800 font-medium"
                )
              }
            >
              <LayoutDashboard className={cn("shrink-0", isCollapsed ? "w-5 h-5" : "w-4 h-4")} />
              {!isCollapsed && <span className="text-sm">Dashboard</span>}
            </NavLink>
          </li>

          <li>
            <NavLink
              to="/me"
              title="Minhas Metas"
              className={({ isActive }) =>
                cn(
                  "flex items-center rounded-md transition-all duration-200",
                  isCollapsed ? "justify-center py-3" : "px-3 py-2.5 gap-3",
                  isActive
                    ? "bg-slate-100 text-blue-600 font-semibold"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-800 font-medium"
                )
              }
            >
              <Target className={cn("shrink-0", isCollapsed ? "w-5 h-5" : "w-4 h-4")} />
              {!isCollapsed && <span className="text-sm">Minhas Metas</span>}
            </NavLink>
          </li>

          {isAdmin && (
            <li>
              <NavLink
                to="/admin"
                title="Painel Admin"
                className={({ isActive }) =>
                  cn(
                    "flex items-center rounded-md transition-all duration-200",
                    isCollapsed ? "justify-center py-3" : "px-3 py-2.5 gap-3",
                    isActive
                      ? "bg-slate-100 text-blue-600 font-semibold"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-800 font-medium"
                  )
                }
              >
                <ShieldCheck className={cn("shrink-0", isCollapsed ? "w-5 h-5" : "w-4 h-4")} />
                {!isCollapsed && <span className="text-sm">Painel Admin</span>}
              </NavLink>
            </li>
          )}
        </ul>

        {/* Footer da Sidebar com Logout */}
        <div className="pt-4 mt-4 border-t border-gray-100">
          <button
            onClick={handleLogout}
            title="Sair do Sistema"
            className={cn(
              "flex items-center text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all rounded-md font-medium",
              isCollapsed ? "justify-center py-3 w-full" : "px-3 py-2.5 gap-3 w-full text-sm"
            )}
          >
            <LogOut className={cn("shrink-0", isCollapsed ? "w-5 h-5" : "w-4 h-4")} />
            {!isCollapsed && <span>Sair do Sistema</span>}
          </button>
        </div>
      </nav>
    </aside>
  );
}
