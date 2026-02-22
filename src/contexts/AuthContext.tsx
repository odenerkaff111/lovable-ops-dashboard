import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean; // No nosso sistema, isso significa "Tem acesso gerencial"
  profile: { 
    id: string; 
    full_name: string; 
    role: string; 
    active: boolean;
  } | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  isAdmin: false,
  profile: null,
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profile, setProfile] = useState<AuthContextType["profile"]>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setTimeout(() => {
          fetchUserData(session.user.id);
        }, 0);
      } else {
        setIsAdmin(false);
        setProfile(null);
        setLoading(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchUserData(userId: string) {
    console.log("🕵️‍♂️ Buscando perfil do usuário:", userId);
    
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    
    if (error) {
      console.error("🚨 Erro ao buscar perfil:", error.message);
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    if (data) {
      setProfile({
        id: data.id,
        full_name: data.full_name,
        role: data.role,
        active: data.active,
      });
      
      // REGRA DE ACESSO: 
      // Adicione aqui todos os cargos que podem ver o Dashboard e o Painel Admin
      const managerRoles = ['admin', 'manager', 'head_comercial', 'gestor'];
      const hasManagerAccess = managerRoles.includes(data.role?.toLowerCase());
      
      setIsAdmin(hasManagerAccess);
      console.log(`✅ Acesso liberado para o cargo: ${data.role} | Gestor: ${hasManagerAccess}`);
    } else {
      setIsAdmin(false);
    }
    
    setLoading(false);
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, isAdmin, profile }}>
      {children}
    </AuthContext.Provider>
  );
}