import { Task, Status } from '@/types/task';
import { KanbanColumn } from './KanbanColumn';
import { useKanbanColumns } from '@/hooks/useKanbanColumns';

interface KanbanBoardProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onMoveTask: (taskId: string, newStatus: Status) => void;
  canMoveTask?: boolean;
}

export function KanbanBoard({ tasks, onTaskClick, onMoveTask, canMoveTask = true }: KanbanBoardProps) {
  const { columns, loading } = useKanbanColumns();

  const visibleColumns = columns.filter(c => c.visible);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-primary-light border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex gap-5 overflow-x-auto pb-4 px-1">
      {visibleColumns.map(col => (
        <KanbanColumn
          key={col.id}
          id={col.status_key as Status}
          title={col.title}
          icon={col.icon}
          dotColor={col.dot_color}
          tasks={tasks.filter(t => t.status === col.status_key)}
          onTaskClick={onTaskClick}
          onDrop={canMoveTask ? onMoveTask : () => {}}
        />
      ))}
    </div>
  );
}
