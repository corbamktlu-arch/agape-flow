import { useState, useEffect, useMemo } from 'react';
import { useSystemSettings, DEFAULT_TEMPLATES } from '@/hooks/useSystemSettings';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Save, Zap, CheckCircle2, ExternalLink, Settings2, Globe, Smartphone, Eye, RotateCcw, Variable } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { renderTemplate, SAMPLE_TASK, buildWhatsAppLink } from '@/lib/whatsapp';

function WhatsAppIcon({ className = 'w-7 h-7' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="currentColor" aria-hidden="true">
      <path d="M16 .5C7.44.5.5 7.44.5 16c0 2.82.74 5.46 2.04 7.76L.5 31.5l7.95-2.02A15.43 15.43 0 0 0 16 31.5C24.56 31.5 31.5 24.56 31.5 16S24.56.5 16 .5zm0 28.2c-2.5 0-4.86-.66-6.9-1.81l-.49-.29-4.72 1.2 1.26-4.6-.32-.5A12.65 12.65 0 0 1 3.3 16C3.3 8.99 8.99 3.3 16 3.3S28.7 8.99 28.7 16 23.01 28.7 16 28.7zm7.27-9.5c-.4-.2-2.36-1.16-2.72-1.3-.36-.13-.63-.2-.9.2s-1.03 1.3-1.27 1.56c-.23.27-.46.3-.86.1-.4-.2-1.69-.62-3.22-1.98-1.19-1.06-2-2.37-2.23-2.77-.23-.4-.02-.62.18-.82.18-.18.4-.46.6-.7.2-.23.27-.4.4-.66.13-.27.07-.5-.03-.7-.1-.2-.9-2.17-1.23-2.97-.32-.78-.65-.67-.9-.68l-.76-.01c-.27 0-.7.1-1.07.5-.36.4-1.4 1.37-1.4 3.34 0 1.97 1.43 3.87 1.63 4.14.2.27 2.82 4.3 6.83 6.03.95.41 1.7.65 2.28.84.96.3 1.83.26 2.52.16.77-.11 2.36-.96 2.7-1.9.33-.93.33-1.72.23-1.9-.1-.17-.36-.27-.76-.47z"/>
    </svg>
  );
}

const VARIABLES = [
  { key: '{title}', label: 'Título da demanda' },
  { key: '{status}', label: 'Status atual' },
  { key: '{responsible}', label: 'Responsável' },
  { key: '{deadline}', label: 'Prazo' },
  { key: '{requester}', label: 'Solicitante' },
  { key: '{priority}', label: 'Prioridade' },
];

export function IntegrationsView() {
  const { settings, loading, updateMultiple } = useSystemSettings();
  const { isAdmin } = useAuth();
  const [showConfig, setShowConfig] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // local form state
  const [enabled, setEnabled] = useState(false);
  const [number, setNumber] = useState('');
  const [tplStart, setTplStart] = useState('');
  const [tplComplete, setTplComplete] = useState('');
  const [tplManual, setTplManual] = useState('');
  const [activeTab, setActiveTab] = useState<'manual' | 'start' | 'complete'>('manual');

  useEffect(() => {
    if (loading) return;
    setEnabled(settings.whatsapp_enabled === 'true');
    setNumber(settings.whatsapp_number ?? '');
    setTplStart(settings.whatsapp_template_start ?? DEFAULT_TEMPLATES.start);
    setTplComplete(settings.whatsapp_template_complete ?? DEFAULT_TEMPLATES.complete);
    setTplManual(settings.whatsapp_template_manual ?? DEFAULT_TEMPLATES.manual);
    setHydrated(true);
  }, [loading, settings, showConfig]);

  const currentTemplate = activeTab === 'manual' ? tplManual : activeTab === 'start' ? tplStart : tplComplete;
  const setCurrentTemplate = (v: string) => {
    if (activeTab === 'manual') setTplManual(v);
    else if (activeTab === 'start') setTplStart(v);
    else setTplComplete(v);
  };

  const preview = useMemo(() => renderTemplate(currentTemplate, SAMPLE_TASK), [currentTemplate]);
  const previewLink = useMemo(() => buildWhatsAppLink(preview, number), [preview, number]);

  const handleSave = async () => {
    setSaving(true);
    await updateMultiple({
      whatsapp_enabled: enabled ? 'true' : 'false',
      whatsapp_number: number,
      whatsapp_template_start: tplStart,
      whatsapp_template_complete: tplComplete,
      whatsapp_template_manual: tplManual,
    } as any);
    setSaving(false);
    setShowConfig(false);
  };

  const insertVar = (variable: string) => {
    setCurrentTemplate(currentTemplate + (currentTemplate.endsWith(' ') || !currentTemplate ? '' : ' ') + variable);
  };

  const resetTemplate = () => {
    if (activeTab === 'manual') setTplManual(DEFAULT_TEMPLATES.manual);
    else if (activeTab === 'start') setTplStart(DEFAULT_TEMPLATES.start);
    else setTplComplete(DEFAULT_TEMPLATES.complete);
    toast.success('Modelo restaurado para o padrão');
  };

  if (!isAdmin) {
    return <p className="text-sm text-muted-foreground text-center py-20">Apenas administradores podem acessar integrações.</p>;
  }

  const features = [
    'Notificações de Início de Demanda',
    'Notificações de Conclusão',
    'Mensagens via wa.me com templates',
    'Variáveis dinâmicas por demanda',
  ];

  const webhookFeatures = [
    { icon: Globe, label: 'Endpoints customizados' },
    { icon: Smartphone, label: 'Eventos em tempo real' },
  ];

  return (
    <div className="space-y-7 animate-slide-in">
      <div>
        <h2 className="text-3xl font-heading font-extrabold text-primary-light tracking-tight">Integrações</h2>
        <p className="text-sm text-muted-foreground mt-1">Conecte o ÁGAPE FLOW com outras ferramentas e automatize comunicações.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* WhatsApp Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl shadow-card border border-border overflow-hidden hover:shadow-elevated transition-shadow"
        >
          <div className="h-1.5 bg-[#25D366]" />
          <div className="p-6">
            <div className="flex items-start justify-between mb-5">
              <div className="w-14 h-14 rounded-2xl bg-[#25D366]/10 flex items-center justify-center text-[#25D366]">
                <WhatsAppIcon className="w-7 h-7" />
              </div>
              <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/20 uppercase tracking-wider">
                {enabled ? 'Ativo' : 'Inativo'}
              </span>
            </div>

            <h3 className="font-heading font-bold text-xl text-foreground mb-2">WhatsApp Business</h3>
            <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
              Envie mensagens automáticas e atualizações de demandas com modelos personalizados e variáveis dinâmicas.
            </p>

            <div className="space-y-2 mb-6">
              {features.map((feature, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-[#25D366]/5 border border-[#25D366]/10">
                  <CheckCircle2 className="w-4 h-4 text-[#25D366] shrink-0" />
                  <span className="text-sm font-medium text-foreground">{feature}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowConfig(true)}
                className="flex-1 bg-[#25D366] hover:bg-[#1fb957] text-white font-semibold gap-2 rounded-xl shadow-md hover:shadow-lg transition-all"
              >
                <Settings2 className="w-4 h-4" /> Configurar Mensagens
              </Button>
              <a
                href={number ? `https://wa.me/${number.replace(/\D/g, '')}` : '#'}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => { if (!number) { e.preventDefault(); toast.error('Configure o número primeiro'); } }}
                className="w-11 h-11 rounded-xl border-2 border-border hover:border-[#25D366]/40 hover:bg-[#25D366]/5 flex items-center justify-center transition-all"
                aria-label="Abrir WhatsApp"
              >
                <ExternalLink className="w-4 h-4 text-muted-foreground" />
              </a>
            </div>
          </div>
        </motion.div>

        {/* Webhooks Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-2xl shadow-card border border-border overflow-hidden opacity-90"
        >
          <div className="h-1.5 bg-gradient-to-r from-muted via-border to-muted" />
          <div className="p-6">
            <div className="flex items-start justify-between mb-5">
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
                <Zap className="w-7 h-7 text-muted-foreground" strokeWidth={2} />
              </div>
              <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-muted text-muted-foreground border border-border uppercase tracking-wider">
                Em breve
              </span>
            </div>
            <h3 className="font-heading font-bold text-xl text-foreground mb-2">Webhooks &amp; API</h3>
            <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
              Conecte ÁGAPE FLOW com Zapier, Make ou seu próprio sistema via API REST.
            </p>
            <div className="space-y-2 mb-6">
              {webhookFeatures.map((f, i) => {
                const Icon = f.icon;
                return (
                  <div key={i} className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-muted/40 border border-border">
                    <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-sm font-medium text-muted-foreground">{f.label}</span>
                  </div>
                );
              })}
            </div>
            <Button disabled className="w-full bg-muted text-muted-foreground font-semibold rounded-xl cursor-not-allowed">
              Aguardando Lançamento
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Config dialog */}
      <Dialog open={showConfig} onOpenChange={setShowConfig}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto shadow-modal">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl flex items-center gap-2">
              <span className="w-9 h-9 rounded-xl bg-[#25D366]/10 text-[#25D366] flex items-center justify-center">
                <WhatsAppIcon className="w-5 h-5" />
              </span>
              Automação WhatsApp
            </DialogTitle>
            <DialogDescription>
              Configure modelos de mensagem com variáveis dinâmicas. Cada demanda preenche automaticamente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Toggle + number */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 bg-muted/40 rounded-xl border border-border">
                <div>
                  <p className="text-sm font-semibold text-foreground">Ativar WhatsApp</p>
                  <p className="text-xs text-muted-foreground">Habilitar envio de mensagens</p>
                </div>
                <Switch checked={enabled} onCheckedChange={setEnabled} />
              </div>

              <div className="p-4 bg-muted/40 rounded-xl border border-border">
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Número padrão (opcional)
                </label>
                <input
                  value={number}
                  onChange={e => setNumber(e.target.value.replace(/\D/g, ''))}
                  placeholder="5511999999999"
                  className="w-full px-3 py-2 bg-background rounded-lg text-sm border-2 border-transparent outline-none focus:border-[#25D366] transition-colors"
                />
                <p className="text-[10px] text-muted-foreground mt-1">País + DDD + número (sem espaços)</p>
              </div>
            </div>

            {/* Template editor with tabs */}
            <div className="border border-border rounded-xl overflow-hidden">
              <Tabs value={activeTab} onValueChange={v => setActiveTab(v as any)}>
                <div className="border-b border-border bg-muted/30 px-2 pt-2">
                  <TabsList className="bg-transparent">
                    <TabsTrigger value="manual">💬 Manual</TabsTrigger>
                    <TabsTrigger value="start">🚀 Início</TabsTrigger>
                    <TabsTrigger value="complete">✅ Conclusão</TabsTrigger>
                  </TabsList>
                </div>

                <div className="p-5 space-y-4">
                  <TabsContent value={activeTab} className="m-0 space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-semibold text-foreground">Modelo da mensagem</label>
                        <button
                          type="button"
                          onClick={resetTemplate}
                          className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
                        >
                          <RotateCcw className="w-3 h-3" /> Restaurar padrão
                        </button>
                      </div>
                      <Textarea
                        value={currentTemplate}
                        onChange={e => setCurrentTemplate(e.target.value)}
                        rows={6}
                        className="font-mono text-sm leading-relaxed resize-none"
                        placeholder="Digite seu modelo aqui..."
                      />
                    </div>

                    {/* Variables */}
                    <div>
                      <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                        <Variable className="w-3.5 h-3.5" /> Variáveis disponíveis
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {VARIABLES.map(v => (
                          <button
                            key={v.key}
                            type="button"
                            onClick={() => insertVar(v.key)}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-mono bg-primary-light/10 text-primary-light hover:bg-primary-light hover:text-white border border-primary-light/20 transition-all"
                            title={v.label}
                          >
                            {v.key}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Live preview */}
                    <div>
                      <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5" /> Pré-visualização
                      </p>
                      <div className="rounded-2xl bg-[#e5ddd5] dark:bg-[#0b141a] p-4">
                        <div className="ml-auto max-w-[85%] bg-[#dcf8c6] dark:bg-[#005c4b] text-foreground dark:text-white rounded-2xl rounded-tr-sm px-4 py-3 text-sm whitespace-pre-wrap shadow-sm">
                          {preview}
                        </div>
                      </div>
                      <a
                        href={previewLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-[#25D366] hover:underline"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Testar este modelo no WhatsApp
                      </a>
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-border">
              <Button variant="outline" onClick={() => setShowConfig(false)}>Cancelar</Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-[#25D366] hover:bg-[#1fb957] text-white font-semibold gap-2 rounded-xl"
              >
                <Save className="w-4 h-4" /> {saving ? 'Salvando...' : 'Salvar configurações'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
