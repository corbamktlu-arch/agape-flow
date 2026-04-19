import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Task, PRIORITY_CONFIG, STATUS_CONFIG, calculateTaskMetrics } from '@/types/task';
import { Trash2, Edit3, Calendar, User, Clock, Tag, History, CheckCircle2, Timer, Play, MessageSquare, Paperclip, Send, Download, X, Upload, Phone } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useActivityLog, ActivityLogEntry } from '@/hooks/useActivityLog';
import { motion, AnimatePresence } from 'framer-motion';

interface TaskDetailModalProps {
  task: Task | null;
  open: boolean;
  onClose: () => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onStart?: (id: string, dueDate?: string) => void;
  canEdit?: boolean;
  canDelete?: boolean;
  canStart?: boolean;
}

interface Comment { id: string; content: string; user_name: string; user_id: string | null; created_at: string; }
interface Attachment { id: string; file_name: string; file_url: string; file_size: number | null; file_type: string | null; user_id: string | null; created_at: string; }

export function TaskDetailModal({ task, open, onClose, onEdit, onDelete, onStart, canEdit = true, canDelete = true, canStart = true }: TaskDetailModalProps) {
  const { user, profile, permissions, isAdmin } = useAuth();
  const { fetchTaskHistory, logActivity } = useActivityLog();
  const [activeTab, setActiveTab] = useState<'details' | 'comments' | 'attachments' | 'history'>('details');
  const [showStartForm, setShowStartForm] = useState(false);
  const [startDueDate, setStartDueDate] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [history, setHistory] = useState<ActivityLogEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && task) {
      setActiveTab('details');
      loadComments();
      loadAttachments();
      loadHistory();
    }
  }, [open, task?.id]);

  // Auto-scroll comments
  useEffect(() => {
    if (activeTab === 'comments') commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments, activeTab]);

  const loadComments = async () => {
    if (!task) return;
    setLoadingComments(true);
    const { data } = await supabase.from('task_comments').select('*').eq('task_id', task.id).order('created_at', { ascending: true });
    setComments((data || []) as Comment[]);
    setLoadingComments(false);
  };

  const loadAttachments = async () => {
    if (!task) return;
    const { data } = await supabase.from('task_attachments').select('*').eq('task_id', task.id).order('created_at', { ascending: false });
    setAttachments((data || []) as Attachment[]);
  };

  const loadHistory = async () => {
    if (!task) return;
    setLoadingHistory(true);
    const data = await fetchTaskHistory(task.id);
    setHistory(data);
    setLoadingHistory(false);
  };

  const handleAddComment = async () => {
    if (!task || !user || !newComment.trim()) return;
    if (!(isAdmin || permissions?.can_comment)) { toast.error('Sem permissão para comentar'); return; }
    const { error } = await supabase.from('task_comments').insert({ task_id: task.id, user_id: user.id, user_name: profile?.full_name || 'Usuário', content: newComment.trim() });
    if (error) { toast.error('Erro ao comentar'); return; }
    await logActivity({ action: 'Comentário adicionado', entity_type: 'task', entity_id: task.id, new_value: newComment.trim().substring(0, 100) });
    setNewComment('');
    await loadComments();
  };

  const handleDeleteComment = async (commentId: string) => {
    const { error } = await supabase.from('task_comments').delete().eq('id', commentId);
    if (!error) await loadComments();
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!task || !user || !e.target.files?.length) return;
    if (!(isAdmin || permissions?.can_attach_files)) { toast.error('Sem permissão para anexar'); return; }
    setUploading(true);
    const file = e.target.files[0];
    const filePath = `${task.id}/${Date.now()}_${file.name}`;
    const { error: uploadErr } = await supabase.storage.from('attachments').upload(filePath, file);
    if (uploadErr) { toast.error('Erro no upload'); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from('attachments').getPublicUrl(filePath);
    await supabase.from('task_attachments').insert({ task_id: task.id, user_id: user.id, file_name: file.name, file_url: urlData.publicUrl, file_size: file.size, file_type: file.type });
    await logActivity({ action: 'Anexo adicionado', entity_type: 'task', entity_id: task.id, new_value: file.name });
    setUploading(false);
    await loadAttachments();
    toast.success('Arquivo anexado!');
  };

  if (!task) return null;
  const priority = PRIORITY_CONFIG[task.priority];
  const status = STATUS_CONFIG[task.status];
  const metrics = calculateTaskMetrics(task);
  const canStartTask = canStart && !task.startDate && task.status !== 'concluido' && task.status !== 'em_andamento';

  const handleDelete = () => { if (confirm('Tem certeza que deseja excluir esta demanda?')) { onDelete(task.id); onClose(); toast.success('Demanda excluída'); } };
  const handleStart = () => { if (onStart) { onStart(task.id, startDueDate ? new Date(startDueDate).toISOString() : undefined); setShowStartForm(false); setStartDueDate(''); onClose(); } };
  const formatDate = (d: string) => format(new Date(d), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  const formatSize = (bytes: number | null) => { if (!bytes) return ''; if (bytes < 1024) return `${bytes} B`; if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`; return `${(bytes / 1048576).toFixed(1)} MB`; };
  
  const whatsAppMsg = encodeURIComponent(`📋 *${task.name}*\n📌 Status: ${status?.label || task.status}\n👤 Responsável: ${task.assignee || '—'}\n⏰ Prazo: ${task.dueDate ? format(new Date(task.dueDate), 'dd/MM/yyyy', { locale: ptBR }) : 'Não definido'}`);

  const InfoRow = ({ icon: Icon, label, value, highlight }: { icon: any; label: string; value: string; highlight?: boolean }) => (
    <div className="flex items-start gap-3 py-2">
      <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${highlight ? 'text-urgent' : 'text-muted-foreground'}`} />
      <div>
        <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">{label}</p>
        <p className={`text-sm ${highlight ? 'text-urgent font-semibold' : 'text-foreground'}`}>{value}</p>
      </div>
    </div>
  );

  const tabClass = (tab: string) => `px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${activeTab === tab ? 'bg-primary-light text-white shadow-sm' : 'text-muted-foreground hover:bg-muted'}`;

  const isImage = (type: string | null) => type?.startsWith('image/');

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl shadow-modal max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex flex-wrap gap-2 mb-2">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${priority.bgClass} ${priority.textClass}`}>{priority.label}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary-light/10 text-primary-light">{status?.label || task.status}</span>
                {metrics.isOverdue && <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-urgent/10 text-urgent">⚠ Atrasada — {metrics.daysOverdue}d</span>}
                {metrics.wasOnTime && <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-success/10 text-success">✓ No prazo</span>}
                {metrics.wasLate && <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-urgent/10 text-urgent">⚠ Atraso de {metrics.daysOverdue}d</span>}
                {metrics.timeRemaining !== null && metrics.timeRemaining > 0 && task.status !== 'concluido' && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-success/10 text-success">⏳ {metrics.timeRemaining}d</span>
                )}
              </div>
              <DialogTitle className="font-heading text-lg">{task.name}</DialogTitle>
            </div>
          </div>
        </DialogHeader>

        {task.description && <p className="text-sm text-muted-foreground mt-1">{task.description}</p>}

        {/* WhatsApp button */}
        <a href={`https://wa.me/?text=${whatsAppMsg}`} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-xs text-success font-medium hover:underline mt-1">
          <Phone className="w-3.5 h-3.5" /> Enviar via WhatsApp
        </a>

        {/* Start task */}
        {canStartTask && (
          <div className="mt-3 p-4 bg-primary-light/5 rounded-xl border border-primary-light/20">
            {!showStartForm ? (
              <Button onClick={() => setShowStartForm(true)} className="w-full gradient-primary text-white font-semibold gap-2">
                <Play className="w-4 h-4" /> Iniciar / Estou fazendo
              </Button>
            ) : (
              <div className="space-y-3">
                <p className="text-xs font-semibold text-foreground">Definir prazo para esta demanda:</p>
                <input type="datetime-local" value={startDueDate} onChange={e => setStartDueDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-muted rounded-xl text-sm border-2 border-transparent outline-none focus:border-primary-light transition-colors" />
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowStartForm(false)} className="flex-1">Cancelar</Button>
                  <Button onClick={handleStart} className="flex-1 gradient-primary text-white font-semibold gap-2"><Play className="w-4 h-4" /> Iniciar</Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mt-4 border-b border-border pb-2">
          <button className={tabClass('details')} onClick={() => setActiveTab('details')}>Detalhes</button>
          <button className={tabClass('comments')} onClick={() => setActiveTab('comments')}>
            <MessageSquare className="w-3 h-3 inline mr-1" />({comments.length})
          </button>
          <button className={tabClass('attachments')} onClick={() => setActiveTab('attachments')}>
            <Paperclip className="w-3 h-3 inline mr-1" />({attachments.length})
          </button>
          <button className={tabClass('history')} onClick={() => setActiveTab('history')}>
            <History className="w-3 h-3 inline mr-1" />({history.length})
          </button>
        </div>

        <AnimatePresence mode="wait">
          {/* Details */}
          {activeTab === 'details' && (
            <motion.div key="details" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="grid grid-cols-2 gap-x-6 mt-2">
                <InfoRow icon={User} label="Solicitante" value={task.requester || '—'} />
                <InfoRow icon={User} label="Responsável" value={task.assignee || '—'} />
                <InfoRow icon={Clock} label="Criado em" value={formatDate(task.createdAt)} />
                {task.startDate && <InfoRow icon={Clock} label="Iniciado em" value={formatDate(task.startDate)} />}
                {task.dueDate && <InfoRow icon={Calendar} label="Prazo" value={formatDate(task.dueDate)} highlight={metrics.isOverdue ?? false} />}
                {task.completedAt && <InfoRow icon={CheckCircle2} label="Concluído em" value={formatDate(task.completedAt)} />}
                {task.category && <InfoRow icon={Tag} label="Categoria" value={task.category} />}
                {metrics.daysInProgress > 0 && <InfoRow icon={Timer} label="Tempo" value={`${metrics.daysInProgress}d (${metrics.totalExecutionHours}h)`} />}
              </div>
              {task.tags && task.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {task.tags.map(tag => <span key={tag} className="px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">{tag}</span>)}
                </div>
              )}
              {task.notes && (
                <div className="mt-4 p-3 bg-muted rounded-xl">
                  <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider mb-1">Observações</p>
                  <p className="text-sm text-foreground">{task.notes}</p>
                </div>
              )}
            </motion.div>
          )}

          {/* Comments */}
          {activeTab === 'comments' && (
            <motion.div key="comments" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-2 space-y-3">
              <div className="max-h-[300px] overflow-y-auto space-y-3">
                {comments.map(c => (
                  <motion.div key={c.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                    className={`p-3 rounded-xl ${c.user_id === user?.id ? 'bg-primary-light/5 border border-primary-light/20 ml-6' : 'bg-muted mr-6'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-foreground">{c.user_name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground">{format(new Date(c.created_at), "dd/MM HH:mm", { locale: ptBR })}</span>
                        {(c.user_id === user?.id || isAdmin || permissions?.can_delete_comments) && (
                          <button onClick={() => handleDeleteComment(c.id)} className="text-muted-foreground hover:text-urgent transition-colors"><X className="w-3 h-3" /></button>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-foreground">{c.content}</p>
                  </motion.div>
                ))}
                {comments.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Nenhum comentário ainda</p>}
                <div ref={commentsEndRef} />
              </div>
              {(isAdmin || permissions?.can_comment) && (
                <div className="flex gap-2">
                  <input value={newComment} onChange={e => setNewComment(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddComment()}
                    placeholder="Escreva um comentário..." className="flex-1 px-4 py-2.5 bg-muted rounded-xl text-sm border-2 border-transparent outline-none focus:border-primary-light transition-colors" />
                  <Button onClick={handleAddComment} size="sm" className="gradient-primary text-white"><Send className="w-4 h-4" /></Button>
                </div>
              )}
            </motion.div>
          )}

          {/* Attachments */}
          {activeTab === 'attachments' && (
            <motion.div key="attachments" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-2 space-y-3">
              {(isAdmin || permissions?.can_attach_files) && (
                <div>
                  <input type="file" ref={fileInputRef} onChange={handleUpload} className="hidden" />
                  <Button onClick={() => fileInputRef.current?.click()} disabled={uploading} variant="outline" className="gap-2 w-full">
                    <Upload className="w-4 h-4" /> {uploading ? 'Enviando...' : 'Anexar arquivo'}
                  </Button>
                </div>
              )}
              <div className="space-y-2">
                {attachments.map(a => (
                  <div key={a.id} className="flex items-center justify-between p-3 bg-muted rounded-xl hover:bg-muted/80 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      {isImage(a.file_type) ? (
                        <img src={a.file_url} alt={a.file_name} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                      ) : (
                        <Paperclip className="w-4 h-4 text-muted-foreground shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{a.file_name}</p>
                        <p className="text-[10px] text-muted-foreground">{formatSize(a.file_size)} • {format(new Date(a.created_at), 'dd/MM HH:mm', { locale: ptBR })}</p>
                      </div>
                    </div>
                    <a href={a.file_url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg hover:bg-card transition-colors">
                      <Download className="w-4 h-4 text-primary-light" />
                    </a>
                  </div>
                ))}
                {attachments.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Nenhum anexo</p>}
              </div>
            </motion.div>
          )}

          {/* History */}
          {activeTab === 'history' && (
            <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-2">
              {loadingHistory ? (
                <p className="text-sm text-muted-foreground text-center py-8">Carregando...</p>
              ) : history.length > 0 ? (
                <div className="border-l-2 border-primary-light/20 pl-4 space-y-3 max-h-[400px] overflow-y-auto">
                  {history.map(entry => (
                    <div key={entry.id} className="relative">
                      <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-primary-light border-2 border-card" />
                      <p className="text-xs text-foreground font-medium">{entry.action}</p>
                      {entry.old_value && entry.new_value && <p className="text-[11px] text-muted-foreground">{entry.old_value} → {entry.new_value}</p>}
                      {!entry.old_value && entry.new_value && <p className="text-[11px] text-muted-foreground">{entry.new_value}</p>}
                      <p className="text-[10px] text-muted-foreground/60">{format(new Date(entry.created_at), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}{entry.user_name && ` • ${entry.user_name}`}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">Sem registros</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-border">
          {canDelete && (
            <Button variant="outline" onClick={handleDelete} className="text-urgent gap-2"><Trash2 className="w-4 h-4" /> Excluir</Button>
          )}
          {canEdit && (
            <Button onClick={() => { onEdit(task); onClose(); }} className="gradient-primary text-white gap-2"><Edit3 className="w-4 h-4" /> Editar</Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
