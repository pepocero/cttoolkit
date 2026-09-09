import { useEffect, useState, type FormEvent } from 'react';
import { ArrowLeft, Boxes, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LoginViewProps {
  initialMode?: 'login' | 'register';
  onBack?: () => void;
}

export function LoginView({ initialMode = 'login', onBack }: LoginViewProps) {
  const { login, register, error, clearError } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLocalError(null);
    clearError();
    setBusy(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(email, password);
      }
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'No se pudo autenticar');
    } finally {
      setBusy(false);
    }
  };

  const message = localError ?? error;

  return (
    <div className="auth-shell">
      <div className="app-bg" aria-hidden />
      <div className="auth-card">
        {onBack ? (
          <button type="button" className="btn btn-ghost back-btn" onClick={onBack}>
            <ArrowLeft size={16} /> Volver
          </button>
        ) : null}

        <div className="auth-brand">
          <button
            type="button"
            className="auth-brand__button"
            onClick={onBack}
            aria-label="Ir a la página de inicio"
          >
            <span className="brand__mark">
              <Boxes size={22} />
            </span>
            <div>
              <h1>CT Toolkit</h1>
              <p className="text-muted">Accede a tus paneles en la nube (Cloudflare R2)</p>
            </div>
          </button>
        </div>

        <div className="auth-tabs">
          <button
            type="button"
            className={mode === 'login' ? 'is-active' : ''}
            onClick={() => {
              setMode('login');
              setLocalError(null);
              clearError();
            }}
          >
            <LogIn size={16} /> Entrar
          </button>
          <button
            type="button"
            className={mode === 'register' ? 'is-active' : ''}
            onClick={() => {
              setMode('register');
              setLocalError(null);
              clearError();
            }}
          >
            <UserPlus size={16} /> Registrarse
          </button>
        </div>

        <form className="form-stack" onSubmit={onSubmit}>
          <label>
            <span>Email</span>
            <input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="tu@email.com"
              required
            />
          </label>
          <label>
            <span>Contraseña</span>
            <input
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Mínimo 8 caracteres"
              minLength={8}
              required
            />
          </label>

          {message ? <p className="form-error">{message}</p> : null}

          <button type="submit" className="btn btn-primary btn-lg" disabled={busy}>
            {busy ? 'Espere…' : mode === 'login' ? 'Entrar' : 'Crear cuenta'}
          </button>
        </form>

        <p className="auth-note text-muted">
          Cada usuario solo ve y gestiona sus propios paneles. Los datos se guardan de forma
          aislada en Cloudflare R2.
        </p>
      </div>
    </div>
  );
}
