import { Task, Priority, PRIORITY_CONFIG } from '@/types/task';
import { useSupabaseUsers } from '@/hooks/useSupabaseUsers';

interface FiltersProps {
  tasks: Task[];
  filterAssignee: string;
  filterPriority: string;
  filterTeam: string;
  onAssigneeChange: (v: string) => void;
  onPriorityChange: (v: string) => void;
  onTeamChange: (v: string) => void;
}

export function Filters({ tasks, filterAssignee, filterPriority, filterTeam, onAssigneeChange, onPriorityChange, onTeamChange }: FiltersProps) {
  const { teams } = useSupabaseUsers();
  const assignees = [...new Set(tasks.map(t => t.assignee).filter(Boolean))];

  const selectClass = "px-3 py-2 bg-card border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-light/30";

  return (
    <div className="flex flex-wrap items-center gap-3">
      <select value={filterAssignee} onChange={e => onAssigneeChange(e.target.value)} className={selectClass}>
        <option value="">Todos os responsáveis</option>
        {assignees.map(a => <option key={a} value={a}>{a}</option>)}
      </select>
      <select value={filterPriority} onChange={e => onPriorityChange(e.target.value)} className={selectClass}>
        <option value="">Todas as prioridades</option>
        {(Object.keys(PRIORITY_CONFIG) as Priority[]).map(p => (
          <option key={p} value={p}>{PRIORITY_CONFIG[p].label}</option>
        ))}
      </select>
      <select value={filterTeam} onChange={e => onTeamChange(e.target.value)} className={selectClass}>
        <option value="">Todas as equipes</option>
        {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
      </select>
    </div>
  );
}
