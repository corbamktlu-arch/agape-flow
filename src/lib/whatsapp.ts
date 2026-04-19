import { Task, STATUS_CONFIG } from '@/types/task';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export type WhatsAppTemplateKind = 'start' | 'complete' | 'manual';

/**
 * Replace template variables with task data.
 * Supported vars: {title}, {status}, {responsible}, {deadline}, {requester}, {priority}
 */
export function renderTemplate(template: string, task: Task): string {
  const deadline = task.dueDate
    ? format(new Date(task.dueDate), 'dd/MM/yyyy', { locale: ptBR })
    : 'Não definido';
  const statusLabel = STATUS_CONFIG[task.status]?.label || task.status;

  return template
    .replace(/\{title\}/g, task.name || '—')
    .replace(/\{status\}/g, statusLabel)
    .replace(/\{responsible\}/g, task.assignee || '—')
    .replace(/\{deadline\}/g, deadline)
    .replace(/\{requester\}/g, task.requester || '—')
    .replace(/\{priority\}/g, task.priority || '—');
}

/**
 * Sample task used for live preview in settings.
 */
export const SAMPLE_TASK: Task = {
  id: 'sample',
  name: 'Criar relatório mensal',
  description: '',
  status: 'em_andamento',
  priority: 'alta',
  assignee: 'Ana Souza',
  requester: 'Diretoria',
  createdAt: new Date().toISOString(),
  dueDate: new Date(Date.now() + 86400000 * 3).toISOString(),
  tags: [],
} as unknown as Task;

/**
 * Build a wa.me link with properly encoded message.
 * If a phone number is provided (digits only), include it.
 */
export function buildWhatsAppLink(message: string, phone?: string): string {
  const cleanPhone = (phone || '').replace(/\D/g, '');
  const encoded = encodeURIComponent(message);
  return cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encoded}`
    : `https://wa.me/?text=${encoded}`;
}
