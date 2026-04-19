import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ActivityLogEntry {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  field: string | null;
  old_value: string | null;
  new_value: string | null;
  user_id: string | null;
  user_name: string | null;
  created_at: string;
  metadata: any;
}

export function useActivityLog() {
  const { user, profile } = useAuth();

  const logActivity = useCallback(async (params: {
    action: string;
    entity_type: string;
    entity_id?: string;
    field?: string;
    old_value?: string;
    new_value?: string;
    metadata?: any;
  }) => {
    if (!user) return;
    await supabase.from('activity_logs').insert({
      action: params.action,
      entity_type: params.entity_type,
      entity_id: params.entity_id || null,
      field: params.field || null,
      old_value: params.old_value || null,
      new_value: params.new_value || null,
      user_id: user.id,
      user_name: profile?.full_name || '',
      metadata: params.metadata || {},
    });
  }, [user, profile]);

  const fetchTaskHistory = useCallback(async (taskId: string): Promise<ActivityLogEntry[]> => {
    const { data } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('entity_id', taskId)
      .eq('entity_type', 'task')
      .order('created_at', { ascending: false });
    return (data || []) as ActivityLogEntry[];
  }, []);

  const fetchGlobalLogs = useCallback(async (filters?: {
    userId?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<ActivityLogEntry[]> => {
    let query = supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(filters?.limit || 200);

    if (filters?.userId) query = query.eq('user_id', filters.userId);
    if (filters?.action) query = query.ilike('action', `%${filters.action}%`);
    if (filters?.startDate) query = query.gte('created_at', filters.startDate);
    if (filters?.endDate) query = query.lte('created_at', filters.endDate + 'T23:59:59');

    const { data } = await query;
    return (data || []) as ActivityLogEntry[];
  }, []);

  return { logActivity, fetchTaskHistory, fetchGlobalLogs };
}
