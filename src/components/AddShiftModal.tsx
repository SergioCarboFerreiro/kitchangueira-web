import { useState } from 'react';
import type { ShiftRequest } from '../lib/api';

interface Props {
  workerId: string;
  date: string;
  workerName: string;
  onSave: (shift: ShiftRequest) => void;
  onClose: () => void;
  saving: boolean;
}

const POSITIONS = ['Camarero/a de sala', 'Cocinero/a', 'Chef', 'Barra', 'Friegaplatos', 'Encargado/a'];
const COMMON_SHIFTS = [
  { label: 'Mañana', start: '09:00', end: '17:00' },
  { label: 'Partido', start: '10:00', end: '18:00' },
  { label: 'Tarde', start: '16:00', end: '00:00' },
  { label: 'Noche', start: '20:00', end: '04:00' },
];

export function AddShiftModal({ workerId, date, workerName, onSave, onClose, saving }: Props) {
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [position, setPosition] = useState(POSITIONS[0]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({ workerId, date, startTime, endTime, position });
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 w-[360px]" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-1">Añadir turno</h3>
        <p className="text-sm text-[var(--text-muted)] mb-4">{workerName} — {date}</p>

        {/* Quick select */}
        <div className="flex gap-2 mb-4">
          {COMMON_SHIFTS.map((cs) => (
            <button
              key={cs.label}
              onClick={() => { setStartTime(cs.start); setEndTime(cs.end); }}
              className={`flex-1 text-xs py-1.5 rounded-lg border transition-colors ${
                startTime === cs.start && endTime === cs.end
                  ? 'border-[var(--accent)] text-[var(--accent)] bg-[var(--accent)]/10'
                  : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--text-muted)]'
              }`}
            >
              {cs.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-[var(--text-muted)] block mb-1">Entrada</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-[var(--text-muted)] block mb-1">Salida</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-[var(--text-muted)] block mb-1">Puesto</label>
            <select
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
            >
              {POSITIONS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 text-sm font-semibold rounded-lg bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
