import { useState, useEffect } from 'react';
import { useSupabaseUsers, UserWithDetails } from '@/hooks/useSupabaseUsers';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole, ROLE_CONFIG } from '@/types/task';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit3, Trash2, UserCheck, UserX, Users, Shield, Phone, Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const PERMISSION_CATEGORIES = [
  {
    label: 'Acesso ao Sistema',
    permissions: [
      { key: 'can_access_dashboard', label: 'Acessar Dashboard' },
      { key: 'can_access_metrics', label: 'Acessar Métricas' },
      { key: 'can_access_reports', label: 'Acessar Relatórios' },
      { key: 'can_access_calendar', label: 'Acessar Calendário' },
      { key: 'can_view_activity_log', label: 'Ver Log de Atividades' },
    ],
  },
  {
    label: 'Demandas',
    permissions: [
      { key: 'can_create_task', label: 'Criar Demanda' },
      { key: 'can_edit_task', label: 'Editar Demanda' },
      { key: 'can_delete_task', label: 'Excluir Demanda' },
      { key: 'can_move_task', label: 'Mover Demanda' },
      { key: 'can_complete_task', label: 'Concluir Demanda' },
      { key: 'can_start_task', label: 'Iniciar Demanda' },
      { key: 'can_change_deadline', label: 'Alterar Prazo' },
    ],
  },
  {
    label: 'Colaboração',
    permissions: [
      { key: 'can_comment', label: 'Comentar' },
      { key: 'can_edit_comments', label: 'Editar Comentários' },
      { key: 'can_delete_comments', label: 'Excluir Comentários' },
      { key: 'can_attach_files', label: 'Anexar Arquivos' },
      { key: 'can_download_attachments', label: 'Baixar Anexos' },
    ],
  },
  {
    label: 'Gestão de Usuários',
    permissions: [
      { key: 'can_manage_users', label: 'Gerenciar Usuários' },
      { key: 'can_edit_users', label: 'Editar Usuários' },
      { key: 'can_deactivate_users', label: 'Desativar Usuários' },
      { key: 'can_reset_password', label: 'Redefinir Senha' },
      { key: 'can_enable_login', label: 'Ativar Login' },
      { key: 'can_disable_login', label: 'Desativar Login' },
    ],
  },
  {
    label: 'Configurações',
    permissions: [
      { key: 'can_change_settings', label: 'Alterar Configurações' },
      { key: 'can_change_simple_password', label: 'Alterar Senha Simples' },
      { key: 'can_change_theme', label: 'Alterar Tema' },
      { key: 'can_change_logo', label: 'Alterar Logo' },
      { key: 'can_manage_kanban_columns', label: 'Gerenciar Colunas Kanban' },
    ],
  },
  {
    label: 'Exportação',
    permissions: [
      { key: 'can_print_reports', label: 'Imprimir Relatórios' },
      { key: 'can_export_pdf', label: 'Exportar PDF' },
    ],
  },
  {
    label: 'Visibilidade',
    permissions: [
      { key: 'can_view_team_only', label: 'Ver Somente Equipe' },
      { key: 'can_view_all_data', label: 'Ver Todos os Dados' },
    ],
  },
  {
    label: 'Integrações',
    permissions: [
      { key: 'can_receive_whatsapp', label: 'Receber WhatsApp' },
      { key: 'can_send_whatsapp', label: 'Enviar WhatsApp' },
      { key: 'can_access_integrations', label: 'Acessar Integrações' },
      { key: 'can_configure_whatsapp', label: 'Configurar WhatsApp' },
    ],
  },
];

export function UsersView() {
  const { users, teams, loading, updateUserProfile, updateUserPermissions, getUserPermissions, addTeam } = useSupabaseUsers();
  const { isAdmin, isGestor, profile: currentProfile } = useAuth();
  const canCreateUsers = isAdmin || isGestor;
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState<UserWithDetails | null>(null);
  const [showPermissions, setShowPermissions] = useState(false);
  const [permUser, setPermUser] = useState<UserWithDetails | null>(null);
  const [perms, setPerms] = useState<Record<string, boolean>>({});
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [teamForm, setTeamForm] = useState({ name: '', color: '#3b82f6', description: '' });
  const [form, setForm] = useState({
    full_name: '', email: '', password: '', role: 'colaborador' as UserRole,
    department: '', position: '', phone: '', team_id: '', manager_id: '', login_enabled: true,
  });

  const gestorOptions = users.filter(u => u.role === 'gestor' && u.active);
  const [creating, setCreating] = useState(false);

  const openNew = () => {
    setEditUser(null);
    setForm({ full_name: '', email: '', password: '', role: 'colaborador', department: '', position: '', phone: '', team_id: '', manager_id: '', login_enabled: true });
    setShowForm(true);
  };

  const openEdit = (u: UserWithDetails) => {
    // Admin cannot be edited by non-admins, and admin profile is protected
    if (u.role === 'admin' && !isAdmin) {
      toast.error('Você não pode editar um administrador');
      return;
    }
    setEditUser(u);
    setForm({
      full_name: u.full_name, email: u.email, password: '', role: (u.role || 'colaborador') as UserRole,
      department: u.department || '', position: u.position || '', phone: u.phone || '',
      team_id: u.team_id || '', manager_id: u.manager_id || '', login_enabled: u.login_enabled,
    });
    setShowForm(true);
  };

  const openPermissions = async (u: UserWithDetails) => {
    setPermUser(u);
    const p = await getUserPermissions(u.user_id);
    setPerms(p || {});
    setShowPermissions(true);
  };

  const savePermissions = async () => {
    if (!permUser) return;
    const ok = await updateUserPermissions(permUser.user_id, perms);
    if (ok) {
      toast.success('Permissões atualizadas!');
      setShowPermissions(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name.trim() || !form.email.trim()) { toast.error('Nome e e-mail são obrigatórios'); return; }

    if (editUser) {
      // Protect admin from role change
      if (editUser.role === 'admin' && form.role !== 'admin') {
        toast.error('Não é possível alterar o perfil de um administrador');
        return;
      }
      const profileUpdate: any = {
        full_name: form.full_name,
        phone: form.phone || null,
        department: form.department || null,
        position: form.position || null,
        team_id: form.team_id || null,
        manager_id: form.role === 'colaborador' ? (form.manager_id || null) : null,
        login_enabled: form.login_enabled,
        role: form.role,
      };
      const ok = await updateUserProfile(editUser.user_id, profileUpdate);
      if (ok) { toast.success('Usuário atualizado!'); setShowForm(false); }
    } else {
      if (!form.password || form.password.length < 6) { toast.error('Senha deve ter no mínimo 6 caracteres'); return; }
      setCreating(true);

      // Create user via edge function — gestor-created users get manager_id = currentProfile.id
      const payload: any = {
        email: form.email,
        password: form.password,
        full_name: form.full_name,
        role: isGestor && !isAdmin ? (form.role === 'gestor' || form.role === 'admin' ? 'colaborador' : form.role) : form.role,
        phone: form.phone,
        department: form.department,
        position: form.position,
        team_id: form.team_id,
      };
      // Link colaborador to selected gestor (admin) or auto-link to creator (gestor)
      if (isAdmin && form.role === 'colaborador' && form.manager_id) {
        payload.manager_id = form.manager_id;
      } else if (!isAdmin && isGestor && currentProfile?.id) {
        payload.manager_id = currentProfile.id;
      }
      const { data, error } = await supabase.functions.invoke('create-user', { body: payload });

      setCreating(false);
      if (error) {
        toast.error('Erro ao criar usuário');
        console.error(error);
      } else {
        toast.success('Usuário cadastrado!');
        setShowForm(false);
        // Refresh users
        window.location.reload();
      }
    }
  };

  const toggleActive = async (u: UserWithDetails) => {
    // Protect admin from being deactivated
    if (u.role === 'admin') {
      toast.error('Administrador não pode ser desativado');
      return;
    }
    const ok = await updateUserProfile(u.user_id, { active: !u.active });
    if (ok) toast.success(u.active ? 'Usuário desativado' : 'Usuário ativado');
  };

  const handleAddTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamForm.name.trim()) { toast.error('Nome da equipe é obrigatório'); return; }
    await addTeam(teamForm.name, teamForm.color, teamForm.description);
    setShowTeamForm(false);
    setTeamForm({ name: '', color: '#3b82f6', description: '' });
  };

  const inputClass = "w-full px-4 py-2.5 bg-muted rounded-xl text-sm border-2 border-transparent outline-none focus:border-primary-light transition-colors";
  const labelClass = "block text-xs font-semibold text-foreground mb-1.5";

  const getTeamName = (teamId: string | null) => {
    if (!teamId) return '—';
    return teams.find(t => t.id === teamId)?.name || '—';
  };

  return (
    <div className="space-y-7 animate-slide-in">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-heading font-extrabold text-primary-light tracking-tight">Usuários</h2>
          <p className="text-sm text-muted-foreground mt-1">Gerencie usuários, equipes e permissões.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowTeamForm(true)} variant="outline" className="gap-2 text-sm rounded-xl border-border/70">
            <Users className="w-4 h-4" /> Nova Equipe
          </Button>
          {canCreateUsers && (
            <Button onClick={openNew} className="gradient-welcome text-white font-semibold gap-2 rounded-xl shadow-elevated hover:shadow-welcome transition-all">
              <Plus className="w-4 h-4" /> Novo Usuário
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        {(Object.keys(ROLE_CONFIG) as UserRole[]).map(role => (
          <div key={role} className="bg-card rounded-2xl p-5 shadow-card border border-border/60 hover:shadow-soft transition-all">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-primary-light/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary-light" />
              </div>
              <div>
                <p className="text-3xl font-heading font-extrabold text-primary tracking-tight leading-none">{users.filter(u => u.role === role).length}</p>
                <p className="text-[10px] text-muted-foreground font-bold tracking-widest uppercase mt-2">{ROLE_CONFIG[role].label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-card rounded-2xl shadow-card border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Nome</th>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider">E-mail</th>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Perfil</th>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Equipe</th>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Setor</th>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Telefone</th>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Login</th>
                <th className="text-right py-3 px-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4 font-medium text-foreground">{u.full_name}</td>
                  <td className="py-3 px-4 text-muted-foreground text-xs">{u.email}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary-light/10 text-primary-light">
                      {ROLE_CONFIG[(u.role || 'colaborador') as UserRole]?.label || u.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground text-xs">{getTeamName(u.team_id)}</td>
                  <td className="py-3 px-4 text-muted-foreground text-xs">{u.department || '—'}</td>
                  <td className="py-3 px-4 text-muted-foreground text-xs">
                    {u.phone ? (
                      <a href={`https://wa.me/${u.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-success hover:underline">
                        <Phone className="w-3 h-3" /> {u.phone}
                      </a>
                    ) : '—'}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${u.active ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
                      {u.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${u.login_enabled ? 'bg-primary-light/10 text-primary-light' : 'bg-muted text-muted-foreground'}`}>
                      {u.login_enabled ? 'Ativo' : 'Desativado'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openPermissions(u)} className="p-1.5 rounded-lg hover:bg-muted transition-colors" title="Permissões">
                        <Settings2 className="w-4 h-4 text-primary-light" />
                      </button>
                      <button onClick={() => toggleActive(u)} className="p-1.5 rounded-lg hover:bg-muted transition-colors" title={u.active ? 'Desativar' : 'Ativar'}>
                        {u.active ? <UserX className="w-4 h-4 text-muted-foreground" /> : <UserCheck className="w-4 h-4 text-success" />}
                      </button>
                      <button onClick={() => openEdit(u)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                        <Edit3 className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {users.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Users className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">Nenhum usuário cadastrado</p>
          </div>
        )}
      </div>

      {/* User Form Modal */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-lg shadow-modal max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">{editUser ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className={labelClass}>Nome Completo *</label>
                <input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} className={inputClass} placeholder="Nome completo" />
              </div>
              <div>
                <label className={labelClass}>E-mail *</label>
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={inputClass} placeholder="email@empresa.com" disabled={!!editUser} />
              </div>
              {!editUser && (
                <div>
                  <label className={labelClass}>Senha *</label>
                  <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className={inputClass} placeholder="Mínimo 6 caracteres" />
                </div>
              )}
              <div>
                <label className={labelClass}>Perfil de Acesso</label>
                <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value as UserRole })} className={inputClass}>
                  {(Object.keys(ROLE_CONFIG) as UserRole[])
                    // Admin can assign any role; Gestor can only assign colaborador
                    .filter(r => isAdmin || r === 'colaborador')
                    .map(r => (
                      <option key={r} value={r}>{ROLE_CONFIG[r].label}</option>
                    ))}
                </select>
              </div>
              {isAdmin && form.role === 'colaborador' && (
                <div>
                  <label className={labelClass}>Gestor vinculado</label>
                  <select value={form.manager_id} onChange={e => setForm({ ...form, manager_id: e.target.value })} className={inputClass}>
                    <option value="">Sem gestor</option>
                    {gestorOptions.map(g => <option key={g.id} value={g.id}>{g.full_name}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className={labelClass}>Telefone / WhatsApp</label>
                <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className={inputClass} placeholder="(11) 99999-9999" />
              </div>
              <div>
                <label className={labelClass}>Equipe</label>
                <select value={form.team_id} onChange={e => setForm({ ...form, team_id: e.target.value })} className={inputClass}>
                  <option value="">Sem equipe</option>
                  {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Setor</label>
                <input value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} className={inputClass} placeholder="Ex: TI, Comercial" />
              </div>
              <div>
                <label className={labelClass}>Cargo</label>
                <input value={form.position} onChange={e => setForm({ ...form, position: e.target.value })} className={inputClass} placeholder="Ex: Analista, Gerente" />
              </div>
              <div className="flex items-center gap-3 md:col-span-2">
                <Switch checked={form.login_enabled} onCheckedChange={v => setForm({ ...form, login_enabled: v })} />
                <label className="text-sm font-medium text-foreground">Login no painel habilitado</label>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button type="submit" disabled={creating} className="gradient-primary text-primary-foreground font-semibold">
                {creating ? 'Criando...' : editUser ? 'Salvar' : 'Cadastrar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Permissions Modal */}
      <Dialog open={showPermissions} onOpenChange={setShowPermissions}>
        <DialogContent className="sm:max-w-2xl shadow-modal max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">
              Permissões — {permUser?.full_name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 mt-2">
            {PERMISSION_CATEGORIES.map(cat => (
              <div key={cat.label}>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5" /> {cat.label}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {cat.permissions.map(p => (
                    <div key={p.key} className="flex items-center justify-between p-2.5 bg-muted/50 rounded-lg border border-border">
                      <span className="text-sm text-foreground">{p.label}</span>
                      <Switch
                        checked={!!perms[p.key]}
                        onCheckedChange={v => setPerms({ ...perms, [p.key]: v })}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-border mt-4">
            <Button variant="outline" onClick={() => setShowPermissions(false)}>Cancelar</Button>
            <Button onClick={savePermissions} className="gradient-primary text-primary-foreground font-semibold">
              Salvar Permissões
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Team Form Modal */}
      <Dialog open={showTeamForm} onOpenChange={setShowTeamForm}>
        <DialogContent className="sm:max-w-md shadow-modal">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">Nova Equipe</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddTeam} className="space-y-4 mt-2">
            <div>
              <label className={labelClass}>Nome da Equipe *</label>
              <input value={teamForm.name} onChange={e => setTeamForm({ ...teamForm, name: e.target.value })} className={inputClass} placeholder="Ex: Desenvolvimento" />
            </div>
            <div>
              <label className={labelClass}>Cor</label>
              <input type="color" value={teamForm.color} onChange={e => setTeamForm({ ...teamForm, color: e.target.value })} className="w-full h-10 rounded-xl cursor-pointer" />
            </div>
            <div>
              <label className={labelClass}>Descrição</label>
              <textarea value={teamForm.description} onChange={e => setTeamForm({ ...teamForm, description: e.target.value })} className={`${inputClass} min-h-[60px] resize-none`} />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowTeamForm(false)}>Cancelar</Button>
              <Button type="submit" className="gradient-primary text-primary-foreground font-semibold">Criar Equipe</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
