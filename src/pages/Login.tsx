import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Eye, EyeOff, Loader2, Zap, Shield, BarChart3, Users } from 'lucide-react';
import { toast } from 'sonner';
import agapeLogo from '@/assets/agape-flow-logo.png';

export default function Login() {
  const { signIn, user, role, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user && role) {
      if (profile && !profile.active) return;
      if (profile && !profile.login_enabled) return;
      navigate('/');
    }
  }, [user, role, profile, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error('Preencha e-mail e senha');
      return;
    }
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      toast.error('Credenciais inválidas. Verifique e-mail e senha.');
    } else {
      toast.success('Bem-vindo ao ÁGAPE FLOW!');
      navigate('/');
    }
  };

  const features = [
    { icon: Zap, title: 'Gestão Inteligente', desc: 'Kanban dinâmico com drag & drop e controle total' },
    { icon: Shield, title: 'Segurança Avançada', desc: '35+ permissões granulares por usuário' },
    { icon: BarChart3, title: 'Métricas em Tempo Real', desc: 'Dashboards de produtividade e atraso' },
    { icon: Users, title: 'Gestão por Equipes', desc: 'Visão segmentada e isolada por gestor' },
  ];

  return (
    <div className="min-h-screen relative bg-background overflow-hidden">
      {/* Left: solid premium blue. Right: clean light surface. Sharp split, no fog. */}
      <div className="absolute inset-0 lg:hidden gradient-primary" />
      <div className="absolute inset-y-0 left-0 w-full lg:w-[58%] gradient-primary" />
      <div className="absolute inset-y-0 right-0 w-full lg:w-[42%] bg-[hsl(var(--background))] hidden lg:block" />

      {/* Subtle grid over branding side only */}
      <div
        className="absolute inset-y-0 left-0 w-full lg:w-[58%] opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(hsl(0 0% 100%) 1px, transparent 1px), linear-gradient(90deg, hsl(0 0% 100%) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(ellipse at 30% 40%, black 40%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse at 30% 40%, black 40%, transparent 80%)',
        }}
      />

      {/* Cinematic light beam at the seam — sharp, intentional, not foggy */}
      <div
        className="absolute inset-y-0 hidden lg:block pointer-events-none"
        style={{
          left: 'calc(58% - 1px)',
          width: '2px',
          background:
            'linear-gradient(to bottom, transparent 0%, hsl(var(--primary-light) / 0.6) 20%, hsl(0 0% 100% / 0.9) 50%, hsl(var(--primary-light) / 0.6) 80%, transparent 100%)',
          boxShadow: '0 0 24px hsl(var(--primary-light) / 0.5), 0 0 60px hsl(var(--primary-light) / 0.25)',
        }}
      />

      {/* Tasteful corner accents on branding side */}
      <div className="absolute -top-32 -left-32 w-[28rem] h-[28rem] rounded-full bg-primary-light/20 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[24rem] h-[24rem] rounded-full bg-white/5 blur-3xl pointer-events-none hidden lg:block" />

      <div className="relative min-h-screen flex flex-col lg:flex-row">
        {/* Left side — branding */}
        <div className="relative lg:w-[58%] flex flex-col justify-between p-8 lg:p-16 text-primary-foreground min-h-[42vh] lg:min-h-screen">
          {/* Logo + brand */}
          <div className="relative z-10 flex items-center gap-5 animate-slide-in">
            <div className="relative">
              <div className="absolute inset-0 bg-white/20 blur-2xl rounded-full" />
              <img
                src={agapeLogo}
                alt="ÁGAPE FLOW"
                className="relative w-20 h-20 lg:w-24 lg:h-24 drop-shadow-2xl"
              />
            </div>
            <div>
              <h2 className="font-heading font-black text-3xl lg:text-4xl tracking-tight leading-none">
                ÁGAPE<span className="font-light opacity-80">FLOW</span>
              </h2>
              <div className="flex items-center gap-2 mt-2">
                <span className="h-px w-6 bg-white/40" />
                <p className="text-[10px] lg:text-[11px] uppercase tracking-[0.32em] opacity-80 font-medium">
                  Tecnologia que conecta resultados
                </p>
              </div>
            </div>
          </div>

          {/* Hero */}
          <div className="relative z-10 max-w-xl animate-slide-in py-10" style={{ animationDelay: '80ms' }}>
            <h1 className="font-heading font-black text-4xl lg:text-6xl tracking-tight leading-[1.05]">
              Gestão de demandas
              <br />
              <span className="italic font-extralight opacity-95 bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                inteligente e profissional
              </span>
            </h1>
            <p className="mt-6 text-base lg:text-lg opacity-85 max-w-md leading-relaxed font-light">
              Plataforma SaaS para controle de demandas, equipes e produtividade com métricas em tempo real.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-10">
              {features.map((f, i) => (
                <div
                  key={f.title}
                  className="group relative rounded-2xl p-4 bg-white/[0.08] backdrop-blur-xl border border-white/20 hover:bg-white/[0.14] hover:border-white/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary-light/20 animate-slide-in overflow-hidden"
                  style={{ animationDelay: `${120 + i * 60}ms` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-white/25 to-white/5 border border-white/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-lg">
                    <f.icon className="w-4 h-4" />
                  </div>
                  <h3 className="relative font-semibold text-sm">{f.title}</h3>
                  <p className="relative text-xs opacity-80 mt-1 leading-snug">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="relative z-10 text-[10px] uppercase tracking-[0.28em] opacity-50 font-medium">
            © {new Date().getFullYear()} ÁGAPE Systems — Todos os direitos reservados
          </p>
        </div>

        {/* Right side — form */}
        <div className="relative lg:w-[42%] flex items-center justify-center p-6 lg:p-12 min-h-[58vh] lg:min-h-screen">
          <div className="relative w-full max-w-md animate-slide-in" style={{ animationDelay: '160ms' }}>
            {/* Premium sharp card */}
            <div className="relative rounded-2xl bg-card border border-border/80 shadow-[0_24px_60px_-20px_hsl(var(--primary)/0.25),0_8px_24px_-12px_hsl(220_40%_20%/0.18)] ring-1 ring-black/[0.02] p-8 lg:p-10 overflow-hidden">
              {/* Top accent line */}
              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent" />

              <div className="relative mb-8">
                <span className="inline-block text-[10px] uppercase tracking-[0.3em] font-bold text-primary mb-3">
                  Acesso ao painel
                </span>
                <h2 className="font-heading font-black text-3xl lg:text-4xl text-foreground tracking-tight leading-tight">
                  Bem-vindo de volta
                </h2>
                <p className="text-sm text-muted-foreground mt-2.5">
                  Entre com suas credenciais para continuar
                </p>
              </div>

              <form onSubmit={handleSubmit} className="relative space-y-5">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                    E-mail
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full px-4 py-3.5 bg-muted/40 rounded-xl text-sm border border-border/60 outline-none focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/10 transition-all"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                    Senha
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-3.5 bg-muted/40 rounded-xl text-sm border border-border/60 outline-none focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/10 transition-all pr-11"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full gradient-primary text-primary-foreground font-semibold py-6 gap-2 text-sm rounded-xl shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/50 hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden group"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    <>
                      Entrar no sistema
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>

                <div className="text-center pt-2">
                  <button type="button" className="text-xs text-primary hover:underline font-semibold">
                    Esqueci minha senha
                  </button>
                </div>
              </form>
            </div>

            <p className="text-center text-[11px] text-muted-foreground/80 mt-6">
              Sistema corporativo · acesso restrito a usuários autorizados
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
