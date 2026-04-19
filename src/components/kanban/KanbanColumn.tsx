import { Task, Status } from '@/types/task';
import { TaskCard } from './TaskCard';
import { useState } from 'react';

interface KanbanColumnProps {
  id: Status;
  title: string;
  icon: string;
  dotColor?: string;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onDrop: (taskId: string, newStatus: Status) => void;
}

export function KanbanColumn({ id, title, icon, dotColor = '#6b7280', tasks, onTaskClick, onDrop }: KanbanColumnProps) {
  const [dragOver, setDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = () => setDragOver(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) onDrop(taskId, id);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex flex-col min-w-[300px] max-w-[340px] flex-1 rounded-2xl transition-colors duration-200 ${
        dragOver ? 'bg-primary-light/5 ring-2 ring-primary-light/20' : ''
      }`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-3">
        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: dotColor }} />
        <span className="text-sm font-heading font-semibold text-foreground">{icon} {title}</span>
        <span className="ml-auto px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs font-semibold">
          {tasks.length}
        </span>
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-3 px-1 pb-4 flex-1 min-h-[200px]">
        {tasks.map(task => (
          <TaskCard
            key={task.id}
            task={task}
            onClick={() => onTaskClick(task)}
            onDragStart={e => e.dataTransfer.setData('taskId', task.id)}
          />
        ))}
        {tasks.length === 0 && (
          <div className="flex items-center justify-center h-32 text-muted-foreground/50 text-sm border-2 border-dashed border-border rounded-xl">
            Arraste tarefas aqui
          </div>
        )}
      </div>
    </div>
  );
}
