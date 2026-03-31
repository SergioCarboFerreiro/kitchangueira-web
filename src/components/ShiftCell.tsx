import type { ShiftResponse } from '../lib/api';

interface Props {
  shift: ShiftResponse;
  onDelete: () => void;
}

const SHIFT_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  morning: { bg: '#1a2a3a', border: '#58a6ff', text: '#8bb9fe' },
  afternoon: { bg: '#1a3a2a', border: '#28c840', text: '#5fd068' },
  night: { bg: '#2a1a3a', border: '#bc8cff', text: '#d4b5ff' },
};

function getShiftType(startTime: string): string {
  const hour = parseInt(startTime.split(':')[0]);
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'night';
}

export function ShiftCell({ shift, onDelete }: Props) {
  const type = getShiftType(shift.startTime);
  const colors = SHIFT_COLORS[type];

  const start = shift.startTime.slice(0, 5);
  const end = shift.endTime.slice(0, 5);

  return (
    <div
      className="group relative rounded-lg p-2 h-full cursor-default"
      style={{ background: colors.bg, borderLeft: `3px solid ${colors.border}` }}
    >
      <div className="text-xs font-semibold" style={{ color: colors.text }}>
        {start}–{end}
      </div>
      <div className="text-[10px] mt-0.5" style={{ color: colors.text, opacity: 0.7 }}>
        {shift.position}
      </div>
      <button
        onClick={onDelete}
        className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[var(--danger)] text-white text-[10px] leading-none opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
      >
        ×
      </button>
    </div>
  );
}
