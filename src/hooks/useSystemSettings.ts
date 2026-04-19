import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SystemSettings {
  system_name: string;
  system_slogan: string;
  simple_password: string;
  logo_url: string;
  primary_color: string;
  sidebar_color: string;
  whatsapp_enabled: string;
  whatsapp_number: string;
  whatsapp_template_start: string;
  whatsapp_template_complete: string;
  whatsapp_template_manual: string;
}

export const DEFAULT_TEMPLATES = {
  start: `🚀 *Demanda iniciada*\n\n📌 *Título:* {title}\n📊 *Status:* {status}\n👤 *Responsável:* {responsible}\n📅 *Prazo:* {deadline}`,
  complete: `✅ *Demanda concluída*\n\n📌 *Título:* {title}\n👤 *Responsável:* {responsible}\n📅 *Concluída em:* {deadline}`,
  manual: `📌 *Demanda:* {title}\n📊 *Status:* {status}\n👤 *Responsável:* {responsible}\n📅 *Prazo:* {deadline}`,
};

const DEFAULTS: SystemSettings = {
  system_name: 'ÁGAPE FLOW',
  system_slogan: 'Tecnologia que conecta resultados',
  simple_password: '1234',
  logo_url: '',
  primary_color: '#1e3a5f',
  sidebar_color: '#1a2744',
  whatsapp_enabled: 'false',
  whatsapp_number: '',
  whatsapp_template_start: DEFAULT_TEMPLATES.start,
  whatsapp_template_complete: DEFAULT_TEMPLATES.complete,
  whatsapp_template_manual: DEFAULT_TEMPLATES.manual,
};

export function useSystemSettings() {
  const [settings, setSettings] = useState<SystemSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('system_settings').select('key, value');
    if (error) {
      console.error('[useSystemSettings] fetch error', error);
      setLoading(false);
      return;
    }
    // Build map preserving every stored value (including empty strings)
    const map: Record<string, string> = {};
    (data || []).forEach(d => { if (d.value !== null && d.value !== undefined) map[d.key] = d.value; });
    // Use ?? so a saved empty string is preserved (only fall back to default when key is truly absent)
    setSettings({
      system_name: map.system_name ?? DEFAULTS.system_name,
      system_slogan: map.system_slogan ?? DEFAULTS.system_slogan,
      simple_password: map.simple_password ?? DEFAULTS.simple_password,
      logo_url: map.logo_url ?? DEFAULTS.logo_url,
      primary_color: map.primary_color ?? DEFAULTS.primary_color,
      sidebar_color: map.sidebar_color ?? DEFAULTS.sidebar_color,
      whatsapp_enabled: map.whatsapp_enabled ?? DEFAULTS.whatsapp_enabled,
      whatsapp_number: map.whatsapp_number ?? DEFAULTS.whatsapp_number,
      whatsapp_template_start: map.whatsapp_template_start ?? DEFAULTS.whatsapp_template_start,
      whatsapp_template_complete: map.whatsapp_template_complete ?? DEFAULTS.whatsapp_template_complete,
      whatsapp_template_manual: map.whatsapp_template_manual ?? DEFAULTS.whatsapp_template_manual,
    });
    setLoading(false);
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const writeSetting = useCallback(async (key: string, value: string) => {
    const { data: existing } = await supabase.from('system_settings').select('id').eq('key', key).maybeSingle();
    if (existing) {
      const { error } = await supabase.from('system_settings').update({ value }).eq('key', key);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('system_settings').insert({ key, value });
      if (error) throw error;
    }
  }, []);

  const updateSetting = useCallback(async (key: string, value: string) => {
    try {
      await writeSetting(key, value);
      await fetchSettings();
    } catch (e: any) {
      console.error('[useSystemSettings] save error', e);
      toast.error('Erro ao salvar: ' + (e?.message || 'desconhecido'));
    }
  }, [writeSetting, fetchSettings]);

  const updateMultiple = useCallback(async (updates: Partial<SystemSettings>) => {
    try {
      // Sequential to avoid race conditions on the same key
      for (const [key, value] of Object.entries(updates)) {
        await writeSetting(key, value as string);
      }
      await fetchSettings();
      toast.success('Configurações salvas!');
    } catch (e: any) {
      console.error('[useSystemSettings] bulk save error', e);
      toast.error('Erro ao salvar configurações');
    }
  }, [writeSetting, fetchSettings]);

  return { settings, loading, updateSetting, updateMultiple, refetch: fetchSettings };
}
