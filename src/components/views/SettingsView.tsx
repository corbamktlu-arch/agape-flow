import { useState, useEffect } from 'react';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Save, Palette, Type, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export function SettingsView() {
  const { settings, loading, updateMultiple } = useSystemSettings();
  const { isAdmin } = useAuth();

  const [form, setForm] = useState({
    system_name: '',
    system_slogan: '',
    simple_password: '',
    primary_color: '#1e3a5f',
    sidebar_color: '#1a2744',
  });
  const [hydrated, setHydrated] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  // Hydrate form once real settings arrive from Supabase
  useEffect(() => {
    if (loading) return;
    setForm({
      system_name: settings.system_name,
      system_slogan: settings.system_slogan,
      simple_password: settings.simple_password,
      primary_color: settings.primary_color,
      sidebar_color: settings.sidebar_color,
    });
    setHydrated(true);
  }, [loading, settings]);

  const handleSave = async () => {
    setSaving(true);
    const updates: any = { ...form };

    if (logoFile) {
      const filePath = `system/logo_${Date.now()}.${logoFile.name.split('.').pop()}`;
      const { error: uploadErr } = await supabase.storage.from('attachments').upload(filePath, logoFile);
      if (!uploadErr) {
        const { data } = supabase.storage.from('attachments').getPublicUrl(filePath);
        updates.logo_url = data.publicUrl;
      } else {
        toast.error('Erro ao enviar logo');
      }
    }

    await updateMultiple(updates);
    setLogoFile(null);
    setSaving(false);
  };

  const inputClass = "w-full px-4 py-2.5 bg-muted rounded-xl text-sm border-2 border-transparent outline-none focus:border-primary-light transition-colors";
  const labelClass = "block text-xs font-semibold text-foreground mb-1.5";

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-muted-foreground">Apenas administradores podem acessar configurações.</p>
      </div>
    );
  }

  if (loading || !hydrated) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary-light border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  

  return (
    <div className="max-w-2xl space-y-6 animate-slide-in">
      <div>
        <h2 className="text-2xl font-heading font-bold text-foreground flex items-center gap-2">
          <Settings className="w-6 h-6 text-primary-light" /> Configurações
        </h2>
        <p className="text-sm text-muted-foreground">Personalize o sistema</p>
      </div>

      {/* System Identity */}
      <div className="bg-card rounded-2xl p-6 shadow-card border border-border space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
            <Type className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-heading font-semibold text-foreground">Identidade do Sistema</h3>
            <p className="text-xs text-muted-foreground">Nome, slogan e logo</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Nome do Sistema</label>
            <input value={form.system_name} onChange={e => setForm({ ...form, system_name: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Slogan</label>
            <input value={form.system_slogan} onChange={e => setForm({ ...form, system_slogan: e.target.value })} className={inputClass} />
          </div>
        </div>

        <div>
          <label className={labelClass}>Logo do Sistema</label>
          <div className="flex items-center gap-4">
            {settings.logo_url && (
              <img src={settings.logo_url} alt="Logo" className="w-12 h-12 rounded-lg object-cover" />
            )}
            <input type="file" accept="image/*" onChange={e => setLogoFile(e.target.files?.[0] || null)} className="text-sm text-muted-foreground" />
          </div>
        </div>
      </div>

      {/* Colors */}
      <div className="bg-card rounded-2xl p-6 shadow-card border border-border space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
            <Palette className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-heading font-semibold text-foreground">Cores</h3>
            <p className="text-xs text-muted-foreground">Personalize as cores do sistema</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Cor Primária</label>
            <input type="color" value={form.primary_color} onChange={e => setForm({ ...form, primary_color: e.target.value })} className="w-full h-10 rounded-xl cursor-pointer" />
          </div>
          <div>
            <label className={labelClass}>Cor da Sidebar</label>
            <input type="color" value={form.sidebar_color} onChange={e => setForm({ ...form, sidebar_color: e.target.value })} className="w-full h-10 rounded-xl cursor-pointer" />
          </div>
        </div>
      </div>


      <Button onClick={handleSave} disabled={saving} className="w-full gradient-primary text-primary-foreground font-semibold gap-2 py-3">
        <Save className="w-4 h-4" /> {saving ? 'Salvando...' : 'Salvar Configurações'}
      </Button>
    </div>
  );
}
