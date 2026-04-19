import { Task, PRIORITY_CONFIG, STATUS_CONFIG, calculateTaskMetrics } from '@/types/task';
import { User, Calendar, AlertTriangle, CheckCircle2, Clock, MessageSquare, Paperclip } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useSystemSettings, DEFAULT_TEMPLATES } from '@/hooks/useSystemSettings';
import { renderTemplate, buildWhatsAppLink } from '@/lib/whatsapp';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface TaskCardProps {
  task: Task;
  onClick: () => void;
  onDragStart: (e: React.DragEvent) => void;
}

// Inline WhatsApp brand icon (recognizable green bubble)
function WhatsAppIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="currentColor" aria-hidden="true">
      <path d="M16 .5C7.44.5.5 7.44.5 16c0 2.82.74 5.46 2.04 7.76L.5 31.5l7.95-2.02A15.43 15.43 0 0 0 16 31.5C24.56 31.5 31.5 24.56 31.5 16S24.56.5 16 .5zm0 28.2c-2.5 0-4.86-.66-6.9-1.81l-.49-.29-4.72 1.2 1.26-4.6-.32-.5A12.65 12.65 0 0 1 3.3 16C3.3 8.99 8.99 3.3 16 3.3S28.7 8.99 28.7 16 23.01 28.7 16 28.7zm7.27-9.5c-.4-.2-2.36-1.16-2.72-1.3-.36-.13-.63-.2-.9.2s-1.03 1.3-1.27 1.56c-.23.27-.46.3-.86.1-.4-.2-1.69-.62-3.22-1.98-1.19-1.06-2-2.37-2.23-2.77-.23-.4-.02-.62.18-.82.18-.18.4-.46.6-.7.2-.23.27-.4.4-.66.13-.27.07-.5-.03-.7-.1-.2-.9-2.17-1.23-2.97-.32-.78-.65-.67-.9-.68l-.76-.01c-.27 0-.7.1-1.07.5-.36.4-1.4 1.37-1.4 3.34 0 1.97 1.43 3.87 1.63 4.14.2.27 2.82 4.3 6.83 6.03.95.41 1.7.65 2.28.84.96.3 1.83.26 2.52.16.77-.11 2.36-.96 2.7-1.9.33-.93.33-1.72.23-1.9-.1-.17-.36-.27-.76-.47z"/>
    </svg>
  );
}

export function TaskCard({ task, onClick, onDragStart }: TaskCardProps) {
  const { settings } = useSystemSettings();
  const priority = PRIORITY_CONFIG[task.priority];
  const metrics = calculateTaskMetrics(task);
  const isUrgent = task.priority === 'urgente';
  const isCompleted = task.status === 'concluido';

  const waMessage = renderTemplate(
    settings.whatsapp_template_manual || DEFAULT_TEMPLATES.manual,
    task,
  );
  const waLink = buildWhatsAppLink(waMessage, settings.whatsapp_number);

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      className={`bg-card rounded-xl p-4 shadow-card border cursor-pointer hover:shadow-elevated hover:-translate-y-0.5 transition-all duration-200 group ${
        isUrgent ? 'border-urgent/40 bg-urgent/[0.02]' : 'border-border hover:border-primary-light/30'
      } ${metrics.isOverdue ? 'border-l-4 border-l-urgent' : ''} ${
        isCompleted ? 'border-l-4 border-l-success' : ''
      }`}
    >
      {/* Tags row */}
      <div className="flex flex-wrap gap-1.5 mb-2.5">
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${priority.bgClass} ${priority.textClass}`}>
          {priority.label}
        </span>
        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary-light/10 text-primary-light">
          {STATUS_CONFIG[task.status]?.label || task.status}
        </span>
        {metrics.isOverdue && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-urgent/10 text-urgent flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> {metrics.daysOverdue}d atraso
          </span>
        )}
        {metrics.timeRemaining !== null && metrics.timeRemaining > 0 && !isCompleted && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-success/10 text-success flex items-center gap-1">
            <Clock className="w-3 h-3" /> {metrics.timeRemaining}d
          </span>
        )}
        {metrics.wasOnTime && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-success/10 text-success flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> No prazo
          </span>
        )}
      </div>

      {/* Title */}
      <h4 className="font-heading font-semibold text-sm text-foreground mb-1 group-hover:text-primary-light transition-colors line-clamp-2">
        {task.name}
      </h4>
      {task.description && (
        <p className="text-xs text-muted-foreground line-clamp-1 mb-2.5">{task.description}</p>
      )}

      {/* Requester & Assignee */}
      <div className="flex items-center gap-3 text-[11px] text-muted-foreground mb-2">
        <div className="flex items-center gap-1">
          <User className="w-3 h-3" />
          <span className="truncate max-w-[90px]" title={task.assignee}>{task.assignee || '—'}</span>
        </div>
        {task.requester && (
          <div className="flex items-center gap-1 text-muted-foreground/60">
            <span className="text-[10px]">via</span>
            <span className="truncate max-w-[70px]" title={task.requester}>{task.requester}</span>
          </div>
        )}
      </div>

      {/* Dates row */}
      <div className="flex items-center justify-between text-[10px] text-muted-foreground border-t border-border pt-2 mt-1">
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>{format(new Date(task.createdAt), "dd/MM HH:mm", { locale: ptBR })}</span>
        </div>
        {task.dueDate && (
          <div className={`flex items-center gap-1 ${metrics.isOverdue ? 'text-urgent font-semibold' : ''}`}>
            <Calendar className="w-3 h-3" />
            <span>{format(new Date(task.dueDate), 'dd/MM/yy', { locale: ptBR })}</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          {(task.comment_count || 0) > 0 && (
            <span className="flex items-center gap-0.5">
              <MessageSquare className="w-3 h-3" /> {task.comment_count}
            </span>
          )}
          {(task.attachment_count || 0) > 0 && (
            <span className="flex items-center gap-0.5">
              <Paperclip className="w-3 h-3" /> {task.attachment_count}
            </span>
          )}
          {/* WhatsApp button */}
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366] hover:text-white transition-colors"
                  aria-label="Enviar mensagem no WhatsApp"
                >
                  <WhatsAppIcon className="w-3.5 h-3.5" />
                </a>
              </TooltipTrigger>
              <TooltipContent side="top">Enviar mensagem no WhatsApp</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {task.tags.slice(0, 3).map(tag => (
            <span key={tag} className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-muted text-muted-foreground">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
