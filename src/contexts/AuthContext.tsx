import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type AppRole = 'admin' | 'gestor' | 'colaborador';

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  department: string | null;
  position: string | null;
  team_id: string | null;
  manager_id: string | null;
  active: boolean;
  login_enabled: boolean;
}

interface UserPermissions {
  can_access_dashboard: boolean;
  can_access_metrics: boolean;
  can_access_reports: boolean;
  can_create_task: boolean;
  can_edit_task: boolean;
  can_delete_task: boolean;
  can_move_task: boolean;
  can_complete_task: boolean;
  can_start_task: boolean;
  can_change_deadline: boolean;
  can_manage_users: boolean;
  can_edit_users: boolean;
  can_deactivate_users: boolean;
  can_reset_password: boolean;
  can_change_settings: boolean;
  can_change_simple_password: boolean;
  can_change_theme: boolean;
  can_change_logo: boolean;
  can_access_calendar: boolean;
  can_print_reports: boolean;
  can_export_pdf: boolean;
  can_comment: boolean;
  can_edit_comments: boolean;
  can_delete_comments: boolean;
  can_attach_files: boolean;
  can_download_attachments: boolean;
  can_view_activity_log: boolean;
  can_receive_whatsapp: boolean;
  can_send_whatsapp: boolean;
  can_access_integrations: boolean;
  can_configure_whatsapp: boolean;
  can_view_team_only: boolean;
  can_view_all_data: boolean;
  can_enable_login: boolean;
  can_disable_login: boolean;
  can_manage_kanban_columns: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  role: AppRole | null;
  permissions: UserPermissions | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isGestor: boolean;
  isColaborador: boolean;
}

const defaultPermissions: UserPermissions = {
  can_access_dashboard: false,
  can_access_metrics: false,
  can_access_reports: false,
  can_create_task: true,
  can_edit_task: false,
  can_delete_task: false,
  can_move_task: false,
  can_complete_task: false,
  can_start_task: false,
  can_change_deadline: false,
  can_manage_users: false,
  can_edit_users: false,
  can_deactivate_users: false,
  can_reset_password: false,
  can_change_settings: false,
  can_change_simple_password: false,
  can_change_theme: false,
  can_change_logo: false,
  can_access_calendar: false,
  can_print_reports: false,
  can_export_pdf: false,
  can_comment: false,
  can_edit_comments: false,
  can_delete_comments: false,
  can_attach_files: false,
  can_download_attachments: false,
  can_view_activity_log: false,
  can_receive_whatsapp: false,
  can_send_whatsapp: false,
  can_access_integrations: false,
  can_configure_whatsapp: false,
  can_view_team_only: false,
  can_view_all_data: false,
  can_enable_login: false,
  can_disable_login: false,
  can_manage_kanban_columns: false,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (userId: string) => {
    try {
      const [profileRes, roleRes, permRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', userId).single(),
        supabase.rpc('get_user_role', { _user_id: userId }),
        supabase.from('permissions').select('*').eq('user_id', userId).single(),
      ]);

      if (profileRes.data) {
        setProfile(profileRes.data as unknown as UserProfile);
      }
      if (roleRes.data) {
        setRole(roleRes.data as AppRole);
      }
      if (permRes.data) {
        const { id, user_id, created_at, updated_at, ...perms } = permRes.data as any;
        setPermissions(perms as UserPermissions);
      } else {
        setPermissions(defaultPermissions);
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        setTimeout(() => fetchUserData(session.user.id), 0);
      } else {
        setProfile(null);
        setRole(null);
        setPermissions(null);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error) {
      // Flag used by AnnouncementPopup to only show right after login (not on refresh)
      sessionStorage.setItem('agape_just_logged_in', '1');
    }
    return { error: error ? new Error(error.message) : null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setRole(null);
    setPermissions(null);
  };

  return (
    <AuthContext.Provider value={{
      user, session, profile, role, permissions, loading,
      signIn, signOut,
      isAdmin: role === 'admin',
      isGestor: role === 'gestor',
      isColaborador: role === 'colaborador',
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
