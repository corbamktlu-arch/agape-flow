import { useEffect, useState, useCallback } from 'react';
import { Bell, CheckCheck, Inbox } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string | null;
  read: boolean;
  created_at: string;
  entity_id: string | null;
  entity_type: string | null;
}

const TYPE_DOT: Record<string, string> = {
  info: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  error: 'bg-destructive',
};

export function NotificationsDropdown() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);
    setItems((data || []) as NotificationItem[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  // Realtime updates
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel('notifications-' + user.id)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, load]);

  const unreadCount = items.filter(i => !i.read).length;

  const markAllRead = async () => {
    if (!user || unreadCount === 0) return;
    await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false);
    load();
  };

  const markRead = async (id: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    setItems(prev => prev.map(i => i.id === id ? { ...i, read: true } : i));
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className="relative p-2 rounded-lg hover:bg-muted transition-colors"
          aria-label="Notificações"
        >
          <Bell className="w-5 h-5 text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center shadow-sm">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[380px] p-0 shadow-elevated border-border">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div>
            <h3 className="font-heading font-bold text-sm text-foreground">Notificações</h3>
            <p className="text-[11px] text-muted-foreground">{unreadCount > 0 ? `${unreadCount} não lida(s)` : 'Tudo em dia'}</p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-[11px] font-semibold text-primary hover:text-primary/80 flex items-center gap-1"
            >
              <CheckCheck className="w-3.5 h-3.5" /> Marcar todas
            </button>
          )}
        </div>

        <div className="max-h-[420px] overflow-y-auto">
          {loading && items.length === 0 && (
            <div className="py-10 text-center text-xs text-muted-foreground">Carregando...</div>
          )}
          {!loading && items.length === 0 && (
            <div className="py-12 px-6 flex flex-col items-center justify-center text-center">
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-3">
                <Inbox className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-semibold text-foreground">Nenhuma notificação</p>
              <p className="text-xs text-muted-foreground mt-1">Você será avisado por aqui sobre atualizações importantes.</p>
            </div>
          )}
          <AnimatePresence initial={false}>
            {items.map(item => {
              const dot = TYPE_DOT[item.type || 'info'] || TYPE_DOT.info;
              return (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  onClick={() => markRead(item.id)}
                  className={`w-full text-left px-4 py-3 border-b border-border/60 hover:bg-muted/40 transition-colors flex gap-3 ${!item.read ? 'bg-primary/[0.03]' : ''}`}
                >
                  <div className="relative mt-1.5">
                    <div className={`w-2 h-2 rounded-full ${dot}`} />
                    {!item.read && <div className={`absolute inset-0 w-2 h-2 rounded-full ${dot} animate-ping opacity-60`} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-snug ${!item.read ? 'font-semibold text-foreground' : 'text-foreground/80'}`}>
                      {item.title}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{item.message}</p>
                    <p className="text-[10px] text-muted-foreground/70 mt-1">
                      {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: ptBR })}
                    </p>
                  </div>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
