import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, profile, role } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-primary-light animate-spin" />
          <p className="text-sm text-muted-foreground font-medium">Carregando ÁGAPE FLOW...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (profile && !profile.active) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="bg-card rounded-2xl shadow-modal p-8 max-w-md text-center border border-border">
          <h2 className="font-heading font-bold text-lg text-foreground mb-2">Acesso Desativado</h2>
          <p className="text-sm text-muted-foreground mb-4">Sua conta foi desativada pelo administrador. Entre em contato para mais informações.</p>
        </div>
      </div>
    );
  }

  if (profile && !profile.login_enabled) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="bg-card rounded-2xl shadow-modal p-8 max-w-md text-center border border-border">
          <h2 className="font-heading font-bold text-lg text-foreground mb-2">Login Não Habilitado</h2>
          <p className="text-sm text-muted-foreground mb-4">Seu login no painel não está habilitado. Solicite ao administrador para ativar seu acesso.</p>
        </div>
      </div>
    );
  }

  // Only admin, gestor and colaborador can access the panel
  if (role && role !== 'admin' && role !== 'gestor' && role !== 'colaborador') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="bg-card rounded-2xl shadow-modal p-8 max-w-md text-center border border-border">
          <h2 className="font-heading font-bold text-lg text-foreground mb-2">Acesso Restrito</h2>
          <p className="text-sm text-muted-foreground mb-4">Sua conta não possui um perfil válido. Contate o administrador.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
