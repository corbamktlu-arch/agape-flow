
-- Create enums
CREATE TYPE public.app_role AS ENUM ('admin', 'gestor', 'colaborador', 'solicitante');
CREATE TYPE public.task_priority AS ENUM ('baixa', 'media', 'alta', 'urgente');
CREATE TYPE public.task_status AS ENUM ('a_fazer', 'aguardando_inicio', 'em_andamento', 'em_revisao', 'urgente', 'concluido');

-- Timestamp trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Teams table
CREATE TABLE public.teams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3b82f6',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  phone TEXT,
  avatar_url TEXT,
  department TEXT,
  position TEXT,
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  manager_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  login_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- User roles table (separate per security best practices)
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
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

-- Helper: get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Permissions table
CREATE TABLE public.permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  can_access_dashboard BOOLEAN DEFAULT true,
  can_access_metrics BOOLEAN DEFAULT true,
  can_access_reports BOOLEAN DEFAULT true,
  can_create_task BOOLEAN DEFAULT true,
  can_edit_task BOOLEAN DEFAULT true,
  can_delete_task BOOLEAN DEFAULT false,
  can_move_task BOOLEAN DEFAULT true,
  can_complete_task BOOLEAN DEFAULT true,
  can_start_task BOOLEAN DEFAULT true,
  can_change_deadline BOOLEAN DEFAULT true,
  can_manage_users BOOLEAN DEFAULT false,
  can_edit_users BOOLEAN DEFAULT false,
  can_deactivate_users BOOLEAN DEFAULT false,
  can_reset_password BOOLEAN DEFAULT false,
  can_change_settings BOOLEAN DEFAULT false,
  can_change_simple_password BOOLEAN DEFAULT false,
  can_change_theme BOOLEAN DEFAULT false,
  can_change_logo BOOLEAN DEFAULT false,
  can_access_calendar BOOLEAN DEFAULT true,
  can_print_reports BOOLEAN DEFAULT true,
  can_export_pdf BOOLEAN DEFAULT true,
  can_comment BOOLEAN DEFAULT true,
  can_edit_comments BOOLEAN DEFAULT false,
  can_delete_comments BOOLEAN DEFAULT false,
  can_attach_files BOOLEAN DEFAULT true,
  can_download_attachments BOOLEAN DEFAULT true,
  can_view_activity_log BOOLEAN DEFAULT false,
  can_receive_whatsapp BOOLEAN DEFAULT false,
  can_send_whatsapp BOOLEAN DEFAULT false,
  can_access_integrations BOOLEAN DEFAULT false,
  can_configure_whatsapp BOOLEAN DEFAULT false,
  can_view_team_only BOOLEAN DEFAULT false,
  can_view_all_data BOOLEAN DEFAULT true,
  can_enable_login BOOLEAN DEFAULT false,
  can_disable_login BOOLEAN DEFAULT false,
  can_manage_kanban_columns BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;

-- Kanban columns table
CREATE TABLE public.kanban_columns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  status_key TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  icon TEXT DEFAULT '📋',
  color TEXT DEFAULT '#6b7280',
  dot_color TEXT DEFAULT '#6b7280',
  position INTEGER NOT NULL DEFAULT 0,
  visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.kanban_columns ENABLE ROW LEVEL SECURITY;

-- Tasks table
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  requester TEXT DEFAULT '',
  requester_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assignee TEXT DEFAULT '',
  assignee_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  priority task_priority NOT NULL DEFAULT 'media',
  status task_status NOT NULL DEFAULT 'a_fazer',
  due_date TIMESTAMPTZ,
  start_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  category TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Task comments
CREATE TABLE public.task_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;

-- Task attachments
CREATE TABLE public.task_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.task_attachments ENABLE ROW LEVEL SECURITY;

-- Activity logs
CREATE TABLE public.activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  action TEXT NOT NULL,
  field TEXT,
  old_value TEXT,
  new_value TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name TEXT DEFAULT '',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- System settings
CREATE TABLE public.system_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Notifications
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  read BOOLEAN NOT NULL DEFAULT false,
  entity_type TEXT,
  entity_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Storage bucket for attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('attachments', 'attachments', true);

-- ============ TRIGGERS ============

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON public.teams FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_permissions_updated_at BEFORE UPDATE ON public.permissions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_kanban_columns_updated_at BEFORE UPDATE ON public.kanban_columns FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_task_comments_updated_at BEFORE UPDATE ON public.task_comments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON public.system_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ AUTO-CREATE PROFILE ON SIGNUP ============

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email);
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'solicitante');
  
  INSERT INTO public.permissions (user_id, can_access_dashboard, can_access_metrics, can_access_reports, can_manage_users, can_edit_users, can_delete_task, can_change_settings, can_view_activity_log, can_manage_kanban_columns)
  VALUES (NEW.id, false, false, false, false, false, false, false, false, false);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ RLS POLICIES ============

-- Profiles
CREATE POLICY "Authenticated can view profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can insert profiles" ON public.profiles FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update any profile" ON public.profiles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- User roles
CREATE POLICY "Authenticated can view roles" ON public.user_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Permissions
CREATE POLICY "Users can view own permissions" ON public.permissions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all permissions" ON public.permissions FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage permissions" ON public.permissions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Teams
CREATE POLICY "Authenticated can view teams" ON public.teams FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage teams" ON public.teams FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Tasks
CREATE POLICY "Authenticated can view tasks" ON public.tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert tasks" ON public.tasks FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update tasks" ON public.tasks FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admins can delete tasks" ON public.tasks FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Task comments
CREATE POLICY "Authenticated can view comments" ON public.task_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert comments" ON public.task_comments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update own comments" ON public.task_comments FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can delete comments" ON public.task_comments FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR auth.uid() = user_id);

-- Task attachments
CREATE POLICY "Authenticated can view attachments" ON public.task_attachments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert attachments" ON public.task_attachments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins can delete attachments" ON public.task_attachments FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR auth.uid() = user_id);

-- Activity logs
CREATE POLICY "Admins can view logs" ON public.activity_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gestor'));
CREATE POLICY "Authenticated can insert logs" ON public.activity_logs FOR INSERT TO authenticated WITH CHECK (true);

-- Kanban columns
CREATE POLICY "Authenticated can view columns" ON public.kanban_columns FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage columns" ON public.kanban_columns FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- System settings
CREATE POLICY "Authenticated can view settings" ON public.system_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage settings" ON public.system_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Notifications
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Authenticated can insert notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Storage policies
CREATE POLICY "Authenticated can upload attachments" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'attachments');
CREATE POLICY "Anyone can view attachments" ON storage.objects FOR SELECT USING (bucket_id = 'attachments');
CREATE POLICY "Admins can delete attachments" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'attachments' AND public.has_role(auth.uid(), 'admin'));

-- ============ DEFAULT DATA ============

INSERT INTO public.kanban_columns (status_key, title, icon, color, dot_color, position) VALUES
  ('a_fazer', 'A Fazer', '📋', '#6b7280', '#6b7280', 0),
  ('aguardando_inicio', 'Aguardando Início', '⏳', '#f59e0b', '#f59e0b', 1),
  ('em_andamento', 'Em Andamento', '⚡', '#3b82f6', '#3b82f6', 2),
  ('em_revisao', 'Em Revisão', '🔍', '#8b5cf6', '#8b5cf6', 3),
  ('urgente', 'Urgente', '🔥', '#ef4444', '#ef4444', 4),
  ('concluido', 'Concluído', '✅', '#22c55e', '#22c55e', 5);

INSERT INTO public.system_settings (key, value) VALUES
  ('simple_password', '1234'),
  ('system_name', 'ÁGAPE FLOW'),
  ('system_slogan', 'Tecnologia que conecta resultados'),
  ('primary_color', '#1e3a5f'),
  ('secondary_color', '#3b82f6'),
  ('logo_url', ''),
  ('whatsapp_enabled', 'false'),
  ('whatsapp_number', '');
