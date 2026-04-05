import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { WorkerResponse, LocalResponse } from '../lib/api';

interface Props {
  locals: LocalResponse[];
}

const ROLES = [
  { value: 'manager', label: 'Manager' },
  { value: 'chef', label: 'Chef' },
  { value: 'employee', label: 'Empleado' },
];

const ROLE_COLORS: Record<string, { color: string; bg: string }> = {
  owner: { color: '#f7c948', bg: '#2a2a1a' },
  manager: { color: '#58a6ff', bg: '#1a2a3a' },
  chef: { color: '#bc8cff', bg: '#2a1a3a' },
  employee: { color: '#28c840', bg: '#1a3a2a' },
};

type View = 'list' | 'create' | 'detail';

export function WorkersView({ locals }: Props) {
  const [workers, setWorkers] = useState<WorkerResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>('list');
  const [selectedWorker, setSelectedWorker] = useState<WorkerResponse | null>(null);

  // Create form
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('employee');
  const [selectedLocals, setSelectedLocals] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset password
  const [resetPw, setResetPw] = useState('');
  const [resetting, setResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  async function loadWorkers() {
    setLoading(true);
    try {
      const data = await api.getWorkers();
      setWorkers(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadWorkers(); }, []);

  function startCreate() {
    setName('');
    setUsername('');
    setPassword('');
    setRole('employee');
    setSelectedLocals(locals.length > 0 ? [locals[0].id] : []);
    setError(null);
    setView('create');
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.createWorker({ name, username, password, role, localIds: selectedLocals });
      setView('list');
      loadWorkers();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate(id: string) {
    await api.deleteWorker(id);
    setSelectedWorker(null);
    setView('list');
    loadWorkers();
  }

  async function handleResetPassword(id: string) {
    if (!resetPw || resetPw.length < 4) return;
    setResetting(true);
    try {
      await api.resetWorkerPassword(id, resetPw);
      setResetPw('');
      setResetSuccess(true);
      setTimeout(() => setResetSuccess(false), 3000);
    } finally {
      setResetting(false);
    }
  }

  function toggleLocal(localId: string) {
    setSelectedLocals((prev) =>
      prev.includes(localId) ? prev.filter((id) => id !== localId) : [...prev, localId]
    );
  }

  const inputClass = "w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)]";

  // ─── Create view ──────────────────────────────────────────────
  if (view === 'create') {
    return (
      <div className="max-w-md">
        <button onClick={() => setView('list')} className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] mb-4">← Cancelar</button>
        <h2 className="text-xl font-semibold mb-6">Añadir trabajador</h2>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-[var(--danger)]/10 border border-[var(--danger)]/30 text-sm text-[var(--danger)]">{error}</div>
        )}

        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="text-xs text-[var(--text-muted)] block mb-1">Nombre completo</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ana García" required autoFocus className={inputClass} />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-[var(--text-muted)] block mb-1">Usuario</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="ana.garcia" required className={inputClass} />
            </div>
            <div className="flex-1">
              <label className="text-xs text-[var(--text-muted)] block mb-1">Contraseña temporal</label>
              <input type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="1234" required className={inputClass} />
            </div>
          </div>

          <div>
            <label className="text-xs text-[var(--text-muted)] block mb-1">Rol</label>
            <select value={role} onChange={(e) => setRole(e.target.value)} className={inputClass}>
              {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs text-[var(--text-muted)] block mb-1">Locales asignados</label>
            <div className="flex gap-2 flex-wrap">
              {locals.map((local) => (
                <button
                  key={local.id}
                  type="button"
                  onClick={() => toggleLocal(local.id)}
                  className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                    selectedLocals.includes(local.id)
                      ? 'border-[var(--accent)] text-[var(--accent)] bg-[var(--accent)]/10'
                      : 'border-[var(--border)] text-[var(--text-muted)]'
                  }`}
                >
                  {local.name}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 text-xs text-[var(--text-muted)]">
            El trabajador podrá iniciar sesión con usuario <strong className="text-[var(--text)]">{username || '...'}</strong> y contraseña <strong className="text-[var(--text)]">{password || '...'}</strong>.
            Se le pedirá cambiar la contraseña en el primer login.
          </div>

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={() => setView('list')} className="flex-1 py-2.5 text-sm rounded-lg border border-[var(--border)] text-[var(--text-muted)]">Cancelar</button>
            <button type="submit" disabled={saving || !name || !username || !password || selectedLocals.length === 0} className="flex-1 py-2.5 text-sm font-semibold rounded-lg bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] disabled:opacity-50">
              {saving ? 'Creando...' : 'Crear trabajador'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // ─── Detail view ──────────────────────────────────────────────
  if (view === 'detail' && selectedWorker) {
    const rc = ROLE_COLORS[selectedWorker.role] || ROLE_COLORS.employee;
    return (
      <div className="max-w-md">
        <button onClick={() => { setView('list'); setSelectedWorker(null); }} className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] mb-4">← Volver</button>

        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-full bg-[var(--border)] flex items-center justify-center text-xl font-bold text-[var(--text-muted)]">
            {selectedWorker.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
          </div>
          <div>
            <h2 className="text-xl font-semibold">{selectedWorker.name}</h2>
            <span className="px-2 py-0.5 text-xs rounded-full font-semibold" style={{ color: rc.color, background: rc.bg }}>{selectedWorker.role}</span>
          </div>
        </div>

        <div className="space-y-4">
          {selectedWorker.email && (
            <div className="text-sm"><span className="text-[var(--text-muted)]">Email: </span>{selectedWorker.email}</div>
          )}
          <div className="text-sm">
            <span className="text-[var(--text-muted)]">Locales: </span>
            {selectedWorker.locals.map((l) => l.name).join(', ') || 'Ninguno'}
          </div>

          {/* Reset password */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4">
            <div className="text-sm font-semibold mb-2">Resetear contraseña</div>
            <div className="flex gap-2">
              <input
                type="text"
                value={resetPw}
                onChange={(e) => setResetPw(e.target.value)}
                placeholder="Nueva contraseña"
                className={`flex-1 ${inputClass}`}
              />
              <button
                onClick={() => handleResetPassword(selectedWorker.id)}
                disabled={resetting || resetPw.length < 4}
                className="px-4 py-2 text-sm rounded-lg bg-[var(--info)] text-white disabled:opacity-50"
              >
                {resetting ? '...' : 'Resetear'}
              </button>
            </div>
            {resetSuccess && <div className="text-xs text-[var(--success)] mt-2">Contraseña reseteada. El trabajador deberá cambiarla al entrar.</div>}
          </div>

          {/* Deactivate */}
          {selectedWorker.role !== 'owner' && (
            <div className="pt-4 border-t border-[var(--border)]">
              <button
                onClick={() => { if (confirm('¿Seguro que quieres desactivar a ' + selectedWorker.name + '?')) handleDeactivate(selectedWorker.id); }}
                className="text-xs text-[var(--danger)] hover:underline"
              >
                Desactivar trabajador
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── List view ────────────────────────────────────────────────
  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <h3 className="text-lg font-semibold">Trabajadores</h3>
        <div className="flex-1" />
        <button onClick={startCreate} className="px-4 py-2 text-sm font-semibold rounded-lg bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]">
          + Añadir trabajador
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-[var(--text-muted)]">Cargando...</div>
      ) : workers.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-4xl mb-3">👥</div>
          <p className="text-[var(--text-muted)]">No hay trabajadores</p>
        </div>
      ) : (
        <div className="space-y-2">
          {workers.map((worker) => {
            const rc = ROLE_COLORS[worker.role] || ROLE_COLORS.employee;
            return (
              <button
                key={worker.id}
                onClick={() => { setSelectedWorker(worker); setView('detail'); setResetPw(''); setResetSuccess(false); }}
                className="w-full text-left bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 hover:border-[var(--accent)] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--border)] flex items-center justify-center text-sm font-bold text-[var(--text-muted)]">
                    {worker.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">{worker.name}</div>
                    <div className="text-xs text-[var(--text-muted)]">
                      {worker.locals.map((l) => l.name).join(', ')}
                    </div>
                  </div>
                  <span className="px-2 py-0.5 text-xs rounded-full font-semibold" style={{ color: rc.color, background: rc.bg }}>
                    {worker.role}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
