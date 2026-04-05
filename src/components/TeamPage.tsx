import { useState } from 'react';
import type { LocalResponse, WorkerResponse, RotaResponse } from '../lib/api';
import { WorkersView } from './WorkersView';
import { RotaGrid } from './RotaGrid';
import { api } from '../lib/api';
import { getMonday, addWeeks, formatWeekRange, formatISO } from '../lib/dates';
import { useEffect, useCallback } from 'react';

interface Props {
  locals: LocalResponse[];
  selectedLocal: string;
}

type SubView = 'rota' | 'workers';

export function TeamPage({ locals, selectedLocal }: Props) {
  const [subView, setSubView] = useState<SubView>('rota');
  const [workers, setWorkers] = useState<WorkerResponse[]>([]);
  const [rota, setRota] = useState<RotaResponse | null>(null);
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRotaData = useCallback(async () => {
    if (!selectedLocal) return;
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
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  }, [selectedLocal, weekStart]);

  useEffect(() => { if (subView === 'rota') loadRotaData(); }, [loadRotaData, subView]);

  const subTabs: { key: SubView; label: string }[] = [
    { key: 'rota', label: 'Rota' },
    { key: 'workers', label: 'Trabajadores' },
  ];

  return (
    <div>
      {/* Sub-tabs */}
      <div className="flex gap-2 mb-6">
        {subTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setSubView(tab.key)}
            className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
              subView === tab.key
                ? 'border-[var(--accent)] text-[var(--accent)] bg-[var(--accent)]/10 font-semibold'
                : 'border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {subView === 'workers' ? (
        <WorkersView locals={locals} />
      ) : (
        <>
          {/* Week navigation */}
          <div className="flex items-center gap-4 mb-6">
            <button onClick={() => setWeekStart(addWeeks(weekStart, -1))} className="w-8 h-8 rounded-lg border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">←</button>
            <div>
              <h3 className="text-lg font-semibold">Rota semanal</h3>
              <p className="text-sm text-[var(--text-muted)]">{formatWeekRange(weekStart)}</p>
            </div>
            <button onClick={() => setWeekStart(addWeeks(weekStart, 1))} className="w-8 h-8 rounded-lg border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">→</button>
            <button onClick={() => setWeekStart(getMonday(new Date()))} className="px-3 py-1 text-xs rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">Hoy</button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-[var(--danger)]/10 border border-[var(--danger)]/30 text-sm text-[var(--danger)]">{error}</div>
          )}

          {loading && !rota && (
            <div className="text-center py-20 text-[var(--text-muted)]">Cargando...</div>
          )}

          {rota && workers.length > 0 && (
            <RotaGrid rota={rota} workers={workers} weekStart={weekStart} onRefresh={loadRotaData} />
          )}

          {!loading && workers.length === 0 && (
            <div className="text-center py-20 text-[var(--text-muted)]">No hay trabajadores asignados a este local.</div>
          )}
        </>
      )}
    </div>
  );
}
