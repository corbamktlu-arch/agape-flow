export type Priority = 'baixa' | 'media' | 'alta' | 'urgente';
export type Status = 'a_fazer' | 'aguardando_inicio' | 'em_andamento' | 'em_revisao' | 'urgente' | 'concluido';
export type UserRole = 'admin' | 'gestor' | 'colaborador';

export interface HistoryEntry {
  id: string;
  timestamp: string;
  action: string;
  field?: string;
  oldValue?: string;
  newValue?: string;
  user?: string;
}

export interface Task {
  id: string;
  name: string;
  description: string;
  requester: string;
  assignee: string;
  assignee_user_id?: string;
  requester_user_id?: string;
  priority: Priority;
  status: Status;
  createdAt: string;
  startDate?: string;
  dueDate?: string;
  completedAt?: string;
  tags: string[];
  category: string;
  notes: string;
  team_id?: string;
  created_by?: string;
  history: HistoryEntry[];
  comment_count?: number;
  attachment_count?: number;
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  position: string;
  active: boolean;
  createdAt: string;
  phone?: string;
  team_id?: string;
  manager_id?: string;
  login_enabled?: boolean;
  user_id?: string;
}

export const ROLE_CONFIG: Record<UserRole, { label: string; description: string }> = {
  admin: { label: 'Administrador', description: 'Acesso total ao sistema' },
  gestor: { label: 'Gestor', description: 'Gerencia o próprio painel, equipe e demandas' },
  colaborador: { label: 'Colaborador', description: 'Cria demandas e edita as próprias dentro do painel do gestor' },
};

export const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; bgClass: string; textClass: string }> = {
  baixa: { label: 'Baixa', color: 'success', bgClass: 'bg-success/10', textClass: 'text-success' },
  media: { label: 'Média', color: 'primary-light', bgClass: 'bg-primary-light/10', textClass: 'text-primary-light' },
  alta: { label: 'Alta', color: 'warning', bgClass: 'bg-warning/10', textClass: 'text-warning' },
  urgente: { label: 'Urgente', color: 'urgent', bgClass: 'bg-urgent/10', textClass: 'text-urgent' },
};

export const STATUS_CONFIG: Record<Status, { label: string; column: string }> = {
  a_fazer: { label: 'A Fazer', column: 'A Fazer' },
  aguardando_inicio: { label: 'Aguardando Início', column: 'Aguardando Início' },
  em_andamento: { label: 'Em Andamento', column: 'Em Andamento' },
  em_revisao: { label: 'Em Revisão', column: 'Em Revisão' },
  urgente: { label: 'Urgente', column: 'Urgente' },
  concluido: { label: 'Concluído', column: 'Concluído' },
};

export const COLUMNS: { id: Status; title: string; icon: string }[] = [
  { id: 'a_fazer', title: 'A Fazer', icon: '📋' },
  { id: 'aguardando_inicio', title: 'Aguardando Início', icon: '⏳' },
  { id: 'em_andamento', title: 'Em Andamento', icon: '⚡' },
  { id: 'em_revisao', title: 'Em Revisão', icon: '🔍' },
  { id: 'urgente', title: 'Urgente', icon: '🔥' },
  { id: 'concluido', title: 'Concluído', icon: '✅' },
];

export function calculateTaskMetrics(task: Task) {
  const created = new Date(task.createdAt);
  const now = new Date();
  const dueDate = task.dueDate ? new Date(task.dueDate) : null;
  const completed = task.completedAt ? new Date(task.completedAt) : null;
  const started = task.startDate ? new Date(task.startDate) : null;

  const isOverdue = dueDate && !completed && dueDate < now && task.status !== 'concluido';
  const wasLate = dueDate && completed && completed > dueDate;
  const wasOnTime = dueDate && completed && completed <= dueDate;

  const daysInProgress = started
    ? Math.ceil(((completed || now).getTime() - started.getTime()) / 86400000)
    : 0;

  const daysOverdue = isOverdue
    ? Math.ceil((now.getTime() - dueDate.getTime()) / 86400000)
    : wasLate && dueDate && completed
    ? Math.ceil((completed.getTime() - dueDate.getTime()) / 86400000)
    : 0;

  const totalExecutionHours = started
    ? Math.round(((completed || now).getTime() - started.getTime()) / 3600000)
    : 0;

  const timeRemaining = dueDate && !completed && dueDate > now
    ? Math.ceil((dueDate.getTime() - now.getTime()) / 86400000)
    : null;

  return { isOverdue, wasLate, wasOnTime, daysInProgress, daysOverdue, totalExecutionHours, timeRemaining };
}
