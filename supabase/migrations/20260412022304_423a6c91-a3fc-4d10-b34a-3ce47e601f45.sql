
-- Fix permissive task policies
DROP POLICY "Authenticated can insert tasks" ON public.tasks;
CREATE POLICY "Authenticated can insert tasks" ON public.tasks FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by OR created_by IS NULL);

DROP POLICY "Authenticated can update tasks" ON public.tasks;
CREATE POLICY "Task assignees and admins can update" ON public.tasks FOR UPDATE TO authenticated USING (
  auth.uid() = assignee_user_id OR auth.uid() = created_by OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gestor')
);

-- Fix permissive comment policies
DROP POLICY "Authenticated can insert comments" ON public.task_comments;
CREATE POLICY "Authenticated can insert own comments" ON public.task_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Fix permissive attachment policies  
DROP POLICY "Authenticated can insert attachments" ON public.task_attachments;
CREATE POLICY "Authenticated can insert own attachments" ON public.task_attachments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Fix permissive activity log policies
DROP POLICY "Authenticated can insert logs" ON public.activity_logs;
CREATE POLICY "Authenticated can insert own logs" ON public.activity_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
