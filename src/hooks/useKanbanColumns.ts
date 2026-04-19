import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface KanbanColumnConfig {
  id: string;
  status_key: string;
  title: string;
  icon: string;
  color: string;
  dot_color: string;
  position: number;
  visible: boolean;
}

export function useKanbanColumns() {
  const [columns, setColumns] = useState<KanbanColumnConfig[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchColumns = useCallback(async () => {
    const { data, error } = await supabase
      .from('kanban_columns')
      .select('*')
      .order('position', { ascending: true });

    if (error) {
      console.error('Error fetching columns:', error);
      // Fallback defaults
      setColumns(getDefaultColumns());
    } else if (data && data.length > 0) {
      setColumns(data.map(c => ({
        id: c.id,
        status_key: c.status_key,
        title: c.title,
        icon: c.icon || '📋',
        color: c.color || '#6b7280',
        dot_color: c.dot_color || '#6b7280',
        position: c.position,
        visible: c.visible,
      })));
    } else {
      // Seed defaults
      const defaults = getDefaultColumns();
      const { error: seedErr } = await supabase.from('kanban_columns').insert(
        defaults.map((c, i) => ({
          status_key: c.status_key,
          title: c.title,
          icon: c.icon,
          color: c.color,
          dot_color: c.dot_color,
          position: i,
          visible: true,
        }))
      );
      if (!seedErr) await fetchColumns();
      else setColumns(defaults);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchColumns(); }, [fetchColumns]);

  const updateColumn = useCallback(async (id: string, updates: Partial<KanbanColumnConfig>) => {
    const dbUpdates: any = {};
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.icon !== undefined) dbUpdates.icon = updates.icon;
    if (updates.color !== undefined) dbUpdates.color = updates.color;
    if (updates.dot_color !== undefined) dbUpdates.dot_color = updates.dot_color;
    if (updates.position !== undefined) dbUpdates.position = updates.position;
    if (updates.visible !== undefined) dbUpdates.visible = updates.visible;

    const { error } = await supabase.from('kanban_columns').update(dbUpdates).eq('id', id);
    if (error) { toast.error('Erro ao atualizar coluna'); return false; }
    await fetchColumns();
    return true;
  }, [fetchColumns]);

  const addColumn = useCallback(async (statusKey: string, title: string, icon: string, color: string, dotColor: string) => {
    const maxPos = columns.length > 0 ? Math.max(...columns.map(c => c.position)) + 1 : 0;
    const { error } = await supabase.from('kanban_columns').insert({
      status_key: statusKey,
      title,
      icon,
      color,
      dot_color: dotColor,
      position: maxPos,
      visible: true,
    });
    if (error) { toast.error('Erro ao adicionar coluna'); return false; }
    await fetchColumns();
    return true;
  }, [columns, fetchColumns]);

  const deleteColumn = useCallback(async (id: string) => {
    const { error } = await supabase.from('kanban_columns').delete().eq('id', id);
    if (error) { toast.error('Erro ao excluir coluna'); return false; }
    await fetchColumns();
    return true;
  }, [fetchColumns]);

  const reorderColumns = useCallback(async (orderedIds: string[]) => {
    const updates = orderedIds.map((id, i) =>
      supabase.from('kanban_columns').update({ position: i }).eq('id', id)
    );
    await Promise.all(updates);
    await fetchColumns();
  }, [fetchColumns]);

  return { columns, loading, updateColumn, addColumn, deleteColumn, reorderColumns, refetch: fetchColumns };
}

function getDefaultColumns(): KanbanColumnConfig[] {
  return [
    { id: '1', status_key: 'a_fazer', title: 'A Fazer', icon: '📋', color: '#6b7280', dot_color: '#6b7280', position: 0, visible: true },
    { id: '2', status_key: 'aguardando_inicio', title: 'Aguardando Início', icon: '⏳', color: '#f59e0b', dot_color: '#f59e0b', position: 1, visible: true },
    { id: '3', status_key: 'em_andamento', title: 'Em Andamento', icon: '⚡', color: '#3b82f6', dot_color: '#3b82f6', position: 2, visible: true },
    { id: '4', status_key: 'em_revisao', title: 'Em Revisão', icon: '🔍', color: '#8b5cf6', dot_color: '#8b5cf6', position: 3, visible: true },
    { id: '5', status_key: 'urgente', title: 'Urgente', icon: '🔥', color: '#ef4444', dot_color: '#ef4444', position: 4, visible: true },
    { id: '6', status_key: 'concluido', title: 'Concluído', icon: '✅', color: '#22c55e', dot_color: '#22c55e', position: 5, visible: true },
  ];
}
