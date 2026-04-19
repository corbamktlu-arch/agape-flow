import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Task, Status, Priority } from '@/types/task';
import { useAuth } from '@/contexts/AuthContext';
import { useActivityLog } from '@/hooks/useActivityLog';
import { toast } from 'sonner';

function mapDbTask(t: any): Task {
  return {
    id: t.id,
    name: t.name,
    description: t.description || '',
    requester: t.requester || '',
    assignee: t.assignee || '',
    assignee_user_id: t.assignee_user_id,
    requester_user_id: t.requester_user_id,
    priority: t.priority as Priority,
    status: t.status as Status,
    createdAt: t.created_at,
    startDate: t.start_date || undefined,
    dueDate: t.due_date || undefined,
    completedAt: t.completed_at || undefined,
    tags: t.tags || [],
    category: t.category || '',
    notes: t.notes || '',
    team_id: t.team_id,
    created_by: t.created_by,
    history: [],
    comment_count: t.comment_count,
    attachment_count: t.attachment_count,
  };
}

export function useSupabaseTasks() {
  const { user, profile, role, permissions, isAdmin } = useAuth();
  const { logActivity } = useActivityLog();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const { data: tasksData, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tasks:', error);
      setLoading(false);
      return;
    }

    const taskIds = (tasksData || []).map(t => t.id);
    let commentCounts: Record<string, number> = {};
    let attachmentCounts: Record<string, number> = {};

    if (taskIds.length > 0) {
      const [commentsRes, attachmentsRes] = await Promise.all([
        supabase.from('task_comments').select('task_id'),
        supabase.from('task_attachments').select('task_id'),
      ]);
      (commentsRes.data || []).forEach(c => { commentCounts[c.task_id] = (commentCounts[c.task_id] || 0) + 1; });
      (attachmentsRes.data || []).forEach(a => { attachmentCounts[a.task_id] = (attachmentCounts[a.task_id] || 0) + 1; });
    }

    let mapped = (tasksData || []).map(t => ({
      ...mapDbTask(t),
      comment_count: commentCounts[t.id] || 0,
      attachment_count: attachmentCounts[t.id] || 0,
    }));

    // Scope by role
    if (!isAdmin) {
      if (role === 'gestor' && profile?.team_id) {
        mapped = mapped.filter(t =>
          t.team_id === profile.team_id ||
          t.assignee_user_id === user.id ||
          t.created_by === user.id
        );
      } else if (role === 'colaborador') {
        // Colaborador sees tasks of their gestor's scope (same team_id as their gestor)
        // plus tasks they created or are assigned to.
        let gestorTeamId: string | null = null;
        if (profile?.manager_id) {
          const { data: gestorProfile } = await supabase
            .from('profiles')
            .select('team_id')
            .eq('id', profile.manager_id)
            .maybeSingle();
          gestorTeamId = gestorProfile?.team_id || null;
        }
        mapped = mapped.filter(t =>
          t.created_by === user.id ||
          t.assignee_user_id === user.id ||
          (profile?.team_id && t.team_id === profile.team_id) ||
          (gestorTeamId && t.team_id === gestorTeamId)
        );
      }
    }

    setTasks(mapped);
    setLoading(false);
  }, [user, role, isAdmin, profile]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const addTask = useCallback(async (task: Partial<Task>) => {
    if (!user) return;
    const { data, error } = await supabase.from('tasks').insert({
      name: task.name!,
      description: task.description || '',
      requester: task.requester || '',
      assignee: task.assignee || '',
      assignee_user_id: task.assignee_user_id || null,
      requester_user_id: task.requester_user_id || null,
      priority: (task.priority || 'media') as any,
      status: 'a_fazer' as any,
      tags: task.tags || [],
      category: task.category || '',
      notes: task.notes || '',
      team_id: task.team_id || null,
      created_by: user.id,
    }).select('id').single();

    if (error) {
      toast.error('Erro ao criar demanda');
      console.error(error);
    } else {
      await logActivity({
        action: 'Demanda criada',
        entity_type: 'task',
        entity_id: data?.id,
        new_value: task.name,
      });
      await fetchTasks();
    }
  }, [user, logActivity, fetchTasks]);

  const updateTask = useCallback(async (id: string, updates: Partial<Task>) => {
    if (!user) return;
    const oldTask = tasks.find(t => t.id === id);

    // Colaborador can only edit own tasks (created_by or assigned to them)
    if (role === 'colaborador' && !isAdmin && oldTask) {
      const isOwner = oldTask.created_by === user.id || oldTask.assignee_user_id === user.id;
      if (!isOwner) {
        toast.error('Você só pode editar demandas próprias');
        return;
      }
    }

    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.requester !== undefined) dbUpdates.requester = updates.requester;
    if (updates.assignee !== undefined) dbUpdates.assignee = updates.assignee;
    if (updates.assignee_user_id !== undefined) dbUpdates.assignee_user_id = updates.assignee_user_id;
    if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate || null;
    if (updates.startDate !== undefined) dbUpdates.start_date = updates.startDate || null;
    if (updates.completedAt !== undefined) dbUpdates.completed_at = updates.completedAt || null;
    if (updates.tags !== undefined) dbUpdates.tags = updates.tags;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
    if (updates.team_id !== undefined) dbUpdates.team_id = updates.team_id;

    const { error } = await supabase.from('tasks').update(dbUpdates).eq('id', id);
    if (error) {
      toast.error('Erro ao atualizar demanda');
      console.error(error);
    } else {
      // Log changes
      if (oldTask) {
        if (updates.status && updates.status !== oldTask.status) {
          await logActivity({ action: 'Status alterado', entity_type: 'task', entity_id: id, field: 'status', old_value: oldTask.status, new_value: updates.status });
        }
        if (updates.priority && updates.priority !== oldTask.priority) {
          await logActivity({ action: 'Prioridade alterada', entity_type: 'task', entity_id: id, field: 'priority', old_value: oldTask.priority, new_value: updates.priority });
        }
        if (updates.assignee && updates.assignee !== oldTask.assignee) {
          await logActivity({ action: 'Responsável alterado', entity_type: 'task', entity_id: id, field: 'assignee', old_value: oldTask.assignee, new_value: updates.assignee });
        }
        if (updates.dueDate && updates.dueDate !== oldTask.dueDate) {
          await logActivity({ action: 'Prazo alterado', entity_type: 'task', entity_id: id, field: 'due_date', old_value: oldTask.dueDate || '', new_value: updates.dueDate });
        }
        if (updates.name && updates.name !== oldTask.name) {
          await logActivity({ action: 'Demanda editada', entity_type: 'task', entity_id: id, field: 'name', old_value: oldTask.name, new_value: updates.name });
        }
      }
      await fetchTasks();
    }
  }, [user, tasks, logActivity, fetchTasks, role, isAdmin]);

  const deleteTask = useCallback(async (id: string) => {
    const task = tasks.find(t => t.id === id);
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) {
      toast.error('Erro ao excluir demanda');
    } else {
      await logActivity({ action: 'Demanda excluída', entity_type: 'task', entity_id: id, old_value: task?.name });
      await fetchTasks();
    }
  }, [tasks, logActivity, fetchTasks]);

  const moveTask = useCallback(async (id: string, newStatus: Status) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const updates: any = { status: newStatus };
    if (newStatus === 'concluido' && !task.completedAt) {
      updates.completed_at = new Date().toISOString();
    }
    if (newStatus === 'em_andamento' && !task.startDate) {
      updates.start_date = new Date().toISOString();
    }

    const { error } = await supabase.from('tasks').update(updates).eq('id', id);
    if (error) {
      toast.error('Erro ao mover demanda');
    } else {
      await logActivity({
        action: newStatus === 'concluido' ? 'Demanda concluída' : 'Status alterado',
        entity_type: 'task',
        entity_id: id,
        field: 'status',
        old_value: task.status,
        new_value: newStatus,
      });

      // Notify task creator when completed
      if (newStatus === 'concluido' && task.created_by) {
        await supabase.from('notifications').insert({
          user_id: task.created_by,
          title: 'Demanda concluída',
          message: `A demanda "${task.name}" foi concluída com sucesso.`,
          type: 'task_completed',
          entity_type: 'task',
          entity_id: id,
        });
      }

      await fetchTasks();
    }
  }, [tasks, logActivity, fetchTasks]);

  const startTask = useCallback(async (id: string, dueDate?: string) => {
    if (!user) return;
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const now = new Date().toISOString();
    const updates: any = {
      status: 'em_andamento',
      start_date: now,
      assignee_user_id: user.id,
      assignee: profile?.full_name || '',
    };
    if (dueDate) updates.due_date = dueDate;

    const { error } = await supabase.from('tasks').update(updates).eq('id', id);
    if (error) {
      toast.error('Erro ao iniciar demanda');
    } else {
      await logActivity({
        action: 'Demanda iniciada',
        entity_type: 'task',
        entity_id: id,
        field: 'status',
        old_value: task.status,
        new_value: 'em_andamento',
        metadata: dueDate ? { prazo_definido: dueDate } : undefined,
      });
      if (dueDate) {
        await logActivity({
          action: 'Prazo definido',
          entity_type: 'task',
          entity_id: id,
          field: 'due_date',
          new_value: dueDate,
        });
      }
      toast.success('Demanda iniciada!');
      await fetchTasks();
    }
  }, [tasks, user, profile, logActivity, fetchTasks]);

  return { tasks, loading, addTask, updateTask, deleteTask, moveTask, startTask, refetch: fetchTasks };
}
