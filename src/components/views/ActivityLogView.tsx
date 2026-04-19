import { useState, useEffect } from 'react';
import { useActivityLog, ActivityLogEntry } from '@/hooks/useActivityLog';
import { useSupabaseUsers } from '@/hooks/useSupabaseUsers';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Activity, Filter, User, Calendar, Search } from 'lucide-react';

export function ActivityLogView() {
  const { fetchGlobalLogs } = useActivityLog();
  const { users } = useSupabaseUsers();
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterUser, setFilterUser] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [filterStart, setFilterStart] = useState('');
  const [filterEnd, setFilterEnd] = useState('');

  useEffect(() => { loadLogs(); }, []);

  const loadLogs = async () => {
    setLoading(true);
    const data = await fetchGlobalLogs({
      userId: filterUser || undefined,
      action: filterAction || undefined,
      startDate: filterStart || undefined,
      endDate: filterEnd || undefined,
      limit: 500,
    });
    setLogs(data);
    setLoading(false);
  };

  useEffect(() => { loadLogs(); }, [filterUser, filterAction, filterStart, filterEnd]);

  const selectClass = "px-3 py-2 bg-card border border-border rounded-lg text-xs outline-none focus:ring-2 focus:ring-primary-light/30";

  const ACTION_COLORS: Record<string, string> = {
    'Demanda criada': 'bg-success/10 text-success',
    'Demanda excluída': 'bg-urgent/10 text-urgent',
    'Status alterado': 'bg-primary-light/10 text-primary-light',
    'Demanda iniciada': 'bg-primary-light/10 text-primary-light',
    'Demanda concluída': 'bg-success/10 text-success',
    'Prioridade alterada': 'bg-warning/10 text-warning',
    'Responsável alterado': 'bg-primary-light/10 text-primary-light',
    'Prazo alterado': 'bg-warning/10 text-warning',
    'Prazo definido': 'bg-warning/10 text-warning',
    'Comentário adicionado': 'bg-[#8b5cf6]/10 text-[#8b5cf6]',
    'Anexo adicionado': 'bg-[#06b6d4]/10 text-[#06b6d4]',
    'Demanda editada': 'bg-muted text-muted-foreground',
  };

  return (
    <div className="space-y-7 animate-slide-in">
      <div>
        <h2 className="text-3xl font-heading font-extrabold text-primary-light tracking-tight">Log de Atividades</h2>
        <p className="text-sm text-muted-foreground mt-1">Histórico completo de ações no sistema.</p>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-2xl p-4 shadow-card border border-border">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-semibold text-foreground uppercase tracking-wider">Filtros</span>
        </div>
        <div className="flex flex-wrap gap-3">
          <div>
            <label className="block text-[10px] text-muted-foreground mb-1">Usuário</label>
            <select value={filterUser} onChange={e => setFilterUser(e.target.value)} className={selectClass}>
              <option value="">Todos</option>
              {users.map(u => <option key={u.user_id} value={u.user_id}>{u.full_name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-muted-foreground mb-1">Ação</label>
            <select value={filterAction} onChange={e => setFilterAction(e.target.value)} className={selectClass}>
              <option value="">Todas</option>
              <option value="criada">Criação</option>
              <option value="alterado">Alteração</option>
              <option value="iniciada">Início</option>
              <option value="concluída">Conclusão</option>
              <option value="excluída">Exclusão</option>
              <option value="Comentário">Comentário</option>
              <option value="Anexo">Anexo</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-muted-foreground mb-1">De</label>
            <input type="date" value={filterStart} onChange={e => setFilterStart(e.target.value)} className={selectClass} />
          </div>
          <div>
            <label className="block text-[10px] text-muted-foreground mb-1">Até</label>
            <input type="date" value={filterEnd} onChange={e => setFilterEnd(e.target.value)} className={selectClass} />
          </div>
        </div>
      </div>

      {/* Log list */}
      <div className="bg-card rounded-2xl shadow-card border border-border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-primary-light border-t-transparent rounded-full animate-spin" />
          </div>
        ) : logs.length > 0 ? (
          <div className="divide-y divide-border">
            {logs.map(log => (
              <div key={log.id} className="flex items-start gap-4 px-5 py-3 hover:bg-muted/30 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-primary-light/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Activity className="w-4 h-4 text-primary-light" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${ACTION_COLORS[log.action] || 'bg-muted text-muted-foreground'}`}>
                      {log.action}
                    </span>
                    {log.user_name && (
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <User className="w-3 h-3" /> {log.user_name}
                      </span>
                    )}
                  </div>
                  {log.old_value && log.new_value && (
                    <p className="text-xs text-muted-foreground mt-0.5">{log.old_value} → {log.new_value}</p>
                  )}
                  {!log.old_value && log.new_value && (
                    <p className="text-xs text-muted-foreground mt-0.5">{log.new_value}</p>
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground shrink-0">
                  {format(new Date(log.created_at), "dd/MM HH:mm", { locale: ptBR })}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Activity className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">Nenhuma atividade registrada</p>
          </div>
        )}
      </div>
    </div>
  );
}
