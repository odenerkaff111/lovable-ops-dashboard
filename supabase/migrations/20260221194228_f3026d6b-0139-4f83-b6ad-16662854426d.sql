
-- Enum for user roles/functions
CREATE TYPE public.user_function AS ENUM ('sdr', 'closer', 'social_seller', 'gestor', 'outro');

-- Enum for appointment status
CREATE TYPE public.appointment_status AS ENUM ('pendente', 'no_show', 'venda_realizada', 'venda_nao_realizada');

-- Enum for app roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  user_function public.user_function NOT NULL DEFAULT 'sdr',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL DEFAULT 'user',
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Task types table
CREATE TABLE public.task_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default task types
INSERT INTO public.task_types (name, label) VALUES
  ('lead_criado', 'Lead Criado'),
  ('lead_engajado', 'Lead Engajado'),
  ('follow_up', 'Follow Up');

-- User goals (meta diária por tipo de tarefa por usuário)
CREATE TABLE public.user_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  task_type_id UUID REFERENCES public.task_types(id) ON DELETE CASCADE NOT NULL,
  daily_goal INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, task_type_id)
);

ALTER TABLE public.user_goals ENABLE ROW LEVEL SECURITY;

-- Activity log (immutable event log)
CREATE TABLE public.activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  action_type TEXT NOT NULL,
  lead_id TEXT NOT NULL,
  event_timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- Appointments (agendamentos)
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id TEXT NOT NULL,
  lead_name TEXT NOT NULL,
  scheduled_date TIMESTAMPTZ NOT NULL,
  responsible_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status public.appointment_status NOT NULL DEFAULT 'pendente',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Profiles: all authenticated can read, admins can manage
CREATE POLICY "Authenticated users can view profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can insert profiles"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete profiles"
  ON public.profiles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- User roles: admins can manage
CREATE POLICY "Authenticated users can view roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can insert roles"
  ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
  ON public.user_roles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Task types: all can read
CREATE POLICY "Anyone can view task types"
  ON public.task_types FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can manage task types"
  ON public.task_types FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- User goals: all authenticated can read, admins can manage
CREATE POLICY "Authenticated users can view goals"
  ON public.user_goals FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can manage goals"
  ON public.user_goals FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update goals"
  ON public.user_goals FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete goals"
  ON public.user_goals FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Activity log: all authenticated can read, service role inserts via webhook
CREATE POLICY "Authenticated users can view activity log"
  ON public.activity_log FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Service role can insert activity"
  ON public.activity_log FOR INSERT TO anon
  WITH CHECK (true);

-- Appointments: all authenticated can read
CREATE POLICY "Authenticated users can view appointments"
  ON public.appointments FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Service role can insert appointments"
  ON public.appointments FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "Service role can update appointments"
  ON public.appointments FOR UPDATE TO anon
  USING (true);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_goals_updated_at
  BEFORE UPDATE ON public.user_goals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable realtime for activity_log and appointments
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_log;
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
