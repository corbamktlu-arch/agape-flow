import { useState, useEffect } from 'react';
import { useKanbanColumns, KanbanColumnConfig } from '@/hooks/useKanbanColumns';
import { useSupabaseTasks } from '@/hooks/useSupabaseTasks';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Edit3, Trash2, GripVertical, Eye, EyeOff, Save, ChevronUp, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export function KanbanSettingsView() {
  const { columns, updateColumn, addColumn, deleteColumn, reorderColumns } = useKanbanColumns();
  const { tasks } = useSupabaseTasks();
  const [showForm, setShowForm] = useState(false);
  const [editCol, setEditCol] = useState<KanbanColumnConfig | null>(null);
  const [form, setForm] = useState({ status_key: '', title: '', icon: '📋', color: '#3b82f6', dot_color: '#3b82f6' });

  const openNew = () => {
    setEditCol(null);
    setForm({ status_key: '', title: '', icon: '📋', color: '#3b82f6', dot_color: '#3b82f6' });
    setShowForm(true);
  };

  const openEdit = (col: KanbanColumnConfig) => {
    setEditCol(col);
    setForm({ status_key: col.status_key, title: col.title, icon: col.icon, color: col.color, dot_color: col.dot_color });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.status_key.trim()) { toast.error('Título e chave são obrigatórios'); return; }

    if (editCol) {
      await updateColumn(editCol.id, { title: form.title, icon: form.icon, color: form.color, dot_color: form.dot_color });
      toast.success('Coluna atualizada!');
    } else {
      await addColumn(form.status_key, form.title, form.icon, form.color, form.dot_color);
      toast.success('Coluna adicionada!');
    }
    setShowForm(false);
  };

  const handleDelete = async (col: KanbanColumnConfig) => {
    if (!confirm(`Excluir a coluna "${col.title}"?`)) return;
    await deleteColumn(col.id);
    toast.success('Coluna excluída');
  };

  const toggleVisibility = async (col: KanbanColumnConfig) => {
    await updateColumn(col.id, { visible: !col.visible });
  };

  const moveUp = async (index: number) => {
    if (index === 0) return;
    const ids = columns.map(c => c.id);
    [ids[index], ids[index - 1]] = [ids[index - 1], ids[index]];
    await reorderColumns(ids);
  };

  const moveDown = async (index: number) => {
    if (index >= columns.length - 1) return;
    const ids = columns.map(c => c.id);
    [ids[index], ids[index + 1]] = [ids[index + 1], ids[index]];
    await reorderColumns(ids);
  };

  // Count tasks per column
  const countForColumn = (statusKey: string) =>
    tasks.filter(t => t.status === statusKey).length;

  const inputClass = "w-full px-4 py-2.5 bg-muted rounded-xl text-sm border-2 border-transparent outline-none focus:border-primary-light transition-colors";
  const labelClass = "block text-xs font-semibold text-foreground mb-1.5";

  return (
    <div className="space-y-7 animate-slide-in">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-heading font-extrabold text-primary-light tracking-tight">Colunas Kanban</h2>
          <p className="text-sm text-muted-foreground mt-1">Personalize o fluxo de trabalho do seu quadro.</p>
        </div>
        <Button
          onClick={openNew}
          className="bg-gradient-to-r from-primary to-primary-light text-white font-semibold gap-2 rounded-xl shadow-elevated hover:shadow-welcome transition-all px-5"
        >
          <Plus className="w-4 h-4" /> Nova Coluna
        </Button>
      </div>

      {/* List */}
      <div className="space-y-3">
        {columns.map((col, i) => {
          const count = countForColumn(col.status_key);
          return (
            <motion.div
              key={col.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className={`group bg-card rounded-2xl shadow-card border border-border hover:shadow-elevated hover:border-primary-light/20 transition-all px-5 py-4 flex items-center gap-4 ${!col.visible ? 'opacity-60' : ''}`}
            >
              {/* Drag handle + reorder */}
              <div className="flex items-center gap-1">
                <GripVertical className="w-4 h-4 text-muted-foreground/50" />
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => moveUp(i)}
                    disabled={i === 0}
                    className="text-muted-foreground hover:text-primary-light disabled:opacity-30 transition-colors"
                  >
                    <ChevronUp className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => moveDown(i)}
                    disabled={i === columns.length - 1}
                    className="text-muted-foreground hover:text-primary-light disabled:opacity-30 transition-colors"
                  >
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Color dot */}
              <div
                className="w-3 h-3 rounded-full shrink-0 ring-4 ring-offset-2 ring-offset-card"
                style={{ backgroundColor: col.dot_color, boxShadow: `0 0 0 4px ${col.dot_color}15` }}
              />

              {/* Title + count */}
              <div className="flex-1 min-w-0">
                <p className="text-base font-heading font-bold text-foreground leading-tight">{col.title}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {count} {count === 1 ? 'demanda vinculada' : 'demandas vinculadas'}
                </p>
              </div>

              {/* Status badge */}
              <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider border ${
                col.visible
                  ? 'bg-success/10 text-success border-success/20'
                  : 'bg-muted text-muted-foreground border-border'
              }`}>
                {col.visible ? 'Ativa' : 'Inativa'}
              </span>

              {/* Actions */}
              <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => toggleVisibility(col)}
                  className="p-2 rounded-lg hover:bg-muted transition-colors"
                  title={col.visible ? 'Ocultar' : 'Mostrar'}
                >
                  {col.visible
                    ? <Eye className="w-4 h-4 text-muted-foreground" />
                    : <EyeOff className="w-4 h-4 text-muted-foreground" />
                  }
                </button>
                <button
                  onClick={() => openEdit(col)}
                  className="p-2 rounded-lg hover:bg-primary-light/10 hover:text-primary-light transition-colors"
                >
                  <Edit3 className="w-4 h-4 text-muted-foreground" />
                </button>
                <button
                  onClick={() => handleDelete(col)}
                  className="p-2 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </motion.div>
          );
        })}

        {columns.length === 0 && (
          <div className="bg-card rounded-2xl border border-border py-16 text-center">
            <p className="text-sm text-muted-foreground">Nenhuma coluna configurada</p>
          </div>
        )}
      </div>

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-md shadow-modal">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">{editCol ? 'Editar Coluna' : 'Nova Coluna'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div>
              <label className={labelClass}>Título *</label>
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className={inputClass} placeholder="Ex: Em Andamento" />
            </div>
            {!editCol && (
              <div>
                <label className={labelClass}>Chave do Status * (sem espaços)</label>
                <input value={form.status_key} onChange={e => setForm({ ...form, status_key: e.target.value.replace(/\s/g, '_').toLowerCase() })} className={inputClass} placeholder="em_andamento" />
              </div>
            )}
            <div>
              <label className={labelClass}>Ícone (emoji)</label>
              <input value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })} className={inputClass} placeholder="⚡" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Cor da coluna</label>
                <input type="color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} className="w-full h-11 rounded-xl cursor-pointer border border-border" />
              </div>
              <div>
                <label className={labelClass}>Cor da bolinha</label>
                <input type="color" value={form.dot_color} onChange={e => setForm({ ...form, dot_color: e.target.value })} className="w-full h-11 rounded-xl cursor-pointer border border-border" />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button type="submit" className="bg-gradient-to-r from-primary to-primary-light text-white font-semibold gap-2">
                <Save className="w-4 h-4" /> {editCol ? 'Salvar' : 'Criar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
