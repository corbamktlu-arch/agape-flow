import { Search, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NotificationsDropdown } from '@/components/notifications/NotificationsDropdown';

interface TopBarProps {
  onNewTask: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  userName?: string;
  canCreateTask?: boolean;
}

export function TopBar({ onNewTask, searchQuery, onSearchChange, userName, canCreateTask = true }: TopBarProps) {
  return (
    <header className="h-[72px] bg-card border-b border-border/60 flex items-center justify-between px-7 shrink-0">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Pesquisar demandas, anexos ou logs..."
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-muted/60 rounded-xl text-sm border border-transparent outline-none focus:bg-card focus:border-primary-light/40 focus:ring-4 focus:ring-primary-light/10 transition-all placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        {canCreateTask && (
          <Button onClick={onNewTask} className="gradient-welcome text-white shadow-elevated hover:shadow-welcome transition-all gap-2 font-semibold rounded-xl px-5 py-5">
            <Plus className="w-4 h-4" />
            Nova Demanda
          </Button>
        )}
        <NotificationsDropdown />
        <div className="flex items-center gap-3 pl-3 border-l border-border/60">
          <div className="text-right hidden sm:block">
            <p className="text-[13px] font-bold text-foreground leading-none">Usuário</p>
            <p className="text-[10px] text-muted-foreground font-bold tracking-wider uppercase mt-1">{(userName || 'Admin').split(' ')[0]}</p>
          </div>
          <div className="w-10 h-10 rounded-full gradient-welcome flex items-center justify-center text-white font-heading font-bold text-sm shadow-elevated">
            {(userName || 'U').substring(0, 2).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
}
