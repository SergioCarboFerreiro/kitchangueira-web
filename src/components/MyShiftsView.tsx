import { useEffect, useState } from 'react';
import type { UserInfo } from '../lib/auth';

interface MyShift {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  position: string;
  notes: string | null;
  localName: string;
}

interface Props {
  user: UserInfo;
}

const DAY_NAMES: Record<string, string> = {
  '1': 'Lunes', '2': 'Martes', '3': 'Miércoles',
  '4': 'Jueves', '5': 'Viernes', '6': 'Sábado', '0': 'Domingo',
};

function getShiftColor(startTime: string) {
  const hour = parseInt(startTime.split(':')[0]);
  if (hour < 12) return { bg: '#1a2a3a', border: '#58a6ff', text: '#8bb9fe', label: 'Mañana' };
  if (hour < 18) return { bg: '#1a3a2a', border: '#28c840', text: '#5fd068', label: 'Tarde' };
  return { bg: '#2a1a3a', border: '#bc8cff', text: '#d4b5ff', label: 'Noche' };
}

function formatDate(dateStr: string): { dayName: string; dayNum: string; month: string } {
  const date = new Date(dateStr + 'T00:00:00');
  const dayName = DAY_NAMES[date.getDay().toString()] || '';
  const dayNum = date.getDate().toString();
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return { dayName, dayNum, month: months[date.getMonth()] };
}

export function MyShiftsView({ user }: Props) {
  const [shifts, setShifts] = useState<MyShift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const token = localStorage.getItem('kitchangueira_token');
        const today = new Date();
        const monday = new Date(today);
        monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
        const twoWeeksLater = new Date(monday);
        twoWeeksLater.setDate(monday.getDate() + 13);

        const from = monday.toISOString().split('T')[0];
        const to = twoWeeksLater.toISOString().split('T')[0];

        const API_BASE = import.meta.env.VITE_API_URL || '';
        const res = await fetch(`${API_BASE}/api/my-shifts?from=${from}&to=${to}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const data = await res.json();
        setShifts(data.shifts || []);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Error');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="max-w-lg mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold">Mis Turnos</h2>
        <p className="text-sm text-[var(--text-muted)] mt-1">{user.name} · {user.role}</p>
      </div>

      {loading && (
        <div className="text-center py-20 text-[var(--text-muted)]">Cargando turnos...</div>
      )}

      {error && (
        <div className="p-3 rounded-lg bg-[var(--danger)]/10 border border-[var(--danger)]/30 text-sm text-[var(--danger)]">
          {error}
        </div>
      )}

      {!loading && !error && shifts.length === 0 && (
        <div className="text-center py-20">
          <div className="text-4xl mb-3">📅</div>
          <p className="text-[var(--text-muted)]">No tienes turnos estas dos semanas</p>
        </div>
      )}

      <div className="space-y-3">
        {shifts.map((shift) => {
          const color = getShiftColor(shift.startTime);
          const { dayName, dayNum, month } = formatDate(shift.date);
          return (
            <div
              key={shift.id}
              className="flex items-center gap-4 p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)]"
            >
              {/* Color bar */}
              <div className="w-1 h-14 rounded-full" style={{ background: color.border }} />

              {/* Day */}
              <div className="text-center w-12">
                <div className="text-xs font-bold text-[var(--accent)]">{dayName.slice(0, 3)}</div>
                <div className="text-xl font-bold">{dayNum}</div>
                <div className="text-[10px] text-[var(--text-muted)]">{month}</div>
              </div>

              {/* Details */}
              <div className="flex-1">
                <div className="text-lg font-semibold">
                  {shift.startTime.slice(0, 5)} — {shift.endTime.slice(0, 5)}
                </div>
                <div className="text-xs text-[var(--text-muted)]">{shift.position}</div>
                <div className="text-xs" style={{ color: color.text }}>{shift.localName}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
