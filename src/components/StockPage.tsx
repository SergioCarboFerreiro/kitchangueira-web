import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { StockDashboardItem } from '../lib/api';

interface Props {
  localId: string;
  isManager: boolean;
  onBack: () => void;
}

const STATUS_COLORS = {
  ok: { bar: '#28c840', bg: '#1a3a2a', text: '#5fd068' },
  low: { bar: '#f7c948', bg: '#2a2a1a', text: '#f7c948' },
  critical: { bar: '#ff6b6b', bg: '#2a1a1a', text: '#ff6b6b' },
};

export function StockPage({ localId, isManager, onBack }: Props) {
  const [items, setItems] = useState<StockDashboardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [counting, setCounting] = useState(false);
  const [countValues, setCountValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  async function loadDashboard() {
    setLoading(true);
    try {
      const data = await api.getStockDashboard(localId);
      setItems(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadDashboard(); }, [localId]);

  function startCount() {
    const initial: Record<string, string> = {};
    items.forEach((item) => { initial[item.productId] = item.currentQuantity.toString(); });
    setCountValues(initial);
    setCounting(true);
  }

  async function submitCount() {
    setSaving(true);
    try {
      const countItems = Object.entries(countValues)
        .filter(([, val]) => val !== '')
        .map(([productId, val]) => ({ productId, quantity: parseFloat(val) }));
      await api.submitStockCount(localId, countItems);
      setCounting(false);
      loadDashboard();
    } finally {
      setSaving(false);
    }
  }

  const alerts = items.filter((i) => i.status !== 'ok');

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="text-sm text-[var(--text-muted)] hover:text-[var(--text)]">← Volver</button>
        <h2 className="text-xl font-semibold">Stock</h2>
        <div className="flex-1" />
        {isManager && !counting && (
          <button
            onClick={startCount}
            className="px-4 py-2 text-sm font-semibold rounded-lg bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]"
          >
            Hacer conteo
          </button>
        )}
        {counting && (
          <div className="flex gap-2">
            <button onClick={() => setCounting(false)} className="px-3 py-2 text-sm rounded-lg border border-[var(--border)] text-[var(--text-muted)]">
              Cancelar
            </button>
            <button
              onClick={submitCount}
              disabled={saving}
              className="px-4 py-2 text-sm font-semibold rounded-lg bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar conteo'}
            </button>
          </div>
        )}
      </div>

      {/* Alerts banner */}
      {alerts.length > 0 && !counting && (
        <div className="mb-4 p-4 rounded-xl border border-[var(--warning)]/30 bg-[var(--warning)]/5">
          <div className="text-sm font-semibold text-[var(--warning)] mb-2">
            ⚠ {alerts.length} producto{alerts.length > 1 ? 's' : ''} bajo mínimos
          </div>
          <div className="text-xs text-[var(--text-muted)]">
            {alerts.map((a) => a.productName).join(', ')}
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-[var(--text-muted)]">Cargando...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-4xl mb-3">📦</div>
          <p className="text-[var(--text-muted)]">No hay productos todavía</p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Header */}
          <div className="grid gap-4 px-4 py-2 text-xs text-[var(--text-muted)] font-semibold" style={{ gridTemplateColumns: '1fr 2fr 100px' }}>
            <span>Producto</span>
            <span>Nivel</span>
            <span className="text-right">{counting ? 'Conteo' : 'Cantidad'}</span>
          </div>

          {items.map((item) => {
            const colors = STATUS_COLORS[item.status];
            const pct = item.minQuantity > 0
              ? Math.min((item.currentQuantity / (item.maxQuantity || item.minQuantity * 2)) * 100, 100)
              : 100;
            const minPct = item.maxQuantity
              ? (item.minQuantity / item.maxQuantity) * 100
              : 50;

            return (
              <div
                key={item.productId}
                className="grid gap-4 items-center px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)]"
                style={{ gridTemplateColumns: '1fr 2fr 100px' }}
              >
                {/* Name + category */}
                <div>
                  <div className="text-sm font-medium">{item.productName}</div>
                  <div className="text-[10px] text-[var(--text-muted)]">{item.category}</div>
                </div>

                {/* Bar */}
                <div>
                  <div className="relative h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, background: colors.bar }}
                    />
                    {item.minQuantity > 0 && (
                      <div
                        className="absolute top-[-2px] h-[10px] w-[2px] bg-white/40"
                        style={{ left: `${minPct}%` }}
                      />
                    )}
                  </div>
                  {item.lastCountBy && !counting && (
                    <div className="text-[9px] text-[var(--text-muted)] mt-1">
                      Conteo: {item.lastCountBy}
                    </div>
                  )}
                </div>

                {/* Quantity or input */}
                {counting ? (
                  <input
                    type="number"
                    step="0.1"
                    value={countValues[item.productId] || ''}
                    onChange={(e) => setCountValues((prev) => ({ ...prev, [item.productId]: e.target.value }))}
                    className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-2 py-1.5 text-sm text-right text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
                  />
                ) : (
                  <div className="text-right">
                    <div>
                      <span className="text-sm font-semibold" style={{ color: colors.text }}>
                        {item.currentQuantity} {item.unit}
                      </span>
                    </div>
                    <span className="text-[10px] text-[var(--text-muted)]">
                      mín: {item.minQuantity} {item.unit}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
