import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';

interface CompletedNotification {
  id: string;
  title: string;
  message: string;
  entity_id: string | null;
}

export function CompletionNotification() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<CompletedNotification[]>([]);
  const [current, setCurrent] = useState<CompletedNotification | null>(null);

  useEffect(() => {
    if (!user) return;
    loadUnread();
  }, [user]);

  const loadUnread = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .eq('read', false)
      .eq('type', 'task_completed')
      .order('created_at', { ascending: false })
      .limit(10);

    const mapped = (data || []).map(n => ({
      id: n.id,
      title: n.title,
      message: n.message,
      entity_id: n.entity_id,
    }));
    setNotifications(mapped);
    if (mapped.length > 0) setCurrent(mapped[0]);
  };

  const markRead = async () => {
    if (!current) return;
    await supabase.from('notifications').update({ read: true }).eq('id', current.id);
    const remaining = notifications.filter(n => n.id !== current.id);
    setNotifications(remaining);
    setCurrent(remaining.length > 0 ? remaining[0] : null);
  };

  if (!current) return null;

  return (
    <Dialog open={!!current} onOpenChange={() => markRead()}>
      <DialogContent className="sm:max-w-sm shadow-modal">
        <DialogHeader>
          <div className="mx-auto w-14 h-14 rounded-2xl bg-success/10 flex items-center justify-center mb-3">
            <CheckCircle2 className="w-7 h-7 text-success" />
          </div>
          <DialogTitle className="text-center font-heading">{current.title}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground text-center">{current.message}</p>
        <Button onClick={markRead} className="w-full mt-4 gradient-primary text-primary-foreground font-semibold">
          OK
        </Button>
      </DialogContent>
    </Dialog>
  );
}
