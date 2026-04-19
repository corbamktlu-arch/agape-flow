import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Bell, AlertTriangle, Info, AlertCircle, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: string;
  send_to_all: boolean;
  send_to_solicitantes_only: boolean;
  recipient_user_ids: string[] | null;
  created_at: string;
}

const TYPE_CONFIG: Record<string, { icon: any; label: string; gradient: string; ring: string; maxDisplays: number | null }> = {
  // Informativo: 1x apenas
  informativo: {
    icon: Info,
    label: 'Informativo',
    gradient: 'from-primary to-primary-light',
    ring: 'ring-primary/20',
    maxDisplays: 1,
  },
  // Alerta: até 2x
  alerta: {
    icon: AlertTriangle,
    label: 'Alerta',
    gradient: 'from-warning to-amber-500',
    ring: 'ring-warning/30',
    maxDisplays: 2,
  },
  // Importante: sempre (null)
  importante: {
    icon: AlertCircle,
    label: 'Importante',
    gradient: 'from-destructive to-rose-600',
    ring: 'ring-destructive/30',
    maxDisplays: null,
  },
};

interface ReadRow {
  announcement_id: string;
  display_count: number;
}

export function AnnouncementPopup() {
  const { user, role } = useAuth();
  const [queue, setQueue] = useState<Announcement[]>([]);
  const [current, setCurrent] = useState<Announcement | null>(null);
  const [reads, setReads] = useState<Map<string, ReadRow>>(new Map());

  useEffect(() => {
    if (!user || !role) return;
    // Only show on fresh login OR if there's an "importante" announcement
    const justLoggedIn = sessionStorage.getItem('agape_just_logged_in') === '1';
    sessionStorage.removeItem('agape_just_logged_in');
    loadPending(justLoggedIn);
  }, [user, role]);

  const loadPending = async (justLoggedIn: boolean) => {
    if (!user) return;
    const { data: allAnnouncements } = await supabase
      .from('announcements')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false });

    if (!allAnnouncements?.length) return;

    const { data: readsData } = await supabase
      .from('announcement_reads')
      .select('announcement_id, display_count')
      .eq('user_id', user.id);

    const readMap = new Map<string, ReadRow>();
    (readsData || []).forEach((r: any) => readMap.set(r.announcement_id, { announcement_id: r.announcement_id, display_count: r.display_count || 0 }));
    setReads(readMap);

    const isColaborador = role === 'colaborador';

    const pending = (allAnnouncements as Announcement[]).filter(a => {
      // Audience filter — "send_to_solicitantes_only" column is reused for colaboradores
      if (a.send_to_solicitantes_only && !isColaborador) return false;
      if (!a.send_to_all && !a.send_to_solicitantes_only) {
        const recipients = a.recipient_user_ids || [];
        if (!recipients.includes(user.id)) return false;
      }

      const cfg = TYPE_CONFIG[a.type] || TYPE_CONFIG.informativo;
      const shown = readMap.get(a.id)?.display_count || 0;

      // "importante" always shows
      if (cfg.maxDisplays === null) return true;

      // others only show right after login (and within max display count)
      if (!justLoggedIn) return false;
      return shown < cfg.maxDisplays;
    });

    setQueue(pending);
    if (pending.length > 0) setCurrent(pending[0]);
  };

  const dismiss = async () => {
    if (!current || !user) return;
    const existing = reads.get(current.id);
    const newCount = (existing?.display_count || 0) + 1;

    if (existing) {
      await supabase
        .from('announcement_reads')
        .update({ display_count: newCount, read_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('announcement_id', current.id);
    } else {
      await supabase.from('announcement_reads').insert({
        announcement_id: current.id,
        user_id: user.id,
        display_count: newCount,
      });
    }

    const remaining = queue.filter(a => a.id !== current.id);
    setQueue(remaining);
    setCurrent(remaining.length > 0 ? remaining[0] : null);
  };

  if (!current) return null;

  const config = TYPE_CONFIG[current.type] || TYPE_CONFIG.informativo;
  const Icon = config.icon;
  const isImportant = current.type === 'importante';

  return (
    <Dialog open={!!current} onOpenChange={(open) => { if (!open) dismiss(); }}>
      <DialogContent className={`sm:max-w-md p-0 overflow-hidden border-0 shadow-2xl ring-4 ${config.ring}`}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          {/* Header gradient */}
          <div className={`bg-gradient-to-br ${config.gradient} p-6 text-white relative`}>
            <button
              onClick={dismiss}
              className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
              aria-label="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-90">{config.label}</span>
                <DialogHeader className="space-y-0">
                  <DialogTitle className="font-heading text-xl text-white leading-tight">{current.title}</DialogTitle>
                </DialogHeader>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 bg-card">
            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{current.message}</p>
            <p className="text-[10px] text-muted-foreground mt-4">
              {format(new Date(current.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
            </p>

            <div className="flex justify-between items-center mt-5 pt-4 border-t border-border">
              {queue.length > 1 ? (
                <span className="text-[11px] text-muted-foreground font-medium">
                  {queue.length} aviso(s) pendente(s)
                </span>
              ) : <span />}
              <Button onClick={dismiss} className={`gap-2 font-semibold bg-gradient-to-r ${config.gradient} text-white border-0 hover:opacity-90`}>
                <Bell className="w-4 h-4" /> {isImportant ? 'Confirmar leitura' : 'OK, entendi'}
              </Button>
            </div>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
