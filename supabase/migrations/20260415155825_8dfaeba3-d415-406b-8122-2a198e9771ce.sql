
-- Add portal fields to profiles for gestor portals
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS portal_slug text UNIQUE,
ADD COLUMN IF NOT EXISTS portal_password text;

-- Announcements table
CREATE TABLE public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'informativo',
  send_to_all boolean NOT NULL DEFAULT true,
  recipient_user_ids uuid[] DEFAULT '{}',
  created_by uuid,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage announcements" ON public.announcements
FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view active announcements" ON public.announcements
FOR SELECT TO authenticated
USING (active = true AND (send_to_all = true OR auth.uid() = ANY(recipient_user_ids)));

-- Announcement reads tracking
CREATE TABLE public.announcement_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id uuid NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  read_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(announcement_id, user_id)
);

ALTER TABLE public.announcement_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reads" ON public.announcement_reads
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can mark as read" ON public.announcement_reads
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Trigger for updated_at on announcements
CREATE TRIGGER update_announcements_updated_at
BEFORE UPDATE ON public.announcements
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
