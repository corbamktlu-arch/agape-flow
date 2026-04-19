import { useState, useMemo } from 'react';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { TopBar } from '@/components/layout/TopBar';
import { MetricCards } from '@/components/dashboard/MetricCards';
import { Filters } from '@/components/dashboard/Filters';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { TaskFormModal } from '@/components/modals/TaskFormModal';
import { TaskDetailModal } from '@/components/modals/TaskDetailModal';
import { SettingsView } from '@/components/views/SettingsView';
import { MetricsView } from '@/components/views/MetricsView';
import { CalendarView } from '@/components/views/CalendarView';
import { UsersView } from '@/components/views/UsersView';
import { ActivityLogView } from '@/components/views/ActivityLogView';
import { KanbanSettingsView } from '@/components/views/KanbanSettingsView';
import { AnnouncementsView } from '@/components/views/AnnouncementsView';
import { IntegrationsView } from '@/components/views/IntegrationsView';
import { AnnouncementPopup } from '@/components/announcements/AnnouncementPopup';
import { CompletionNotification } from '@/components/announcements/CompletionNotification';
import { useSupabaseTasks } from '@/hooks/useSupabaseTasks';
import { useSupabaseUsers } from '@/hooks/useSupabaseUsers';
import { useAuth } from '@/contexts/AuthContext';
import { Task } from '@/types/task';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const { tasks, loading: tasksLoading, addTask, updateTask, deleteTask, moveTask, startTask } = useSupabaseTasks();
  const { profile, role, permissions, signOut, isAdmin, isGestor } = useAuth();
  const { users } = useSupabaseUsers();

  const [currentView, setCurrentView] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterTeam, setFilterTeam] = useState('');
  const [filterGestor, setFilterGestor] = useState('');
  const [sortBy, setSortBy] = useState<'priority' | 'dueDate' | 'createdAt' | ''>('');

  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editTask, setEditTask] = useState<Task | null>(null);

  // Get gestors for admin selector (exclude admin from gestor list)
  const gestors = useMemo(() => {
    return users.filter(u => u.role === 'gestor');
  }, [users]);

  const filteredTasks = useMemo(() => {
    let result = tasks.filter(t => {
      if (searchQuery && !t.name.toLowerCase().includes(searchQuery.toLowerCase()) && !t.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (filterAssignee && t.assignee !== filterAssignee) return false;
      if (filterPriority && t.priority !== filterPriority) return false;
      if (filterTeam && t.team_id !== filterTeam) return false;
      // Admin gestor filter
      if (filterGestor && isAdmin) {
        const gestorUser = users.find(u => u.user_id === filterGestor);
        if (gestorUser?.team_id && t.team_id !== gestorUser.team_id) return false;
      }
      return true;
    });

    if (sortBy === 'dueDate') {
      result = [...result].sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
    } else if (sortBy === 'createdAt') {
      result = [...result].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === 'priority') {
      const order = { urgente: 0, alta: 1, media: 2, baixa: 3 };
      result = [...result].sort((a, b) => order[a.priority] - order[b.priority]);
    }

    return result;
  }, [tasks, searchQuery, filterAssignee, filterPriority, filterTeam, filterGestor, sortBy, isAdmin, users]);

  const handleNewTask = () => {
    if (isAdmin || permissions?.can_create_task) {
      setEditTask(null);
      setShowForm(true);
    }
  };
  
  const handleTaskClick = (task: Task) => { setSelectedTask(task); setShowDetail(true); };
  const handleEdit = (task: Task) => { setEditTask(task); setShowForm(true); };
  const handleFormSubmit = async (data: Partial<Task>) => {
    if (editTask) {
      await updateTask(editTask.id, data);
    } else {
      await addTask(data);
    }
    setEditTask(null);
  };

  const canAccessView = (view: string) => {
    if (isAdmin) return true;
    if (!permissions) return false;
    switch (view) {
      case 'dashboard': return permissions.can_access_dashboard;
      case 'kanban': return true;
      case 'calendar': return permissions.can_access_calendar;
      case 'metrics': return permissions.can_access_metrics;
      case 'users': return permissions.can_manage_users;
      case 'settings': return permissions.can_change_settings;
      case 'activity': return permissions.can_view_activity_log;
      case 'kanban_settings': return permissions.can_manage_kanban_columns;
      case 'announcements': return false;
      case 'integrations': return permissions.can_access_integrations;
      default: return false;
    }
  };

  const handleViewChange = (view: string) => {
    if (canAccessView(view)) setCurrentView(view);
  };

  if (tasksLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-primary-light animate-spin" />
          <p className="text-sm text-muted-foreground font-medium">Carregando demandas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <AnnouncementPopup />
      <CompletionNotification />

      <AppSidebar 
        currentView={currentView} 
        onViewChange={handleViewChange} 
        userName={profile?.full_name || 'Usuário'}
        userRole={role || 'colaborador'}
        onSignOut={signOut}
        permissions={permissions}
        isAdmin={isAdmin}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar 
          onNewTask={handleNewTask} 
          searchQuery={searchQuery} 
          onSearchChange={setSearchQuery}
          userName={profile?.full_name || 'Usuário'}
          canCreateTask={isAdmin || !!permissions?.can_create_task}
        />

        <main className="flex-1 overflow-y-auto p-6">
          {(currentView === 'dashboard' || currentView === 'kanban') && (
            <div className="space-y-6">
              {currentView === 'dashboard' && <MetricCards tasks={filteredTasks} />}
              <div className="flex items-center justify-between flex-wrap gap-3">
                <h2 className="text-xl font-heading font-bold text-foreground">Quadro de Demandas</h2>
                <div className="flex items-center gap-3 flex-wrap">
                  {/* Admin gestor selector */}
                  {isAdmin && gestors.length > 0 && (
                    <select
                      value={filterGestor}
                      onChange={e => setFilterGestor(e.target.value)}
                      className="px-3 py-2 bg-card border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-light/30"
                    >
                      <option value="">Todos os gestores</option>
                      {gestors.map(g => (
                        <option key={g.user_id} value={g.user_id}>{g.full_name}</option>
                      ))}
                    </select>
                  )}
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value as any)}
                    className="px-3 py-2 bg-card border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-light/30"
                  >
                    <option value="">Sem ordenação</option>
                    <option value="priority">Prioridade</option>
                    <option value="dueDate">Prazo</option>
                    <option value="createdAt">Data de criação</option>
                  </select>
                  <Filters
                    tasks={tasks}
                    filterAssignee={filterAssignee}
                    filterPriority={filterPriority}
                    filterTeam={filterTeam}
                    onAssigneeChange={setFilterAssignee}
                    onPriorityChange={setFilterPriority}
                    onTeamChange={setFilterTeam}
                  />
                </div>
              </div>
              <KanbanBoard 
                tasks={filteredTasks} 
                onTaskClick={handleTaskClick} 
                onMoveTask={moveTask}
                canMoveTask={isAdmin || !!permissions?.can_move_task}
              />
            </div>
          )}
          {currentView === 'calendar' && <CalendarView tasks={filteredTasks} onTaskClick={handleTaskClick} />}
          {currentView === 'metrics' && <MetricsView tasks={filteredTasks} />}
          {currentView === 'users' && <UsersView />}
          {currentView === 'activity' && <ActivityLogView />}
          {currentView === 'kanban_settings' && <KanbanSettingsView />}
          {currentView === 'announcements' && <AnnouncementsView />}
          {currentView === 'integrations' && <IntegrationsView />}
          {currentView === 'settings' && <SettingsView />}
        </main>
      </div>

      <TaskFormModal open={showForm} onClose={() => { setShowForm(false); setEditTask(null); }} onSubmit={handleFormSubmit} editTask={editTask} />
      <TaskDetailModal 
        task={selectedTask} 
        open={showDetail} 
        onClose={() => setShowDetail(false)} 
        onEdit={handleEdit} 
        onDelete={deleteTask}
        onStart={startTask}
        canEdit={isAdmin || !!permissions?.can_edit_task}
        canDelete={isAdmin || !!permissions?.can_delete_task}
        canStart={isAdmin || !!permissions?.can_start_task}
      />
    </div>
  );
};

export default Index;
