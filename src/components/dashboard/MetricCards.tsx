import { Task } from '@/types/task';
import { ClipboardList, Zap, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

interface MetricCardsProps {
  tasks: Task[];
}

export function MetricCards({ tasks }: MetricCardsProps) {
  const total = tasks.length;
  const inProgress = tasks.filter(t => t.status === 'em_andamento').length;
  const urgent = tasks.filter(t => t.status === 'urgente' || t.priority === 'urgente').length;
  const completed = tasks.filter(t => t.status === 'concluido').length;
  const overdue = tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'concluido').length;

  const metrics = [
    { label: 'Total', value: total, icon: ClipboardList, colorClass: 'text-primary-light', bgClass: 'bg-primary-light/10' },
    { label: 'Em Andamento', value: inProgress, icon: Zap, colorClass: 'text-primary-light', bgClass: 'bg-primary-light/10' },
    { label: 'Urgentes', value: urgent, icon: AlertTriangle, colorClass: 'text-urgent', bgClass: 'bg-urgent/10' },
    { label: 'Concluídas', value: completed, icon: CheckCircle2, colorClass: 'text-success', bgClass: 'bg-success/10' },
    { label: 'Atrasadas', value: overdue, icon: Clock, colorClass: 'text-warning', bgClass: 'bg-warning/10' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-5">
      {metrics.map(m => (
        <div key={m.label} className="bg-card rounded-2xl p-5 shadow-card border border-border/60 hover:shadow-soft hover:-translate-y-0.5 transition-all duration-300 animate-slide-in">
          <div className="flex items-start justify-between mb-3">
            <div className={`w-10 h-10 rounded-xl ${m.bgClass} flex items-center justify-center`}>
              <m.icon className={`w-5 h-5 ${m.colorClass}`} />
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground font-bold tracking-widest uppercase">{m.label}</p>
          <p className="text-3xl font-heading font-extrabold text-foreground mt-2 tracking-tight">{m.value}</p>
        </div>
      ))}
    </div>
  );
}
