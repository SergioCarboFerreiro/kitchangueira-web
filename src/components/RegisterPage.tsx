import { useState } from 'react';
import { api } from '../lib/api';
import { saveAuth } from '../lib/auth';

interface Props {
  onRegister: () => void;
  onSwitchToLogin: () => void;
}

export function RegisterPage({ onRegister, onSwitchToLogin }: Props) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    businessName: '',
    localName: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (step === 1) {
      setStep(2);
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await api.register(form);
      saveAuth(res.token, res.user);
      onRegister();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[var(--accent)]">KitchAngueira</h1>
          <p className="text-sm text-[var(--text-muted)] mt-2">Registra tu negocio</p>
        </div>

        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8">
          <div className="flex gap-2 mb-6">
            <div className={`flex-1 h-1 rounded-full ${step >= 1 ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'}`} />
            <div className={`flex-1 h-1 rounded-full ${step >= 2 ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'}`} />
          </div>

          <h2 className="text-lg font-semibold mb-1">
            {step === 1 ? 'Tu cuenta' : 'Tu negocio'}
          </h2>
          <p className="text-xs text-[var(--text-muted)] mb-6">
            {step === 1 ? 'Paso 1 de 2 — datos personales' : 'Paso 2 de 2 — datos del restaurante'}
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-[var(--danger)]/10 border border-[var(--danger)]/30 text-sm text-[var(--danger)]">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {step === 1 ? (
              <>
                <div>
                  <label className="text-xs text-[var(--text-muted)] block mb-1">Tu nombre</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => update('name', e.target.value)}
                    placeholder="Pedro García"
                    autoFocus
                    className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-4 py-3 text-sm text-[var(--text)] placeholder-[var(--text-muted)]/50 focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>
                <div>
                  <label className="text-xs text-[var(--text-muted)] block mb-1">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => update('email', e.target.value)}
                    placeholder="pedro@mirestaurante.com"
                    className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-4 py-3 text-sm text-[var(--text)] placeholder-[var(--text-muted)]/50 focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>
                <div>
                  <label className="text-xs text-[var(--text-muted)] block mb-1">Usuario</label>
                  <input
                    type="text"
                    value={form.username}
                    onChange={(e) => update('username', e.target.value)}
                    placeholder="pedro"
                    className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-4 py-3 text-sm text-[var(--text)] placeholder-[var(--text-muted)]/50 focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>
                <div>
                  <label className="text-xs text-[var(--text-muted)] block mb-1">Contraseña</label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => update('password', e.target.value)}
                    placeholder="Mínimo 4 caracteres"
                    className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-4 py-3 text-sm text-[var(--text)] placeholder-[var(--text-muted)]/50 focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!form.name || !form.username || !form.password}
                  className="w-full py-3 text-sm font-semibold rounded-lg bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] disabled:opacity-50 transition-colors"
                >
                  Siguiente
                </button>
              </>
            ) : (
              <>
                <div>
                  <label className="text-xs text-[var(--text-muted)] block mb-1">Nombre del negocio</label>
                  <input
                    type="text"
                    value={form.businessName}
                    onChange={(e) => update('businessName', e.target.value)}
                    placeholder="Restaurante La Brasa"
                    autoFocus
                    className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-4 py-3 text-sm text-[var(--text)] placeholder-[var(--text-muted)]/50 focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>
                <div>
                  <label className="text-xs text-[var(--text-muted)] block mb-1">Nombre del primer local</label>
                  <input
                    type="text"
                    value={form.localName}
                    onChange={(e) => update('localName', e.target.value)}
                    placeholder="La Brasa Centro"
                    className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-4 py-3 text-sm text-[var(--text)] placeholder-[var(--text-muted)]/50 focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 py-3 text-sm rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]"
                  >
                    Atrás
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !form.businessName || !form.localName}
                    className="flex-1 py-3 text-sm font-semibold rounded-lg bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] disabled:opacity-50 transition-colors"
                  >
                    {loading ? 'Creando...' : 'Crear negocio'}
                  </button>
                </div>
              </>
            )}
          </form>
        </div>

        <p className="text-center text-xs text-[var(--text-muted)] mt-6">
          ¿Ya tienes cuenta?{' '}
          <button onClick={onSwitchToLogin} className="text-[var(--accent)] hover:underline">
            Iniciar sesión
          </button>
        </p>
      </div>
    </div>
  );
}
