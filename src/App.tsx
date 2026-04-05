import { useEffect, useState, useCallback } from 'react';
import { api } from './lib/api';
import type { LocalResponse, WorkerResponse, RotaResponse } from './lib/api';
import { isAuthenticated, getUser, logout } from './lib/auth';
import type { UserInfo } from './lib/auth';
import { getMonday, addWeeks, formatWeekRange, formatISO } from './lib/dates';
import { RotaGrid } from './components/RotaGrid';
import { LoginPage } from './components/LoginPage';
import { RegisterPage } from './components/RegisterPage';
import { MyShiftsView } from './components/MyShiftsView';
import { RecipesPage } from './components/RecipesPage';
import { StockPage } from './components/StockPage';
import { OrdersPage } from './components/OrdersPage';

type AuthView = 'login' | 'register';
type Page = 'rota' | 'recipes' | 'stock' | 'orders';

export default function App() {
  const [authed, setAuthed] = useState(isAuthenticated());
  const [authView, setAuthView] = useState<AuthView>('login');
  const [user, setUser] = useState<UserInfo | null>(getUser());
  const [page, setPage] = useState<Page>('rota');

  const [locals, setLocals] = useState<LocalResponse[]>([]);
  const [selectedLocal, setSelectedLocal] = useState<string>('');
  const [workers, setWorkers] = useState<WorkerResponse[]>([]);
  const [rota, setRota] = useState<RotaResponse | null>(null);
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function handleAuth() {
    setAuthed(true);
    setUser(getUser());
  }

  function handleLogout() {
    logout();
    setAuthed(false);
    setUser(null);
  }

  // Load locals on mount (when authed)
  useEffect(() => {
    if (!authed) return;
    api.getLocals().then((data) => {
      setLocals(data);
      if (data.length > 0) setSelectedLocal(data[0].id);
    }).catch((e) => setError(e.message));
  }, [authed]);

  // Load workers + rota when local or week changes
  const loadData = useCallback(async () => {
    if (!selectedLocal || !authed) return;
    setLoading(true);
    setError(null);
    try {
      const [w, r] = await Promise.all([
        api.getWorkers(selectedLocal),
        api.getRota(selectedLocal, formatISO(weekStart)),
      ]);
      setWorkers(w);
      setRota(r);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error loading data');
    } finally {
      setLoading(false);
    }
  }, [selectedLocal, weekStart, authed]);

  useEffect(() => { loadData(); }, [loadData]);

  // Not authenticated — show login or register
  if (!authed) {
    if (authView === 'register') {
      return <RegisterPage onRegister={handleAuth} onSwitchToLogin={() => setAuthView('login')} />;
    }
    return <LoginPage onLogin={handleAuth} onSwitchToRegister={() => setAuthView('register')} />;
  }

  const isManager = user?.role === 'owner' || user?.role === 'manager';

  // Employee/Chef view — only their own shifts
  if (!isManager) {
    return (
      <div className="min-h-screen">
        <header className="sticky top-0 z-40 bg-[var(--bg)]/95 backdrop-blur border-b border-[var(--border)] px-6 py-3">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-bold text-[var(--accent)]">KitchAngueira</h1>
            <div className="flex-1" />
            <span className="text-xs text-[var(--text-muted)]">{user?.name} · {user?.role}</span>
            <button onClick={handleLogout} className="text-xs text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors">Salir</button>
          </div>
        </header>
        <main className="p-4 sm:p-6">
          <MyShiftsView user={user!} />
        </main>
      </div>
    );
  }

  // Manager/Owner view — full rota management
  return (
    <div className="min-h-screen">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-[var(--bg)]/95 backdrop-blur border-b border-[var(--border)] px-4 sm:px-6 py-3">
        {/* Row 1: logo + local + user */}
        <div className="flex items-center gap-3">
          <h1 className="text-base sm:text-lg font-bold text-[var(--accent)]">KitchAngueira</h1>
          <div className="h-5 w-px bg-[var(--border)] hidden sm:block" />

          <select
            value={selectedLocal}
            onChange={(e) => setSelectedLocal(e.target.value)}
            className="bg-[var(--surface)] border border-[var(--border)] rounded-lg px-2 sm:px-3 py-1.5 text-xs sm:text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)] max-w-[140px] sm:max-w-none"
          >
            {locals.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>

          <div className="flex-1" />

          <span className="text-[10px] sm:text-xs text-[var(--text-muted)] hidden sm:inline">
            {user?.name} · {user?.role}
          </span>
          <button
            onClick={handleLogout}
            className="text-xs text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors"
          >
            Salir
          </button>
        </div>

        {/* Row 2: navigation tabs */}
        <div className="flex gap-1 mt-2">
          {(['rota', 'recipes', 'stock', 'orders'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setPage(tab)}
              className={`flex-1 sm:flex-none px-3 py-1.5 text-xs rounded-lg transition-colors ${page === tab ? 'bg-[var(--accent)]/15 text-[var(--accent)] font-semibold' : 'text-[var(--text-muted)] hover:text-[var(--text)]'}`}
            >
              {{ rota: 'Turnos', recipes: 'Recetas', stock: 'Stock', orders: 'Pedidos' }[tab]}
            </button>
          ))}
        </div>
      </header>

      {/* Content */}
      <main className="p-4 sm:p-6">
        {page === 'orders' ? (
          <OrdersPage localId={selectedLocal} onBack={() => setPage('rota')} />
        ) : page === 'stock' ? (
          <StockPage localId={selectedLocal} isManager={isManager} onBack={() => setPage('rota')} />
        ) : page === 'recipes' ? (
          <RecipesPage isManager={isManager} onBack={() => setPage('rota')} />
        ) : (
          <>
            {/* Week navigation */}
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={() => setWeekStart(addWeeks(weekStart, -1))}
                className="w-8 h-8 rounded-lg border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--text-muted)] transition-colors"
              >
                ←
              </button>
              <div>
                <h2 className="text-xl font-semibold">Rota semanal</h2>
                <p className="text-sm text-[var(--text-muted)]">{formatWeekRange(weekStart)}</p>
              </div>
              <button
                onClick={() => setWeekStart(addWeeks(weekStart, 1))}
                className="w-8 h-8 rounded-lg border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--text-muted)] transition-colors"
              >
                →
              </button>
              <button
                onClick={() => setWeekStart(getMonday(new Date()))}
                className="px-3 py-1 text-xs rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--text-muted)] transition-colors"
              >
                Hoy
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-[var(--danger)]/10 border border-[var(--danger)]/30 text-sm text-[var(--danger)]">
                {error}
              </div>
            )}

            {loading && !rota && (
              <div className="text-center py-20 text-[var(--text-muted)]">Cargando...</div>
            )}

            {rota && workers.length > 0 && (
              <RotaGrid rota={rota} workers={workers} weekStart={weekStart} onRefresh={loadData} />
            )}

            {!loading && workers.length === 0 && (
              <div className="text-center py-20 text-[var(--text-muted)]">
                No hay trabajadores asignados a este local.
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
