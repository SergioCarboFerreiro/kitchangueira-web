import { useState } from 'react';
import type { RotaResponse, ShiftResponse, WorkerResponse, ShiftRequest } from '../lib/api';
import { api } from '../lib/api';
import { getWeekDates, formatDayShort, formatDate, formatISO } from '../lib/dates';
import { ShiftCell } from './ShiftCell';
import { AddShiftModal } from './AddShiftModal';

interface Props {
  rota: RotaResponse;
  workers: WorkerResponse[];
  weekStart: Date;
  onRefresh: () => void;
}

export function RotaGrid({ rota, workers, weekStart, onRefresh }: Props) {
  const [addingShift, setAddingShift] = useState<{ workerId: string; date: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const weekDates = getWeekDates(weekStart);

  function getShift(workerId: string, date: string): ShiftResponse | undefined {
    return rota.shifts.find((s) => s.workerId === workerId && s.date === date);
  }

  async function handleAddShift(shift: ShiftRequest) {
    setSaving(true);
    try {
      const existingShifts: ShiftRequest[] = rota.shifts.map((s) => ({
        workerId: s.workerId,
        date: s.date,
        startTime: s.startTime,
        endTime: s.endTime,
        position: s.position,
        notes: s.notes ?? undefined,
      }));
      await api.saveRota(rota.localId, formatISO(weekStart), [...existingShifts, shift]);
      setAddingShift(null);
      onRefresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteShift(shiftId: string) {
    setSaving(true);
    try {
      const remaining: ShiftRequest[] = rota.shifts
        .filter((s) => s.id !== shiftId)
        .map((s) => ({
          workerId: s.workerId,
          date: s.date,
          startTime: s.startTime,
          endTime: s.endTime,
          position: s.position,
          notes: s.notes ?? undefined,
        }));
      await api.saveRota(rota.localId, formatISO(weekStart), remaining);
      onRefresh();
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish() {
    setPublishing(true);
    try {
      await api.publishRota(rota.id);
      onRefresh();
    } finally {
      setPublishing(false);
    }
  }

  async function handleCopyPrevious() {
    setSaving(true);
    try {
      await api.copyPreviousWeek(rota.localId, formatISO(weekStart));
      onRefresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      {/* Actions bar */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={handleCopyPrevious}
          disabled={saving}
          className="px-3 py-1.5 text-xs rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--info)] transition-colors"
        >
          Copiar semana anterior
        </button>
        <div className="flex-1" />
        <span className="text-xs text-[var(--text-muted)]">
          {rota.shifts.length} turnos · {rota.status === 'published' ? '✅ Publicada' : '📝 Borrador'}
        </span>
        {rota.status === 'draft' && rota.shifts.length > 0 && (
          <button
            onClick={handlePublish}
            disabled={publishing}
            className="px-4 py-1.5 text-sm font-semibold rounded-lg bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50"
          >
            {publishing ? 'Publicando...' : 'Publicar'}
          </button>
        )}
      </div>

      {/* Grid */}
      <div className="overflow-x-auto">
        <div className="grid gap-px bg-[var(--border)] rounded-xl overflow-hidden" style={{ gridTemplateColumns: '140px repeat(7, 1fr)', minWidth: '800px' }}>
          {/* Header row */}
          <div className="bg-[var(--surface)] p-3 text-xs font-semibold text-[var(--text-muted)]">Trabajador</div>
          {weekDates.map((d) => (
            <div key={formatISO(d)} className="bg-[var(--surface)] p-3 text-center">
              <div className="text-xs font-semibold text-[var(--text-muted)]">{formatDayShort(d)}</div>
              <div className="text-xs text-[var(--text-muted)] opacity-60">{formatDate(d)}</div>
            </div>
          ))}

          {/* Worker rows */}
          {workers.map((worker) => (
            <>
              <div key={`name-${worker.id}`} className="bg-[var(--surface)] p-3 flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[var(--border)] flex items-center justify-center text-xs font-semibold text-[var(--text-muted)]">
                  {worker.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <div className="text-sm font-medium leading-tight">{worker.name.split(' ')[0]}</div>
                  <div className="text-[10px] text-[var(--text-muted)]">{worker.role}</div>
                </div>
              </div>
              {weekDates.map((d) => {
                const dateStr = formatISO(d);
                const shift = getShift(worker.id, dateStr);
                return (
                  <div key={`${worker.id}-${dateStr}`} className="bg-[var(--surface)] p-1.5 min-h-[60px]">
                    {shift ? (
                      <ShiftCell shift={shift} onDelete={() => handleDeleteShift(shift.id)} />
                    ) : (
                      <button
                        onClick={() => setAddingShift({ workerId: worker.id, date: dateStr })}
                        className="w-full h-full min-h-[48px] rounded-lg border border-dashed border-[var(--border)] hover:border-[var(--accent)] text-[var(--text-muted)] hover:text-[var(--accent)] text-lg transition-colors flex items-center justify-center"
                      >
                        +
                      </button>
                    )}
                  </div>
                );
              })}
            </>
          ))}
        </div>
      </div>

      {/* Add shift modal */}
      {addingShift && (
        <AddShiftModal
          workerId={addingShift.workerId}
          date={addingShift.date}
          workerName={workers.find((w) => w.id === addingShift.workerId)?.name ?? ''}
          onSave={handleAddShift}
          onClose={() => setAddingShift(null)}
          saving={saving}
        />
      )}
    </div>
  );
}
