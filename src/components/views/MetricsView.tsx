import { useState, useMemo } from 'react';
import { Task, PRIORITY_CONFIG, STATUS_CONFIG, Priority, Status, calculateTaskMetrics } from '@/types/task';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area } from 'recharts';
import { Printer, Filter, TrendingUp, Clock, CheckCircle2, AlertTriangle, ClipboardList, Users, Calendar, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, subDays, startOfDay, eachDayOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useSupabaseUsers } from '@/hooks/useSupabaseUsers';
import { motion } from 'framer-motion';

interface MetricsViewProps {
  tasks: Task[];
}

const COLORS = ['#3b82f6', '#f59e0b', '#22c55e', '#ef4444', '#8b5cf6', '#06b6d4'];

export function MetricsView({ tasks }: MetricsViewProps) {
  const { teams, users } = useSupabaseUsers();
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterRequester, setFilterRequester] = useState('');
  const [filterTeam, setFilterTeam] = useState('');

  const filtered = useMemo(() => {
    return tasks.filter(t => {
      if (periodStart && new Date(t.createdAt) < new Date(periodStart)) return false;
      if (periodEnd && new Date(t.createdAt) > new Date(periodEnd + 'T23:59:59')) return false;
      if (filterAssignee && t.assignee !== filterAssignee) return false;
      if (filterStatus && t.status !== filterStatus) return false;
      if (filterPriority && t.priority !== filterPriority) return false;
      if (filterRequester && t.requester !== filterRequester) return false;
      if (filterTeam && t.team_id !== filterTeam) return false;
      return true;
    });
  }, [tasks, periodStart, periodEnd, filterAssignee, filterStatus, filterPriority, filterRequester, filterTeam]);

  const assignees = [...new Set(tasks.map(t => t.assignee).filter(Boolean))];
  const requesters = [...new Set(tasks.map(t => t.requester).filter(Boolean))];

  const total = filtered.length;
  const completed = filtered.filter(t => t.status === 'concluido').length;
  const urgent = filtered.filter(t => t.priority === 'urgente' || t.status === 'urgente').length;
  const overdue = filtered.filter(t => calculateTaskMetrics(t).isOverdue).length;
  const completedTasks = filtered.filter(t => t.status === 'concluido' && t.completedAt && t.startDate);
  const avgCompletionHours = completedTasks.length > 0 ? Math.round(completedTasks.reduce((sum, t) => sum + calculateTaskMetrics(t).totalExecutionHours, 0) / completedTasks.length) : 0;
  const onTime = filtered.filter(t => calculateTaskMetrics(t).wasOnTime).length;
  const late = filtered.filter(t => calculateTaskMetrics(t).wasLate).length;

  const byStatus = (Object.keys(STATUS_CONFIG) as Status[]).map(s => ({ name: STATUS_CONFIG[s].label, value: filtered.filter(t => t.status === s).length }));
  const byPriority = (Object.keys(PRIORITY_CONFIG) as Priority[]).map(p => ({ name: PRIORITY_CONFIG[p].label, value: filtered.filter(t => t.priority === p).length }));
  const byAssignee = assignees.map(a => ({
    name: a,
    total: filtered.filter(t => t.assignee === a).length,
    completed: filtered.filter(t => t.assignee === a && t.status === 'concluido').length,
    overdue: filtered.filter(t => t.assignee === a && calculateTaskMetrics(t).isOverdue).length,
  })).sort((a, b) => b.completed - a.completed);

  // By team
  const byTeam = teams.map(team => ({
    name: team.name,
    total: filtered.filter(t => t.team_id === team.id).length,
    completed: filtered.filter(t => t.team_id === team.id && t.status === 'concluido').length,
  })).filter(t => t.total > 0);

  // Over time (last 14 days)
  const last14 = eachDayOfInterval({ start: subDays(new Date(), 13), end: new Date() });
  const overTime = last14.map(day => {
    const dayStr = format(day, 'dd/MM');
    const created = filtered.filter(t => format(new Date(t.createdAt), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')).length;
    const done = filtered.filter(t => t.completedAt && format(new Date(t.completedAt), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')).length;
    return { name: dayStr, Criadas: created, Concluídas: done };
  });

  // Gestor performance
  const gestorPerf = users.filter(u => u.role === 'gestor').map(g => {
    const gTasks = filtered.filter(t => t.team_id === g.team_id);
    return {
      name: g.full_name.split(' ')[0],
      total: gTasks.length,
      completed: gTasks.filter(t => t.status === 'concluido').length,
    };
  }).filter(g => g.total > 0);

  const topPerformer = byAssignee.length > 0 ? byAssignee[0] : null;
  const handlePrint = () => window.print();

  const selectClass = "px-3 py-2 bg-card border border-border rounded-lg text-xs outline-none focus:ring-2 focus:ring-primary-light/30";
  const inputClass = "px-3 py-2 bg-card border border-border rounded-lg text-xs outline-none focus:ring-2 focus:ring-primary-light/30";

  const indicators = [
    { label: 'Total', value: total, icon: ClipboardList, color: 'text-primary-light', bg: 'bg-primary-light/10' },
    { label: 'Concluídas', value: completed, icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10' },
    { label: 'Urgentes', value: urgent, icon: AlertTriangle, color: 'text-urgent', bg: 'bg-urgent/10' },
    { label: 'Atrasadas', value: overdue, icon: Clock, color: 'text-warning', bg: 'bg-warning/10' },
    { label: 'No prazo', value: onTime, icon: TrendingUp, color: 'text-success', bg: 'bg-success/10' },
    { label: 'Fora do prazo', value: late, icon: AlertTriangle, color: 'text-urgent', bg: 'bg-urgent/10' },
    { label: 'Tempo médio', value: `${avgCompletionHours}h`, icon: Clock, color: 'text-primary-light', bg: 'bg-primary-light/10' },
    { label: 'Destaque', value: topPerformer?.name?.split(' ')[0] || '—', icon: Users, color: 'text-primary-light', bg: 'bg-primary-light/10' },
  ];

  return (
    <div className="space-y-6 animate-slide-in print-area">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-heading font-bold text-foreground">Métricas & Relatórios</h2>
          <p className="text-sm text-muted-foreground">Análise de desempenho e produtividade</p>
        </div>
        <Button onClick={handlePrint} variant="outline" className="gap-2 print:hidden"><Printer className="w-4 h-4" /> Imprimir</Button>
      </div>

      <div className="hidden print:block mb-6">
        <div className="text-center border-b border-border pb-4 mb-4">
          <h1 className="text-2xl font-heading font-bold">ÁGAPE FLOW — Relatório Gerencial</h1>
          <p className="text-sm text-muted-foreground">Gerado em {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-2xl p-4 shadow-card border border-border print:hidden">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-semibold text-foreground uppercase tracking-wider">Filtros</span>
        </div>
        <div className="flex flex-wrap gap-3">
          <div><label className="block text-[10px] text-muted-foreground mb-1">Início</label><input type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)} className={inputClass} /></div>
          <div><label className="block text-[10px] text-muted-foreground mb-1">Fim</label><input type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} className={inputClass} /></div>
          <div><label className="block text-[10px] text-muted-foreground mb-1">Responsável</label>
            <select value={filterAssignee} onChange={e => setFilterAssignee(e.target.value)} className={selectClass}><option value="">Todos</option>{assignees.map(a => <option key={a} value={a}>{a}</option>)}</select>
          </div>
          <div><label className="block text-[10px] text-muted-foreground mb-1">Equipe</label>
            <select value={filterTeam} onChange={e => setFilterTeam(e.target.value)} className={selectClass}><option value="">Todas</option>{teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
          </div>
          <div><label className="block text-[10px] text-muted-foreground mb-1">Status</label>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={selectClass}><option value="">Todos</option>{(Object.keys(STATUS_CONFIG) as Status[]).map(s => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}</select>
          </div>
          <div><label className="block text-[10px] text-muted-foreground mb-1">Prioridade</label>
            <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} className={selectClass}><option value="">Todas</option>{(Object.keys(PRIORITY_CONFIG) as Priority[]).map(p => <option key={p} value={p}>{PRIORITY_CONFIG[p].label}</option>)}</select>
          </div>
          <div><label className="block text-[10px] text-muted-foreground mb-1">Solicitante</label>
            <select value={filterRequester} onChange={e => setFilterRequester(e.target.value)} className={selectClass}><option value="">Todos</option>{requesters.map(r => <option key={r} value={r}>{r}</option>)}</select>
          </div>
        </div>
      </div>

      {/* Indicators */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {indicators.map((m, i) => (
          <motion.div key={m.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-card rounded-xl p-4 shadow-card border border-border hover:shadow-elevated transition-shadow">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${m.bg} flex items-center justify-center`}><m.icon className={`w-5 h-5 ${m.color}`} /></div>
              <div><p className="text-xl font-heading font-bold text-foreground">{m.value}</p><p className="text-[11px] text-muted-foreground font-medium">{m.label}</p></div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card rounded-2xl p-6 shadow-card border border-border">
          <h3 className="font-heading font-semibold text-foreground mb-4">Por Status</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart><Pie data={byStatus} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" label={({ name, value }) => value > 0 ? `${name}: ${value}` : ''}>{byStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /><Legend /></PieChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-card rounded-2xl p-6 shadow-card border border-border">
          <h3 className="font-heading font-semibold text-foreground mb-4">Por Prioridade</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={byPriority}><CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" /><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="value" radius={[6, 6, 0, 0]}>{byPriority.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Bar></BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Over time chart */}
      <div className="bg-card rounded-2xl p-6 shadow-card border border-border">
        <h3 className="font-heading font-semibold text-foreground mb-4">Demandas nos últimos 14 dias</h3>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={overTime}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="Criadas" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} />
            <Area type="monotone" dataKey="Concluídas" stroke="#22c55e" fill="#22c55e" fillOpacity={0.1} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {byTeam.length > 0 && (
          <div className="bg-card rounded-2xl p-6 shadow-card border border-border">
            <h3 className="font-heading font-semibold text-foreground mb-4">Por Equipe</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={byTeam}><CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" /><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip /><Legend /><Bar dataKey="total" name="Total" fill="#3b82f6" radius={[6, 6, 0, 0]} /><Bar dataKey="completed" name="Concluídas" fill="#22c55e" radius={[6, 6, 0, 0]} /></BarChart>
            </ResponsiveContainer>
          </div>
        )}
        {gestorPerf.length > 0 && (
          <div className="bg-card rounded-2xl p-6 shadow-card border border-border">
            <h3 className="font-heading font-semibold text-foreground mb-4">Desempenho por Gestor</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={gestorPerf}><CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" /><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip /><Legend /><Bar dataKey="total" name="Total" fill="#8b5cf6" radius={[6, 6, 0, 0]} /><Bar dataKey="completed" name="Concluídas" fill="#22c55e" radius={[6, 6, 0, 0]} /></BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Productivity by assignee */}
      {byAssignee.length > 0 && (
        <div className="bg-card rounded-2xl p-6 shadow-card border border-border">
          <h3 className="font-heading font-semibold text-foreground mb-4">Produtividade por Responsável</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={byAssignee}><CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" /><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip /><Legend /><Bar dataKey="total" name="Total" fill="#3b82f6" radius={[6, 6, 0, 0]} /><Bar dataKey="completed" name="Concluídas" fill="#22c55e" radius={[6, 6, 0, 0]} /><Bar dataKey="overdue" name="Atrasadas" fill="#ef4444" radius={[6, 6, 0, 0]} /></BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Detailed table */}
      <div className="bg-card rounded-2xl p-6 shadow-card border border-border">
        <h3 className="font-heading font-semibold text-foreground mb-4">Tabela Detalhada</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-2 font-semibold text-muted-foreground uppercase tracking-wider">Demanda</th>
                <th className="text-left py-2 px-2 font-semibold text-muted-foreground uppercase tracking-wider">Responsável</th>
                <th className="text-left py-2 px-2 font-semibold text-muted-foreground uppercase tracking-wider">Prioridade</th>
                <th className="text-left py-2 px-2 font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="text-left py-2 px-2 font-semibold text-muted-foreground uppercase tracking-wider">Criação</th>
                <th className="text-left py-2 px-2 font-semibold text-muted-foreground uppercase tracking-wider">Prazo</th>
                <th className="text-left py-2 px-2 font-semibold text-muted-foreground uppercase tracking-wider">Situação</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => {
                const m = calculateTaskMetrics(t);
                return (
                  <tr key={t.id} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                    <td className="py-2 px-2 font-medium text-foreground max-w-[200px] truncate">{t.name}</td>
                    <td className="py-2 px-2 text-muted-foreground">{t.assignee || '—'}</td>
                    <td className="py-2 px-2"><span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${PRIORITY_CONFIG[t.priority].bgClass} ${PRIORITY_CONFIG[t.priority].textClass}`}>{PRIORITY_CONFIG[t.priority].label}</span></td>
                    <td className="py-2 px-2 text-muted-foreground">{STATUS_CONFIG[t.status]?.label || t.status}</td>
                    <td className="py-2 px-2 text-muted-foreground">{format(new Date(t.createdAt), 'dd/MM/yy', { locale: ptBR })}</td>
                    <td className="py-2 px-2 text-muted-foreground">{t.dueDate ? format(new Date(t.dueDate), 'dd/MM/yy', { locale: ptBR }) : '—'}</td>
                    <td className="py-2 px-2">
                      {m.wasOnTime && <span className="text-success text-[10px] font-semibold">✓ No prazo</span>}
                      {m.wasLate && <span className="text-urgent text-[10px] font-semibold">✗ Atrasada</span>}
                      {m.isOverdue && <span className="text-urgent text-[10px] font-semibold">⚠ Em atraso</span>}
                      {!m.wasOnTime && !m.wasLate && !m.isOverdue && <span className="text-muted-foreground text-[10px]">—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
