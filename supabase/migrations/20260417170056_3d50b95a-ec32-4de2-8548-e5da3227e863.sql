-- 1. Tabela de configurações padrão por role
CREATE TABLE IF NOT EXISTS public.role_defaults (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role app_role NOT NULL UNIQUE,
  permissions jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.role_defaults ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view role defaults"
ON public.role_defaults FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage role defaults"
ON public.role_defaults FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_role_defaults_updated_at
BEFORE UPDATE ON public.role_defaults
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed defaults
INSERT INTO public.role_defaults (role, permissions) VALUES
  ('gestor', '{"can_access_dashboard":true,"can_access_metrics":true,"can_access_reports":true,"can_access_calendar":true,"can_access_integrations":true,"can_create_task":true,"can_edit_task":true,"can_delete_task":false,"can_move_task":true,"can_start_task":true,"can_complete_task":true,"can_change_deadline":true,"can_comment":true,"can_edit_comments":true,"can_delete_comments":true,"can_attach_files":true,"can_download_attachments":true,"can_manage_users":true,"can_edit_users":true,"can_deactivate_users":true,"can_reset_password":true,"can_enable_login":true,"can_disable_login":true,"can_view_team_only":true,"can_view_all_data":false,"can_view_activity_log":true,"can_export_pdf":true,"can_print_reports":true,"can_send_whatsapp":true,"can_receive_whatsapp":true,"can_configure_whatsapp":false,"can_change_simple_password":true}'::jsonb),
  ('colaborador', '{"can_access_dashboard":true,"can_access_metrics":false,"can_access_reports":false,"can_access_calendar":true,"can_access_integrations":false,"can_create_task":true,"can_edit_task":true,"can_delete_task":false,"can_move_task":true,"can_start_task":true,"can_complete_task":true,"can_change_deadline":true,"can_comment":true,"can_edit_comments":false,"can_delete_comments":false,"can_attach_files":true,"can_download_attachments":true,"can_manage_users":false,"can_edit_users":false,"can_view_team_only":true,"can_view_all_data":false,"can_view_activity_log":false,"can_export_pdf":false,"can_send_whatsapp":true}'::jsonb)
ON CONFLICT (role) DO NOTHING;

-- 2. Coluna para contar exibições de avisos
ALTER TABLE public.announcement_reads
  ADD COLUMN IF NOT EXISTS display_count integer NOT NULL DEFAULT 0;

-- Permitir UPDATE (incrementar contador)
DROP POLICY IF EXISTS "Users can update own reads" ON public.announcement_reads;
CREATE POLICY "Users can update own reads"
ON public.announcement_reads FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);