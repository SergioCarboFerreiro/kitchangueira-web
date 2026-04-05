import { useEffect, useState } from 'react';
import { api } from './lib/api';
import type { LocalResponse } from './lib/api';
import { isAuthenticated, getUser, logout } from './lib/auth';
import type { UserInfo } from './lib/auth';
import { LoginPage } from './components/LoginPage';
import { RegisterPage } from './components/RegisterPage';
import { MyShiftsView } from './components/MyShiftsView';
import { TeamPage } from './components/TeamPage';
import { RecipesPage } from './components/RecipesPage';
import { InventoryPage } from './components/InventoryPage';
import { OrdersPage } from './components/OrdersPage';

type AuthView = 'login' | 'register';
type Page = 'team' | 'kitchen' | 'inventory' | 'orders';

const PAGE_LABELS: Record<Page, string> = {
  team: 'Equipo',
  kitchen: 'Cocina',
  inventory: 'Inventario',
  orders: 'Pedidos',
};

export default function App() {
  const [authed, setAuthed] = useState(isAuthenticated());
  const [authView, setAuthView] = useState<AuthView>('login');
  const [user, setUser] = useState<UserInfo | null>(getUser());
  const [page, setPage] = useState<Page>('team');

  const [locals, setLocals] = useState<LocalResponse[]>([]);
  const [selectedLocal, setSelectedLocal] = useState<string>('');

  function handleAuth() {
    setAuthed(true);
    setUser(getUser());
  }

  function handleLogout() {
    logout();
    setAuthed(false);
    setUser(null);
  }

  useEffect(() => {
    if (!authed) return;
    api.getLocals().then((data) => {
      setLocals(data);
      if (data.length > 0) setSelectedLocal(data[0].id);
    });
  }, [authed]);

  // Not authenticated
  if (!authed) {
    if (authView === 'register') {
      return <RegisterPage onRegister={handleAuth} onSwitchToLogin={() => setAuthView('login')} />;
    }
    return <LoginPage onLogin={handleAuth} onSwitchToRegister={() => setAuthView('register')} />;
  }

  const isManager = user?.role === 'owner' || user?.role === 'manager';

  // Employee/Chef view
  if (!isManager) {
    return (
      <div className="min-h-screen">
        <header className="sticky top-0 z-40 bg-[var(--bg)]/95 backdrop-blur border-b border-[var(--border)] px-4 sm:px-6 py-3">
          <div className="flex items-center gap-4">
            <h1 className="text-base sm:text-lg font-bold text-[var(--accent)]">KitchAngueira</h1>
            <div className="flex-1" />
            <span className="text-[10px] sm:text-xs text-[var(--text-muted)]">{user?.name} · {user?.role}</span>
            <button onClick={handleLogout} className="text-xs text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors">Salir</button>
          </div>
        </header>
        <main className="p-4 sm:p-6">
          <MyShiftsView user={user!} />
        </main>
      </div>
    );
  }

  // Manager/Owner view
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 bg-[var(--bg)]/95 backdrop-blur border-b border-[var(--border)] px-4 sm:px-6 py-3">
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
          <button onClick={handleLogout} className="text-xs text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors">Salir</button>
        </div>

        <div className="flex gap-1 mt-2">
          {(Object.keys(PAGE_LABELS) as Page[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setPage(tab)}
              className={`flex-1 sm:flex-none px-3 py-1.5 text-xs rounded-lg transition-colors ${page === tab ? 'bg-[var(--accent)]/15 text-[var(--accent)] font-semibold' : 'text-[var(--text-muted)] hover:text-[var(--text)]'}`}
            >
              {PAGE_LABELS[tab]}
            </button>
          ))}
        </div>
      </header>

      <main className="p-4 sm:p-6">
        {page === 'team' && <TeamPage locals={locals} selectedLocal={selectedLocal} />}
        {page === 'kitchen' && <RecipesPage isManager={isManager} onBack={() => setPage('team')} />}
        {page === 'inventory' && <InventoryPage localId={selectedLocal} isManager={isManager} />}
        {page === 'orders' && <OrdersPage localId={selectedLocal} onBack={() => setPage('team')} />}
      </main>
    </div>
  );
}
