import { LayoutDashboard, KanbanSquare, Settings, BarChart3, CalendarDays, Users, ChevronLeft, ChevronRight, LogOut, Activity, Columns, Bell, Plug } from 'lucide-react';
import { useState } from 'react';
import agapeLogo from '@/assets/agape-flow-logo.png';

interface AppSidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
  userName?: string;
  userRole?: string;
  onSignOut?: () => void;
  permissions?: any;
  isAdmin?: boolean;
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  gestor: 'Gestor',
  colaborador: 'Colaborador',
};

export function AppSidebar({ currentView, onViewChange, userName, userRole, onSignOut, permissions, isAdmin }: AppSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  const NAV_ITEMS = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, visible: isAdmin || permissions?.can_access_dashboard },
    { id: 'kanban', label: 'Quadro Kanban', icon: KanbanSquare, visible: true },
    { id: 'calendar', label: 'Calendário', icon: CalendarDays, visible: isAdmin || permissions?.can_access_calendar },
    { id: 'metrics', label: 'Métricas', icon: BarChart3, visible: isAdmin || permissions?.can_access_metrics },
    { id: 'users', label: 'Usuários', icon: Users, visible: isAdmin || permissions?.can_manage_users },
    { id: 'activity', label: 'Log de Atividades', icon: Activity, visible: isAdmin || permissions?.can_view_activity_log },
    { id: 'kanban_settings', label: 'Colunas Kanban', icon: Columns, visible: isAdmin || permissions?.can_manage_kanban_columns },
    { id: 'announcements', label: 'Avisos', icon: Bell, visible: isAdmin },
    { id: 'integrations', label: 'Integrações', icon: Plug, visible: isAdmin || permissions?.can_access_integrations },
    { id: 'settings', label: 'Configurações', icon: Settings, visible: isAdmin || permissions?.can_change_settings },
  ].filter(item => item.visible);

  return (
    <aside className={`gradient-sidebar flex flex-col h-screen transition-all duration-300 ${collapsed ? 'w-[76px]' : 'w-[260px]'} shrink-0 print:hidden border-r border-sidebar-border`}>
      <div className="flex items-center gap-3 px-5 h-[72px] border-b border-sidebar-border/60">
        <img src={agapeLogo} alt="ÁGAPE FLOW" width={40} height={40} className="shrink-0 rounded-xl shadow-soft" />
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="text-white font-heading font-extrabold text-[17px] leading-none tracking-tight">
              ÁGAPE<span className="text-primary-light"> FLOW</span>
            </h1>
            <p className="text-sidebar-foreground/45 text-[9px] font-semibold tracking-[0.18em] uppercase mt-1.5">Tecnologia</p>
          </div>
        )}
      </div>

      <nav className="flex-1 py-5 px-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(item => {
          const active = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`group relative w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200 ${
                active
                  ? 'bg-primary-light/15 text-white shadow-[inset_2px_0_0_hsl(var(--primary-light))]'
                  : 'text-sidebar-foreground/65 hover:text-white hover:bg-sidebar-accent/60'
              }`}
            >
              <item.icon className={`w-[18px] h-[18px] shrink-0 transition-colors ${active ? 'text-primary-light' : ''}`} />
              {!collapsed && <span className="tracking-tight">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-sidebar-border/60 space-y-2">
        {!collapsed && userName && (
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-sidebar-accent/40">
            <div className="w-9 h-9 rounded-full gradient-welcome flex items-center justify-center text-white font-heading font-bold text-xs shrink-0">
              {userName.substring(0, 2).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-white text-[13px] font-semibold truncate leading-tight">{userName}</p>
              <p className="text-sidebar-foreground/50 text-[9px] font-bold tracking-widest uppercase mt-0.5">{ROLE_LABELS[userRole || ''] || userRole}</p>
            </div>
          </div>
        )}
        <div className="flex gap-1">
          {onSignOut && (
            <button
              onClick={onSignOut}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sidebar-foreground/55 hover:text-white hover:bg-sidebar-accent/60 transition-colors text-xs font-medium"
            >
              <LogOut className="w-4 h-4" />
              {!collapsed && <span>Sair</span>}
            </button>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center justify-center px-3 py-2 rounded-xl text-sidebar-foreground/55 hover:text-white hover:bg-sidebar-accent/60 transition-colors"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </aside>
  );
}
