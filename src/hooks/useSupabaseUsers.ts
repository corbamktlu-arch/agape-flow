import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface UserWithDetails {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  department: string | null;
  position: string | null;
  team_id: string | null;
  active: boolean;
  login_enabled: boolean;
  avatar_url: string | null;
  manager_id: string | null;
  portal_slug: string | null;
  portal_password: string | null;
  created_at: string;
  role?: string;
}

export interface Team {
  id: string;
  name: string;
  color: string | null;
  description: string | null;
  active: boolean;
}

export function useSupabaseUsers() {
  const { user, isAdmin, isGestor, isColaborador } = useAuth();
  const [users, setUsers] = useState<UserWithDetails[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const [profilesRes, rolesRes, teamsRes] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('user_roles').select('*'),
      supabase.from('teams').select('*').order('name'),
    ]);

    const roles: Record<string, string> = {};
    (rolesRes.data || []).forEach(r => { roles[r.user_id] = r.role; });

    let mapped = (profilesRes.data || []).map(p => ({
      ...p,
      role: roles[p.user_id] || 'colaborador',
    })) as UserWithDetails[];

    // VISIBILITY RULES:
    // - Admin: everything
    // - Gestor: self + users in same team + users they created (manager_id = me.id); admins hidden
    // - Colaborador: self + their gestor + peers (same gestor); admins hidden
    if (!isAdmin) {
      const me = mapped.find(u => u.user_id === user.id);
      const myTeamId = me?.team_id || null;
      const myManagerId = me?.manager_id || null;
      if (isGestor) {
        mapped = mapped.filter(u =>
          u.role !== 'admin' && (
            u.user_id === user.id ||
            (myTeamId && u.team_id === myTeamId) ||
            u.manager_id === me?.id
          )
        );
      } else if (isColaborador) {
        mapped = mapped.filter(u =>
          u.role !== 'admin' && (
            u.user_id === user.id ||
            (myManagerId && (u.id === myManagerId || u.manager_id === myManagerId))
          )
        );
      } else {
        mapped = mapped.filter(u => u.user_id === user.id);
      }
    }

    setUsers(mapped);
    setTeams((teamsRes.data || []) as Team[]);
    setLoading(false);
  }, [user, isAdmin, isGestor, isColaborador]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const updateUserProfile = useCallback(async (userId: string, updates: Partial<UserWithDetails & { portal_slug?: string; portal_password?: string }>) => {
    const profileUpdates: any = {};
    if (updates.full_name !== undefined) profileUpdates.full_name = updates.full_name;
    if (updates.phone !== undefined) profileUpdates.phone = updates.phone;
    if (updates.department !== undefined) profileUpdates.department = updates.department;
    if (updates.position !== undefined) profileUpdates.position = updates.position;
    if (updates.team_id !== undefined) profileUpdates.team_id = updates.team_id;
    if (updates.active !== undefined) profileUpdates.active = updates.active;
    if (updates.login_enabled !== undefined) profileUpdates.login_enabled = updates.login_enabled;
    if (updates.manager_id !== undefined) profileUpdates.manager_id = updates.manager_id;
    if ('portal_slug' in updates) profileUpdates.portal_slug = updates.portal_slug;
    if ('portal_password' in updates) profileUpdates.portal_password = updates.portal_password;

    const { error } = await supabase.from('profiles').update(profileUpdates).eq('user_id', userId);
    if (error) {
      toast.error('Erro ao atualizar usuário');
      console.error(error);
      return false;
    }

    // Update role if changed
    if (updates.role) {
      await supabase.from('user_roles').update({ role: updates.role as any }).eq('user_id', userId);
    }

    await fetchUsers();
    return true;
  }, [fetchUsers]);

  const updateUserPermissions = useCallback(async (userId: string, perms: Record<string, boolean>) => {
    const { error } = await supabase.from('permissions').update(perms as any).eq('user_id', userId);
    if (error) {
      toast.error('Erro ao atualizar permissões');
      console.error(error);
      return false;
    }
    return true;
  }, []);

  const getUserPermissions = useCallback(async (userId: string) => {
    const { data, error } = await supabase.from('permissions').select('*').eq('user_id', userId).single();
    if (error) return null;
    const { id, user_id, created_at, updated_at, ...perms } = data as any;
    return perms;
  }, []);

  const addTeam = useCallback(async (name: string, color: string, description: string) => {
    const { error } = await supabase.from('teams').insert({ name, color, description });
    if (error) { toast.error('Erro ao criar equipe'); return; }
    toast.success('Equipe criada!');
    await fetchUsers();
  }, [fetchUsers]);

  return { users, teams, loading, fetchUsers, updateUserProfile, updateUserPermissions, getUserPermissions, addTeam };
}
