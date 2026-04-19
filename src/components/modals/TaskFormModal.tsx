import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Task, Priority, Status, PRIORITY_CONFIG, STATUS_CONFIG } from '@/types/task';
import { Send } from 'lucide-react';
import { toast } from 'sonner';
import { useSupabaseUsers } from '@/hooks/useSupabaseUsers';

interface TaskFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (task: Partial<Task>) => void;
  editTask?: Task | null;
}

export function TaskFormModal({ open, onClose, onSubmit, editTask }: TaskFormModalProps) {
  const { users, teams } = useSupabaseUsers();
  const [form, setForm] = useState({
    name: '',
    description: '',
    requester: '',
    assignee: '',
    assignee_user_id: '',
    priority: 'media' as Priority,
    status: 'a_fazer' as Status,
    dueDate: '',
    category: '',
    notes: '',
    tags: '',
    team_id: '',
  });

  useEffect(() => {
    if (open) {
      setForm({
        name: editTask?.name || '',
        description: editTask?.description || '',
        requester: editTask?.requester || '',
        assignee: editTask?.assignee || '',
        assignee_user_id: editTask?.assignee_user_id || '',
        priority: editTask?.priority || 'media',
        status: editTask?.status || 'a_fazer',
        dueDate: editTask?.dueDate ? editTask.dueDate.slice(0, 16) : '',
        category: editTask?.category || '',
        notes: editTask?.notes || '',
        tags: editTask?.tags?.join(', ') || '',
        team_id: editTask?.team_id || '',
      });
    }
  }, [open, editTask]);

  const handleAssigneeChange = (userId: string) => {
    const user = users.find(u => u.user_id === userId);
    setForm({
      ...form,
      assignee_user_id: userId,
      assignee: user?.full_name || '',
      team_id: user?.team_id || form.team_id,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Nome da demanda é obrigatório'); return; }
    onSubmit({
      name: form.name,
      description: form.description,
      requester: form.requester,
      assignee: form.assignee,
      assignee_user_id: form.assignee_user_id || undefined,
      priority: form.priority,
      status: editTask ? form.status : 'a_fazer',
      // Only allow dueDate when editing (set by assignee)
      dueDate: editTask && form.dueDate ? new Date(form.dueDate).toISOString() : undefined,
      category: form.category,
      notes: form.notes,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      team_id: form.team_id || undefined,
    });
    toast.success(editTask ? 'Demanda atualizada!' : 'Demanda criada com sucesso!');
    onClose();
  };

  const inputClass = "w-full px-4 py-2.5 bg-muted rounded-xl text-sm border-2 border-transparent outline-none focus:border-primary-light transition-colors";
  const labelClass = "block text-xs font-semibold text-foreground mb-1.5";

  const activeUsers = users.filter(u => u.active);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl shadow-modal max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">{editTask ? 'Editar Demanda' : 'Nova Demanda'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className={labelClass}>Nome da Demanda *</label>
              <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className={inputClass} placeholder="Ex: Redesign da landing page" />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Descrição</label>
              <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className={`${inputClass} min-h-[80px] resize-none`} placeholder="Descreva a demanda..." />
            </div>
            <div>
              <label className={labelClass}>Solicitante</label>
              <input value={form.requester} onChange={e => setForm({...form, requester: e.target.value})} className={inputClass} placeholder="Nome do solicitante" />
            </div>
            <div>
              <label className={labelClass}>Responsável</label>
              <select value={form.assignee_user_id} onChange={e => handleAssigneeChange(e.target.value)} className={inputClass}>
                <option value="">Selecionar responsável</option>
                {activeUsers.map(u => (
                  <option key={u.user_id} value={u.user_id}>{u.full_name} — {u.position || u.department || 'Sem cargo'}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Prioridade</label>
              <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value as Priority})} className={inputClass}>
                {(Object.keys(PRIORITY_CONFIG) as Priority[]).map(p => (
                  <option key={p} value={p}>{PRIORITY_CONFIG[p].label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Equipe</label>
              <select value={form.team_id} onChange={e => setForm({...form, team_id: e.target.value})} className={inputClass}>
                <option value="">Sem equipe</option>
                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            {editTask && (
              <>
                <div>
                  <label className={labelClass}>Status</label>
                  <select value={form.status} onChange={e => setForm({...form, status: e.target.value as Status})} className={inputClass}>
                    {(Object.keys(STATUS_CONFIG) as Status[]).map(s => (
                      <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Prazo (definido pelo responsável)</label>
                  <input type="datetime-local" value={form.dueDate} onChange={e => setForm({...form, dueDate: e.target.value})} className={inputClass} />
                </div>
              </>
            )}
            {!editTask && (
              <div className="md:col-span-2 p-3 bg-muted/50 rounded-xl border border-border">
                <p className="text-[11px] text-muted-foreground">
                  💡 O prazo será definido pelo responsável ao iniciar a demanda. Não é necessário informar agora.
                </p>
              </div>
            )}
            <div>
              <label className={labelClass}>Categoria</label>
              <input value={form.category} onChange={e => setForm({...form, category: e.target.value})} className={inputClass} placeholder="Ex: Design, Desenvolvimento" />
            </div>
            <div>
              <label className={labelClass}>Tags (separadas por vírgula)</label>
              <input value={form.tags} onChange={e => setForm({...form, tags: e.target.value})} className={inputClass} placeholder="frontend, bug, urgente" />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Observações</label>
              <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className={`${inputClass} min-h-[60px] resize-none`} placeholder="Observações adicionais..." />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" className="gradient-primary text-primary-foreground font-semibold gap-2">
              <Send className="w-4 h-4" /> {editTask ? 'Salvar' : 'Criar Demanda'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
