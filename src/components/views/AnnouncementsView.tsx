import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSupabaseUsers } from '@/hooks/useSupabaseUsers';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Plus, Bell, Trash2, Edit3, Info, AlertTriangle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: string;
  send_to_all: boolean;
  send_to_solicitantes_only: boolean;
  recipient_user_ids: string[];
  active: boolean;
  created_at: string;
}

const TYPES = [
  { value: 'informativo', label: 'Informativo', icon: Info, color: 'text-primary-light' },
  { value: 'alerta', label: 'Alerta', icon: AlertTriangle, color: 'text-warning' },
  { value: 'importante', label: 'Importante', icon: AlertCircle, color: 'text-urgent' },
];

export function AnnouncementsView() {
  const { user, isAdmin } = useAuth();
  const { users } = useSupabaseUsers();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<Announcement | null>(null);
  const [form, setForm] = useState({ title: '', message: '', type: 'informativo', audience: 'all' as 'all' | 'solicitantes' | 'specific', recipient_user_ids: [] as string[] });

  const fetchAnnouncements = useCallback(async () => {
    const { data } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
    setAnnouncements((data || []) as Announcement[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAnnouncements(); }, [fetchAnnouncements]);

  const openNew = () => {
    setEditItem(null);
    setForm({ title: '', message: '', type: 'informativo', audience: 'all', recipient_user_ids: [] });
    setShowForm(true);
  };

  const openEdit = (a: Announcement) => {
    setEditItem(a);
    const audience: 'all' | 'solicitantes' | 'specific' =
      a.send_to_solicitantes_only ? 'solicitantes' : a.send_to_all ? 'all' : 'specific';
    setForm({ title: a.title, message: a.message, type: a.type, audience, recipient_user_ids: a.recipient_user_ids || [] });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) { toast.error('Preencha título e mensagem'); return; }

    const payload = {
      title: form.title,
      message: form.message,
      type: form.type,
      send_to_all: form.audience === 'all',
      send_to_solicitantes_only: form.audience === 'solicitantes',
      recipient_user_ids: form.audience === 'specific' ? form.recipient_user_ids : [],
      created_by: user?.id,
    };

    if (editItem) {
      await supabase.from('announcements').update(payload).eq('id', editItem.id);
    } else {
      await supabase.from('announcements').insert(payload);
    }
    toast.success(editItem ? 'Aviso atualizado!' : 'Aviso criado!');
    setShowForm(false);
    await fetchAnnouncements();
  };

  const toggleActive = async (a: Announcement) => {
    await supabase.from('announcements').update({ active: !a.active }).eq('id', a.id);
    await fetchAnnouncements();
  };

  const deleteAnnouncement = async (id: string) => {
    if (!confirm('Excluir este aviso?')) return;
    await supabase.from('announcements').delete().eq('id', id);
    await fetchAnnouncements();
    toast.success('Aviso excluído');
  };

  const toggleRecipient = (userId: string) => {
    setForm(prev => ({
      ...prev,
      recipient_user_ids: prev.recipient_user_ids.includes(userId)
        ? prev.recipient_user_ids.filter(id => id !== userId)
        : [...prev.recipient_user_ids, userId],
    }));
  };

  const inputClass = "w-full px-4 py-2.5 bg-muted rounded-xl text-sm border-2 border-transparent outline-none focus:border-primary-light transition-colors";

  if (!isAdmin) return <p className="text-sm text-muted-foreground text-center py-20">Apenas administradores podem gerenciar avisos.</p>;

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-heading font-bold text-foreground flex items-center gap-2">
            <Bell className="w-6 h-6 text-primary-light" /> Avisos
          </h2>
          <p className="text-sm text-muted-foreground">Comunicação interna com usuários</p>
        </div>
        <Button onClick={openNew} className="gradient-primary text-primary-foreground font-semibold gap-2">
          <Plus className="w-4 h-4" /> Novo Aviso
        </Button>
      </div>

      <div className="space-y-3">
        {announcements.map(a => {
          const typeConf = TYPES.find(t => t.value === a.type) || TYPES[0];
          const Icon = typeConf.icon;
          return (
            <div key={a.id} className={`bg-card rounded-xl p-5 shadow-card border border-border ${!a.active ? 'opacity-50' : ''}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${typeConf.color}`} />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-heading font-semibold text-foreground">{a.title}</h4>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${a.active ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
                        {a.active ? 'Ativo' : 'Inativo'}
                      </span>
                      <span className="text-[10px] text-muted-foreground px-2 py-0.5 rounded-full bg-muted">
                        {a.send_to_solicitantes_only ? 'Solicitantes' : a.send_to_all ? 'Todos' : `${a.recipient_user_ids?.length || 0} usuário(s)`}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{a.message}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">
                      {format(new Date(a.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Switch checked={a.active} onCheckedChange={() => toggleActive(a)} />
                  <button onClick={() => openEdit(a)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                    <Edit3 className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <button onClick={() => deleteAnnouncement(a.id)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                    <Trash2 className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {announcements.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Bell className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">Nenhum aviso criado</p>
          </div>
        )}
      </div>

      {/* Form Modal */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-lg shadow-modal max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">{editItem ? 'Editar Aviso' : 'Novo Aviso'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Título *</label>
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className={inputClass} placeholder="Título do aviso" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Mensagem *</label>
              <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} className={`${inputClass} min-h-[100px] resize-none`} placeholder="Escreva a mensagem..." />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Tipo</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className={inputClass}>
                {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-2">Destinatários</label>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { v: 'all', label: 'Todos' },
                  { v: 'solicitantes', label: 'Solicitantes' },
                  { v: 'specific', label: 'Específicos' },
                ] as const).map(opt => (
                  <button
                    key={opt.v}
                    type="button"
                    onClick={() => setForm({ ...form, audience: opt.v })}
                    className={`px-3 py-2.5 rounded-xl text-xs font-semibold border-2 transition-all ${
                      form.audience === opt.v
                        ? 'bg-primary-light/10 border-primary-light text-primary-light'
                        : 'bg-muted border-transparent text-muted-foreground hover:bg-muted/70'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            {form.audience === 'specific' && (
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Selecionar destinatários</label>
                <div className="max-h-[200px] overflow-y-auto space-y-1 border border-border rounded-xl p-2">
                  {users.map(u => (
                    <label key={u.user_id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.recipient_user_ids.includes(u.user_id)}
                        onChange={() => toggleRecipient(u.user_id)}
                        className="rounded"
                      />
                      <span className="text-sm text-foreground">{u.full_name}</span>
                      <span className="text-[10px] text-muted-foreground">{u.email}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button type="submit" className="gradient-primary text-primary-foreground font-semibold">
                {editItem ? 'Salvar' : 'Criar Aviso'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
