import { useState, useMemo } from 'react';
import { Task, PRIORITY_CONFIG, STATUS_CONFIG, calculateTaskMetrics } from '@/types/task';
import { ChevronLeft, ChevronRight, Clock, AlertTriangle } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CalendarViewProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

export function CalendarView({ tasks, onTaskClick }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [view, setView] = useState<'month' | 'week'>('month');

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { locale: ptBR });
  const calEnd = endOfWeek(monthEnd, { locale: ptBR });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const getTasksForDay = (day: Date) => {
    return tasks.filter(t => {
      if (t.dueDate && isSameDay(new Date(t.dueDate), day)) return true;
      if (t.createdAt && isSameDay(new Date(t.createdAt), day)) return true;
      return false;
    });
  };

  const today = new Date();

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-heading font-bold text-foreground">Calendário</h2>
          <p className="text-sm text-muted-foreground">Acompanhe prazos e datas de criação</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setView('month')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${view === 'month' ? 'bg-primary-light text-accent-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>Mês</button>
          <button onClick={() => setView('week')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${view === 'week' ? 'bg-primary-light text-accent-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>Semana</button>
        </div>
      </div>

      <div className="bg-card rounded-2xl shadow-card border border-border overflow-hidden">
        {/* Nav */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 rounded-lg hover:bg-muted transition-colors">
            <ChevronLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <h3 className="font-heading font-semibold text-lg text-foreground capitalize">
            {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
          </h3>
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 rounded-lg hover:bg-muted transition-colors">
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Week headers */}
        <div className="grid grid-cols-7 border-b border-border">
          {weekDays.map(d => (
            <div key={d} className="py-2 text-center text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              {d}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7">
          {days.map((day, i) => {
            const dayTasks = getTasksForDay(day);
            const isToday = isSameDay(day, today);
            const isCurrentMonth = isSameMonth(day, currentMonth);

            return (
              <div
                key={i}
                className={`min-h-[100px] border-b border-r border-border p-1.5 ${
                  !isCurrentMonth ? 'bg-muted/30' : ''
                } ${isToday ? 'bg-primary-light/5' : ''}`}
              >
                <div className={`text-xs font-medium mb-1 ${
                  isToday ? 'w-6 h-6 rounded-full bg-primary-light text-accent-foreground flex items-center justify-center' :
                  !isCurrentMonth ? 'text-muted-foreground/40' : 'text-muted-foreground'
                }`}>
                  {format(day, 'd')}
                </div>
                <div className="space-y-0.5">
                  {dayTasks.slice(0, 3).map(t => {
                    const metrics = calculateTaskMetrics(t);
                    return (
                      <button
                        key={t.id}
                        onClick={() => onTaskClick(t)}
                        className={`w-full text-left px-1.5 py-0.5 rounded text-[10px] font-medium truncate block transition-colors hover:opacity-80 ${
                          metrics.isOverdue
                            ? 'bg-urgent/10 text-urgent'
                            : t.status === 'concluido'
                            ? 'bg-success/10 text-success'
                            : 'bg-primary-light/10 text-primary-light'
                        }`}
                        title={t.name}
                      >
                        {t.name}
                      </button>
                    );
                  })}
                  {dayTasks.length > 3 && (
                    <p className="text-[9px] text-muted-foreground px-1">+{dayTasks.length - 3} mais</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming deadlines */}
      <div className="bg-card rounded-2xl p-6 shadow-card border border-border">
        <h3 className="font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary-light" /> Próximos Prazos
        </h3>
        <div className="space-y-2">
          {tasks
            .filter(t => t.dueDate && t.status !== 'concluido' && new Date(t.dueDate) >= new Date())
            .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
            .slice(0, 8)
            .map(t => (
              <button
                key={t.id}
                onClick={() => onTaskClick(t)}
                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full ${PRIORITY_CONFIG[t.priority].bgClass.replace('/10', '')}`} />
                  <div>
                    <p className="text-sm font-medium text-foreground">{t.name}</p>
                    <p className="text-[11px] text-muted-foreground">{t.assignee}</p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(t.dueDate!), 'dd/MM', { locale: ptBR })}
                </span>
              </button>
            ))}
          {tasks.filter(t => t.dueDate && t.status !== 'concluido' && new Date(t.dueDate) >= new Date()).length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhum prazo próximo</p>
          )}
        </div>
      </div>
    </div>
  );
}
